// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import LanguageSelect from './LanguageSelect.jsx'
import { useStore } from '../store/useStore.js'
import * as i18n from '../lib/i18n.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('LanguageSelect component', () => {
  let host, root

  beforeEach(() => {
    useStore.setState({
      S: { lang: 'en', langAuto: false },
      config: {}
    })
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => root.unmount())
    host.remove()
  })

  it('renders openGym Segmented control with English and Persian buttons', () => {
    act(() => {
      root.render(<LanguageSelect />)
    })
    const seg = host.querySelector('.seg.lang-seg')
    expect(seg).toBeTruthy()
    const buttons = Array.from(seg.querySelectorAll('button')).map(b => b.textContent)
    expect(buttons).toContain('English')
    expect(buttons).toContain('فارسی')
  })

  it('switches between English and Persian on button click', async () => {
    const setLangSpy = vi.spyOn(i18n, 'setLang').mockImplementation(() => Promise.resolve())
    act(() => {
      root.render(<LanguageSelect />)
    })
    const seg = host.querySelector('.seg.lang-seg')
    const buttons = Array.from(seg.querySelectorAll('button'))
    const faBtn = buttons.find(b => b.textContent.includes('فارسی'))
    const enBtn = buttons.find(b => b.textContent.includes('English'))

    // Click Persian button
    await act(async () => {
      faBtn.click()
    })

    expect(useStore.getState().S.lang).toBe('fa')
    expect(useStore.getState().S.langAuto).toBe(false)
    expect(setLangSpy).toHaveBeenCalledWith('fa', true, false)

    // Click English button
    await act(async () => {
      enBtn.click()
    })

    expect(useStore.getState().S.lang).toBe('en')
    expect(setLangSpy).toHaveBeenCalledWith('en', true, false)
    setLangSpy.mockRestore()
  })

  it('highlights the active Persian language button with class "on"', () => {
    useStore.setState({
      S: { lang: 'fa', langAuto: false },
      config: {}
    })
    act(() => {
      root.render(<LanguageSelect />)
    })
    const seg = host.querySelector('.seg.lang-seg')
    const buttons = Array.from(seg.querySelectorAll('button'))
    const faBtn = buttons.find(b => b.textContent.includes('فارسی'))
    const enBtn = buttons.find(b => b.textContent.includes('English'))

    expect(faBtn.classList.contains('on')).toBe(true)
    expect(enBtn.classList.contains('on')).toBe(false)
  })
})
