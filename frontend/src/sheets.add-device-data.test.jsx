// @vitest-environment happy-dom
// The sign-in question about entries logged while signed out: a count of one reads in the
// singular ("1 workout and 1 weigh-in"), per noun, in English and in the packs.
import { afterEach, describe, expect, it } from 'vitest'
import { _setLangState } from './lib/i18n-core.js'
import { addDeviceDataMessage } from './sheets.jsx'
import fa from './locales/fa.js'

afterEach(() => _setLangState('en', null, null, null))

describe('addDeviceDataMessage', () => {
  it('says "1 workout and 1 weigh-in", not "1 workouts and 1 weigh-ins"', () => {
    _setLangState('en', null, null, null)
    expect(addDeviceDataMessage(1, 1)).toMatch(/^1 workout and 1 weigh-in were logged/)
    expect(addDeviceDataMessage(1, 3)).toMatch(/^1 workout and 3 weigh-ins were logged/)
    expect(addDeviceDataMessage(4, 1)).toMatch(/^4 workouts and 1 weigh-in were logged/)
    expect(addDeviceDataMessage(2, 5)).toMatch(/^2 workouts and 5 weigh-ins were logged/)
    expect(addDeviceDataMessage(0, 2)).toMatch(/^0 workouts and 2 weigh-ins were logged/)
  })

  it('uses the singular sentences of the language packs', () => {
    _setLangState('fa', fa, null, null)
    const expected = fa['{0} workout and {1} weigh-in were logged on this device while signed out. Add them to your profile, or keep the profile exactly as it is on the server.']
      .replace('{0}', '1')
      .replace('{1}', '1')
    expect(addDeviceDataMessage(1, 1)).toBe(expected)
  })
})
