import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button, Modal, Form, Input, Select, Switch, Space, App,
  Typography, Popconfirm, Card, Tag,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, HolderOutlined,
} from '@ant-design/icons'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { fetchMenus, createMenu, updateMenu, deleteMenu, reorderMenus } from '../../api/cms'
import type { CmsMenu } from '../../types'

// ── 플랫 목록 ↔ 트리 변환 ─────────────────────────────────────────────────

function flattenTree(nodes: CmsMenu[], parentIdx: number | null = null, depth = 0): FlatMenu[] {
  return nodes.flatMap((n) => [
    { ...n, depth, parent_idx: parentIdx },
    ...flattenTree(n.children ?? [], n.idx, depth + 1),
  ])
}

interface FlatMenu extends Omit<CmsMenu, 'children'> {
  depth: number
}

// ── 정렬 가능한 메뉴 행 ────────────────────────────────────────────────────

function SortableRow({
  item,
  onEdit,
  onDelete,
}: {
  item: FlatMenu
  onEdit: (item: FlatMenu) => void
  onDelete: (idx: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.idx })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: '#fff',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    gap: 8,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <span {...attributes} {...listeners} style={{ cursor: 'grab', color: '#bbb' }}>
        <HolderOutlined />
      </span>
      <span style={{ marginLeft: item.depth * 20, flex: 1 }}>
        {item.depth > 0 && <span style={{ color: '#bbb', marginRight: 4 }}>└</span>}
        {item.label}
      </span>
      <span style={{ color: '#888', fontSize: 12, minWidth: 180 }}>{item.url || '-'}</span>
      <Tag style={{ minWidth: 50 }}>{item.target}</Tag>
      <Tag color={item.is_used ? 'green' : 'default'}>{item.is_used ? '사용' : '미사용'}</Tag>
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(item)} />
        <Popconfirm title="삭제하시겠습니까?" onConfirm={() => onDelete(item.idx)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    </div>
  )
}

// ── 메인 페이지 ────────────────────────────────────────────────────────────

export default function MenusPage() {
  const qc = useQueryClient()
  const { message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FlatMenu | null>(null)
  const [flatItems, setFlatItems] = useState<FlatMenu[]>([])
  const [form] = Form.useForm()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const { isLoading } = useQuery({
    queryKey: ['cms-menus'],
    queryFn: () =>
      fetchMenus().then((r) => {
        const flat = flattenTree(r.data.data ?? [])
        setFlatItems(flat)
        return r.data
      }),
  })

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        ...values,
        is_used:    values.is_used ? 1 : 0,
        parent_idx: values.parent_idx ?? null,
      }
      return editing ? updateMenu(editing.idx, payload) : createMenu(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-menus'] })
      message.success(editing ? '메뉴가 수정되었습니다.' : '메뉴가 생성되었습니다.')
      closeModal()
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '저장에 실패했습니다.'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMenu,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-menus'] })
      message.success('메뉴가 삭제되었습니다.')
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '삭제에 실패했습니다.'),
  })

  const reorderMutation = useMutation({
    mutationFn: reorderMenus,
    onSuccess: () => message.success('순서가 저장되었습니다.'),
    onError: (err: any) => message.error(err.response?.data?.message ?? '순서 저장에 실패했습니다.'),
  })

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setFlatItems((prev) => {
        const oldIdx = prev.findIndex((i) => i.idx === active.id)
        const newIdx = prev.findIndex((i) => i.idx === over.id)
        const next = arrayMove(prev, oldIdx, newIdx)

        // 드래그 완료 후 일괄 저장
        reorderMutation.mutate(
          next.map((item, seq) => ({
            idx:        item.idx,
            sequence:   seq,
            parent_idx: item.parent_idx,
          }))
        )
        return next
      })
    },
    [reorderMutation]
  )

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (item: FlatMenu) => {
    setEditing(item)
    form.setFieldsValue({
      label:      item.label,
      url:        item.url,
      target:     item.target,
      is_used:    Number(item.is_used) === 1,
      parent_idx: item.parent_idx ?? undefined,
    })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditing(null); form.resetFields() }

  // 상위 메뉴 선택 옵션 (최상위만 부모 후보로 허용 — 2depth 구조)
  const parentOptions = flatItems
    .filter((i) => i.depth === 0)
    .map((i) => ({ value: i.idx, label: i.label }))

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>메뉴 관리</Typography.Title>
        <Space>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>드래그로 순서 변경</Typography.Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>메뉴 추가</Button>
        </Space>
      </div>

      <Card loading={isLoading} bodyStyle={{ padding: 0 }}>
        {/* 헤더 행 */}
        <div style={{ display: 'flex', padding: '8px 12px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', gap: 8, fontWeight: 600, fontSize: 12, color: '#888' }}>
          <span style={{ width: 20 }} />
          <span style={{ flex: 1 }}>메뉴명</span>
          <span style={{ minWidth: 180 }}>URL</span>
          <span style={{ minWidth: 50 }}>타겟</span>
          <span style={{ minWidth: 60 }}>사용</span>
          <span style={{ minWidth: 72 }}>관리</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={flatItems.map((i) => i.idx)} strategy={verticalListSortingStrategy}>
            {flatItems.map((item) => (
              <SortableRow
                key={item.idx}
                item={item}
                onEdit={openEdit}
                onDelete={(idx) => deleteMutation.mutate(idx)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {flatItems.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#bbb' }}>등록된 메뉴가 없습니다.</div>
        )}
      </Card>

      <Modal
        title={editing ? '메뉴 수정' : '메뉴 추가'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="저장"
        cancelText="취소"
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
          <Form.Item name="parent_idx" label="상위 메뉴">
            <Select
              allowClear
              placeholder="없음 (최상위)"
              options={parentOptions}
            />
          </Form.Item>
          <Form.Item name="label" label="메뉴명" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="url" label="URL">
            <Input placeholder="/about" />
          </Form.Item>
          <Form.Item name="target" label="링크 타겟" initialValue="_self">
            <Select options={[{ value: '_self', label: '현재 창 (_self)' }, { value: '_blank', label: '새 창 (_blank)' }]} />
          </Form.Item>
          <Form.Item name="is_used" label="사용 여부" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
