import client from './client'
import type { CmsPage, CmsBanner, CmsPopup, CmsMenu } from '../types'

// ── Auth ────────────────────────────────────────────────────────────────────

export const adminLogin = (login_id: string, password: string) =>
  client.post<{ success: boolean; data: { access_token: string } }>('/auth/login', { login_id, password })

export const adminLogout = () => client.post('/auth/logout')

// ── Pages ───────────────────────────────────────────────────────────────────

export const fetchPages = (params?: { page?: number; keyword?: string; status?: number }) =>
  client.get('/cms/pages', { params })

export const fetchPage = (idx: number) =>
  client.get<{ success: boolean; data: CmsPage & { contents: string } }>(`/cms/pages/${idx}`)

export const createPage = (data: { slug: string; title: string; contents: string; status: number }) =>
  client.post('/cms/pages', data)

export const updatePage = (idx: number, data: Partial<{ slug: string; title: string; contents: string; status: number }>) =>
  client.put(`/cms/pages/${idx}`, data)

export const deletePage = (idx: number) => client.delete(`/cms/pages/${idx}`)

// ── Banners ─────────────────────────────────────────────────────────────────

export const fetchBanners = (params?: { position?: string }) =>
  client.get('/cms/banners', { params })

export const createBanner = (data: Partial<CmsBanner>) => client.post('/cms/banners', data)

export const updateBanner = (idx: number, data: Partial<CmsBanner>) =>
  client.put(`/cms/banners/${idx}`, data)

export const deleteBanner = (idx: number) => client.delete(`/cms/banners/${idx}`)

// ── Popups ──────────────────────────────────────────────────────────────────

export const fetchPopups = (params?: { page?: number; is_used?: number }) =>
  client.get('/cms/popups', { params })

export const fetchPopup = (idx: number) =>
  client.get<{ success: boolean; data: CmsPopup & { contents: string } }>(`/cms/popups/${idx}`)

export const createPopup = (data: Partial<CmsPopup & { contents: string }>) =>
  client.post('/cms/popups', data)

export const updatePopup = (idx: number, data: Partial<CmsPopup & { contents: string }>) =>
  client.put(`/cms/popups/${idx}`, data)

export const deletePopup = (idx: number) => client.delete(`/cms/popups/${idx}`)

// ── Menus ────────────────────────────────────────────────────────────────────

export const fetchMenus = () => client.get('/cms/menus')

export const createMenu = (data: Partial<CmsMenu>) => client.post('/cms/menus', data)

export const updateMenu = (idx: number, data: Partial<CmsMenu>) =>
  client.put(`/cms/menus/${idx}`, data)

export const deleteMenu = (idx: number) => client.delete(`/cms/menus/${idx}`)

export const reorderMenus = (items: { idx: number; sequence: number; parent_idx: number | null }[]) =>
  client.put('/cms/menus/reorder', items)
