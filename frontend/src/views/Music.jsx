import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { api } from '../lib/api.js'
import { getLang, t } from '../lib/i18n.js'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import '../music.css'

// Fallback demo tracks if offline / backend not reachable
const DEMO_TRACKS = [
  {
    id: 'demo_1',
    title: 'Heavy Duty Beat',
    artist: 'Gym Power Audio',
    category: 'Heavy Lifting',
    duration: 180,
    status: 'approved',
    likes: 19,
    plays: 54,
    url: ''
  },
  {
    id: 'demo_2',
    title: 'Cardio Pulse 140 BPM',
    artist: 'Electrobeats',
    category: 'Cardio',
    duration: 210,
    status: 'approved',
    likes: 27,
    plays: 88,
    url: ''
  },
  {
    id: 'demo_3',
    title: 'Beast Mode Focus',
    artist: 'Iron Mind',
    category: 'High Energy',
    duration: 195,
    status: 'approved',
    likes: 34,
    plays: 112,
    url: ''
  }
]

// Web Audio synthesizer for offline demo beats so sound ALWAYS works!
function playWebAudioDemoBeat(audioCtxRef, isRunning, bpm = 128) {
  if (!window.AudioContext && !window.webkitAudioContext) return null
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
  }
  const ctx = audioCtxRef.current
  if (ctx.state === 'suspended') ctx.resume()

  if (!isRunning) return null

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(110, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.18)

  gain.gain.setValueAtTime(0.4, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.22)
}

