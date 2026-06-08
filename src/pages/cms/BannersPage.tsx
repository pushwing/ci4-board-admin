import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Button, Modal, Form, Input, InputNumber, Switch, Space, App,
  Typography, Popconfirm, DatePicker, Image, Select, Spin, Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { fetchBanners, createBanner, updateBanner, deleteBanner } from '../../api/cms'
import { isActiveNow } from '../../utils/cms'
import type { CmsBanner } from '../../types'

const tsToDay = (ts: number | null) => (ts ? dayjs.unix(ts) : null)
const dayToTs = (d: dayjs.Dayjs | null) => (d ? d.unix() : null)

const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface SizeSpec { width: number; height: number }

const POSITION_SIZES: Record<string, SizeSpec> = {
  main_top:    { width: 1200, height: 300 },
  main_bottom: { width: 1200, height: 300 },
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload  = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 읽을 수 없습니다.')) }
    img.src = url
  })
}

function BannerImageUpload({
  value,
  onChange,
  position,
}: {
  value?: string
  onChange?: (url: string) => void
  position?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const { message, modal } = App.useApp()

  const spec = position ? POSITION_SIZES[position] : undefined

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (!ALLOWED.includes(file.type)) {
      message.error('jpg, png, gif, webp 파일만 업로드 가능합니다.')
      return
    }

    if (spec) {
      let dims: { width: number; height: number }
      try {
        dims = await getImageDimensions(file)
      } catch {
        message.error('이미지를 읽을 수 없습니다.')
        return
      }

      if (dims.width !== spec.width || dims.height !== spec.height) {
        const confirmed = await new Promise<boolean>((resolve) => {
          modal.confirm({
            title: '이미지 사이즈 불일치',
            content: (
              <div>
                <p>권장 사이즈: <strong>{spec.width} × {spec.height}px</strong></p>
                <p>선택한 이미지: <strong>{dims.width} × {dims.height}px</strong></p>
                <p>그래도 업로드하시겠습니까?</p>
              </div>
            ),
            okText: '업로드',
            cancelText: '취소',
            onOk:    () => resolve(true),
            onCancel: () => resolve(false),
          })
        })
        if (!confirmed) return
      }
    }

    setUploading(true)
    try {
      const token = localStorage.getItem('admin_token')
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('/api/v1/files/wysiwyg', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        message.error(json.message ?? '업로드에 실패했습니다.')
        return
      }
      // 절대 URL → 상대 경로 변환 (/uploads/...) — Next.js rewrite 경유
      const url: string = json.data.url
      onChange?.(url.replace(/^https?:\/\/[^/]+/, ''))
    } catch {
      message.error('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {spec && (
        <div style={{ fontSize: 12, color: '#888' }}>
          권장 사이즈: <strong>{spec.width} × {spec.height}px</strong>
        </div>
      )}
      {value && (
        <Image
          src={value}
          style={{ maxHeight: 120, objectFit: 'contain', border: '1px solid #d9d9d9', borderRadius: 4 }}
        />
      )}
      <Spin spinning={uploading}>
        <Button
          icon={<UploadOutlined />}
          onClick={() => fileInputRef.current?.click()}
          loading={uploading}
          style={{ width: '100%' }}
        >
          {value ? '이미지 변경' : '이미지 업로드'}
        </Button>
      </Spin>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED.join(',')}
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  )
}

export default function BannersPage() {
  const qc = useQueryClient()
  const { message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CmsBanner | null>(null)
  const [form] = Form.useForm()
  const selectedPosition = Form.useWatch('position', form)

  const { data, isLoading } = useQuery({
    queryKey: ['cms-banners'],
    queryFn: () => fetchBanners().then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        ...values,
        start_at: dayToTs(values.start_at),
        end_at:   dayToTs(values.end_at),
        is_used:  values.is_used ? 1 : 0,
      }
      return editing ? updateBanner(editing.idx, payload) : createBanner(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-banners'] })
      message.success(editing ? '배너가 수정되었습니다.' : '배너가 생성되었습니다.')
      closeModal()
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '저장에 실패했습니다.'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBanner,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-banners'] })
      message.success('배너가 삭제되었습니다.')
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '삭제에 실패했습니다.'),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: CmsBanner) => {
    setEditing(record)
    form.setFieldsValue({
      ...record,
      start_at: tsToDay(record.start_at),
      end_at:   tsToDay(record.end_at),
      is_used:  Number(record.is_used) === 1,
    })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditing(null); form.resetFields() }

  const columns = [
    { title: 'idx',      dataIndex: 'idx',        width: 70 },
    { title: '위치',     dataIndex: 'position',   width: 120 },
    {
      title: '이미지',
      dataIndex: 'image_path',
      render: (v: string) => v ? <Image src={v.replace(/^https?:\/\/[^/]+/, '')} width={80} height={40} style={{ objectFit: 'cover' }} /> : '-',
    },
    { title: '링크',   dataIndex: 'link_url', render: (v: string | null) => v ?? '-' },
    { title: '순서',   dataIndex: 'sequence', width: 70 },
    { title: '사용',   dataIndex: 'is_used',  width: 70, render: (v: number) => <Switch checked={Number(v) === 1} disabled size="small" /> },
    {
      title: '노출 상태',
      width: 100,
      render: (_: any, record: CmsBanner) => isActiveNow(record)
        ? <Tag color="success">노출중</Tag>
        : <Tag color="default">비노출</Tag>,
    },
    {
      title: '관리',
      width: 100,
      render: (_: any, record: CmsBanner) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="삭제하시겠습니까?" onConfirm={() => deleteMutation.mutate(record.idx)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>배너 관리</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>배너 추가</Button>
      </div>

      <Table rowKey="idx" loading={isLoading} dataSource={data?.data ?? []} columns={columns} pagination={false} />

      <Modal
        title={editing ? '배너 수정' : '배너 추가'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="저장"
        cancelText="취소"
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
          <Form.Item name="position" label="위치 코드" rules={[{ required: true }]}>
            <Select placeholder="위치를 선택하세요">
              <Select.Option value="main_top">main_top — 메인 상단</Select.Option>
              <Select.Option value="main_bottom">main_bottom — 메인 하단</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="image_path" label="이미지" rules={[{ required: true, message: '이미지를 업로드해주세요.' }]}>
            <BannerImageUpload position={selectedPosition} />
          </Form.Item>
          <Form.Item name="link_url" label="링크 URL">
            <Input placeholder="https://example.com" />
          </Form.Item>
          <Form.Item name="start_at" label="노출 시작">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_at" label="노출 종료">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="sequence" label="순서" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_used" label="사용 여부" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
