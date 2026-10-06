import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api.js'
import { useUI } from '../store/useUI.js'
import { getLang } from '../lib/i18n.js'
import { tAdmin as t } from './admin-i18n.js'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { confirmSheet } from '../sheets.jsx'

export default function AdminMusic() {
  const isFa = getLang() === 'fa'
  const toast = useUI(s => s.toast)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [previewTrackId, setPreviewTrackId] = useState(null)
  const [isPlayingPreview, setIsPlayingPreview] = useState(false)
  const previewAudioRef = useRef(null)

  // Direct upload form state
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadArtist, setUploadArtist] = useState('')
  const [uploadCategory, setUploadCategory] = useState('High Energy')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Editing suggestion modal/state
  const [editingTrack, setEditingTrack] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editArtist, setEditArtist] = useState('')
  const [editCategory, setEditCategory] = useState('High Energy')

  const loadAdminMusic = async () => {
    try {
      setLoading(true)
      const res = await api('/api/admin/music')
      setData(res)
    } catch (e) {
      console.warn('Could not load /api/admin/music:', e.message)
      setData({
        pending: [],
        approved: [],
        rejected: [],
        stats: { totalTracks: 0, pendingCount: 0, approvedCount: 0, totalPlays: 0, storageBytes: 0 }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminMusic()
    return () => {
      previewAudioRef.current?.pause()
    }
  }, [])

  // Audio preview handler
  const togglePreview = (track) => {
    if (previewTrackId === track.id && isPlayingPreview) {
      previewAudioRef.current?.pause()
      setIsPlayingPreview(false)
      return
    }

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio()
      previewAudioRef.current.onended = () => setIsPlayingPreview(false)
      previewAudioRef.current.onerror = () => {
        setIsPlayingPreview(false)
        toast(isFa ? 'امکان پخش فایل صوتی وجود ندارد' : 'Could not play audio file')
      }
    }

    setPreviewTrackId(track.id)
    setIsPlayingPreview(true)
    previewAudioRef.current.src = track.url
    previewAudioRef.current.play().catch(e => {
      setIsPlayingPreview(false)
      toast((isFa ? 'خطا در پخش: ' : 'Playback error: ') + e.message)
    })
  }

  // Approve suggestion
  const handleApprove = async (id, customMeta = null) => {
    try {
      const payload = {
        id,
        action: 'approve',
        ...(customMeta || {})
      }
      await api('/api/admin/music/review', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      toast(isFa ? '✓ آهنگ تایید شد و به لیست پخش باشگاه اضافه گردید!' : '✓ Track approved and added to playlist!')
      setEditingTrack(null)
      loadAdminMusic()
    } catch (e) {
      toast((isFa ? 'خطا: ' : 'Error: ') + e.message)
    }
  }

  // Reject suggestion
  const handleReject = async (track) => {
    confirmSheet({
      title: isFa ? `رد پیشنهاد «${track.title}»؟` : `Reject "${track.title}"?`,
      message: isFa
        ? 'این آهنگ به لیست پخش عمومی باشگاه اضافه نخواهد شد و وضعیت آن برای ورزشکار «رد شده» ثبت می‌شود.'
        : 'This track will not be added to the gym playlist and will be marked as rejected.',
      confirmText: isFa ? 'رد کردن' : 'Reject',
      danger: true,
      onConfirm: async () => {
        try {
          await api('/api/admin/music/review', {
            method: 'POST',
            body: JSON.stringify({ id: track.id, action: 'reject' })
          })
          toast(isFa ? 'پیشنهاد رد شد' : 'Suggestion rejected')
          loadAdminMusic()
        } catch (e) {
          toast(e.message)
        }
      }
    })
  }

  // Delete track
  const handleDelete = async (track) => {
    confirmSheet({
      title: isFa ? `حذف آهنگ «${track.title}»؟` : `Delete "${track.title}"?`,
      message: isFa
        ? 'فایل صوتی و اطلاعات این آهنگ به طور کامل از سرور حذف خواهد شد.'
        : 'This audio track and file will be permanently removed from the server.',
      confirmText: isFa ? 'حذف دائمی' : 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await api('/api/admin/music/delete', {
            method: 'POST',
            body: JSON.stringify({ id: track.id })
          })
          toast(isFa ? 'آهنگ حذف شد' : 'Track deleted')
          if (previewTrackId === track.id) {
            previewAudioRef.current?.pause()
            setIsPlayingPreview(false)
          }
          loadAdminMusic()
        } catch (e) {
          toast(e.message)
        }
      }
    })
  }

  // Coach direct upload
  const handleCoachUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile) {
      toast(isFa ? 'لطفاً فایل صوتی را انتخاب کنید' : 'Please select an audio file')
      return
    }
    if (!uploadTitle.trim()) {
      toast(isFa ? 'عنوان آهنگ را وارد کنید' : 'Enter track title')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', uploadTitle.trim())
      formData.append('artist', uploadArtist.trim() || (isFa ? 'انتخاب مربی' : 'Coach Pick'))
      formData.append('category', uploadCategory)

      const res = await fetch('/api/admin/music/upload', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      toast(isFa ? '✓ آهنگ با موفقیت به پلی‌لیست باشگاه اضافه شد!' : '✓ Track uploaded and published!')
      setUploadFile(null)
      setUploadTitle('')
      setUploadArtist('')
      loadAdminMusic()
    } catch (e) {
      toast((isFa ? 'خطا در آپلود: ' : 'Upload failed: ') + e.message)
    } finally {
      setUploading(false)
    }
  }

  const startEdit = (track) => {
    setEditingTrack(track)
    setEditTitle(track.title)
    setEditArtist(track.artist)
    setEditCategory(track.category || 'High Energy')
  }

  const pending = data?.pending || []
  const approved = data?.approved || []
  const stats = data?.stats || {}

  return (
    <div style={{ marginTop: 14 }}>
      {/* Music KPIs */}
      <div className="tiles" style={{ marginBottom: 16 }}>
        <div className="tile">
          <div className="l">{isFa ? 'آهنگ‌های فعال' : 'Active Tracks'}</div>
          <div className="v" style={{ color: 'var(--acc)' }}>{stats.approvedCount || 0}</div>
        </div>
        <div className="tile">
          <div className="l">{isFa ? 'در انتظار تایید' : 'Pending Review'}</div>
          <div className="v" style={{ color: pending.length > 0 ? 'var(--yellow)' : undefined }}>
            {pending.length}
          </div>
        </div>
        <div className="tile">
          <div className="l">{isFa ? 'مجموع پخش' : 'Total Plays'}</div>
          <div className="v">{stats.totalPlays || 0}</div>
        </div>
        <div className="tile">
          <div className="l">{isFa ? 'حجم فایل‌ها' : 'Storage'}</div>
          <div className="v" style={{ fontSize: '.95rem' }}>
            {((stats.storageBytes || 0) / 1024 / 1024).toFixed(1)} MB
          </div>
        </div>
      </div>

      {/* 1. Pending Athlete Suggestions Card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row between">
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="music" />
            {isFa ? 'پیشنهادات آهنگ ورزشکاران' : 'Athlete Song Suggestions'}
          </h2>
          {pending.length > 0 && (
            <span className="adm-pill" style={{ background: 'var(--yellow)', color: '#000', fontWeight: 700 }}>
              {pending.length} {isFa ? 'مورد جدید' : 'new'}
            </span>
          )}
        </div>

        <div className="adm-lead">
          {isFa
            ? 'آهنگ‌هایی که ورزشکاران برای پخش در باشگاه پیشنهاد کرده‌اند. می‌توانید ابتدا به فایل صوتی گوش دهید و در صورت تایید، آن را مستقیماً وارد پلی‌لیست عمومی باشگاه کنید.'
            : 'Songs suggested by gym athletes. You can preview the audio, edit metadata, and approve them into the gym playlist.'}
        </div>

        {pending.length === 0 ? (
          <div className="adm-empty">
            {isFa ? 'هیچ پیشنهاد معلقی در صف بررسی وجود ندارد.' : 'No pending suggestions awaiting review.'}
          </div>
        ) : (
          pending.map(track => {
            const isPlaying = previewTrackId === track.id && isPlayingPreview
            const isEditing = editingTrack?.id === track.id

            return (
              <div
                key={track.id}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--r, 12px)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--sep)',
                  marginBottom: 10
                }}
              >
                <div className="row between" style={{ alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.02rem', marginBottom: 2 }}>
                      {track.title}
                    </div>
                    <div className="dim small" style={{ marginBottom: 6 }}>
                      <span>{track.artist}</span> · <span className="player-tag acc">{track.category}</span>
                    </div>

                    <div className="row" style={{ gap: 6, flexWrap: 'wrap', fontSize: '0.78rem' }}>
                      <span className="adm-pill">
                        {isFa ? `پیشنهاد از: ${track.suggestedBy?.name || 'ورزشکار'}` : `By: ${track.suggestedBy?.name || 'Athlete'}`}
                      </span>
                      <span className="adm-pill">
                        {new Date(track.createdAt).toLocaleDateString(isFa ? 'fa-IR' : undefined)}
                      </span>
                      {track.filesize && (
                        <span className="adm-pill">
                          {(track.filesize / 1024 / 1024).toFixed(1)} MB
                        </span>
                      )}
                    </div>

                    {track.athleteNote && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: '6px 10px',
                          borderRadius: 8,
                          background: 'color-mix(in srgb, var(--acc) 10%, var(--surface))',
                          fontSize: '0.8rem',
                          color: 'var(--label)'
                        }}
                      >
                        💬 <b>{isFa ? 'پیام ورزشکار:' : 'Athlete note:'}</b> {track.athleteNote}
                      </div>
                    )}
                  </div>

                  {/* Audio Preview Button */}
                  <Button
                    size="sm"
                    variant={isPlaying ? 'primary' : 'default'}
                    icon={isPlaying ? 'pause' : 'play'}
                    onClick={() => togglePreview(track)}
                  >
                    {isPlaying ? (isFa ? 'توقف' : 'Stop') : (isFa ? 'گوش دادن' : 'Preview')}
                  </Button>
                </div>

                {/* Inline Edit Form if active */}
                {isEditing ? (
                  <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 10, marginTop: 10 }}>
                    <div className="input-group" style={{ marginBottom: 8 }}>
                      <label>{isFa ? 'عنوان آهنگ' : 'Title'}</label>
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 8 }}>
                      <label>{isFa ? 'خواننده' : 'Artist'}</label>
                      <input value={editArtist} onChange={e => setEditArtist(e.target.value)} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 10 }}>
                      <label>{isFa ? 'سبک / دسته‌بندی' : 'Category'}</label>
                      <select value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                        <option value="High Energy">High Energy</option>
                        <option value="Heavy Lifting">Heavy Lifting</option>
                        <option value="Cardio">Cardio</option>
                        <option value="Warm-up">Warm-up</option>
                        <option value="EDM / Beats">EDM / Beats</option>
                      </select>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <Button
                        variant="primary"
                        size="sm"
                        icon="check"
                        onClick={() => handleApprove(track.id, { title: editTitle, artist: editArtist, category: editCategory })}
                      >
                        {isFa ? 'ذخیره و تایید نهایی' : 'Save & Approve'}
                      </Button>
                      <Button size="sm" onClick={() => setEditingTrack(null)}>
                        {isFa ? 'انصراف' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="row" style={{ gap: 8, marginTop: 10 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon="check"
                      onClick={() => handleApprove(track.id)}
                    >
                      {isFa ? '✓ تایید و انتشار' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      icon="pencil"
                      onClick={() => startEdit(track)}
                    >
                      {isFa ? 'ویرایش و تایید' : 'Edit & Approve'}
                    </Button>
                    <Button
                      size="sm"
                      style={{ color: 'var(--red)' }}
                      icon="trash"
                      onClick={() => handleReject(track)}
                    >
                      {isFa ? 'رد پیشنهاد' : 'Reject'}
                    </Button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 2. Coach Direct Upload Card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="upload" />
          {isFa ? 'آپلود مستقیم آهنگ توسط مربی' : 'Coach Direct Music Upload'}
        </h2>
        <div className="adm-lead">
          {isFa
            ? 'آهنگ‌هایی که خودتان به عنوان مربی انتخاب می‌کنید، بدون نیاز به بررسی به طور خودکار در لیست پخش رسمی باشگاه قرار می‌گیرند.'
            : 'Upload official gym tracks directly. They are published immediately without needing review.'}
        </div>

        <form onSubmit={handleCoachUpload}>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/flac,audio/aac"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) {
                setUploadFile(f)
                if (!uploadTitle) {
                  setUploadTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '))
                }
              }
            }}
          />

          <div
            className={`file-dropzone ${uploadFile ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '16px', marginBottom: 12 }}
          >
            <div className="dropzone-icon" style={{ fontSize: 24, marginBottom: 4 }}>
              <Icon name={uploadFile ? 'checkCircle' : 'upload'} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
              {uploadFile ? uploadFile.name : (isFa ? 'کلیک کنید یا فایل صوتی را اینجا بکشید' : 'Choose audio file (MP3, WAV, OGG)')}
            </div>
            {uploadFile && (
              <div className="dim small">
                {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
          </div>

          <div className="row" style={{ gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label>{isFa ? 'عنوان آهنگ *' : 'Track Title *'}</label>
              <input
                type="text"
                placeholder={isFa ? 'مثلاً: Beast Mode Beats' : 'e.g. Beast Mode Beats'}
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
              <label>{isFa ? 'نام خواننده / هنرمند' : 'Artist Name'}</label>
              <input
                type="text"
                placeholder={isFa ? 'نام خواننده' : 'Artist'}
                value={uploadArtist}
                onChange={e => setUploadArtist(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ flex: '1 1 160px', marginBottom: 0 }}>
              <label>{isFa ? 'دسته‌بندی' : 'Category'}</label>
              <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>
                <option value="High Energy">High Energy</option>
                <option value="Heavy Lifting">Heavy Lifting</option>
                <option value="Cardio">Cardio</option>
                <option value="Warm-up">Warm-up</option>
                <option value="EDM / Beats">EDM / Beats</option>
              </select>
            </div>
          </div>

          <Button variant="primary" type="submit" disabled={uploading} style={{ width: '100%', marginTop: 8 }}>
            {uploading
              ? (isFa ? 'در حال آپلود و پردازش فایل...' : 'Uploading...')
              : (isFa ? '✓ آپلود و انتشار فوری در باشگاه' : 'Upload & Publish to Gym')}
          </Button>
        </form>
      </div>

      {/* 3. Active Gym Playlist Management Card */}
      <div className="card">
        <div className="row between">
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="list" />
            {isFa ? `پلی‌لیست فعال باشگاه (${approved.length})` : `Active Gym Playlist (${approved.length})`}
          </h2>
          <Button size="sm" onClick={loadAdminMusic}>↻</Button>
        </div>

        <div className="adm-lead">
          {isFa
            ? 'تمام آهنگ‌هایی که در حال حاضر در بخش موزیک پلیر ورزشکاران فعال و قابل پخش هستند.'
            : 'All tracks currently live and playable for athletes in the music player.'}
        </div>

        {approved.length === 0 ? (
          <div className="adm-empty">
            {isFa ? 'هیچ آهنگی در لیست فعال وجود ندارد.' : 'No active tracks found.'}
          </div>
        ) : (
          approved.map(track => {
            const isPlaying = previewTrackId === track.id && isPlayingPreview

            return (
              <div
                key={track.id}
                className="row between"
                style={{
                  padding: '10px 4px',
                  borderBottom: 'var(--hair) solid var(--sep)',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.94rem' }}>
                    {track.title}
                  </div>
                  <div className="dim small">
                    <span>{track.artist}</span> · <span className="player-tag">{track.category}</span>
                    {track.suggestedBy && (
                      <span style={{ marginInlineStart: 6 }}>
                        · {isFa ? `پیشنهاد: ${track.suggestedBy.name}` : `By ${track.suggestedBy.name}`}
                      </span>
                    )}
                  </div>
                  <div className="dim" style={{ fontSize: '0.72rem', marginTop: 3 }}>
                    <span>▶ {track.plays || 0} {isFa ? 'پخش' : 'plays'}</span> · <span>❤️ {track.likes || 0}</span>
                  </div>
                </div>

                <div className="row" style={{ gap: 6, flex: 'none' }}>
                  <button
                    className="iconbtn adm-iconbtn"
                    onClick={() => togglePreview(track)}
                    aria-label="Preview"
                    title={isPlaying ? (isFa ? 'توقف' : 'Stop') : (isFa ? 'پخش پیش‌نمایش' : 'Preview')}
                  >
                    <Icon name={isPlaying ? 'pause' : 'play'} />
                  </button>
                  <button
                    className="iconbtn adm-iconbtn"
                    style={{ color: 'var(--red)' }}
                    onClick={() => handleDelete(track)}
                    aria-label="Delete"
                    title={isFa ? 'حذف آهنگ' : 'Delete track'}
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