function fmtSec(sec) {
  if (isNaN(sec) || sec == null) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export default function Music() {
  const nav = useNavigate()
  const user = useStore(s => s.user)
  const toast = useUI(s => s.toast)
  const openSheet = useUI(s => s.openSheet)

  const [tracks, setTracks] = useState([])
  const [mySuggestions, setMySuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Player state
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState('none') // 'none' | 'all' | 'one'

  const audioRef = useRef(null)
  const webAudioCtxRef = useRef(null)
  const demoIntervalRef = useRef(null)

  const isFa = getLang() === 'fa'

  // Load tracks from server
  const loadMusic = async () => {
    try {
      setLoading(true)
      const res = await api('/api/music')
      if (res && res.tracks) {
        setTracks(res.tracks)
        setMySuggestions(res.mySuggestions || [])
        if (!currentTrack && res.tracks.length > 0) {
          setCurrentTrack(res.tracks[0])
        }
      }
    } catch (err) {
      console.warn('Could not reach /api/music, using demo data:', err.message)
      setTracks(DEMO_TRACKS)
      if (!currentTrack) setCurrentTrack(DEMO_TRACKS[0])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMusic()
  }, [])

  // Audio element management
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }
    const a = audioRef.current

    const handleTimeUpdate = () => setCurrentTime(a.currentTime)
    const handleLoadedMetadata = () => setDuration(a.duration || currentTrack?.duration || 0)
    const handleEnded = () => handleNextTrack()
    const handleError = () => {
      // If server file failed or empty, fallback to synthetic beat
      if (isPlaying) {
        startDemoBeatLoop()
      }
    }

    a.addEventListener('timeupdate', handleTimeUpdate)
    a.addEventListener('loadedmetadata', handleLoadedMetadata)
    a.addEventListener('ended', handleEnded)
    a.addEventListener('error', handleError)

    return () => {
      a.removeEventListener('timeupdate', handleTimeUpdate)
      a.removeEventListener('loadedmetadata', handleLoadedMetadata)
      a.removeEventListener('ended', handleEnded)
      a.removeEventListener('error', handleError)
      clearInterval(demoIntervalRef.current)
    }
  }, [currentTrack, isShuffle, repeatMode, tracks])

  // Volume synchronization
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Track change
  const playTrack = (track) => {
    clearInterval(demoIntervalRef.current)
    setCurrentTrack(track)
    setIsPlaying(true)

    if (audioRef.current) {
      if (track.url) {
        audioRef.current.src = track.url
        audioRef.current.play().catch(e => {
          console.warn('Audio play error, falling back to demo synthesizer:', e.message)
          startDemoBeatLoop()
        })
      } else {
        startDemoBeatLoop()
      }
    }

    // Inform server of play count
    api('/api/music/play', { method: 'POST', body: JSON.stringify({ id: track.id }) }).catch(() => {})
  }

  const togglePlay = () => {
    if (!currentTrack && tracks.length > 0) {
      playTrack(tracks[0])
      return
    }

    if (isPlaying) {
      setIsPlaying(false)
      audioRef.current?.pause()
      clearInterval(demoIntervalRef.current)
    } else {
      setIsPlaying(true)
      if (currentTrack?.url) {
        audioRef.current?.play().catch(() => startDemoBeatLoop())
      } else {
        startDemoBeatLoop()
      }
    }
  }

  const startDemoBeatLoop = () => {
    clearInterval(demoIntervalRef.current)
    playWebAudioDemoBeat(webAudioCtxRef, true)
    demoIntervalRef.current = setInterval(() => {
      playWebAudioDemoBeat(webAudioCtxRef, true)
      setCurrentTime(c => {
        const next = c + 0.5
        if (next >= (currentTrack?.duration || 180)) {
          handleNextTrack()
          return 0
        }
        return next
      })
    }, 500)
  }

  const handleNextTrack = () => {
    const list = getFilteredTracks()
    if (!list.length) return

    if (repeatMode === 'one' && currentTrack) {
      if (audioRef.current) audioRef.current.currentTime = 0
      audioRef.current?.play().catch(() => startDemoBeatLoop())
      return
    }

    let nextIdx = 0
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * list.length)
    } else {
      const curIdx = list.findIndex(t => t.id === currentTrack?.id)
      nextIdx = curIdx + 1
      if (nextIdx >= list.length) {
        if (repeatMode === 'none') {
          setIsPlaying(false)
          return
        }
        nextIdx = 0
      }
    }
    playTrack(list[nextIdx])
  }

  const handlePrevTrack = () => {
    const list = getFilteredTracks()
    if (!list.length) return

    const curIdx = list.findIndex(t => t.id === currentTrack?.id)
    let prevIdx = curIdx - 1
    if (prevIdx < 0) prevIdx = list.length - 1
    playTrack(list[prevIdx])
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, clickX / rect.width))
    const total = duration || currentTrack?.duration || 180
    const target = percent * total
    setCurrentTime(target)
    if (audioRef.current) {
      audioRef.current.currentTime = target
    }
  }

  const toggleLike = async (trackId, e) => {
    e?.stopPropagation()
    try {
      const res = await api('/api/music/like', { method: 'POST', body: JSON.stringify({ id: trackId }) })
      if (res && res.ok) {
        setTracks(prev => prev.map(t => t.id === trackId ? { ...t, likes: res.likes, liked: res.liked } : t))
        if (currentTrack?.id === trackId) {
          setCurrentTrack(c => ({ ...c, likes: res.likes, liked: res.liked }))
        }
      }
    } catch {
      // optimistic toggle for offline/guest
      setTracks(prev => prev.map(t => {
        if (t.id === trackId) {
          const liked = !t.liked
          return { ...t, liked, likes: (t.likes || 0) + (liked ? 1 : -1) }
        }
        return t
      }))
    }
  }

  // Filter categories
  const categories = [
    { id: 'all', label: isFa ? 'همه آهنگ‌ها' : 'All Tracks' },
    { id: 'Heavy Lifting', label: isFa ? 'تمرین سنگین' : 'Heavy Lifting' },
    { id: 'High Energy', label: isFa ? 'پرانرژی' : 'High Energy' },
    { id: 'Cardio', label: isFa ? 'هوازی' : 'Cardio' },
    { id: 'Warm-up', label: isFa ? 'گرم کردن' : 'Warm-up' },
    ...(mySuggestions.length > 0 ? [{ id: 'my-suggestions', label: isFa ? 'پیشنهادات من' : 'My Suggestions', badge: mySuggestions.length }] : [])
  ]

  const getFilteredTracks = () => {
    let list = activeCategory === 'my-suggestions' ? mySuggestions : tracks
    if (activeCategory !== 'all' && activeCategory !== 'my-suggestions') {
      list = list.filter(t => t.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(t => (t.title || '').toLowerCase().includes(q) || (t.artist || '').toLowerCase().includes(q))
    }
    return list
  }

  const openSuggestModal = () => {
    openSheet(close => <SuggestModal close={close} onUploaded={() => { loadMusic(); setActiveCategory('my-suggestions') }} />)
  }

  const filtered = getFilteredTracks()

  return (
    <div className="narrow music-view">
      {/* Header */}
      <div className="music-header">
        <div className="music-header-title">
          <h1>{isFa ? 'موزیک و پلی‌لیست باشگاه' : 'Gym Music Player'}</h1>
          <div className="sub">
            {isFa
              ? 'موزیک‌های منتخب و پرانرژی برای تمرین · با قابلیت پیشنهاد آهنگ به مربی'
              : 'Curated high-energy gym beats · Suggest tracks to your coach'}
          </div>
        </div>
        <Button variant="primary" size="sm" icon="plus" onClick={openSuggestModal}>
          {isFa ? 'پیشنهاد آهنگ' : 'Suggest Song'}
        </Button>
      </div>

      {/* Hero Now Playing Player Card */}
      {currentTrack && (
        <div className="hero-player-card">
          <div className="player-main-info">
            <div className={`player-disc ${isPlaying ? 'spinning' : ''}`}>
              <div className="player-disc-center">
                <Icon name="music" />
              </div>
            </div>

            <div className="player-meta">
              <div className="player-title">{currentTrack.title}</div>
              <div className="player-artist">{currentTrack.artist}</div>
              <div className="player-tags">
                <span className="player-tag acc">{currentTrack.category || 'Gym Beat'}</span>
                {currentTrack.suggestedBy && (
                  <span className="player-tag">
                    {isFa ? `پیشنهاد: ${currentTrack.suggestedBy.name}` : `By ${currentTrack.suggestedBy.name}`}
                  </span>
                )}
                {currentTrack.uploadedBy?.role === 'coach' && (
                  <span className="player-tag acc">
                    {isFa ? 'انتخاب رسمی مربی' : 'Coach Official Pick'}
                  </span>
                )}
              </div>
            </div>

            {/* Sound Wave Equalizer Animation */}
            <div className={`sound-waves ${isPlaying ? 'active' : ''}`} title="Playing Audio">
              <div className="sound-bar" />
              <div className="sound-bar" />
              <div className="sound-bar" />
              <div className="sound-bar" />
              <div className="sound-bar" />
            </div>
          </div>

          {/* Interactive Seek Bar */}
          <div className="player-progress-container">
            <div className="player-progress-bar" onClick={handleSeek}>
              <div
                className="player-progress-fill"
                style={{
                  width: `${((currentTime / (duration || currentTrack.duration || 180)) * 100) || 0}%`
                }}
              />
            </div>
            <div className="player-time-display">
              <span>{fmtSec(currentTime)}</span>
              <span>{fmtSec(duration || currentTrack.duration || 180)}</span>
            </div>
          </div>

          {/* Player Main Controls */}
          <div className="player-controls">
            <button
              className={`ctrl-btn ${isShuffle ? 'active' : ''}`}
              onClick={() => setIsShuffle(!isShuffle)}
              title={isFa ? 'پخش تصادفی (Shuffle)' : 'Shuffle'}
            >
              <Icon name="shuffle" />
            </button>

            <button className="ctrl-btn" onClick={handlePrevTrack} title={isFa ? 'آهنگ قبلی' : 'Previous'}>
              <Icon name="backward" />
            </button>

            <button
              className="play-pause-btn"
              onClick={togglePlay}
              title={isPlaying ? (isFa ? 'توقف' : 'Pause') : (isFa ? 'پخش' : 'Play')}
            >
              <Icon name={isPlaying ? 'pause' : 'play'} />
            </button>

            <button className="ctrl-btn" onClick={handleNextTrack} title={isFa ? 'آهنگ بعدی' : 'Next'}>
              <Icon name="forward" />
            </button>

            <button
              className={`ctrl-btn ${repeatMode !== 'none' ? 'active' : ''}`}
              onClick={() => setRepeatMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none')}
              title={isFa ? `تکرار: ${repeatMode}` : `Repeat: ${repeatMode}`}
            >
              <Icon name="repeat" />
            </button>

            <button
              className={`like-btn ${currentTrack.liked ? 'liked' : ''}`}
              onClick={(e) => toggleLike(currentTrack.id, e)}
              title={isFa ? 'پسندیدن' : 'Like'}
            >
              <Icon name={currentTrack.liked ? 'heartFill' : 'heart'} />
              <span>{currentTrack.likes || 0}</span>
            </button>
          </div>

          {/* Volume Slider */}
          <div className="player-volume-row">
            <button className="ctrl-btn" style={{ padding: 4 }} onClick={() => setIsMuted(!isMuted)}>
              <Icon name={isMuted || volume === 0 ? 'volumeMute' : 'volume'} />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={e => {
                setVolume(parseFloat(e.target.value))
                if (isMuted) setIsMuted(false)
              }}
              className="volume-slider"
              title="Volume"
            />
          </div>
        </div>
      )}

      {/* Categories & Filter Chips */}
      <div className="music-categories">
        {categories.map(c => (
          <button
            key={c.id}
            className={`music-chip ${activeCategory === c.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.label}
            {c.badge != null && <span className="chip-badge">{c.badge}</span>}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="input-group" style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder={isFa ? '🔍 جستجوی آهنگ، خواننده یا سبک...' : '🔍 Search song title or artist...'}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tracks Section Header */}
      <div className="tracks-section-header">
        <h3>
          {activeCategory === 'my-suggestions'
            ? (isFa ? 'آهنگ‌های پیشنهادی شما به مربی' : 'Your Song Suggestions')
            : (isFa ? `لیست آهنگ‌های باشگاه (${filtered.length})` : `Gym Playlist (${filtered.length})`)}
        </h3>
        {activeCategory === 'my-suggestions' && (
          <Button size="sm" icon="plus" onClick={openSuggestModal}>
            {isFa ? 'پیشنهاد جدید' : 'New Suggestion'}
          </Button>
        )}
      </div>

      {/* Track List */}
      {filtered.length === 0 ? (
        <div className="card music-empty-state">
          <Icon name="music" />
          <div style={{ fontWeight: 600, fontSize: '1.05rem', margin: '6px 0' }}>
            {isFa ? 'هیچ آهنگی در این بخش یافت نشد' : 'No tracks found in this category'}
          </div>
          <div className="dim small" style={{ marginBottom: 14 }}>
            {activeCategory === 'my-suggestions'
              ? (isFa ? 'شما هنوز آهنگی پیشنهاد نکرده‌اید. با دکمه زیر می‌توانید اولین آهنگ را برای مربی بفرستید!' : 'You have not suggested any songs yet. Suggest your favorite gym beat to the coach!')
              : (isFa ? 'می‌توانید آهنگ پیشنهادی خود را آپلود کنید تا پس از بررسی مربی به لیست اضافه شود.' : 'You can suggest an audio track to be added by the coach.')}
          </div>
          <Button variant="primary" size="sm" icon="plus" onClick={openSuggestModal}>
            {isFa ? 'پیشنهاد اولین آهنگ' : 'Suggest a Song'}
          </Button>
        </div>
      ) : (
        filtered.map((trk, i) => {
          const isThisPlaying = currentTrack?.id === trk.id && isPlaying
          const isThisSelected = currentTrack?.id === trk.id

          return (
            <div
              key={trk.id}
              className={`track-item ${isThisSelected ? 'playing' : ''}`}
              onClick={() => playTrack(trk)}
            >
              <div className="track-play-badge">
                <Icon name={isThisPlaying ? 'pause' : 'play'} />
              </div>

              <div className="track-details">
                <div className="track-name-row">
                  <span className="track-name">{trk.title}</span>
                  {trk.status === 'pending' && (
                    <span className="status-pill pending">
                      {isFa ? '🟡 در انتظار تایید مربی' : 'Pending Review'}
                    </span>
                  )}
                  {trk.status === 'rejected' && (
                    <span className="status-pill rejected">
                      {isFa ? '🔴 رد شده' : 'Rejected'}
                    </span>
                  )}
                </div>

                <div className="track-sub">
                  <span>{trk.artist}</span>
                  <span>·</span>
                  <span className="track-category-tag">{trk.category}</span>
                  {trk.suggestedBy && (
                    <>
                      <span>·</span>
                      <span className="dim">
                        {isFa ? `پیشنهاد: ${trk.suggestedBy.name}` : `By ${trk.suggestedBy.name}`}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="track-actions">
                <span className="dim small font-mono" style={{ marginInlineEnd: 6 }}>
                  {fmtSec(trk.duration || 180)}
                </span>
                <button
                  className={`like-btn ${trk.liked ? 'liked' : ''}`}
                  onClick={(e) => toggleLike(trk.id, e)}
                >
                  <Icon name={trk.liked ? 'heartFill' : 'heart'} />
                  <span>{trk.likes || 0}</span>
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// Modal for Athletes to upload and suggest a song to the coach
function SuggestModal({ close, onUploaded }) {
  const isFa = getLang() === 'fa'
  const toast = useUI(s => s.toast)
  const user = useStore(s => s.user)

  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [category, setCategory] = useState('High Energy')
  const [note, setNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      // Extract title from filename automatically if empty
      if (!title) {
        const cleanName = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
        setTitle(cleanName)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      toast(isFa ? 'لطفاً فایل صوتی آهنگ را انتخاب کنید' : 'Please select an audio file')
      return
    }
    if (!title.trim()) {
      toast(isFa ? 'نام آهنگ را وارد کنید' : 'Please enter the song title')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title.trim())
      formData.append('artist', artist.trim() || user?.name || 'Athlete Suggestion')
      formData.append('category', category)
      formData.append('note', note.trim())

      const res = await fetch('/api/music/suggest', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      toast(isFa ? '✓ آهنگ با موفقیت برای تایید مربی ارسال شد!' : '✓ Track submitted for coach review!')
      onUploaded?.()
      close()
    } catch (err) {
      toast((isFa ? 'خطا در ارسال: ' : 'Upload failed: ') + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="suggest-modal-card">
      <div className="row between" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{isFa ? 'پیشنهاد آهنگ به مربی' : 'Suggest a Song to Coach'}</h3>
        <button className="iconbtn" onClick={close}><Icon name="xmark" /></button>
      </div>

      <div className="dim small" style={{ marginBottom: 14, lineHeight: 1.45 }}>
        {isFa
          ? 'آهنگ پیشنهادی شما در پنل ادمین مربی قرار می‌گیرد. پس از بررسی و تایید مربی، این آهنگ به پلی‌لیست عمومی باشگاه اضافه خواهد شد.'
          : 'Your suggested track will be sent to the coach admin panel. Once approved, it will be added to the gym playlist.'}
      </div>

      <form onSubmit={handleSubmit}>
        {/* File Dropzone */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/flac,audio/aac"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div
          className={`file-dropzone ${file ? 'has-file' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="dropzone-icon">
            <Icon name={file ? 'checkCircle' : 'upload'} />
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 4 }}>
            {file ? file.name : (isFa ? 'انتخاب یا رها کردن فایل صوتی' : 'Choose or drop audio file')}
          </div>
          <div className="dim small">
            {file
              ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
              : (isFa ? 'فرمت‌های MP3, WAV, OGG, M4A تا سقف ۵۰ مگابایت' : 'MP3, WAV, OGG, M4A up to 50MB')}
          </div>
        </div>

        {/* Track Title */}
        <div className="input-group">
          <label>{isFa ? 'عنوان آهنگ *' : 'Track Title *'}</label>
          <input
            type="text"
            placeholder={isFa ? 'مثلاً: Eye of the Tiger' : 'e.g. Eye of the Tiger'}
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Artist */}
        <div className="input-group">
          <label>{isFa ? 'نام خواننده / هنرمند' : 'Artist Name'}</label>
          <input
            type="text"
            placeholder={isFa ? 'نام خواننده یا بند' : 'Artist or band name'}
            value={artist}
            onChange={e => setArtist(e.target.value)}
          />
        </div>

        {/* Workout Category */}
        <div className="input-group">
          <label>{isFa ? 'سبک تمرین / دسته‌بندی' : 'Workout Category'}</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="High Energy">{isFa ? 'پرانرژی (High Energy)' : 'High Energy'}</option>
            <option value="Heavy Lifting">{isFa ? 'تمرین سنگین و رکورد (Heavy Lifting / PR)' : 'Heavy Lifting'}</option>
            <option value="Cardio">{isFa ? 'هوازی و دویدن (Cardio / Running)' : 'Cardio'}</option>
            <option value="Warm-up">{isFa ? 'گرم کردن و کشش (Warm-up / Stretching)' : 'Warm-up'}</option>
            <option value="EDM / Beats">{isFa ? 'الکترونیک و بیس (EDM / Heavy Bass)' : 'EDM / Heavy Bass'}</option>
          </select>
        </div>

        {/* Athlete Note to Coach */}
        <div className="input-group">
          <label>{isFa ? 'پیام یا توضیح برای مربی (اختیاری)' : 'Note for Coach (Optional)'}</label>
          <textarea
            rows={2}
            placeholder={isFa ? 'مثلاً: ریتم بیس این آهنگ برای ست‌های سنگین ددلیفت بی‌نظیره!' : 'e.g. Great rhythm for heavy deadlift sets!'}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <div style={{ height: 6 }} />
        <Button variant="primary" type="submit" disabled={uploading} style={{ width: '100%' }}>
          {uploading
            ? (isFa ? 'در حال ارسال فایل صوتی...' : 'Uploading audio...')
            : (isFa ? 'ارسال به مربی جهت تایید' : 'Submit to Coach')}
        </Button>
      </form>
    </div>
  )
}
