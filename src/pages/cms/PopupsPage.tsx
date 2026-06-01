import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Button, Modal, Form, Input, Switch, Space, App,
  Typography, Popconfirm, DatePicker, Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { fetchPopups, fetchPopup, createPopup, updatePopup, deletePopup } from '../../api/cms'
import RichEditor from '../../components/RichEditor'
import type { CmsPopup } from '../../types'

const tsToDay = (ts: number | null) => (ts ? dayjs.unix(ts) : null)
const dayToTs = (d: dayjs.Dayjs | null) => (d ? d.unix() : null)

const fmtDate = (ts: number | null) =>
  ts ? dayjs.unix(ts).format('YYYY-MM-DD HH:mm') : '-'

export default function PopupsPage() {
  const qc = useQueryClient()
  const { message } = App.useApp()
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CmsPopup | null>(null)
  const [contents, setContents] = useState('')
  const [form] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['cms-popups', page],
    queryFn: () => fetchPopups({ page }).then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        ...values,
        contents,
        start_at: dayToTs(values.start_at),
        end_at:   dayToTs(values.end_at),
        is_used:  values.is_used ? 1 : 0,
      }
      return editing ? updatePopup(editing.idx, payload) : createPopup(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-popups'] })
      message.success(editing ? '팝업이 수정되었습니다.' : '팝업이 생성되었습니다.')
      closeModal()
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '저장에 실패했습니다.'),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePopup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-popups'] })
      message.success('팝업이 삭제되었습니다.')
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '삭제에 실패했습니다.'),
  })

  const openCreate = () => {
    setEditing(null)
    setContents('')
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = async (record: CmsPopup) => {
    const res = await fetchPopup(record.idx)
    const detail = res.data.data
    setEditing(record)
    setContents(detail.contents ?? '')
    form.setFieldsValue({
      title:    detail.title,
      position: detail.position,
      start_at: tsToDay(detail.start_at),
      end_at:   tsToDay(detail.end_at),
      is_used:  Number(detail.is_used) === 1,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    form.resetFields()
    setContents('')
  }

  const columns = [
    { title: 'idx',   dataIndex: 'idx',      width: 70 },
    { title: '제목',  dataIndex: 'title' },
    { title: '위치',  dataIndex: 'position', width: 120, render: (v: string) => v || '-' },
    { title: '시작',  dataIndex: 'start_at', width: 150, render: fmtDate },
    { title: '종료',  dataIndex: 'end_at',   width: 150, render: fmtDate },
    {
      title: '사용',
      dataIndex: 'is_used',
      width: 80,
      render: (v: number) => <Tag color={v ? 'green' : 'default'}>{v ? '사용' : '미사용'}</Tag>,
    },
    {
      title: '관리',
      width: 100,
      render: (_: any, record: CmsPopup) => (
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
        <Typography.Title level={4} style={{ margin: 0 }}>팝업 관리</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>팝업 추가</Button>
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
        title={editing ? '팝업 수정' : '팝업 추가'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        width={860}
        okText="저장"
        cancelText="취소"
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
          <Form.Item name="title" label="제목" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="position" label="위치 코드">
            <Input placeholder="main" />
          </Form.Item>
          <Space style={{ display: 'flex' }}>
            <Form.Item name="start_at" label="노출 시작">
              <DatePicker showTime />
            </Form.Item>
            <Form.Item name="end_at" label="노출 종료">
              <DatePicker showTime />
            </Form.Item>
          </Space>
          <Form.Item name="is_used" label="사용 여부" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item label="내용" required>
            <RichEditor value={contents} onChange={setContents} height={300} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
