import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { api } from '../lib/api.js'
import { fmtDate, fmtNum, fmtVol, fmtDur } from '../lib/format.js'
import { auditCat, auditLine, fmtWhen } from '../lib/audit.js'
import { workoutVolume, setsDone } from '../lib/history.js'
import { confirmSheet } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import LanguageSelect from '../components/LanguageSelect.jsx'
import { getLang } from '../lib/i18n.js'
import { tAdmin as t, relAdmin as rel, durAdmin as dur } from './admin-i18n.js'
import AdminCoach from './AdminCoach.jsx'
import '../admin.css'

// The one time the reset code is visible. Locked, so a tap beside the sheet cannot lose it
// before it has been copied or written down.
function ResetCodeSheet({ name, email, code, expires, close }) {
  const toast = useUI(s => s.toast)
  const copy = () => { navigator.clipboard?.writeText(code).catch(() => {}); toast(t('Copied')) }
  return <>
    <h3>{t('Reset code for {name}', { name })}</h3>
    <div className="adm-lead">
      {getLang() === 'fa' ? (
        <>این کد را به آن‌ها بدهید. آن‌ها «ورود با رمز عبور» ← «کد بازنشانی از مدیر دارید؟» را انتخاب کرده، نام خود <b>{name}</b>{email && <> (یا ایمیل ورود <b>{email}</b>)</>}، کد و یک رمز عبور جدید را وارد می‌کنند. این کد فقط یک بار تا {new Date(expires).toLocaleString('fa-IR')} معتبر است و دیگر نمایش داده نخواهد شد.</>
      ) : (
        <>Give them this code. They choose “Sign in with password” → “Have a reset code from your admin?”, enter their name <b>{name}</b>{email && <> (or their sign-in e-mail <b>{email}</b>)</>}, the code and a new password. It works once, until {new Date(expires).toLocaleString()}, and will not be shown again.</>
      )}
    </div>
    <button className="adm-code" style={{ fontSize: 22, width: '100%', padding: '14px 0' }} onClick={copy} aria-label="copy code">{code}</button>
    <div style={{ height: 12 }} />
    <Button variant="primary" onClick={close}>{t('Done')}</Button>
  </>
}

