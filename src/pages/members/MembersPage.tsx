import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Button, Modal, Form, Input, Select, Tag, Space,
  App, Typography,
} from 'antd'
import { EditOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { fetchMembers, updateMember } from '../../api/admin'
import type { Member, UserGroup } from '../../types'

export default function MembersPage() {
  const qc = useQueryClient()
  const { message } = App.useApp()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [form] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-members', page, keyword, statusFilter],
    queryFn: () =>
      fetchMembers({ page, keyword: keyword || undefined, status: statusFilter }).then((r) => {
        setGroups(r.data.meta?.groups ?? [])
        return r.data
      }),
  })

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      if (!editing) return Promise.reject()
      return updateMember(editing.idx, {
        group_idx:    Number(values.group_idx),
        status:       Number(values.status),
        nickname:     values.nickname,
        email:        values.email,
        new_password: values.new_password || undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-members'] })
      message.success('회원 정보가 수정되었습니다.')
      setModalOpen(false)
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '저장에 실패했습니다.'),
  })

  const openEdit = (record: Member) => {
    setEditing(record)
    form.setFieldsValue({
      group_idx: String(groups.find((g) => g.group_name === record.group_name)?.idx ?? ''),
      status:    String(record.status),
      nickname:  record.nickname,
      email:     record.email,
      new_password: '',
    })
    setModalOpen(true)
  }

  const groupOptions = groups.map((g) => ({ value: String(g.idx), label: g.group_name }))

  const columns = [
    { title: 'idx',    dataIndex: 'idx',     width: 70 },
    { title: '아이디', dataIndex: 'user_id', width: 120 },
    { title: '닉네임', dataIndex: 'nickname' },
    { title: '이메일', dataIndex: 'email' },
    { title: '그룹',   dataIndex: 'group_name', width: 100 },
    {
      title: '상태',
      dataIndex: 'status',
      width: 80,
      render: (v: number) => <Tag color={Number(v) === 1 ? 'green' : 'red'}>{Number(v) === 1 ? '정상' : '탈퇴'}</Tag>,
    },
    { title: '글',  dataIndex: 'article_count', width: 60 },
    { title: '댓글', dataIndex: 'comment_count', width: 60 },
    {
      title: '가입일',
      dataIndex: 'timestamp_insert',
      width: 110,
      render: (v: number) => dayjs.unix(v).format('YYYY-MM-DD'),
    },
    {
      title: '관리',
      width: 80,
      render: (_: any, record: Member) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
      ),
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>회원 관리</Typography.Title>
        <Space>
          <Select
            allowClear
            placeholder="상태 필터"
            style={{ width: 120 }}
            options={[{ value: 1, label: '정상' }, { value: 0, label: '탈퇴' }]}
            onChange={(v) => { setStatusFilter(v); setPage(1) }}
          />
          <Input.Search
            placeholder="아이디·닉네임·이메일"
            allowClear
            style={{ width: 220 }}
            onSearch={(v) => { setKeyword(v); setPage(1) }}
            enterButton={<SearchOutlined />}
          />
        </Space>
      </div>

      <Table
        rowKey="idx"
        loading={isLoading}
        dataSource={data?.data ?? []}
        columns={columns}
        pagination={{
          current: page,
          pageSize: data?.meta?.per_page ?? 30,
          total: data?.meta?.total ?? 0,
          onChange: setPage,
        }}
      />

      <Modal
        title={`회원 수정 — ${editing?.user_id}`}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        okText="저장"
        cancelText="취소"
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
          <Form.Item name="group_idx" label="그룹" rules={[{ required: true }]}>
            <Select options={groupOptions} />
          </Form.Item>
          <Form.Item name="status" label="상태" rules={[{ required: true }]}>
            <Select options={[{ value: '1', label: '정상' }, { value: '0', label: '비활성' }]} />
          </Form.Item>
          <Form.Item name="nickname" label="닉네임" rules={[{ required: true, min: 2, max: 64 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="이메일" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="new_password" label="새 비밀번호 (변경 시만 입력)">
            <Input.Password placeholder="6자 이상 입력 시 변경" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
