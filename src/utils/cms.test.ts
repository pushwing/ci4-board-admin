import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import dayjs from 'dayjs'
import { isActiveNow, isSlugUsedInMenus } from './cms'
import type { CmsBanner, CmsMenu } from '../types'

// ── isActiveNow ──────────────────────────────────────────────────────────────

const baseBanner: CmsBanner = {
  idx: 1,
  position: 'main',
  image_path: '/uploads/test.jpg',
  link_url: null,
  start_at: null,
  end_at: null,
  sequence: 1,
  is_used: 1,
  timestamp_insert: 0,
}

const NOW = dayjs('2025-06-08T12:00:00').unix()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2025-06-08T12:00:00'))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('isActiveNow', () => {
  it('is_used=0 이면 날짜 관계없이 false', () => {
    expect(isActiveNow({ ...baseBanner, is_used: 0 })).toBe(false)
  })

  it('날짜 제한 없이 is_used=1 이면 true', () => {
    expect(isActiveNow({ ...baseBanner, start_at: null, end_at: null })).toBe(true)
  })

  it('현재 시각이 start_at 이전이면 false', () => {
    expect(isActiveNow({ ...baseBanner, start_at: NOW + 3600, end_at: null })).toBe(false)
  })

  it('현재 시각이 start_at 이후이면 true', () => {
    expect(isActiveNow({ ...baseBanner, start_at: NOW - 3600, end_at: null })).toBe(true)
  })

  it('현재 시각이 end_at 이후이면 false', () => {
    expect(isActiveNow({ ...baseBanner, start_at: null, end_at: NOW - 1 })).toBe(false)
  })

  it('현재 시각이 end_at 이전이면 true', () => {
    expect(isActiveNow({ ...baseBanner, start_at: null, end_at: NOW + 3600 })).toBe(true)
  })

  it('start_at ~ end_at 범위 안에 있으면 true', () => {
    expect(isActiveNow({ ...baseBanner, start_at: NOW - 3600, end_at: NOW + 3600 })).toBe(true)
  })

  it('start_at ~ end_at 범위 밖이면 false (종료 후)', () => {
    expect(isActiveNow({ ...baseBanner, start_at: NOW - 7200, end_at: NOW - 3600 })).toBe(false)
  })

  it('start_at ~ end_at 범위 밖이면 false (시작 전)', () => {
    expect(isActiveNow({ ...baseBanner, start_at: NOW + 3600, end_at: NOW + 7200 })).toBe(false)
  })
})

// ── isSlugUsedInMenus ────────────────────────────────────────────────────────

const menuTree: CmsMenu[] = [
  {
    idx: 1, parent_idx: null, label: '홈', url: '/', target: '_self', sequence: 1, is_used: 1,
    children: [],
  },
  {
    idx: 2, parent_idx: null, label: '소개', url: '/pages/about', target: '_self', sequence: 2, is_used: 1,
    children: [
      {
        idx: 3, parent_idx: 2, label: '팀', url: '/pages/team', target: '_self', sequence: 1, is_used: 1,
        children: [],
      },
    ],
  },
  {
    idx: 4, parent_idx: null, label: '외부', url: 'https://example.com', target: '_blank', sequence: 3, is_used: 1,
    children: [],
  },
]

describe('isSlugUsedInMenus', () => {
  it('루트 레벨에서 slug가 사용되면 true', () => {
    expect(isSlugUsedInMenus(menuTree, 'about')).toBe(true)
  })

  it('중첩 메뉴에서 slug가 사용되면 true', () => {
    expect(isSlugUsedInMenus(menuTree, 'team')).toBe(true)
  })

  it('사용되지 않는 slug 이면 false', () => {
    expect(isSlugUsedInMenus(menuTree, 'contact')).toBe(false)
  })

  it('빈 메뉴 트리면 false', () => {
    expect(isSlugUsedInMenus([], 'about')).toBe(false)
  })

  it('URL이 /pages/{slug} 형태가 아닌 경우 매칭 안 됨', () => {
    // url='https://example.com' 은 /pages/... 가 아니므로 false
    expect(isSlugUsedInMenus(menuTree, 'example.com')).toBe(false)
  })

  it('부분 문자열 매칭 안 됨 (about-us != about)', () => {
    expect(isSlugUsedInMenus(menuTree, 'about-us')).toBe(false)
  })

  it('children이 undefined인 메뉴도 안전하게 처리', () => {
    const menus: CmsMenu[] = [
      { idx: 10, parent_idx: null, label: 'test', url: '/pages/test', target: '_self', sequence: 1, is_used: 1 },
    ]
    expect(isSlugUsedInMenus(menus, 'test')).toBe(true)
    expect(isSlugUsedInMenus(menus, 'other')).toBe(false)
  })
})
