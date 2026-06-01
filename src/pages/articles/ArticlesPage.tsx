import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Button, Modal, Form, Input, Switch, Space, App,
  Typography, Popconfirm, Tag, Select, Spin,
} from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { fetchArticles, fetchArticle, updateArticle, deleteArticle } from '../../api/admin'
import RichEditor from '../../components/RichEditor'
import type { Article } from '../../types'

export default function ArticlesPage() {
  const qc = useQueryClient()
  const { message } = App.useApp()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [bbsFilter, setBbsFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [contents, setContents] = useState('')
  const [contentsLoading, setContentsLoading] = useState(false)
  const [form] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles', page, keyword, bbsFilter],
    queryFn: () =>
      fetchArticles({
        page,
        keyword: keyword || undefined,
        bbs_id: bbsFilter || undefined,
      }).then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      if (!editing) return Promise.reject()
      return updateArticle(editing.idx, {
        title:     values.title,
        contents,
        is_notice: !!values.is_notice,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-articles'] })
      message.success('게시글이 수정되었습니다.')
      closeModal()
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '저장에 실패했습니다.'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-articles'] })
      message.success('게시글이 삭제되었습니다.')
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '삭제에 실패했습니다.'),
  })

  const openEdit = async (record: Article) => {
    setEditing(record)
    setContents('')
    form.setFieldsValue({ title: record.title, is_notice: record.is_notice === 1 })
    setModalOpen(true)

    // 본문은 단건 조회 API로 별도 로딩
    setContentsLoading(true)
    try {
      const res = await fetchArticle(record.idx)
      setContents(res.data?.data?.contents ?? '')
    } catch {
      message.error('본문을 불러오지 못했습니다.')
    } finally {
      setContentsLoading(false)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setContents('')
    form.resetFields()
  }

  const bbsOptions = [...new Map((data?.data as Article[] ?? []).map((a) => [a.bbs_id, a])).values()]
    .map((a) => ({ value: a.bbs_id, label: `${a.bbs_name} (${a.bbs_id})` }))

  const columns = [
    { title: 'idx',    dataIndex: 'idx',       width: 70 },
    { title: '게시판', dataIndex: 'bbs_name',  width: 100 },
    {
      title: '제목',
      dataIndex: 'title',
      render: (v: string, r: Article) => (
        <Space>
          {r.is_notice === 1 && <Tag color="orange">공지</Tag>}
          {v}
        </Space>
      ),
    },
    { title: '작성자', dataIndex: 'nickname',      width: 100 },
    { title: '조회',   dataIndex: 'hit_count',     width: 70 },
    { title: '댓글',   dataIndex: 'comment_count', width: 70 },
    {
      title: '작성일',
      dataIndex: 'timestamp_insert',
      width: 110,
      render: (v: number) => dayjs.unix(v).format('YYYY-MM-DD'),
    },
    {
      title: '관리',
      width: 100,
      render: (_: any, record: Article) => (
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
        <Typography.Title level={4} style={{ margin: 0 }}>게시글 관리</Typography.Title>
        <Space>
          <Select
            allowClear
            placeholder="게시판 필터"
            style={{ width: 180 }}
            options={bbsOptions}
            onChange={(v) => { setBbsFilter(v ?? ''); setPage(1) }}
          />
          <Input.Search
            placeholder="제목·작성자 검색"
            allowClear
            style={{ width: 200 }}
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
        title={`게시글 수정${editing ? ` — #${editing.idx}` : ''}`}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        width={900}
        okText="저장"
        cancelText="취소"
        confirmLoading={saveMutation.isPending}
        okButtonProps={{ disabled: contentsLoading }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
          <Form.Item name="title" label="제목" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="내용" required>
            {contentsLoading ? (
              <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d9d9d9', borderRadius: 6 }}>
                <Spin tip="본문 불러오는 중..." />
              </div>
            ) : (
              <RichEditor value={contents} onChange={setContents} height={400} />
            )}
          </Form.Item>

          <Form.Item name="is_notice" label="공지 여부" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
