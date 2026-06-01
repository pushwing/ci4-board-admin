import client from './client'

// ── 게시판 ──────────────────────────────────────────────────────────────────

export const fetchBoards = () => client.get('/boards')

export const updateBoard = (
  bbsId: string,
  data: {
    bbs_name: string
    bbs_used: boolean
    bbs_count_list_article: number
    bbs_comment_used: boolean
    view_list: string[]
    view_article: string[]
    write_article: string[]
    write_comment: string[]
  }
) => client.put(`/boards/${bbsId}`, data)

// ── 회원 ────────────────────────────────────────────────────────────────────

export const fetchMembers = (params?: { keyword?: string; status?: number; page?: number }) =>
  client.get('/members', { params })

export const updateMember = (
  idx: number,
  data: {
    group_idx: number
    status: number
    nickname: string
    email: string
    new_password?: string
  }
) => client.put(`/members/${idx}`, data)

// ── 게시글 ──────────────────────────────────────────────────────────────────

export const fetchArticles = (params?: { keyword?: string; bbs_id?: string; page?: number }) =>
  client.get('/articles', { params })

export const fetchArticle = (idx: number) => client.get(`/articles/${idx}`)

export const updateArticle = (
  idx: number,
  data: { title: string; contents: string; is_notice: boolean }
) => client.put(`/articles/${idx}`, data)

export const deleteArticle = (idx: number) => client.delete(`/articles/${idx}`)

// ── 사이트 설정 ──────────────────────────────────────────────────────────────

export const fetchSetting = () => client.get('/setting')

export const updateSetting = (data: {
  browser_title_fix_value: string
  join_used: boolean
  site_block_used: boolean
  site_block_contents: string
}) => client.put('/setting', data)
