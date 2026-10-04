import { useStore } from '../store/useStore.js'
import { effectiveLang } from '../lib/default-lang.js'
import { setLang, useLang, LANGS, baseLang } from '../lib/i18n.js'
import { Segmented } from './ui.jsx'

export default function LanguageSelect({ className = '' }) {
  useLang() // re-render on language change
  const S = useStore(s => s.S)
  const config = useStore(s => s.config)
  const update = useStore(s => s.update)
  const curLang = effectiveLang(S, config)

  const handleChange = (val) => {
    update(s => {
      s.lang = val
      s.langAuto = false
    })
    setLang(
      val,
      S.enParens?.[baseLang(val)] ?? true,
      S.enOnly?.[baseLang(val)] === true
    )
  }

  // Primary options: English and Persian using openGym Segmented control
  const options = [
    { value: 'en', label: 'English' },
    { value: 'fa', label: 'فارسی' }
  ]

  // If another language is currently active (e.g. chosen from Settings), keep it visible
  if (curLang && curLang !== 'en' && curLang !== 'fa') {
    options.push({ value: curLang, label: LANGS[curLang] || curLang })
  }

  return (
    <Segmented
      className={`lang-seg ${className}`}
      options={options}
      value={curLang === 'fa' ? 'fa' : curLang === 'en' ? 'en' : curLang}
      onChange={handleChange}
    />
  )
}
