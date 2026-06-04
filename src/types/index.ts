export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message: string | null
}

export interface ApiListResponse<T = unknown> {
  success: boolean
  data: T[]
  meta: {
    page: number
    per_page: number
    total: number
    last_page: number
  }
}

export interface AuthUser {
  idx: number
  user_id: string
  nickname: string
  group_idx: number
}

export interface CmsPage {
  idx: number
  slug: string
  title: string
  status: 0 | 1
  timestamp_insert: number
  timestamp_update: number | null
}

export interface CmsPageDetail extends CmsPage {
  contents: string
}

export interface CmsBanner {
  idx: number
  position: string
  image_path: string
  link_url: string | null
  start_at: number | null
  end_at: number | null
  sequence: number
  is_used: 0 | 1
  timestamp_insert: number
}

export interface CmsPopup {
  idx: number
  title: string
  position: string
  start_at: number | null
  end_at: number | null
  is_used: 0 | 1
  timestamp_insert: number
}

export interface CmsPopupDetail extends CmsPopup {
  contents: string
}

// ── 운영 관리 ────────────────────────────────────────────────────────────────

export interface Board {
  idx: number
  bbs_id: string
  bbs_name: string
  bbs_used: string
  list_count: string
  comment_used: string
  perm_view_list: string
  perm_write_article: string
}

export interface UserGroup {
  idx: number
  group_name: string
}

export interface Member {
  idx: number
  user_id: string
  nickname: string
  email: string
  status: number
  group_name: string
  article_count: number
  comment_count: number
  timestamp_insert: number
}

export interface Article {
  idx: number
  title: string
  nickname: string
  bbs_id: string
  bbs_name: string
  is_notice: number
  is_deleted: number
  comment_count: number
  hit_count: number
  timestamp_insert: number
}

export interface SiteSetting {
  browser_title_fix_value: string
  join_used: string
  site_block_used: string
  site_block_contents: string
}

export interface CmsMenu {
  idx: number
  parent_idx: number | null
  label: string
  url: string
  target: '_self' | '_blank'
  sequence: number
  is_used: 0 | 1
  children?: CmsMenu[]
}

export interface LibraryFile {
  idx: number
  uploader_idx: number
  uploader_user_id: string | null
  uploader_nickname: string | null
  source: 'direct' | 'wysiwyg'
  original_name: string
  stored_name: string
  file_path: string
  mime_type: string
  file_size: number
  alt_text: string | null
  is_public: 0 | 1
  used_count: number
  timestamp_insert: number
  url: string
}

export interface LibraryUsage {
  type: 'article' | 'cms_page' | 'cms_banner'
  idx: number
  hint: string
}

export interface LibraryListResponse {
  total: number
  page: number
  per_page: number
  items: LibraryFile[]
}
