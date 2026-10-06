import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { MOBILE } from './lib/mobile.js'
import { DEMO } from './lib/demo.js'
import { useStore } from './store/useStore.js'
import { effectiveLang, rememberDefaultLang } from './lib/default-lang.js'
import { setLang, baseLang } from './lib/i18n.js'
import { startMediaSync } from './lib/media-sync.js'
import { startNativeKeyboard } from './lib/native-keyboard.js'
import './index.css'

// App.jsx restores per-route scroll itself; the browser's own attempt races it.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

async function bootstrap() {
  if (!MOBILE && !DEMO) {
    try {
      const p = window.__gymConfigPromise
      if (p) {
        // Fast-path: wait up to 800ms for /api/config so first-time boot knows instance DEFAULT_LANG
        const c = await Promise.race([
          p,
          new Promise(r => setTimeout(() => r(null), 800))
        ])
        if (c) {
          rememberDefaultLang(c)
          useStore.setState({ config: c })
        }
      }
    } catch {
      /* ignore */
    }
  }

  // Pre-load the active language pack before the first paint so there is zero flash of English
  try {
    const { S, config } = useStore.getState()
    const targetLang = effectiveLang(S, config)
    if (targetLang && targetLang !== 'en') {
      const base = baseLang(targetLang)
      await setLang(
        targetLang,
        S.enParens?.[base] ?? true,
        S.enOnly?.[base] === true
      )
    }
  } catch {
    /* ignore */
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode><App /></StrictMode>
  )
}

bootstrap()

// The photos and videos of custom exercises, in every build (the phone and the demo included):
// uploads of what the server lacks, the local clean-up, and the plan's files kept offline.
startMediaSync(useStore)

// Android 15 does not resize the page for the soft keyboard; the app says how much it covers and
// this keeps the focused field above it. Idle everywhere else.
startNativeKeyboard()

// Not in the mobile build: the native shell already serves everything from disk.
if (!MOBILE && 'serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {})
  // The plan's exercise media, kept by the worker for a workout opened without a network (#281).
  // It only fetches ahead while the page runs as the installed app; a tab keeps what it has shown.
  import('./lib/media-prefetch.js').then(m => m.startMediaPrefetch(useStore)).catch(() => {})
}
