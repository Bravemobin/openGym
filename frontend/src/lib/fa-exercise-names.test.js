import { afterEach, describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import fa from '../exercise-names/fa.js'
import { EXDB } from './exercises-data.js'
import {
  EXERCISE_NAME_LANGS, _setLangState, exerciseNameFor, exerciseNameSearchText
} from './i18n-core.js'

describe('Persian exercise names', () => {
  const source = JSON.parse(readFileSync(new URL('../../../scripts/exercise-name-sources/fa.json', import.meta.url), 'utf8'))
  afterEach(() => _setLangState('en', {}, null, null))

  test('matches the curated source and covers the complete built-in catalogue', () => {
    expect(Object.keys(fa)).toHaveLength(EXDB.length)
    expect(fa).toEqual(source)
    expect(EXERCISE_NAME_LANGS).toContain('fa')
  })

  test('contains a non-empty Persian translation for every known exercise', () => {
    for (const exercise of EXDB) {
      expect(fa[exercise.id]?.trim(), exercise.id).toBeTruthy()
      // Arabic/Persian script somewhere in the title: a name left in English would otherwise pass
      // while showing "barbell bench press (barbell bench press)".
      expect(fa[exercise.id], exercise.id).toMatch(/\p{Script=Arabic}/u)
      // Transliterated calques or literal translations the glossary rejects in favour of the term gyms actually use.
      expect(fa[exercise.id], exercise.id).not.toMatch(/(?:^|[^\p{L}])(?:دنبل|پول‌آپ|چن‌آپ|خرد کردن|کشیش|مگس)(?=$|[^\p{L}])/iu)
    }
  })

  test('preserves identity-changing qualifiers and equipment', () => {
    const rules = [
      // "ez bar"/"ez barbell" is the EZ bar, and an olympic barbell is named for the bar too,
      // so a plain "barbell" is the only one that has to say هالتر.
      [/ez[\s-]bar/iu, /(?:میله|هالتر) ez/iu],
      [/(?<!ez[\s-])(?<!olympic )barbell/iu, /هالتر/iu],
      [/olympic barbell/iu, /(?:المپیکی|هالتر)/iu],
      [/dumbbell/iu, /دمبل/iu],
      [/kettlebell/iu, /کتل‌بل/iu],
      [/smith/iu, /اسمیت/iu],
      [/stability ball/iu, /توپ سوئیسی/iu],
      [/assisted/iu, /کمکی/iu],
      [/weighted/iu, /وزنه/iu],
      [/(?:^|[^\p{L}])male(?=$|[^\p{L}])/iu, /مرد/iu],
      [/(?:^|[^\p{L}])female(?=$|[^\p{L}])/iu, /زن/iu],
    ]
    for (const exercise of EXDB) {
      for (const [english, persian] of rules) {
        if (english.test(exercise.n)) expect(fa[exercise.id], `${exercise.id}: ${exercise.n}`).toMatch(persian)
      }
    }
  })

  test('shows Persian first and preserves the canonical English title', () => {
    const exercise = EXDB[0]
    _setLangState('fa', {}, null, fa)
    expect(exerciseNameFor(exercise)).toBe(`${fa[exercise.id]} (${exercise.n})`)
    expect(exerciseNameSearchText(exercise)).toContain(fa[exercise.id])
    expect(exerciseNameSearchText(exercise)).toContain(exercise.n)
  })

  test('never translates custom exercises or changes other languages', () => {
    const custom = { id: 'custom-1', n: 'تمرین اختصاصی من' }
    _setLangState('fa', {}, null, fa)
    expect(exerciseNameFor(custom)).toBe('تمرین اختصاصی من')
    _setLangState('en', {}, null, null)
    expect(exerciseNameFor(EXDB[0])).toBe(EXDB[0].n)
  })
})
