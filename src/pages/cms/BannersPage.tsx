import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Button, Modal, Form, Input, InputNumber, Switch, Space, App,
  Typography, Popconfirm, DatePicker, Image,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { fetchBanners, createBanner, updateBanner, deleteBanner } from '../../api/cms'
import type { CmsBanner } from '../../types'

const tsToDay = (ts: number | null) => (ts ? dayjs.unix(ts) : null)
const dayToTs = (d: dayjs.Dayjs | null) => (d ? d.unix() : null)

export default function BannersPage() {
  const qc = useQueryClient()
  const { message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CmsBanner | null>(null)
  const [form] = Form.useForm()

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
      is_used:  record.is_used === 1,
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
      render: (v: string) => v ? <Image src={v} width={80} height={40} style={{ objectFit: 'cover' }} /> : '-',
    },
    { title: '링크',   dataIndex: 'link_url', render: (v: string | null) => v ?? '-' },
    { title: '순서',   dataIndex: 'sequence', width: 70 },
    { title: '사용',   dataIndex: 'is_used',  width: 70, render: (v: number) => <Switch checked={v === 1} disabled size="small" /> },
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
            <Input placeholder="main_top" />
          </Form.Item>
          <Form.Item name="image_path" label="이미지 경로" rules={[{ required: true }]}>
            <Input placeholder="/uploads/banner/image.jpg" />
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
