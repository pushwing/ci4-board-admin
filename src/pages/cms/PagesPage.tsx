import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Button, Modal, Form, Input, Select, Space, Tag, App, Typography, Popconfirm, Alert,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { fetchPages, createPage, updatePage, deletePage, fetchMenus } from '../../api/cms'
import RichEditor from '../../components/RichEditor'
import type { CmsMenu, CmsPage } from '../../types'

function isSlugUsedInMenus(menus: CmsMenu[], slug: string): boolean {
  return menus.some(
    (m) => m.url === `/pages/${slug}` || isSlugUsedInMenus(m.children ?? [], slug)
  )
}

const STATUS_LABELS: Record<number, React.ReactNode> = {
  0: <Tag color="default">임시저장</Tag>,
  1: <Tag color="green">발행</Tag>,
}

export default function PagesPage() {
  const qc = useQueryClient()
  const { message } = App.useApp()
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CmsPage | null>(null)
  const [contents, setContents] = useState('')
  const [form] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['cms-pages', page],
    queryFn: () => fetchPages({ page }).then((r) => r.data),
  })

  const { data: menusData } = useQuery({
    queryKey: ['cms-menus'],
    queryFn: () => fetchMenus().then((r) => r.data),
    staleTime: 30_000,
  })

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = { ...values, contents, status: values.status ? 1 : 0 }
      return editing ? updatePage(editing.idx, payload) : createPage(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-pages'] })
      message.success(editing ? '페이지가 수정되었습니다.' : '페이지가 생성되었습니다.')
      closeModal()
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '저장에 실패했습니다.'),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-pages'] })
      message.success('페이지가 삭제되었습니다.')
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '삭제에 실패했습니다.'),
  })

  const openCreate = () => {
    setEditing(null)
    setContents('')
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: CmsPage) => {
    setEditing(record)
    form.setFieldsValue({ slug: record.slug, title: record.title, status: record.status })
    setContents('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    form.resetFields()
    setContents('')
  }

  const columns = [
    { title: 'idx',    dataIndex: 'idx',   width: 70 },
    { title: 'slug',   dataIndex: 'slug',  render: (v: string) => <code>{v}</code> },
    { title: '제목',   dataIndex: 'title' },
    { title: '상태',   dataIndex: 'status', width: 100, render: (v: number) => STATUS_LABELS[v] },
    {
      title: '메뉴 사용',
      width: 110,
      render: (_: any, record: CmsPage) => isSlugUsedInMenus(menusData?.data ?? [], record.slug)
        ? <Tag color="blue">사용중</Tag>
        : <Tag color="default">미사용</Tag>,
    },
    {
      title: '관리',
      width: 120,
      render: (_: any, record: CmsPage) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="삭제하시겠습니까?"
            onConfirm={() => {
              const menus = menusData?.data ?? []
              if (isSlugUsedInMenus(menus, record.slug)) {
                message.error('메뉴 관리에서 사용 중인 페이지입니다. 먼저 해당 메뉴의 URL을 변경해주세요.')
                return
              }
              deleteMutation.mutate(record.idx)
            }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>페이지 관리</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>페이지 추가</Button>
      </div>

      <Table
        rowKey="idx"
        loading={isLoading}
        dataSource={data?.data ?? []}
        columns={columns}
        pagination={{
          current: page,
          pageSize: data?.meta?.per_page ?? 20,
          total: data?.meta?.total ?? 0,
          onChange: setPage,
        }}
      />

      <Modal
        title={editing ? '페이지 수정' : '페이지 추가'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        width={900}
        okText="저장"
        cancelText="취소"
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
          <Form.Item
            name="slug"
            label="Slug (페이지 주소)"
            rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: '영문 소문자·숫자·하이픈만 허용' }]}
            extra={
              <Alert
                style={{ marginTop: 8 }}
                type="info"
                showIcon
                message="Slug란?"
                description={
                  <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 12, lineHeight: '1.8' }}>
                    <li>이 페이지의 고유 URL 주소가 됩니다.</li>
                    <li>
                      예) slug를 <code>about-us</code>로 입력하면{' '}
                      <code style={{ color: '#1677ff' }}>https://사이트주소/pages/about-us</code> 로 접근 가능합니다.
                    </li>
                    <li>영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다. (공백·특수문자 불가)</li>
                    <li>다른 페이지와 중복될 수 없습니다.</li>
                    <li>한 번 발행 후에는 변경하지 않는 것을 권장합니다. (변경 시 기존 링크가 깨질 수 있습니다.)</li>
                    <li>메뉴관리에서 URL을 <code>/pages/slug명</code>으로 입력하면 네비게이션에 연결됩니다.</li>
                  </ul>
                }
              />
            }
          >
            <Input placeholder="about-us" />
          </Form.Item>
          <Form.Item name="title" label="제목" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="상태" name="status" initialValue={0}>
            <Select options={[{ value: 0, label: '임시저장' }, { value: 1, label: '발행' }]} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="내용" required>
            <RichEditor value={contents} onChange={setContents} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
