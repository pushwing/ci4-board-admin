import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal, Input, Segmented, Spin, Tooltip, Pagination, Empty } from 'antd'
import { FileOutlined, FilePdfOutlined, FileZipOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { fetchLibraryFiles } from '../api/cms'
import type { LibraryFile } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (url: string, name: string, mime: string) => void
}

type MimeFilter = 'all' | 'image' | 'doc'

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mime }: { mime: string }) {
  if (mime.includes('pdf'))  return <FilePdfOutlined style={{ fontSize: 28, color: '#ff4d4f' }} />
  if (mime.includes('zip'))  return <FileZipOutlined  style={{ fontSize: 28, color: '#fa8c16' }} />
  return <FileOutlined style={{ fontSize: 28, color: '#8c8c8c' }} />
}

export default function LibraryPicker({ open, onClose, onSelect }: Props) {
  const [keyword, setKeyword]     = useState('')
  const [mimeFilter, setMimeFilter] = useState<MimeFilter>('all')
  const [page, setPage]           = useState(1)

  const mimeParam =
    mimeFilter === 'image' ? 'image/' :
    mimeFilter === 'doc'   ? 'application/' :
    undefined

  const { data, isFetching } = useQuery({
    queryKey: ['library-picker', page, mimeFilter, keyword],
    queryFn: () =>
      fetchLibraryFiles({ page, mime: mimeParam, source: undefined })
        .then((r) => r.data?.data as { total: number; per_page: number; items: LibraryFile[] }),
    enabled: open,
  })

  const items: LibraryFile[] = data?.items ?? []

  // 클라이언트 사이드 키워드 필터 (페이지 내)
  const filtered = keyword.trim()
    ? items.filter((f) => f.original_name.toLowerCase().includes(keyword.toLowerCase()))
    : items

  const handleSelect = (file: LibraryFile) => {
    onSelect(file.url, file.original_name, file.mime_type)
    onClose()
  }

  const handleClose = () => {
    setKeyword('')
    setPage(1)
    onClose()
  }

  return (
    <Modal
      title="파일 라이브러리에서 삽입"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={760}
      destroyOnClose
    >
      {/* 필터 바 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Segmented
          options={[
            { label: '전체', value: 'all' },
            { label: '이미지', value: 'image' },
            { label: '문서/기타', value: 'doc' },
          ]}
          value={mimeFilter}
          onChange={(v) => { setMimeFilter(v as MimeFilter); setPage(1) }}
        />
        <Input.Search
          placeholder="파일명 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ flex: 1 }}
        />
      </div>

      {/* 파일 목록 */}
      <Spin spinning={isFetching} style={{ minHeight: 320 }}>
        {!isFetching && filtered.length === 0 ? (
          <Empty description="파일이 없습니다." style={{ margin: '40px 0' }} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 8,
              minHeight: 320,
              maxHeight: 400,
              overflowY: 'auto',
            }}
          >
            {filtered.map((file) => (
              <Tooltip
                key={file.idx}
                title={
                  <div style={{ fontSize: 12 }}>
                    <div>{file.original_name}</div>
                    <div style={{ color: '#aaa' }}>{formatBytes(file.file_size)}</div>
                    <div style={{ color: '#aaa' }}>{dayjs.unix(file.timestamp_insert).format('YYYY-MM-DD')}</div>
                  </div>
                }
                placement="bottom"
              >
                <div
                  onClick={() => handleSelect(file)}
                  style={{
                    cursor: 'pointer',
                    border: '1px solid #e8e8e8',
                    borderRadius: 6,
                    padding: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'border-color .15s, box-shadow .15s',
                    background: '#fff',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = '#1677ff'
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px rgba(22,119,255,.15)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = '#e8e8e8'
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
                  }}
                >
                  {file.mime_type.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.alt_text ?? file.original_name}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                    />
                  ) : (
                    <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileIcon mime={file.mime_type} />
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      color: '#555',
                      width: '100%',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={file.original_name}
                  >
                    {file.original_name}
                  </span>
                </div>
              </Tooltip>
            ))}
          </div>
        )}
      </Spin>

      {/* 페이지네이션 */}
      {(data?.total ?? 0) > (data?.per_page ?? 20) && (
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Pagination
            current={page}
            pageSize={data?.per_page ?? 20}
            total={data?.total ?? 0}
            size="small"
            onChange={(p) => setPage(p)}
            showTotal={(t) => `총 ${t}개`}
          />
        </div>
      )}
    </Modal>
  )
}
