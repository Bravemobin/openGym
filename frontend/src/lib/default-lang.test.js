// #303: an instance-wide default language, and the browser's, apply only to a copy nobody has
// picked a language for — never to an existing profile, whose `lang: 'en'` may be a choice.
import { describe, expect, it } from 'vitest'
import { matchLocale, autoLang } from './default-lang.js'

describe('matchLocale', () => {
  it('matches the full tag first, in any case or separator', () => {
    expect(matchLocale('fa')).toBe('fa')
    expect(matchLocale(' FA ')).toBe('fa')
    expect(matchLocale('en')).toBe('en')
    expect(matchLocale(' EN ')).toBe('en')
  })
  it('falls back to the base language, and to nothing for one the app does not have', () => {
    expect(matchLocale('fa-IR')).toBe('fa')
    expect(matchLocale('en-US')).toBe('en')
    expect(matchLocale('de-DE')).toBe(null)
    expect(matchLocale('nl-NL')).toBe(null)
    expect(matchLocale('')).toBe(null)
    expect(matchLocale(undefined)).toBe(null)
  })
})

describe('autoLang', () => {
  const fresh = { lang: 'en', langAuto: true }
  it('leaves a copy alone that chose, or that predates the mark', () => {
    expect(autoLang({ lang: 'en' }, { default_lang: 'fa' }, ['fa-IR'])).toBe(null)
    expect(autoLang({ lang: 'en', langAuto: false }, { default_lang: 'fa' }, ['fa-IR'])).toBe(null)
  })
  it('puts DEFAULT_LANG before the browser, the browser before English', () => {
    expect(autoLang(fresh, { default_lang: 'fa' }, ['en-US'])).toBe('fa')
    expect(autoLang(fresh, {}, ['nl-NL', 'fa-IR'])).toBe('fa')
    expect(autoLang(fresh, {}, ['nl-NL'])).toBe('en')
    expect(autoLang(fresh, { default_lang: 'xx' }, ['fa-IR'])).toBe('fa')
  })
})
