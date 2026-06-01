import { Editor } from '@tinymce/tinymce-react'

interface Props {
  value: string
  onChange: (val: string) => void
  height?: number
}

// #25: TinyMCE 어드민 에디터 통합
// XSS sanitize는 서버(CI4)에서 처리 — 클라이언트는 원본 HTML 전송
export default function RichEditor({ value, onChange, height = 400 }: Props) {
  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      value={value}
      onEditorChange={onChange}
      init={{
        height,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image',
          'charmap', 'preview', 'anchor', 'searchreplace',
          'visualblocks', 'code', 'fullscreen', 'insertdatetime',
          'media', 'table', 'help', 'wordcount',
        ],
        toolbar:
          'undo redo | blocks | bold italic underline strikethrough | ' +
          'alignleft aligncenter alignright alignjustify | ' +
          'bullist numlist outdent indent | link image table | ' +
          'removeformat code fullscreen | help',
        content_style: 'body { font-family: -apple-system, sans-serif; font-size: 14px }',
        language: 'ko_KR',
      }}
    />
  )
}
