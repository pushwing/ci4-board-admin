import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Button, Modal, Form, Input, Switch, InputNumber,
  Checkbox, Space, App, Typography, Tag,
} from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { fetchBoards, updateBoard } from '../../api/admin'
import { parsePhpSerializedArray } from '../../utils/phpUnserialize'
import type { Board, UserGroup } from '../../types'

export default function BoardsPage() {
  const qc = useQueryClient()
  const { message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Board | null>(null)
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [form] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-boards'],
    queryFn: () =>
      fetchBoards().then((r) => {
        setGroups(r.data.data?.groups ?? [])
        return r.data
      }),
  })

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      if (!editing) return Promise.reject()
      return updateBoard(editing.bbs_id, {
        bbs_name:               values.bbs_name,
        bbs_used:               !!values.bbs_used,
        bbs_count_list_article: values.bbs_count_list_article,
        bbs_comment_used:       !!values.bbs_comment_used,
        view_list:              (values.view_list    ?? []).map(String),
        view_article:           (values.view_article ?? []).map(String),
        write_article:          (values.write_article ?? []).map(String),
        write_comment:          (values.write_comment ?? []).map(String),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-boards'] })
      message.success('게시판 설정이 저장되었습니다.')
      setModalOpen(false)
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '저장에 실패했습니다.'),
  })

  const openEdit = (board: Board) => {
    setEditing(board)
    form.setFieldsValue({
      bbs_name:               board.bbs_name,
      bbs_used:               board.bbs_used === '1',
      bbs_count_list_article: Number(board.list_count) || 15,
      bbs_comment_used:       board.comment_used === '1',
      view_list:    parsePhpSerializedArray(board.perm_view_list),
      view_article: parsePhpSerializedArray(board.perm_view_list),
      write_article: parsePhpSerializedArray(board.perm_write_article),
      write_comment: parsePhpSerializedArray(board.perm_write_article),
    })
    setModalOpen(true)
  }

  const groupOptions = groups.map((g) => ({ label: g.group_name, value: String(g.idx) }))

  const columns = [
    { title: 'bbs_id', dataIndex: 'bbs_id', width: 160, render: (v: string) => <code>{v}</code> },
    { title: '게시판명', dataIndex: 'bbs_name' },
    { title: '목록 수', dataIndex: 'list_count', width: 80 },
    {
      title: '사용',
      dataIndex: 'bbs_used',
      width: 80,
      render: (v: string) => <Tag color={v === '1' ? 'green' : 'default'}>{v === '1' ? '사용' : '중지'}</Tag>,
    },
    {
      title: '댓글',
      dataIndex: 'comment_used',
      width: 80,
      render: (v: string) => <Tag color={v === '1' ? 'blue' : 'default'}>{v === '1' ? '허용' : '차단'}</Tag>,
    },
    {
      title: '관리',
      width: 80,
      render: (_: any, record: Board) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>설정</Button>
      ),
    },
  ]

  return (
    <>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>게시판 관리</Typography.Title>

      <Table
        rowKey="idx"
        loading={isLoading}
        dataSource={data?.data?.boards ?? []}
        columns={columns}
        pagination={false}
      />

      <Modal
        title={`게시판 설정 — ${editing?.bbs_id}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={640}
        okText="저장"
        cancelText="취소"
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
          <Form.Item name="bbs_name" label="게시판명" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space>
            <Form.Item name="bbs_used" label="사용 여부" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="bbs_comment_used" label="댓글 허용" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="bbs_count_list_article" label="페이지당 목록 수">
              <InputNumber min={1} max={100} />
            </Form.Item>
          </Space>

          <Form.Item name="view_list" label="목록 보기 — 허용 그룹">
            <Checkbox.Group options={groupOptions} />
          </Form.Item>
          <Form.Item name="view_article" label="글 보기 — 허용 그룹">
            <Checkbox.Group options={groupOptions} />
          </Form.Item>
          <Form.Item name="write_article" label="글 쓰기 — 허용 그룹">
            <Checkbox.Group options={groupOptions} />
          </Form.Item>
          <Form.Item name="write_comment" label="댓글 쓰기 — 허용 그룹">
            <Checkbox.Group options={groupOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
