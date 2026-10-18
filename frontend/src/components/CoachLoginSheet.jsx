import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { coachLogin, coachRegister } from '../lib/coach-panel-api.js'
import { Button, Segmented } from './ui.jsx'
import Icon from './Icon.jsx'

export default function CoachLoginSheet({ close }) {
  const setUser = useStore((s) => s.setUser)
  const toast = useUI.getState().toast

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [coachSecret, setCoachSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!username.trim() || !password) {
      setError('نام کاربری و رمز عبور را وارد کنید')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await coachLogin({
        username: username.trim(),
        password
      })
      if (res?.user) {
        setUser(res.user, { adopt: true })
        close()
        toast(`خوش آمدید مربی ${res.user.name}`)
      } else {
        setError(res?.error || 'خطا در ورود به حساب مربی')
      }
    } catch (err) {
      setError(err?.data?.error || err?.message || 'نام کاربری یا رمز عبور اشتباه است')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e?.preventDefault()
    if (!username.trim() || !password) {
      setError('نام مربی و رمز عبور الزامی است')
      return
    }
    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await coachRegister({
        name: username.trim(),
        password,
        coachSecret: coachSecret.trim()
      })
      if (res?.user) {
        setUser(res.user, { adopt: true })
        close()
        toast(`حساب مربیگری ${res.user.name} با موفقیت ایجاد شد`)
      } else {
        setError(res?.error || 'خطا در ایجاد حساب مربی')
      }
    } catch (err) {
      setError(err?.data?.error || err?.message || 'خطا در ایجاد حساب مربی')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span
          className="lrow-i"
          style={{
            background: 'color-mix(in srgb, var(--indigo) 18%, transparent)',
            color: 'var(--indigo)',
            width: 36,
            height: 36,
            borderRadius: 10
          }}
        >
          <Icon name="shield" />
        </span>
        <div>
          <h3 style={{ margin: 0, fontSize: 18 }}>پنل اختصاصی مربی</h3>
          <div className="muted small" style={{ marginTop: 2 }}>
            ورود جهت مدیریت شاگردان و تنظیم برنامه‌ها
          </div>
        </div>
      </div>

      <Segmented
        options={[
          { value: 'login', label: 'ورود مربی' },
          { value: 'register', label: 'ایجاد حساب مربی' }
        ]}
        value={mode}
        onChange={(v) => {
          setMode(v)
          setError('')
        }}
      />

      <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ marginTop: 14 }}>
        <div style={{ marginBottom: 10 }}>
          <label className="small muted" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            {mode === 'login' ? 'نام کاربری یا ایمیل مربی' : 'نام کامل مربی'}
          </label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={mode === 'login' ? 'مثال: علیرضا یا ایمیل' : 'مثال: کاپیتان حمیدی'}
            autoFocus
            required
            style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="small muted" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            رمز عبور
          </label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="حداقل ۶ کاراکتر"
            required
            style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
          />
        </div>

        {mode === 'register' && (
          <div style={{ marginBottom: 14 }}>
            <label className="small muted" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
              کد امنیتی مربیگری
            </label>
            <input
              className="input"
              type="password"
              value={coachSecret}
              onChange={(e) => setCoachSecret(e.target.value)}
              placeholder="پیش‌فرض: emadcoach"
              style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
            />
            <div className="dim small" style={{ marginTop: 4 }}>
              جهت جلوگیری از ثبت‌نام افراد متفرقه به عنوان مربی در سامانه
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              color: 'var(--red)',
              background: 'color-mix(in srgb, var(--red) 12%, transparent)',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 12,
              fontWeight: 500
            }}
          >
            {error}
          </div>
        )}

        <Button variant="primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? 'در حال بررسی...' : mode === 'login' ? 'ورود به پنل مربیگری' : 'ایجاد حساب و ورود'}
        </Button>
      </form>
    </div>
  )
}
