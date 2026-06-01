import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useEffect, useRef, useState } from 'react'
import { Button, Space, Divider, Tooltip } from 'antd'
import {
  UndoOutlined, RedoOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined,
  StrikethroughOutlined, OrderedListOutlined, UnorderedListOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  LinkOutlined, PictureOutlined, FileImageOutlined, CodeOutlined,
} from '@ant-design/icons'
import './RichEditor.css'

const lowlight = createLowlight(common)

interface Props {
  value: string
  onChange: (val: string) => void
  height?: number
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  if (!editor) return null

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('링크 URL', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run()
  }

  const addImageByUrl = () => {
    const url = window.prompt('이미지 URL')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
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
      if (!res.ok || !json.success) { alert(json.message ?? '업로드 실패'); return }
      editor.chain().focus().setImage({ src: json.data.url }).run()
    } catch {
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const btn = (icon: React.ReactNode, tip: string, onClick: () => void, active?: boolean, disabled?: boolean) => (
    <Tooltip title={tip}>
      <Button
        size="small"
        type={active ? 'primary' : 'text'}
        icon={icon}
        onClick={onClick}
        disabled={disabled}
        style={{ minWidth: 28 }}
      />
    </Tooltip>
  )

  return (
    <div className="rich-editor-toolbar">
      <Space size={2} wrap>
        {btn(<UndoOutlined />, '실행취소', () => editor.chain().focus().undo().run(), false, !editor.can().undo())}
        {btn(<RedoOutlined />, '다시실행', () => editor.chain().focus().redo().run(), false, !editor.can().redo())}
        <Divider style={{ margin: '0 4px', height: 20 }} />

        {btn(<BoldOutlined />, '굵게', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {btn(<ItalicOutlined />, '기울임', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {btn(<UnderlineOutlined />, '밑줄', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
        {btn(<StrikethroughOutlined />, '취소선', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
        <Divider style={{ margin: '0 4px', height: 20 }} />

        <Tooltip title="제목1">
          <Button size="small" type={editor.isActive('heading', { level: 1 }) ? 'primary' : 'text'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            style={{ minWidth: 28, fontWeight: 700, fontSize: 11 }}>H1</Button>
        </Tooltip>
        <Tooltip title="제목2">
          <Button size="small" type={editor.isActive('heading', { level: 2 }) ? 'primary' : 'text'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            style={{ minWidth: 28, fontWeight: 700, fontSize: 11 }}>H2</Button>
        </Tooltip>
        <Tooltip title="제목3">
          <Button size="small" type={editor.isActive('heading', { level: 3 }) ? 'primary' : 'text'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            style={{ minWidth: 28, fontWeight: 700, fontSize: 11 }}>H3</Button>
        </Tooltip>
        <Divider style={{ margin: '0 4px', height: 20 }} />

        {btn(<AlignLeftOutlined />, '왼쪽 정렬', () => editor.chain().focus().setTextAlign('left').run(), editor.isActive({ textAlign: 'left' }))}
        {btn(<AlignCenterOutlined />, '가운데 정렬', () => editor.chain().focus().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }))}
        {btn(<AlignRightOutlined />, '오른쪽 정렬', () => editor.chain().focus().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' }))}
        <Divider style={{ margin: '0 4px', height: 20 }} />

        {btn(<UnorderedListOutlined />, '불릿 목록', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {btn(<OrderedListOutlined />, '번호 목록', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
        <Divider style={{ margin: '0 4px', height: 20 }} />

        {btn(<LinkOutlined />, '링크', setLink, editor.isActive('link'))}
        {btn(<PictureOutlined />, '이미지 URL', addImageByUrl)}
        <Tooltip title={uploading ? '업로드 중...' : '이미지 파일 업로드'}>
          <Button size="small" type="text" icon={<FileImageOutlined />}
            loading={uploading} onClick={() => fileInputRef.current?.click()}
            style={{ minWidth: 28 }} />
        </Tooltip>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
          className="rich-editor-file-input" onChange={handleFileSelect} />
        <Divider style={{ margin: '0 4px', height: 20 }} />

        {btn(<CodeOutlined />, '코드 블록', () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive('codeBlock'))}
      </Space>
    </div>
  )
}

export default function RichEditor({ value, onChange, height = 400 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, link: false, underline: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: '내용을 입력하세요.' }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
        style: `min-height: ${height - 50}px`,
      },
    },
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  return (
    <div className="rich-editor-wrap">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
