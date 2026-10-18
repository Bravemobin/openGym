import { describe, it, expect } from 'vitest'
import {
  LANGS, INSTR_LANGS, EXERCISE_NAME_LANGS, DATE_LOCALES, DERIVED_LOCALES,
  baseLang, derivePack, dateLocale, getLang, t, _setLangState, exerciseNameClass, exerciseNameFor, CASED_NAME_LANGS
} from './i18n-core.js'
import { EXDB } from './exercises-data.js'
import fa from '../locales/fa.js'

describe('baseLang', () => {
  it('leaves supported languages as themselves', () => {
    expect(baseLang('fa')).toBe('fa')
    expect(baseLang('en')).toBe('en')
    expect(baseLang('nonsense')).toBe('nonsense')
  })
})

describe('derivePack', () => {
  it('returns the pack untouched for a language that is not derived', () => {
    const pack = { a: 'تست' }
    expect(derivePack('fa', pack)).toBe(pack)
    expect(derivePack('en', pack)).toBe(pack)
  })

  it('passes a null pack through', () => {
    expect(derivePack('fa', null)).toBe(null)
  })
})

describe('LANGS and DATE_LOCALES', () => {
  it('offers English and Persian in the picker', () => {
    expect(LANGS['en']).toBe('English')
    expect(LANGS['fa']).toBe('فارسی')
    expect(Object.keys(LANGS)).toEqual(['en', 'fa'])
    expect(DATE_LOCALES['en']).toBe('en-GB')
    expect(DATE_LOCALES['fa']).toBe('fa-IR-u-nu-latn')
  })

  it('sets and gets the active language', () => {
    _setLangState('fa', fa, null, null)
    expect(getLang()).toBe('fa')
    expect(dateLocale()).toBe('fa-IR-u-nu-latn')
    expect(t('Settings')).toBe('تنظیمات')
    _setLangState('en', {}, null, null)
  })
})

describe('exerciseNameClass', () => {
  const bench = { id: '0025', n: 'barbell bench press' }
  const pushUp = { id: '0662', n: 'push-up' }
  const custom = { id: 'custom-1', n: 'my own press' }

  it('title-cases in English', () => {
    _setLangState('en', {}, null, null)
    expect(exerciseNameClass(bench)).toBe('capitalize')
    expect(exerciseNameClass(pushUp)).toBe('capitalize')
    expect(exerciseNameClass(custom)).toBe('capitalize')
  })

  it('title-cases when showing Persian pack (lower-case style)', () => {
    _setLangState('fa', {}, null, { '0025': 'پرس سینه با هالتر' })
    expect(exerciseNameClass(bench)).toBe('capitalize')
    _setLangState('en', {}, null, null)
  })
})

describe('title-casing per exercise-name pack', () => {
  const packs = import.meta.glob('../exercise-names/*.js', { eager: true, import: 'default' })
  const packFor = lang => packs[`../exercise-names/${lang}.js`]

  it('lists exactly the packs written in their own casing', () => {
    for (const lang of CASED_NAME_LANGS) expect(EXERCISE_NAME_LANGS, lang).toContain(lang)
  })

  for (const lang of EXERCISE_NAME_LANGS) {
    const cased = CASED_NAME_LANGS.includes(baseLang(lang))
    it(`${lang}: a translated name is ${cased ? 'left in its own casing' : 'title-cased like English'}`, () => {
      const names = packFor(baseLang(lang))
      const translated = EXDB.filter(e => names[e.id])
      _setLangState(lang, {}, null, names)
      for (const ex of translated) expect(exerciseNameClass(ex), `${lang} ${ex.id}`).toBe(cased ? '' : 'capitalize')
      _setLangState('en', {}, null, null)
    })
  }
})

describe('English-name switches with every exercise-name pack', () => {
  const packs = import.meta.glob('../exercise-names/*.js', { eager: true, import: 'default' })
  const packFor = lang => packs[`../exercise-names/${lang}.js`]

  it('ships a pack for every language listed as having one', () => {
    for (const lang of EXERCISE_NAME_LANGS) expect(packFor(lang), lang).toBeTruthy()
  })

  for (const lang of EXERCISE_NAME_LANGS) {
    it(`${lang}: parentheses off shows the translation alone, English only shows the English title`, () => {
      const names = packFor(lang)
      const ex = EXDB.find(e => names[e.id] && names[e.id].toLocaleLowerCase(lang) !== e.n.toLocaleLowerCase('en'))
      expect(ex, lang).toBeTruthy()
      _setLangState(lang, {}, null, names)
      const translatedClass = CASED_NAME_LANGS.includes(lang) ? '' : 'capitalize'
      expect(exerciseNameFor(ex)).toBe(`${names[ex.id]} (${ex.n})`)
      expect(exerciseNameClass(ex)).toBe(translatedClass)
      _setLangState(lang, {}, null, names, false)
      expect(exerciseNameFor(ex)).toBe(names[ex.id])
      expect(exerciseNameClass(ex)).toBe(translatedClass)
      _setLangState(lang, {}, null, names, true, true)
      expect(exerciseNameFor(ex)).toBe(ex.n)
      expect(exerciseNameClass(ex)).toBe('capitalize')
      _setLangState('en', {}, null, null)
    })
  }
})
