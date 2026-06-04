import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Button, Modal, Form, Input, Space, App, Typography,
  Popconfirm, Tag, Image, Select, Alert, Tooltip, Switch,
} from 'antd'
import {
  UploadOutlined, EditOutlined, DeleteOutlined, FileOutlined,
  FilePdfOutlined, FileZipOutlined, FileWordOutlined, FileExcelOutlined,
  GlobalOutlined, LockOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { fetchLibraryFiles, uploadLibraryFile, updateLibraryFile, deleteLibraryFile } from '../../api/cms'
import type { LibraryFile, LibraryUsage } from '../../types'

const MIME_OPTIONS = [
  { label: '전체', value: '' },
  { label: '이미지', value: 'image/' },
  { label: 'PDF', value: 'application/pdf' },
  { label: 'ZIP', value: 'application/zip' },
  { label: 'Word', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml' },
  { label: 'Excel', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml' },
]

const SOURCE_OPTIONS = [
  { label: '전체 출처', value: '' },
  { label: '직접 업로드', value: 'direct' },
  { label: '위지윅', value: 'wysiwyg' },
]

const PUBLIC_OPTIONS = [
  { label: '전체', value: '' },
  { label: '공용만', value: '1' },
  { label: '비공개만', value: '0' },
]

const USAGE_TYPE_LABELS: Record<string, string> = {
  article:    '게시글',
  cms_page:   'CMS 페이지',
  cms_banner: 'CMS 배너',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileThumb({ file }: { file: LibraryFile }) {
  if (file.mime_type.startsWith('image/')) {
    return (
      <Image
        src={file.url}
        width={48}
        height={48}
        style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #f0f0f0' }}
        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      />
    )
  }
  const icon = file.mime_type.includes('pdf')
    ? <FilePdfOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
    : file.mime_type.includes('zip')
    ? <FileZipOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
    : file.mime_type.includes('word') || file.mime_type.includes('msword')
    ? <FileWordOutlined style={{ fontSize: 32, color: '#1677ff' }} />
    : file.mime_type.includes('excel') || file.mime_type.includes('spreadsheet')
    ? <FileExcelOutlined style={{ fontSize: 32, color: '#52c41a' }} />
    : <FileOutlined style={{ fontSize: 32, color: '#8c8c8c' }} />

  return (
    <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
  )
}

export default function LibraryPage() {
  const qc = useQueryClient()
  const { message, modal } = App.useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [page, setPage]     = useState(1)
  const [mime, setMime]     = useState('')
  const [source, setSource] = useState('')
  const [isPublicFilter, setIsPublicFilter] = useState('')
  const [uploadPublic, setUploadPublic]     = useState(false)

  const [editTarget, setEditTarget] = useState<LibraryFile | null>(null)
  const [editForm] = Form.useForm()

  const [usageConflict, setUsageConflict] = useState<LibraryUsage[] | null>(null)

  const queryKey = ['library-files', page, mime, source, isPublicFilter]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      fetchLibraryFiles({
        page,
        mime: mime || undefined,
        source: source || undefined,
        ...(isPublicFilter !== '' ? { is_public: isPublicFilter } : {}),
      } as any).then((r) => r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadLibraryFile(file, uploadPublic),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-files'] })
      message.success('파일이 업로드되었습니다.')
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '업로드에 실패했습니다.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ idx, alt_text, is_public }: { idx: number; alt_text: string | null; is_public: 0 | 1 }) =>
      updateLibraryFile(idx, { alt_text, is_public }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-files'] })
      message.success('수정되었습니다.')
      setEditTarget(null)
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '수정에 실패했습니다.'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLibraryFile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-files'] })
      message.success('파일이 삭제되었습니다.')
    },
    onError: (err: any) => {
      if (err.response?.status === 409) {
        setUsageConflict(err.response.data?.usages ?? [])
      } else {
        message.error(err.response?.data?.message ?? '삭제에 실패했습니다.')
      }
    },
  })

  // is_public 인라인 토글
  const togglePublicMutation = useMutation({
    mutationFn: ({ idx, is_public, alt_text }: { idx: number; is_public: 0 | 1; alt_text: string | null }) =>
      updateLibraryFile(idx, { alt_text, is_public }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-files'] })
    },
    onError: (err: any) => message.error(err.response?.data?.message ?? '변경에 실패했습니다.'),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return
    uploadMutation.mutate(file)
  }

  const openEdit = (record: LibraryFile) => {
    setEditTarget(record)
    editForm.setFieldsValue({ alt_text: record.alt_text ?? '', is_public: Number(record.is_public) === 1 })
  }

  const handleDelete = (record: LibraryFile) => {
    modal.confirm({
      title: '파일 삭제',
      content: `"${record.original_name}"을(를) 삭제하시겠습니까?`,
      okText: '삭제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: () => deleteMutation.mutate(record.idx),
    })
  }

  const columns = [
    {
      title: '미리보기',
      width: 64,
      render: (_: any, record: LibraryFile) => <FileThumb file={record} />,
    },
    {
      title: '파일명',
      dataIndex: 'original_name',
      render: (name: string, record: LibraryFile) => (
        <a href={record.url} target="_blank" rel="noopener noreferrer" title={record.file_path}>
          {name}
        </a>
      ),
    },
    {
      title: '공개',
      dataIndex: 'is_public',
      width: 80,
      render: (v: 0 | 1, record: LibraryFile) => (
        <Tooltip title={Number(v) === 1 ? '공용 — 클릭하여 비공개로 변경' : '비공개 — 클릭하여 공용으로 변경'}>
          <Switch
            size="small"
            checked={Number(v) === 1}
            checkedChildren={<GlobalOutlined />}
            unCheckedChildren={<LockOutlined />}
            loading={togglePublicMutation.isPending}
            onChange={(checked) =>
              togglePublicMutation.mutate({ idx: record.idx, is_public: checked ? 1 : 0, alt_text: record.alt_text })
            }
          />
        </Tooltip>
      ),
    },
    {
      title: '업로더',
      width: 130,
      render: (_: any, record: LibraryFile) => (
        <span style={{ fontSize: 12 }}>
          {record.uploader_nickname ?? '-'}
          {record.uploader_user_id && (
            <span style={{ color: '#aaa', marginLeft: 4 }}>({record.uploader_user_id})</span>
          )}
        </span>
      ),
    },
    {
      title: '출처',
      dataIndex: 'source',
      width: 90,
      render: (v: string) => (
        <Tag color={v === 'wysiwyg' ? 'blue' : 'green'}>{v === 'wysiwyg' ? '위지윅' : '직접'}</Tag>
      ),
    },
    {
      title: 'MIME',
      dataIndex: 'mime_type',
      width: 180,
      render: (v: string) => <span style={{ fontSize: 12, color: '#888' }}>{v}</span>,
    },
    {
      title: '크기',
      dataIndex: 'file_size',
      width: 90,
      render: (v: number) => formatBytes(v),
    },
    {
      title: 'Alt 텍스트',
      dataIndex: 'alt_text',
      render: (v: string | null) => (
        <Tooltip title={v ?? ''}>
          <span style={{ color: v ? '#000' : '#bbb', maxWidth: 120, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {v ?? '—'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '업로드일',
      dataIndex: 'timestamp_insert',
      width: 110,
      render: (v: number) => dayjs.unix(v).format('YYYY-MM-DD'),
    },
    {
      title: '관리',
      width: 90,
      render: (_: any, record: LibraryFile) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>파일 라이브러리</Typography.Title>
        <Space>
          <span style={{ fontSize: 13, color: '#555' }}>공용으로 업로드</span>
          <Switch
            checked={uploadPublic}
            onChange={setUploadPublic}
            checkedChildren={<GlobalOutlined />}
            unCheckedChildren={<LockOutlined />}
          />
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            파일 업로드
          </Button>
        </Space>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          accept="image/*,.pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={handleFileChange}
        />
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Select value={source} onChange={(v) => { setSource(v); setPage(1) }} options={SOURCE_OPTIONS} style={{ width: 140 }} />
        <Select value={mime} onChange={(v) => { setMime(v); setPage(1) }} options={MIME_OPTIONS} style={{ width: 140 }} />
        <Select value={isPublicFilter} onChange={(v) => { setIsPublicFilter(v); setPage(1) }} options={PUBLIC_OPTIONS} style={{ width: 110 }} />
      </Space>

      <Table
        rowKey="idx"
        loading={isLoading}
        dataSource={data?.data?.items ?? []}
        columns={columns}
        pagination={{
          current: page,
          pageSize: data?.data?.per_page ?? 20,
          total: data?.data?.total ?? 0,
          onChange: (p) => setPage(p),
          showTotal: (total) => `총 ${total}개`,
        }}
        size="small"
      />

      {/* 수정 모달 */}
      <Modal
        title="파일 정보 수정"
        open={!!editTarget}
        onCancel={() => setEditTarget(null)}
        onOk={() => editForm.submit()}
        okText="저장"
        cancelText="취소"
        confirmLoading={updateMutation.isPending}
        destroyOnClose
      >
        {editTarget && (
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileThumb file={editTarget} />
            <span style={{ fontSize: 13, color: '#555' }}>{editTarget.original_name}</span>
          </div>
        )}
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) =>
            updateMutation.mutate({
              idx:       editTarget!.idx,
              alt_text:  values.alt_text?.trim() || null,
              is_public: values.is_public ? 1 : 0,
            })
          }
        >
          <Form.Item name="alt_text" label="Alt 텍스트">
            <Input placeholder="이미지 대체 텍스트" allowClear />
          </Form.Item>
          <Form.Item name="is_public" label="공개 설정" valuePropName="checked">
            <Switch
              checkedChildren={<><GlobalOutlined /> 공용</>}
              unCheckedChildren={<><LockOutlined /> 비공개</>}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 사용처 충돌 모달 */}
      <Modal
        title="파일 삭제 불가"
        open={!!usageConflict}
        onCancel={() => setUsageConflict(null)}
        footer={<Button onClick={() => setUsageConflict(null)}>닫기</Button>}
      >
        <Alert
          type="warning"
          showIcon
          message="다음 위치에서 이 파일을 사용 중입니다. 참조를 먼저 제거한 후 삭제해주세요."
          style={{ marginBottom: 16 }}
        />
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {(usageConflict ?? []).map((u, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              <Tag color={u.type === 'article' ? 'blue' : u.type === 'cms_page' ? 'purple' : 'orange'}>
                {USAGE_TYPE_LABELS[u.type] ?? u.type}
              </Tag>
              {u.hint}
            </li>
          ))}
        </ul>
      </Modal>
    </>
  )
}
