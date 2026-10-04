// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLang, getLang } from '../lib/i18n.js'
import { tAdmin, relAdmin, durAdmin, credentialHintAdmin, credentialLabelAdmin, failureTitleAdmin } from './admin-i18n.js'
import Admin from './Admin.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => ({ answers: {}, sheets: [] }))
vi.mock('../lib/api.js', () => ({
  api: path => {
    const key = path.split('?')[0]
    return key in mocks.answers ? Promise.resolve(mocks.answers[key]) : Promise.reject(new Error('not found'))
  }
}))
vi.mock('../store/useStore.js', () => {
  const snap = () => ({ user: { id: 'adm_fa', name: 'مدیر باشگاه', admin: true }, S: {} })
  const useStore = selector => selector ? selector(snap()) : snap()
  useStore.getState = snap
  return { useStore }
})
vi.mock('../store/useUI.js', () => {
  const snap = () => ({ toast: () => {}, openSheet: render => mocks.sheets.push(render) })
  const useUI = selector => selector ? selector(snap()) : snap()
  useUI.getState = snap
  return { useUI }
})
vi.mock('react-router-dom', () => ({ useNavigate: () => () => {} }))
vi.mock('../sheets.jsx', () => ({ confirmSheet: vi.fn() }))
vi.mock('./AdminCoach.jsx', () => ({ default: () => <div data-testid="admin-coach">بخش مربی هوشمند</div> }))

const mounted = []
function render(el) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => root.render(el))
  return host
}
const settle = () => act(() => new Promise(r => setTimeout(r, 0)))

beforeEach(async () => {
  await act(async () => { await setLang('fa') })
  document.body.innerHTML = ''
  mocks.sheets.length = 0
  mocks.answers = {
    '/api/admin/users': {
      users: [
        { id: 'u1', name: 'علی رضایی', workouts: 12, lastSync: Date.now() - 3600000, disabled: false, streakWeeks: 3 }
      ],
      invite_only: false
    },
    '/api/admin/invites': { invites: [] },
    '/api/admin/audit': { events: [], enabled: true, retention: {} },
    '/api/admin/activity-dashboard': {
      now: Date.now(),
      kpis: {
        totalMembers: 1,
        liveNow: 1,
        dau: 1,
        wau: 1,
        mau: 1,
        totalWorkoutsAllTime: 12,
        workoutsThisMonth: 6,
        totalVolumeAllTime: 34000,
        avgWorkoutMinutes: 45
      },
      live: [
        {
          userId: 'u1',
          userName: 'علی رضایی',
          routineName: 'تمرین بالاتنه',
          exIdx: 2,
          exTotal: 5,
          setsDone: 6,
          setsTotal: 15,
          startedAt: Date.now() - 20 * 60000
        }
      ],
      recentFeed: [
        {
          id: 'w101',
          userId: 'u1',
          userName: 'علی رضایی',
          name: 'تمرین سینه و سرشانه',
          date: '2026-09-29',
          timestamp: Date.now() - 3600000,
          durationMs: 45 * 60000,
          volume: 4200,
          setsDone: 12,
          prsCount: 1,
          exercises: [{ name: 'پرس سینه هالتر', setsDone: 4, topWeight: 100 }],
          note: 'تمرین پرانرژی بود'
        }
      ],
      dailyTrends: [],
      dayOfWeekStats: [1, 2, 3, 4, 5, 6, 7],
      hourOfDayStats: Array(24).fill(1),
      heatmap: {},
      leaderboard: [
        { id: 'u1', name: 'علی رضایی', workouts: 12, workoutsLast30d: 6, streakWeeks: 3, totalVolume: 34000, unit: 'kg' }
      ],
      users: [
        { id: 'u1', name: 'علی رضایی', workouts: 12, lastSync: Date.now() - 3600000, disabled: false, streakWeeks: 3 }
      ]
    }
  }
})

afterEach(async () => {
  await act(async () => { await setLang('en') })
  act(() => { mounted.splice(0).forEach(root => root.unmount()) })
})

afterAll(async () => {
  await act(async () => { await setLang('en') })
})

describe('Admin Persian localization (admin-i18n.js)', () => {
  it('translates admin strings correctly in Persian mode and English mode', async () => {
    await setLang('fa')
    expect(tAdmin('Admin')).toBe('مدیریت')
    expect(tAdmin('Management Dashboard')).toBe('داشبورد مدیریت')
    expect(tAdmin('Activity Feed')).toBe('فید فعالیت')
    expect(tAdmin('Analytics')).toBe('آمار و تحلیل')
    expect(tAdmin('Operations')).toBe('عملیات')
    expect(tAdmin('Users')).toBe('کاربران')
    expect(tAdmin('Workouts')).toBe('تمرین‌ها')
    expect(tAdmin('Live on Floor')).toBe('زنده در سالن')
    expect(tAdmin('Disable account')).toBe('غیرفعال‌سازی حساب')
    expect(tAdmin('Delete account')).toBe('حذف حساب کاربری')

    await setLang('en')
    expect(tAdmin('Admin')).toBe('Admin')
    expect(tAdmin('Management Dashboard')).toBe('Management Dashboard')
    expect(tAdmin('Disable account')).toBe('Disable account')
  })

  it('formats relative times and durations in Persian correctly', async () => {
    await setLang('fa')
    expect(relAdmin(0)).toBe('هرگز')
    expect(relAdmin(Date.now() - 10000)).toBe('همین الان')
    expect(relAdmin(Date.now() - 120000)).toContain('دقیقه پیش')
    expect(relAdmin(Date.now() - 7200000)).toContain('ساعت پیش')
    expect(durAdmin(45 * 60000)).toBe('45 دقیقه')
    expect(durAdmin(90 * 60000)).toBe('1 ساعت و 30 دقیقه')

    await setLang('en')
    expect(relAdmin(0)).toBe('never')
    expect(relAdmin(Date.now() - 10000)).toBe('just now')
    expect(durAdmin(45 * 60000)).toBe('45 min')
  })

  it('translates Coach credential and error helpers in Persian', async () => {
    await setLang('fa')
    expect(credentialHintAdmin({ state: 'connected', account: 'test@example.com' })).toContain('متصل به عنوان test@example.com')
    expect(credentialLabelAdmin('apikey')).toBe('کلید API')
    expect(failureTitleAdmin('timeout')).toContain('مهلت زمانی')

    await setLang('en')
    expect(credentialHintAdmin({ state: 'connected', account: 'test@example.com' })).toContain('Connected as test@example.com')
    expect(credentialLabelAdmin('apikey')).toBe('API key')
  })

  it('renders the Admin dashboard with Persian UI and language selector', async () => {
    setLang('fa')
    const page = render(<Admin />)
    await settle()

    // Persian title and top tiles
    expect(page.textContent).toContain('مدیریت')
    expect(page.textContent).toContain('کاربران')
    expect(page.textContent).toContain('تمرین‌ها')
    expect(page.textContent).toContain('زنده در سالن')

    // Persian tabs
    expect(page.textContent).toContain('فید فعالیت')
    expect(page.textContent).toContain('آمار و تحلیل')
    expect(page.textContent).toContain('عملیات')

    // Persian feed and live monitor
    expect(page.textContent).toContain('زنده در سالن باشگاه')
    expect(page.textContent).toContain('علی رضایی')
    expect(page.textContent).toContain('حرکت 2 از 5')
    expect(page.textContent).toContain('فید فعالیت‌های تمرینی')

    // Language selector button
    const langSeg = page.querySelector('.lang-seg')
    expect(langSeg).toBeTruthy()
    expect(langSeg.textContent).toContain('فارسی')
  })
})
