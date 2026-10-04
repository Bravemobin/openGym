// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  const snap = () => ({ user: { id: 'adm', name: 'Admin', admin: true }, S: {} })
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
vi.mock('./AdminCoach.jsx', () => ({ default: () => <div data-testid="admin-coach">Coach Component</div> }))

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

beforeEach(() => {
  document.body.innerHTML = ''
  mocks.sheets.length = 0
  mocks.answers = {
    '/api/admin/users': {
      users: [
        { id: 'u1', name: 'Alice', workouts: 15, lastSync: Date.now() - 3600000, disabled: false, streakWeeks: 4 },
        { id: 'u2', name: 'Bob', workouts: 8, lastSync: Date.now() - 86400000, disabled: false, streakWeeks: 2 }
      ],
      invite_only: false
    },
    '/api/admin/invites': { invites: [] },
    '/api/admin/audit': { events: [], enabled: true, retention: {} },
    '/api/admin/activity-dashboard': {
      now: Date.now(),
      kpis: {
        totalMembers: 2,
        liveNow: 1,
        dau: 2,
        wau: 2,
        mau: 2,
        totalWorkoutsAllTime: 23,
        workoutsThisMonth: 12,
        totalVolumeAllTime: 45000,
        avgWorkoutMinutes: 48
      },
      live: [
        {
          userId: 'u1',
          userName: 'Alice',
          routineName: 'Upper Hypertrophy',
          exIdx: 3,
          exTotal: 6,
          setsDone: 8,
          setsTotal: 18,
          startedAt: Date.now() - 25 * 60000
        }
      ],
      recentFeed: [
        {
          id: 'w101',
          userId: 'u2',
          userName: 'Bob',
          name: 'Leg Day Blast',
          date: '2026-09-29',
          timestamp: Date.now() - 7200000,
          durationMs: 50 * 60000,
          volume: 5200,
          setsDone: 15,
          prsCount: 2,
          exercises: [
            { name: 'Barbell Squat', setsDone: 4, topWeight: 140 },
            { name: 'Romanian Deadlift', setsDone: 3, topWeight: 120 }
          ],
          note: 'Felt strong on squats today!'
        }
      ],
      dailyTrends: [
        { date: '2026-09-28', workoutsCount: 3, activeUsersCount: 2, totalVolume: 8000 },
        { date: '2026-09-29', workoutsCount: 4, activeUsersCount: 3, totalVolume: 11000 }
      ],
      dayOfWeekStats: [2, 5, 4, 6, 3, 2, 1],
      hourOfDayStats: Array(24).fill(0).map((_, i) => (i === 18 ? 8 : i === 7 ? 5 : 1)),
      heatmap: { '2026-09-28': 3, '2026-09-29': 4 },
      leaderboard: [
        { id: 'u1', name: 'Alice', workouts: 15, workoutsLast30d: 8, streakWeeks: 4, totalVolume: 28000, unit: 'kg' },
        { id: 'u2', name: 'Bob', workouts: 8, workoutsLast30d: 4, streakWeeks: 2, totalVolume: 17000, unit: 'kg' }
      ],
      users: [
        { id: 'u1', name: 'Alice', workouts: 15, lastSync: Date.now() - 3600000, disabled: false, streakWeeks: 4 },
        { id: 'u2', name: 'Bob', workouts: 8, lastSync: Date.now() - 86400000, disabled: false, streakWeeks: 2 }
      ]
    }
  }
})

afterEach(() => { act(() => { mounted.splice(0).forEach(root => root.unmount()) }) })

describe('Management Dashboard for user activities', () => {
  it('renders live floor monitor and activity feed in the Activity tab', async () => {
    const page = render(<Admin />)
    await settle()

    // Top metrics
    expect(page.textContent).toContain('Live on Floor')
    expect(page.textContent).toContain('Workouts')

    // Live floor monitor
    expect(page.textContent).toContain('Live on Gym Floor')
    expect(page.textContent).toContain('Alice')
    expect(page.textContent).toContain('Upper Hypertrophy')
    expect(page.textContent).toContain('Exercise 3 of 6')

    // Recent activity feed
    expect(page.textContent).toContain('Workout Activity Feed')
    expect(page.textContent).toContain('Bob')
    expect(page.textContent).toContain('Leg Day Blast')
    expect(page.textContent).toContain('Barbell Squat')
    expect(page.textContent).toContain('2 PRs')
    expect(page.textContent).toContain('Felt strong on squats today!')

    // Users directory
    expect(page.textContent).toContain('Users')
    expect(page.textContent).toContain('Alice')
    expect(page.textContent).toContain('Bob')
  })

  it('switches to the Analytics tab and displays attendance trends, peak times, heatmap, and leaderboard', async () => {
    const page = render(<Admin />)
    await settle()

    const analyticsTab = [...page.querySelectorAll('.adm-tab-btn')].find(b => b.textContent.includes('Analytics'))
    expect(analyticsTab).toBeTruthy()
    act(() => analyticsTab.click())
    await settle()

    expect(page.textContent).toContain('DAU / WAU')
    expect(page.textContent).toContain('Avg Duration')
    expect(page.textContent).toContain('Daily Workouts (Last 30 Days)')
    expect(page.textContent).toContain('Peak Gym Days')
    expect(page.textContent).toContain('Peak Training Hours')
    expect(page.textContent).toContain('Gym Attendance Heatmap')
    expect(page.textContent).toContain('Consistency Leaderboard')
    expect(page.textContent).toContain('🔥 4w streak')
  })

  it('switches to the Operations tab and displays AI coach and invite controls', async () => {
    const page = render(<Admin />)
    await settle()

    const opsTab = [...page.querySelectorAll('.adm-tab-btn')].find(b => b.textContent.includes('Operations'))
    expect(opsTab).toBeTruthy()
    act(() => opsTab.click())
    await settle()

    expect(page.textContent).toContain('Coach Component')
    expect(page.textContent).toContain('Invite codes')
    expect(page.textContent).toContain('Activity log')
  })
})
