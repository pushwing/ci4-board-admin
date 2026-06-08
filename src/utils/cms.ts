import dayjs from 'dayjs'
import type { CmsBanner, CmsMenu } from '../types'

export function isActiveNow(record: CmsBanner): boolean {
  if (Number(record.is_used) !== 1) return false
  const now = dayjs().unix()
  if (record.start_at !== null && now < record.start_at) return false
  if (record.end_at !== null && now > record.end_at) return false
  return true
}

export function isSlugUsedInMenus(menus: CmsMenu[], slug: string): boolean {
  return menus.some(
    (m) => m.url === `/pages/${slug}` || isSlugUsedInMenus(m.children ?? [], slug)
  )
}
