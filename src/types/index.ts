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
