// @vitest-environment happy-dom
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useStore } from '../store/useStore.js'
import { confirmSheet } from '../sheets.jsx'
import Home from './Home.jsx'

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('../sheets.jsx', () => ({
  starterPlanSheet: vi.fn(), bwSheet: vi.fn(), goalSheet: vi.fn(), dayOverrideSheet: vi.fn(),
  calendarSheet: vi.fn(), startFlow: vi.fn(), bwDeltaColor: () => '', weighInsSheet: vi.fn(),
  confirmSheet: vi.fn(),
}))

let host, root
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  confirmSheet.mockClear()
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove() })

const mountWith = user => {
  useStore.setState(s => ({
    S: { ...s.S, routines: [], workouts: [], bodyweight: [], dayPlan: {}, week: {}, active: null },
    user,
  }))
  act(() => root.render(<Home />))
}

const logoutBtn = () => host.querySelector('button[aria-label="Sign out"]')

describe('Home — athlete logout button in header', () => {
  it('shows logout button for athlete user', () => {
    mountWith({ id: 'u1', name: 'Athlete 1', role: 'athlete' })
    expect(logoutBtn()).toBeTruthy()
  })

  it('does not show logout button for guest', () => {
    mountWith(null)
    expect(logoutBtn()).toBeNull()
  })

  it('does not show athlete logout button for coach/admin', () => {
    mountWith({ id: 'c1', name: 'Coach', role: 'coach', admin: true })
    expect(logoutBtn()).toBeNull()
  })

  it('opens confirmation sheet and signs out on confirm', async () => {
    const signOut = vi.fn().mockResolvedValue({ owed: false })
    useStore.setState({ signOut })

    mountWith({ id: 'u1', name: 'Athlete 1', role: 'athlete' })
    const btn = logoutBtn()
    act(() => { btn.dispatchEvent(new MouseEvent('click', { bubbles: true })) })

    expect(confirmSheet).toHaveBeenCalledTimes(1)
    const opts = confirmSheet.mock.calls[0][0]
    expect(opts.danger).toBe(true)

    await opts.onConfirm()
    expect(signOut).toHaveBeenCalledWith({ force: true })
  })
})