function UserDetail({ id, onChanged, close }) {
  const [d, setD] = useState(null)
  const toast = useUI(s => s.toast)
  const openSheet = useUI(s => s.openSheet)
  useEffect(() => { api('/api/admin/user?id=' + encodeURIComponent(id)).then(setD).catch(e => toast(e.message)) }, [id])
  if (!d) return <div className="muted small">Loading…</div>
  const u = d.user
  // The document comes straight off the user's state file. PUT /api/data drops null and
  // shapeless entries now, but a file written before it did still answers with them, and this
  // sheet renders outside the route's ErrorBoundary: one throw here blanked the whole app and
  // left exactly this account un-disableable. setsDone/workoutVolume walk entries and sets, so
  // an entry that lacks either has nothing to show and is skipped rather than drawn.
  const workouts = (d.workouts || []).filter(w => w && Array.isArray(w.entries) && w.entries.every(e => e && Array.isArray(e.sets)))
  // Their whole record as the admin API already returns it — the export the delete sheet offers.
  const exportUser = () => {
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `opengym-${u.name.replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase()}-${u.id}.json`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const doDelete = () => {
    api('/api/admin/user/delete', { method: 'POST', body: JSON.stringify({ id: u.id }) })
      .then(() => { toast(t('Account deleted')); onChanged(); close() })
      .catch(e => toast(e.message))
  }
  const setDisabled = disabled => {
    api('/api/admin/user/disable', { method: 'POST', body: JSON.stringify({ id: u.id, disabled }) })
      .then(() => { toast(disabled ? t('User disabled') : t('User enabled')); onChanged(); close() })
      .catch(e => toast(e.message))
  }
  // Password sign-in (#118): the server only sends `password` when the instance offers it. The
  // code comes back once, is shown once, and is never stored anywhere but as a hash.
  const pwInstance = typeof u.password === 'boolean'
  const resetPassword = () => confirmSheet({
    title: t('Reset {name}’s password?', { name: u.name }),
    message: t('You get a one-time code to hand them. Their current password stops working now and they are signed out everywhere; their passkeys keep working. They set a new password with the code under “Sign in with password”. It is shown once and is valid for 24 hours.'),
    confirmText: t('Create reset code'),
    danger: true,
    onConfirm: () => api('/api/admin/user/password-reset', { method: 'POST', body: JSON.stringify({ id: u.id }) })
      .then(r => { onChanged(); close(); openSheet(done => <ResetCodeSheet name={r.name} email={u.email} code={r.code} expires={r.expires} close={done} />, { locked: true }) })
      .catch(e => toast(e.message)),
  })
  return <>
    <h3 className="capitalize">{u.name}</h3>
    <div className="row" style={{ gap: 6, flexWrap: 'wrap', margin: '8px 0 12px' }}>
      {u.admin && <span className="adm-pill acc">{t('admin')}</span>}
      {u.disabled && <span className="adm-pill bad">{t('disabled')}</span>}
      {u.invitedBy && <span className="adm-pill">{t('invite')} {u.invitedBy}</span>}
      {u.password && <span className="adm-pill">{t('password')}</span>}
      {/* The sign-in e-mail (password instances only): shown to admins and nobody else. */}
      {u.email && <span className="adm-pill" title="sign-in e-mail">{u.email}</span>}
      {u.resetUntil && <span className="adm-pill acc">{t('reset code until')} {new Date(u.resetUntil).toLocaleString(getLang() === 'fa' ? 'fa-IR' : undefined)}</span>}
      <span className="adm-pill">{t('joined')} {u.created ? fmtDate(u.created.slice(0, 10)) : '—'}</span>
    </div>
    <div className="tiles" style={{ textAlign: 'start' }}>
      <div className="tile"><div className="l">{t('Workouts')}</div><div className="v" style={{ fontSize: '1.1rem' }}>{workouts.length}</div></div>
      <div className="tile"><div className="l">{t('Weigh-ins')}</div><div className="v" style={{ fontSize: '1.1rem' }}>{d.bodyweight.length}</div></div>
      <div className="tile"><div className="l">{t('Routines')}</div><div className="v" style={{ fontSize: '1.1rem' }}>{d.routines.length}</div></div>
      <div className="tile"><div className="l">{t('Last sync')}</div><div className="v" style={{ fontSize: '.95rem' }}>{rel(d.lastSync)}</div></div>
    </div>
    {!u.admin && <>
      <button className={'btn ' + (u.disabled ? 'primary' : 'danger')} style={{ margin: '12px 0 4px' }}
        onClick={() => u.disabled ? setDisabled(false)
          : confirmSheet({ title: t('Disable {name}?', { name: u.name }), message: t('They are signed out everywhere and can no longer sync or log in until re-enabled. Their data stays.'), confirmText: t('Disable'), danger: true, onConfirm: () => setDisabled(true) })}>
        {u.disabled ? t('Enable account') : t('Disable account')}</button>
      <div className="adm-hint">{u.disabled ? t('Enabling lets them sign in and sync again.') : t('Disabling signs them out everywhere and blocks sign-in. Nothing is deleted.')}</div>
      {/* The one destructive action in the app (issue #107), so it asks twice and offers the
          export first — that history is theirs. The second step names the account again, because
          the first sheet can be dismissed by anyone who was not reading. */}
      <button className="btn danger" style={{ margin: '14px 0 4px' }}
        onClick={() => confirmSheet({
          title: t('Delete {name}?', { name: u.name }),
          message: t('Everything goes: their workouts, weigh-ins, routines, passkeys and notifications. This cannot be undone, and the invite code they joined with stays used. Download their data first if they might want it.'),
          confirmText: t('Continue'),
          danger: true,
          onConfirm: () => confirmSheet({
            title: t('Delete {name} for good?', { name: u.name }),
            message: t('Last chance — there is no undo and no backup of this on the server.'),
            confirmText: t('Delete account'),
            danger: true,
            onConfirm: doDelete,
          }),
        })}>{t('Delete account')}</button>
      <button className="btn" style={{ marginBottom: 4 }} onClick={exportUser}>{t('Download their data')}</button>
      <div className="adm-hint">{t('Deleting removes the account and every trace of its training history from this server.')}</div>
      {pwInstance && <>
        <button className="btn" style={{ margin: '14px 0 4px' }} onClick={resetPassword}>{t('Reset password')}</button>
        <div className="adm-hint">{u.password
          ? t('For a forgotten password: a one-time code lets them choose a new one. Their current password stops working at once.')
          : t('No password yet. A one-time code lets them set one — the way back in after losing their only passkey.')}</div>
      </>}
    </>}
    <h4 className="sec">{t('Workout history')}</h4>
    {workouts.length ? <div className="list" style={{ gap: 0 }}>
      {workouts.slice(0, 60).map(w => <div key={w.id} className="row between" style={{ padding: '9px 2px', borderBottom: '1px solid var(--sep)' }}>
        <div><div className="small" style={{ fontWeight: 600 }}>{w.name}</div>
          <div className="dim" style={{ fontSize: '.72rem' }}>{fmtDate(w.d, true)} · {fmtDur((w.end || w.start) - w.start)} · {setsDone(w)} {getLang() === 'fa' ? 'ست' : 'sets'}{w.prs?.length ? ' · ' + w.prs.length + (getLang() === 'fa' ? ' رکورد' : ' PR') : ''}</div></div>
        <span className="small muted">{fmtVol(w.vol ?? workoutVolume(w), d.unit)}</span>
      </div>)}
    </div> : <div className="adm-empty">{t('No workouts logged.')}</div>}
  </>
}

function InvitesCard({ invites, reload, inviteOnly }) {
  const toast = useUI(s => s.toast)
  const gen = () => api('/api/admin/invites/new', { method: 'POST', body: '{}' })
    .then(({ invite }) => { navigator.clipboard?.writeText(invite.code).catch(() => {}); toast((getLang() === 'fa' ? 'کد ' : 'Code ') + invite.code + (getLang() === 'fa' ? ' ایجاد و کپی شد' : ' created & copied')); reload() })
    .catch(e => toast(e.message))
  const revoke = code => confirmSheet({
    title: (getLang() === 'fa' ? `لغو کد ${code}؟` : `Revoke code ${code}?`),
    message: t('Anyone who has it can no longer use it. People who already signed up with it are not affected.'),
    confirmText: t('Revoke'), danger: true,
    onConfirm: () => api('/api/admin/invites/revoke', { method: 'POST', body: JSON.stringify({ code }) })
      .then(() => { toast(t('Code revoked')); reload() }).catch(e => toast(e.message))
  })
  const copy = code => { navigator.clipboard?.writeText(code).catch(() => {}); toast((getLang() === 'fa' ? 'کپی شد ' : 'Copied ') + code) }
  const open = (invites || []).filter(i => !i.usedBy)
  const used = (invites || []).filter(i => i.usedBy)
  return <div className="card">
    <div className="row between"><h2 style={{ margin: 0 }}>{t('Invite codes')}</h2>
      <Button variant="primary" size="sm" onClick={gen} icon="plus">{t('New code')}</Button></div>
    <div className="adm-lead">
      {inviteOnly
        ? t('Sign-up is invite-only: someone needs one of these codes to create a profile. Each code works once.')
        : t('Sign-up is open, so codes are optional here — they only record who invited whom.')}
    </div>
    {open.length ? <>
      <div className="adm-group-t">{t('Unused · tap to copy')}</div>
      {open.map(i => <div key={i.code} className="row between" style={{ padding: '6px 0', borderBottom: 'var(--hair) solid var(--sep)' }}>
        <button className="adm-code" onClick={() => copy(i.code)} aria-label={'copy ' + i.code}>{i.code}</button>
        <div className="row" style={{ gap: 4 }}>
          <button className="iconbtn adm-iconbtn" onClick={() => copy(i.code)} aria-label="copy"><Icon name="clipboard" /></button>
          <button className="iconbtn adm-iconbtn" style={{ color: 'var(--red)' }} onClick={() => revoke(i.code)} aria-label="revoke"><Icon name="trash" /></button>
        </div>
      </div>)}
    </> : null}
    {used.length ? <>
      <div className="adm-group-t" style={{ marginTop: open.length ? 12 : 0 }}>{t('Already used')}</div>
      {used.map(i => <div key={i.code} className="row between dim" style={{ padding: '6px 0', fontSize: '.82rem' }}>
        <span style={{ fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', letterSpacing: '.06em' }}>{i.code}</span><span>→ {i.usedByName || t('used')}</span>
      </div>)}
    </> : null}
    {!open.length && !used.length && <div className="adm-empty">{t('No codes yet. "New code" makes one and copies it to your clipboard.')}</div>}
  </div>
}

// Who signed in, who tried and failed, what an admin changed. A card rather than its own route:
// the dashboard is deliberately one page of cards, and the 95 % use of this is a glance at the
// last twenty events. Paging follows Library.jsx's house style — "Show more", not page numbers.
function AuditCard({ tick }) {
  const toast = useUI(s => s.toast)
  const [meta, setMeta] = useState(null)      // last response minus the rows: total, retention, …
  const [rows, setRows] = useState([])
  const [cat, setCat] = useState('')

  const load = (c, before) => api('/api/admin/audit?limit=50&cat=' + c + (before ? '&before=' + before : ''))
    .then(r => { setMeta(r); setRows(x => (before ? x.concat(r.events) : r.events)) })
    .catch(e => toast(e.message))
  const pick = c => { setCat(c); setRows([]); setMeta(null); load(c) }
  // Reloads on mount and whenever the header's ↻ bumps the tick. Deliberately not on the 15s
  // poll that drives "training now": this is history, not presence.
  useEffect(() => { load(cat) }, [tick])

  const clear = () => confirmSheet({
    title: t('Clear the activity log?'),
    message: t('Every recorded event is deleted. The clear itself is logged, so the gap stays visible.'),
    confirmText: t('Clear'), danger: true,
    onConfirm: () => api('/api/admin/audit/clear', { method: 'POST', body: '{}' })
      .then(() => { toast(t('Activity log cleared')); pick(cat) }).catch(e => toast(e.message))
  })

  if (meta && !meta.enabled) return null      // AUDIT_LOG=0 — the card isn't there at all

  return <div className="card">
    <div className="row between"><h2 style={{ margin: 0 }}>{t('Activity log')}</h2>
      <button className="iconbtn adm-iconbtn" style={{ color: 'var(--red)' }} onClick={clear} aria-label="clear log"><Icon name="trash" /></button></div>
    <div className="adm-lead">
      {t('Who signed in, what failed, and what an admin changed.')}
      {meta ? ' ' + fmtNum(meta.total) + (getLang() === 'fa' ? ' رویداد' : ' events')
        + (meta.retention.days ? (getLang() === 'fa' ? `، نگهداری برای ${meta.retention.days} روز` : `, kept for ${meta.retention.days} days`) : '')
        + (meta.ip_mode === 'off' ? (getLang() === 'fa' ? '، بدون آدرس‌های IP' : ', without IP addresses') : '') + '.' : ''}
    </div>
    <div className="chips" style={{ marginBottom: 10 }}>
      {[['', t('All')], ['auth', t('Sign-ins')], ['admin', t('Admin')], ['fail', t('Failed')]].map(([v, l]) =>
        <button key={v} className={'chip' + (cat === v ? ' on' : '')} onClick={() => pick(v)}>{l}</button>)}
    </div>
    {rows.map(e => {
      const line = auditLine(e)
      return <div key={e.id} className="row between" style={{ padding: '8px 2px', borderBottom: 'var(--hair) solid var(--sep)' }}>
        <div className="grow">
          <div className="small" style={{ fontWeight: 600 }}>{line.title}
            {/* a red pill, not a red row: twenty fumbled Face IDs in a row shouldn't read as an incident */}
            {!e.ok && <span className="adm-pill bad" style={{ marginInlineStart: 6 }}>{t('failed')}</span>}
            {auditCat(e.ev) === 'admin' && <span className="adm-pill acc" style={{ marginInlineStart: 6 }}>{t('admin')}</span>}</div>
          {line.sub && <div className="dim" style={{ fontSize: '.72rem' }}>{line.sub}</div>}
        </div>
        <span className="small muted" style={{ flex: 'none', marginInlineStart: 8 }}>{fmtWhen(e.ts, meta?.now)}</span>
      </div>
    })}
    {meta && !rows.length && <div className="adm-empty">{t('Nothing logged yet.')}</div>}
    {meta?.nextBefore && <div style={{ marginTop: 10 }}>
      <Button size="sm" onClick={() => load(cat, meta.nextBefore)}>{t('Show more')}</Button></div>}
  </div>
}

function ActivityTrendsChart({ trends = [] }) {
  const [hovered, setHovered] = useState(null)
  if (!trends.length) return null

  const W = 330, H = 105
  const maxW = Math.max(1, ...trends.map(t => t.workoutsCount || 0))
  const barW = Math.max(4, Math.floor((W - 24) / trends.length) - 2)

  return (
    <div className="adm-chart-box">
      <div className="row between" style={{ marginBottom: 6 }}>
        <span className="small" style={{ fontWeight: 600 }}>{t('Daily Workouts (Last 30 Days)')}</span>
        {hovered && (
          <span className="small" style={{ color: 'var(--acc)', fontWeight: 600 }}>
            {fmtDate(hovered.date)}: {hovered.workoutsCount} {hovered.workoutsCount === 1 ? t('session') : t('sessions')} · {hovered.activeUsersCount} {t('active')}
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <line x1="8" y1={H - 16} x2={W - 8} y2={H - 16} stroke="var(--sep)" strokeWidth="0.8" />
        {trends.map((d, i) => {
          const x = 10 + i * (barW + 2)
          const barH = d.workoutsCount > 0 ? Math.max(5, Math.round((d.workoutsCount / maxW) * (H - 32))) : 2
          const y = H - 16 - barH
          const isHov = hovered?.date === d.date
          return (
            <rect
              key={d.date}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={2}
              fill={isHov ? 'var(--label)' : d.workoutsCount > 0 ? 'var(--acc)' : 'var(--surface-3)'}
              style={{ cursor: 'pointer', transition: 'fill 0.15s ease' }}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
            />
          )
        })}
        <text x="10" y={H} fontSize="9" fill="var(--label-3)">{trends[0]?.date ? fmtDate(trends[0].date) : ''}</text>
        <text x={W - 10} y={H} fontSize="9" fill="var(--label-3)" textAnchor="end">{t('Today')}</text>
      </svg>
    </div>
  )
}

function PeakDaysChart({ dayStats = [] }) {
  const days = getLang() === 'fa'
    ? ['دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه', 'یکشنبه']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const max = Math.max(1, ...dayStats)
  return (
    <div className="adm-chart-box">
      <div className="small" style={{ fontWeight: 600, marginBottom: 8 }}>{t('Peak Gym Days (All Time)')}</div>
      <div className="row" style={{ height: 90, alignItems: 'flex-end', gap: 6 }}>
        {days.map((day, i) => {
          const count = dayStats[i] || 0
          const pct = Math.max(5, Math.round((count / max) * 100))
          const isPeak = count === max && count > 0
          return (
            <div key={day} className="adm-bar-col">
              <span style={{ fontSize: 10, color: 'var(--label-2)', marginBottom: 2 }}>{count}</span>
              <div
                className={'adm-bar-fill' + (isPeak ? ' highlight' : '')}
                style={{ height: `${pct}%` }}
                title={`${day}: ${count} ${t('workouts')}`}
              />
              <div className="adm-bar-label" style={{ fontWeight: isPeak ? 700 : 400, color: isPeak ? 'var(--acc)' : undefined }}>
                {day}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PeakHoursChart({ hourStats = [] }) {
  const max = Math.max(1, ...hourStats)
  return (
    <div className="adm-chart-box">
      <div className="small" style={{ fontWeight: 600, marginBottom: 8 }}>{t('Peak Training Hours (24h)')}</div>
      <div className="row" style={{ height: 75, alignItems: 'flex-end', gap: 2 }}>
        {Array.from({ length: 24 }).map((_, h) => {
          const count = hourStats[h] || 0
          const pct = Math.max(4, Math.round((count / max) * 100))
          const isPeak = count === max && count > 0
          return (
            <div key={h} className="adm-bar-col" title={`${h}:00 - ${h + 1}:00: ${count} ${t('workouts')}`}>
              <div
                className={'adm-bar-fill' + (isPeak ? ' highlight' : '')}
                style={{ height: `${pct}%`, maxWidth: 10, borderRadius: 2 }}
              />
              {h % 6 === 0 ? (
                <div className="adm-bar-label" style={{ fontSize: 9 }}>{h}h</div>
              ) : (
                <div style={{ height: 16 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GymHeatmap({ heatmap = {} }) {
  const [hovered, setHovered] = useState(null)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const start = new Date(today)
  start.setDate(today.getDate() - 52 * 7)

  const cols = []
  for (let w = 0; w < 52; w++) {
    const days = []
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start)
      cur.setDate(start.getDate() + w * 7 + d)
      const iso = cur.toISOString().slice(0, 10)
      const count = heatmap[iso] || 0
      days.push({ iso, count })
    }
    cols.push(days)
  }

  const colorFor = count => {
    if (!count) return 'var(--surface-3)'
    if (count === 1) return 'color-mix(in srgb, var(--acc) 38%, var(--surface-3))'
    if (count <= 3) return 'color-mix(in srgb, var(--acc) 68%, var(--surface-3))'
    return 'var(--acc)'
  }

  return (
    <div className="adm-chart-box">
      <div className="row between" style={{ marginBottom: 6 }}>
        <span className="small" style={{ fontWeight: 600 }}>{t('Gym Attendance Heatmap (Past Year)')}</span>
        {hovered && (
          <span className="small" style={{ color: 'var(--acc)', fontWeight: 600 }}>
            {fmtDate(hovered.iso)}: {hovered.count} {hovered.count === 1 ? t('workout') : t('workouts')}
          </span>
        )}
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 3, minWidth: 480 }}>
          {cols.map((col, ci) => (
            <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {col.map(cell => (
                <div
                  key={cell.iso}
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 2,
                    background: colorFor(cell.count),
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHovered(cell)}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConsistencyLeaderboard({ leaderboard = [], openUser }) {
  if (!leaderboard.length) return null
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="row between">
        <h2 style={{ margin: 0 }}>{t('Consistency Leaderboard')}</h2>
        <span className="small muted">{t('Top Active Members')}</span>
      </div>
      <div className="adm-lead">{t('Recognizing member dedication, weekly streaks, and total training volume.')}</div>
      <div className="list" style={{ gap: 0 }}>
        {leaderboard.map((m, idx) => {
          const rankClass = idx === 0 ? 'top-1' : idx === 1 ? 'top-2' : idx === 2 ? 'top-3' : ''
          return (
            <div
              key={m.id}
              className="row between"
              style={{ padding: '9px 4px', borderBottom: 'var(--hair) solid var(--sep)', cursor: 'pointer' }}
              onClick={() => openUser(m.id)}
            >
              <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                <div className={`adm-rank-badge ${rankClass}`}>{idx + 1}</div>
                <div>
                  <div className="small" style={{ fontWeight: 600 }}>
                    {m.live && <Icon name="dot" style={{ fontSize: 9, color: 'var(--green)', display: 'inline-block', marginInlineEnd: 4 }} />}
                    {m.name}
                  </div>
                  <div className="dim" style={{ fontSize: '.72rem' }}>
                    {m.workoutsLast30d || 0} {getLang() === 'fa' ? `تمرین در ۳۰ روز اخیر · مجموع ${m.workouts}` : `workouts last 30d · ${m.workouts} total`}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {m.streakWeeks > 0 ? (
                  <span className="adm-pill acc" style={{ fontSize: 11 }}>🔥 {m.streakWeeks}{getLang() === 'fa' ? ' هفته تداوم' : 'w streak'}</span>
                ) : (
                  <span className="small muted">{fmtVol(m.totalVolume || 0, m.unit || 'kg')}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LiveFloorCard({ liveUsers = [], openUser }) {
  if (!liveUsers.length) {
    return (
      <div className="card" style={{ padding: '14px 16px', background: 'var(--surface-2)' }}>
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <Icon name="dumbbell" style={{ fontSize: 20, color: 'var(--label-3)' }} />
          <div>
            <div className="small" style={{ fontWeight: 600 }}>{t('Gym Floor is Quiet')}</div>
            <div className="dim" style={{ fontSize: '.75rem' }}>{t('No active training sessions recorded right now.')}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ borderColor: 'var(--acc)' }}>
      <div className="row between" style={{ margin: '0 0 6px' }}>
        <h2 className="row" style={{ margin: 0, gap: 8, alignItems: 'center' }}>
          <div className="adm-live-pulse" />
          {t('Live on Gym Floor')} ({liveUsers.length})
        </h2>
        <span className="adm-pill acc">{t('Live')}</span>
      </div>
      <div className="adm-lead">{t('Sessions running at this moment. Tap a name for details.')}</div>
      {liveUsers.map(u => {
        const started = u.startedAt || u.live?.startedAt || Date.now()
        const elapsed = dur(Date.now() - started)
        const exIdx = u.exIdx ?? u.live?.exIdx ?? 0
        const exTotal = u.exTotal ?? u.live?.exTotal ?? 0
        const setsDone = u.setsDone ?? u.live?.setsDone ?? 0
        const setsTotal = u.setsTotal ?? u.live?.setsTotal ?? 0
        const exProgress = exTotal > 0 ? Math.round((exIdx / exTotal) * 100) : 0
        const id = u.userId || u.id

        return (
          <div key={id} className="adm-live-card" onClick={() => openUser(id)}>
            <div className="row between" style={{ marginBottom: 4 }}>
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <span className="small" style={{ fontWeight: 700 }}>{u.userName || u.name}</span>
                <span className="dim" style={{ fontSize: '.75rem' }}>· {u.routineName || u.live?.name || t('Workout')}</span>
              </div>
              <span className="adm-pill acc" style={{ fontSize: 11 }}>{elapsed}</span>
            </div>
            <div className="dim" style={{ fontSize: '.75rem', marginBottom: 6 }}>
              {getLang() === 'fa' ? `حرکت ${exIdx} از ${exTotal} · ${setsDone}/${setsTotal} ست` : `Exercise ${exIdx} of ${exTotal} · ${setsDone}/${setsTotal} sets`}
            </div>
            <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(5, exProgress)}%`, height: '100%', background: 'var(--acc)', borderRadius: 2, transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ActivityFeedCard({ feed = [], openUser }) {
  const [filterUser, setFilterUser] = useState('')
  const filtered = filterUser
    ? feed.filter(w => (w.userName || '').toLowerCase().includes(filterUser.toLowerCase()) || (w.name || '').toLowerCase().includes(filterUser.toLowerCase()))
    : feed

  if (!feed.length) {
    return (
      <div className="card">
        <h2 style={{ margin: '0 0 4px' }}>{t('Workout Activity Feed')}</h2>
        <div className="adm-lead">{t('Recent workout sessions completed by all members.')}</div>
        <div className="adm-empty">{t('No workouts logged yet.')}</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="row between" style={{ margin: '0 0 6px' }}>
        <h2 style={{ margin: 0 }}>{t('Workout Activity Feed')}</h2>
        <span className="small muted">{feed.length} {t('recent sessions')}</span>
      </div>
      <div className="adm-lead">{t('Chronological stream of workouts completed across the gym. Tap any workout for member history.')}</div>
      
      {feed.length > 5 && (
        <input
          type="text"
          className="adm-search-input"
          placeholder={t('Filter feed by member or workout name...')}
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
        />
      )}

      <div>
        {filtered.slice(0, 30).map(w => {
          const initials = (w.userName || 'U').slice(0, 2).toUpperCase()
          return (
            <div key={w.id} className="adm-feed-card" onClick={() => openUser(w.userId)}>
              <div className="row between" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                  <div className="adm-avatar">{initials}</div>
                  <div>
                    <div className="small" style={{ fontWeight: 600 }}>
                      {w.userName} <span className="dim" style={{ fontWeight: 400 }}>{t('finished')}</span> {w.name}
                    </div>
                    <div className="dim" style={{ fontSize: '.72rem' }}>
                      {w.date ? fmtDate(w.date, true) : t('Recently')} · {rel(w.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="row" style={{ gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {w.volume > 0 && <span className="adm-pill" style={{ fontSize: 11 }}>{fmtNum(w.volume)} kg</span>}
                  {w.durationMs > 0 && <span className="adm-pill" style={{ fontSize: 11 }}>{fmtDur(w.durationMs)}</span>}
                  {w.setsDone > 0 && <span className="adm-pill" style={{ fontSize: 11 }}>{w.setsDone} {getLang() === 'fa' ? 'ست' : 'sets'}</span>}
                  {w.prsCount > 0 && <span className="adm-pill acc" style={{ fontSize: 11 }}>🏆 {w.prsCount} {getLang() === 'fa' ? 'رکورد' : (w.prsCount > 1 ? 'PRs' : 'PR')}</span>}
                </div>
              </div>

              {Array.isArray(w.exercises) && w.exercises.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap' }}>
                  {w.exercises.map((e, idx) => (
                    <span key={idx} className="adm-ex-chip">
                      {e.name} {e.setsDone ? `(${e.setsDone}s)` : ''} {e.topWeight ? `· ${e.topWeight}kg` : ''}
                    </span>
                  ))}
                </div>
              )}

              {w.note && (
                <div className="dim" style={{ fontSize: '.75rem', marginTop: 6, fontStyle: 'italic', paddingLeft: 6, borderLeft: '2px solid var(--sep)' }}>
                  "{w.note}"
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && <div className="adm-empty">{t('No workouts matching your filter.')}</div>}
      </div>
    </div>
  )
}

function MembersCard({ users = [], openUser, liveUsers = [] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const liveIds = new Set(liveUsers.map(u => u.userId || u.id))

  const filtered = (users || []).filter(u => {
    if (search) {
      const q = search.toLowerCase()
      const matchName = (u.name || '').toLowerCase().includes(q)
      const matchEmail = (u.email || '').toLowerCase().includes(q)
      if (!matchName && !matchEmail) return false
    }
    if (filter === 'live') return liveIds.has(u.id) || u.live
    if (filter === 'active') return u.lastSync && Date.now() - u.lastSync < 7 * 86400000
    if (filter === 'disabled') return u.disabled
    return true
  })

  return (
    <div className="card">
      <div className="row between" style={{ margin: '0 0 6px' }}>
        <h2 style={{ margin: 0 }}>{t('Users')}</h2>
        <span className="small muted">{users ? users.length : 0} {getLang() === 'fa' ? 'مجموع' : 'total'}</span>
      </div>
      <div className="adm-lead">{t('Everyone with a profile on this instance. Tap one to see their activity, to disable the account (nothing is deleted) or to delete it with all their data for good.')}</div>

      {users && users.length > 4 && (
        <input
          type="text"
          className="adm-search-input"
          placeholder={t('Search member by name or email...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      )}

      {users && users.length > 4 && (
        <div className="chips" style={{ marginBottom: 12 }}>
          {[
            ['all', t('All')],
            ['live', getLang() === 'fa' ? `اکنون آنلاین (${liveUsers.length})` : `Live now (${liveUsers.length})`],
            ['active', t('Active this week')],
            ['disabled', t('Disabled')]
          ].map(([v, l]) => (
            <button key={v} className={'chip' + (filter === v ? ' on' : '')} onClick={() => setFilter(v)}>
              {l}
            </button>
          ))}
        </div>
      )}

      <div className="list">
        {filtered.map(u => {
          const isLive = liveIds.has(u.id) || u.live
          return (
            <div key={u.id} className="item" onClick={() => openUser(u.id)} style={u.disabled ? { opacity: .55 } : null}>
              <div className="grow">
                <div className="tt">
                  {isLive && <Icon name="dot" style={{ fontSize: 9, color: 'var(--green)', display: 'inline-block', marginInlineEnd: 5 }} />}
                  {u.name}
                  {u.admin && <span className="adm-pill acc" style={{ marginInlineStart: 4 }}>{t('admin')}</span>}
                  {u.disabled && <span className="adm-pill bad" style={{ marginInlineStart: 4 }}>{t('disabled')}</span>}
                  {u.streakWeeks > 1 && <span className="adm-pill" style={{ marginInlineStart: 4, fontSize: 11 }}>🔥 {u.streakWeeks}{getLang() === 'fa' ? ' هفته' : 'w'}</span>}
                </div>
                <div className="ss">
                  {isLive
                    ? t('training now') + ' · ' + (u.live?.name || u.routineName || t('Workout'))
                    : (u.workouts ?? 0) + ' ' + t('workouts') + (u.lastWorkout ? ' · ' + (getLang() === 'fa' ? 'آخرین ' : 'last ') + fmtDate(u.lastWorkout) : '') + ' · ' + (getLang() === 'fa' ? 'آخرین همگام‌سازی ' : 'last sync ') + rel(u.lastSync)}
                </div>
                {u.email && <div className="ss" title="sign-in e-mail">{u.email}</div>}
              </div>
              {u.hasPush && <Icon name="bell" title="push notifications on" style={{ fontSize: 15, color: 'var(--label-3)' }} />}
              <Icon name="chevronRight" className="chev" />
            </div>
          )
        })}
        {users && !filtered.length && <div className="adm-empty">{t('No users yet.')}</div>}
      </div>
    </div>
  )
}

function AnalyticsSection({ activityData, users, openUser }) {
  const kpis = activityData?.kpis
  const trends = activityData?.dailyTrends || []
  const dayStats = activityData?.dayOfWeekStats || [0, 0, 0, 0, 0, 0, 0]
  const hourStats = activityData?.hourOfDayStats || Array(24).fill(0)
  const heatmap = activityData?.heatmap || {}
  const leaderboard = activityData?.leaderboard || []

  return (
    <>
      <div className="tiles" style={{ marginBottom: 12 }}>
        <div className="tile">
          <div className="l">{t('DAU / WAU')}</div>
          <div className="v">{kpis ? `${kpis.dau} / ${kpis.wau}` : '—'}</div>
        </div>
        <div className="tile">
          <div className="l">{t('This Month')}</div>
          <div className="v">{kpis ? kpis.workoutsThisMonth : '—'}</div>
        </div>
        <div className="tile">
          <div className="l">{t('Avg Duration')}</div>
          <div className="v">{kpis ? `${kpis.avgWorkoutMinutes} min` : '—'}</div>
        </div>
        <div className="tile">
          <div className="l">{t('Gym Volume')}</div>
          <div className="v" style={{ fontSize: '.95rem' }}>{kpis ? `${fmtNum(Math.round((kpis.totalVolumeAllTime || 0) / 1000))} t` : '—'}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ margin: 0 }}>{t('Attendance & Activity Trends')}</h2>
        <div className="adm-lead">{t('Recognize member volume, daily workout consistency, and training patterns over time.')}</div>
        <ActivityTrendsChart trends={trends} />
        <PeakDaysChart dayStats={dayStats} />
        <PeakHoursChart hourStats={hourStats} />
        <GymHeatmap heatmap={heatmap} />
      </div>

      <ConsistencyLeaderboard leaderboard={leaderboard} openUser={openUser} />
    </>
  )
}

const DEMO_ACTIVITY_DATA = {
  kpis: {
    totalMembers: 6,
    liveNow: 2,
    dau: 4,
    wau: 6,
    mau: 6,
    totalWorkoutsAllTime: 124,
    workoutsThisMonth: 34,
    totalVolumeAllTime: 154000,
    avgWorkoutMinutes: 52
  },
  live: [
    {
      userId: 'u_demo_1',
      userName: 'Marcus Vance',
      routineName: 'Upper Hypertrophy A',
      exIdx: 3,
      exTotal: 6,
      setsDone: 9,
      setsTotal: 18,
      startedAt: Date.now() - 32 * 60000
    },
    {
      userId: 'u_demo_2',
      userName: 'Elena Rostova',
      routineName: 'Leg Day & Core',
      exIdx: 2,
      exTotal: 5,
      setsDone: 6,
      setsTotal: 15,
      startedAt: Date.now() - 18 * 60000
    }
  ],
  recentFeed: [
    {
      id: 'w_demo_101',
      userId: 'u_demo_3',
      userName: 'David Kim',
      name: 'Push Hypertrophy',
      date: new Date(Date.now() - 45 * 60000).toISOString().slice(0, 10),
      timestamp: Date.now() - 45 * 60000,
      durationMs: 54 * 60000,
      volume: 6850,
      setsDone: 18,
      prsCount: 2,
      exercises: [
        { name: 'Barbell Bench Press', setsDone: 4, topWeight: 105 },
        { name: 'Incline DB Press', setsDone: 4, topWeight: 34 },
        { name: 'Cable Lateral Raise', setsDone: 4, topWeight: 12 },
        { name: 'Tricep Pushdown', setsDone: 4, topWeight: 28 }
      ],
      note: 'New 1RM on bench press today! Felt great.'
    },
    {
      id: 'w_demo_102',
      userId: 'u_demo_4',
      userName: 'Sarah Jenkins',
      name: 'Lower Strength Focus',
      date: new Date(Date.now() - 180 * 60000).toISOString().slice(0, 10),
      timestamp: Date.now() - 180 * 60000,
      durationMs: 62 * 60000,
      volume: 8400,
      setsDone: 16,
      prsCount: 1,
      exercises: [
        { name: 'Barbell Back Squat', setsDone: 5, topWeight: 130 },
        { name: 'Romanian Deadlift', setsDone: 4, topWeight: 110 },
        { name: 'Bulgarian Split Squat', setsDone: 3, topWeight: 24 }
      ]
    },
    {
      id: 'w_demo_103',
      userId: 'u_demo_5',
      userName: 'Alex Chen',
      name: 'Pull & Arms',
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      timestamp: Date.now() - 86400000,
      durationMs: 46 * 60000,
      volume: 5300,
      setsDone: 15,
      prsCount: 0,
      exercises: [
        { name: 'Barbell Bent Over Row', setsDone: 4, topWeight: 85 },
        { name: 'Lat Pulldown', setsDone: 4, topWeight: 70 },
        { name: 'Incline Bicep Curl', setsDone: 4, topWeight: 16 }
      ]
    }
  ],
  dailyTrends: Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10)
    const sessions = 2 + (i % 5)
    return {
      date: d,
      workoutsCount: sessions,
      activeUsersCount: Math.min(4, sessions),
      totalVolume: sessions * 4200
    }
  }),
  dayOfWeekStats: [8, 14, 11, 15, 9, 6, 4],
  hourOfDayStats: [0, 0, 0, 0, 0, 1, 4, 9, 7, 5, 4, 3, 4, 5, 6, 8, 14, 18, 16, 11, 6, 3, 1, 0],
  heatmap: {},
  leaderboard: [
    { id: 'u_demo_3', name: 'David Kim', workouts: 34, workoutsLast30d: 14, streakWeeks: 9, totalVolume: 84000, unit: 'kg' },
    { id: 'u_demo_4', name: 'Sarah Jenkins', workouts: 28, workoutsLast30d: 12, streakWeeks: 7, totalVolume: 72000, unit: 'kg' },
    { id: 'u_demo_1', name: 'Marcus Vance', workouts: 25, workoutsLast30d: 11, streakWeeks: 6, totalVolume: 61000, unit: 'kg' },
    { id: 'u_demo_5', name: 'Alex Chen', workouts: 20, workoutsLast30d: 8, streakWeeks: 4, totalVolume: 49000, unit: 'kg' },
    { id: 'u_demo_2', name: 'Elena Rostova', workouts: 18, workoutsLast30d: 7, streakWeeks: 3, totalVolume: 38000, unit: 'kg' }
  ],
  users: [
    { id: 'u_demo_3', name: 'David Kim', workouts: 34, streakWeeks: 9, lastWorkout: new Date(Date.now() - 45 * 60000).toISOString(), lastSync: Date.now() - 45 * 60000 },
    { id: 'u_demo_4', name: 'Sarah Jenkins', workouts: 28, streakWeeks: 7, lastWorkout: new Date(Date.now() - 180 * 60000).toISOString(), lastSync: Date.now() - 180 * 60000 },
    { id: 'u_demo_1', name: 'Marcus Vance', workouts: 25, streakWeeks: 6, lastWorkout: new Date(Date.now() - 86400000).toISOString(), lastSync: Date.now() - 10000, live: { name: 'Upper Hypertrophy A', exIdx: 3, exTotal: 6, setsDone: 9, setsTotal: 18, startedAt: Date.now() - 32 * 60000 } },
    { id: 'u_demo_2', name: 'Elena Rostova', workouts: 18, streakWeeks: 3, lastWorkout: new Date(Date.now() - 2 * 86400000).toISOString(), lastSync: Date.now() - 10000, live: { name: 'Leg Day & Core', exIdx: 2, exTotal: 5, setsDone: 6, setsTotal: 15, startedAt: Date.now() - 18 * 60000 } },
    { id: 'u_demo_5', name: 'Alex Chen', workouts: 20, streakWeeks: 4, lastWorkout: new Date(Date.now() - 86400000).toISOString(), lastSync: Date.now() - 86400000 }
  ]
}

export default function Admin() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const openSheet = useUI(s => s.openSheet)
  const toast = useUI(s => s.toast)
  const [users, setUsers] = useState(null)
  const [usersErr, setUsersErr] = useState(null)   // why the last load failed, until one succeeds
  const [invites, setInvites] = useState(null)
  const [inviteOnly, setInviteOnly] = useState(false)
  const [tick, setTick] = useState(0)          // the ↻ button; the activity log listens to it
  const [activityData, setActivityData] = useState(null)
  const [tab, setTab] = useState('activity')   // 'activity' | 'analytics' | 'operations'
  const [demoAdmin, setDemoAdmin] = useState(false)

  const loadUsers = () => api('/api/admin/users')
    .then(d => {
      if (!Array.isArray(d?.users)) throw new Error('The server answered without a list of users.')
      setUsers(d.users); setInviteOnly(!!d.invite_only); setUsersErr(null)
    })
    .catch(e => setUsersErr(e.message || 'Failed to load'))

  const loadInvites = () => api('/api/admin/invites').then(d => setInvites(d.invites)).catch(() => {})

  const loadActivity = () => api('/api/admin/activity-dashboard')
    .then(d => setActivityData(d))
    .catch(() => {})

  const reloadAll = () => {
    loadUsers()
    loadInvites()
    loadActivity()
  }

  // Poll every 15s so the live presence and activity feed stay live without a manual refresh
  useEffect(() => {
    if (!user?.admin && !demoAdmin) return
    reloadAll()
    const iv = setInterval(reloadAll, 15000)
    return () => clearInterval(iv)
  }, [user?.admin, demoAdmin])

  // If not signed in or not an admin, show a friendly explanation and preview toggle instead of a blank screen
  if (!user?.admin && !demoAdmin) {
    return (
      <div className="narrow">
        <div className="hdr">
          <button className="iconbtn" onClick={() => nav('/settings')} aria-label="Back"><Icon name="chevronLeft" /></button>
          <div style={{ flex: 1, marginInlineStart: 8 }}>
            <h1 style={{ margin: 0 }}>{t('Management Dashboard')}</h1>
            <div className="sub">{t('Admin Access Required')}</div>
          </div>
          <LanguageSelect />
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="row" style={{ gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center',
              background: 'color-mix(in srgb, var(--yellow) 18%, transparent)', color: 'var(--yellow)', fontSize: 22, flex: 'none'
            }}>
              <Icon name="lock" />
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{t('Operator Access Only')}</h2>
              <div className="dim" style={{ fontSize: 13.5, lineHeight: 1.45 }}>
                {user ? (
                  getLang() === 'fa' ? (
                    <>شما با عنوان <b>{user.name}</b> وارد شده‌اید، اما این نمایه دسترسی مدیریت روی این سرور را ندارد.</>
                  ) : (
                    <>You are signed in as <b>{user.name}</b>, but this profile does not have administrator privileges on this server.</>
                  )
                ) : (
                  t('You are currently using openGym in guest mode or not signed in. An admin profile is needed to manage live gym data.')
                )}
              </div>
            </div>
          </div>

          {user && (
            <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 'var(--r)', marginBottom: 14 }}>
              <div className="dim" style={{ fontSize: 11.5, marginBottom: 4, fontWeight: 600, letterSpacing: '.04em' }}>{t('YOUR USER ID:')}</div>
              <div className="row between" style={{ gap: 8 }}>
                <code style={{ fontSize: 13, wordBreak: 'break-all', fontFamily: 'monospace' }}>{user.id}</code>
                <Button size="sm" onClick={() => { navigator.clipboard?.writeText(user.id); toast(t('User ID copied')) }}>{t('Copy')}</Button>
              </div>
            </div>
          )}

          <div className="adm-group-t" style={{ marginTop: 6 }}>{t('How to enable admin access:')}</div>
          <ol style={{ fontSize: 13.5, color: 'var(--label-2)', lineHeight: 1.55, paddingLeft: 18, margin: '6px 0 16px' }}>
            {user ? (
              getLang() === 'fa' ? (
                <>
                  <li>شناسه کاربری خود را به <code>.env</code> اضافه کنید: <code>ADMIN_UIDS={user.id}</code></li>
                  <li>یا در <code>data/db.json</code>، مقدار <code>"admin": true</code> را روی شیء کاربری خود قرار دهید.</li>
                  <li>کانتینر سرور یا پروسه بک‌اند را ری‌استارت کنید.</li>
                </>
              ) : (
                <>
                  <li>Add your ID to <code>.env</code>: <code>ADMIN_UIDS={user.id}</code></li>
                  <li>Or in <code>data/db.json</code>, set <code>"admin": true</code> on your user object.</li>
                  <li>Restart the server container or backend process.</li>
                </>
              )
            ) : (
              getLang() === 'fa' ? (
                <>
                  <li>یک نمایه در تنظیمات ← حساب کاربری ایجاد کنید.</li>
                  <li>شناسه کاربری خود را به <code>ADMIN_UIDS</code> در <code>.env</code> اضافه کنید.</li>
                </>
              ) : (
                <>
                  <li>Create a profile in Settings → Account.</li>
                  <li>Add your user ID to <code>ADMIN_UIDS</code> in <code>.env</code>.</li>
                </>
              )
            )}
          </ol>

          <Button variant="primary" style={{ width: '100%' }} onClick={() => setDemoAdmin(true)}>
            {t('Preview Management Dashboard (Demo Mode)')}
          </Button>
        </div>
      </div>
    )
  }

  const openUser = id => openSheet(close => <UserDetail id={id} onChanged={reloadAll} close={close} />)
  const activeActivity = activityData || (demoAdmin ? DEMO_ACTIVITY_DATA : null)
  const activeUsers = users || (demoAdmin ? DEMO_ACTIVITY_DATA.users : null)
  const liveUsers = activeActivity?.live || (activeUsers || []).filter(u => u.live)
  const activeCount = (activeUsers || []).filter(u => u.lastSync && Date.now() - u.lastSync < 7 * 86400000).length
  const disabledCount = (activeUsers || []).filter(u => u.disabled).length
  const totalWorkouts = activeActivity?.kpis?.totalWorkoutsAllTime ?? (activeUsers || []).reduce((sum, u) => sum + (u.workouts || 0), 0)

  return <div className="narrow">
    <div className="hdr">
      <button className="iconbtn" onClick={() => nav('/settings')} aria-label="Back"><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginInlineStart: 8 }}><h1 style={{ margin: 0 }}>{t('Admin')}</h1>
        <div className="sub">{users ? `${users.length} ${t('users')} · ${activeCount} ${t('active this week')}` : usersErr ? t('Could not load') : t('Loading…')}</div></div>
      <div className="row" style={{ gap: 6, alignItems: 'center' }}>
        <LanguageSelect />
        <button className="iconbtn" onClick={() => { reloadAll(); setTick(n => n + 1) }} aria-label="refresh">↻</button>
      </div>
    </div>
    <div className="adm-intro">
      {t('Management dashboard for this gym instance: monitor live workouts on floor, recognize member activity and streaks, explore attendance analytics, and manage member profiles.')}
    </div>

    {usersErr && <div className="card" role="alert" style={{ borderColor: 'var(--red)' }}>
      <div className="row between"><h2 style={{ margin: 0 }}>{users ? t('The last update failed') : t('Could not load the users')}</h2>
        <Button size="sm" icon="reset" onClick={loadUsers}>{t('Try again')}</Button></div>
      <div className="adm-lead" style={{ marginBottom: 0 }}>
        {usersErr} {users ? t('The list below is the last one that loaded.') : t('It tries again every 15 seconds.')}
      </div>
    </div>}

    <div className="tiles" style={{ marginBottom: 8 }}>
      <div className="tile"><div className="l">{t('Users')}</div><div className="v">{users ? users.length : '—'}</div></div>
      <div className="tile"><div className="l">{t('Live on Floor')}</div><div className="v" style={{ color: liveUsers.length ? 'var(--acc)' : undefined }}>{liveUsers.length || (users ? 0 : '—')}</div></div>
      <div className="tile"><div className="l">{t('Active 7d')}</div><div className="v">{users ? activeCount : '—'}</div></div>
      <div className="tile"><div className="l">{t('Workouts')}</div><div className="v">{users ? totalWorkouts : '—'}</div></div>
    </div>

    {/* Tab Switcher */}
    <div className="adm-tab-bar" role="tablist">
      <button
        role="tab"
        aria-selected={tab === 'activity'}
        className={'adm-tab-btn' + (tab === 'activity' ? ' active' : '')}
        onClick={() => setTab('activity')}
      >
        <Icon name="dumbbell" style={{ fontSize: 16 }} />
        {t('Activity Feed')}
        {liveUsers.length > 0 && <span className="adm-tab-badge">{liveUsers.length} {t('live')}</span>}
      </button>
      <button
        role="tab"
        aria-selected={tab === 'analytics'}
        className={'adm-tab-btn' + (tab === 'analytics' ? ' active' : '')}
        onClick={() => setTab('analytics')}
      >
        <Icon name="chartLine" style={{ fontSize: 16 }} />
        {t('Analytics')}
      </button>
      <button
        role="tab"
        aria-selected={tab === 'operations'}
        className={'adm-tab-btn' + (tab === 'operations' ? ' active' : '')}
        onClick={() => setTab('operations')}
      >
        <Icon name="gear" style={{ fontSize: 16 }} />
        {t('Operations')}
      </button>
    </div>

    {tab === 'activity' && (
      <>
        <LiveFloorCard liveUsers={liveUsers} openUser={openUser} />
        {activityData?.recentFeed && (
          <ActivityFeedCard feed={activityData.recentFeed} openUser={openUser} />
        )}
        <MembersCard users={activityData?.users || users} openUser={openUser} liveUsers={liveUsers} />
      </>
    )}

    {tab === 'analytics' && (
      <AnalyticsSection activityData={activityData} users={users} openUser={openUser} />
    )}

    {tab === 'operations' && (
      <>
        <AdminCoach />
        <InvitesCard invites={invites} reload={loadInvites} inviteOnly={inviteOnly} />
        <div style={{ marginTop: 14 }}><AuditCard tick={tick} /></div>
      </>
    )}
  </div>
}

