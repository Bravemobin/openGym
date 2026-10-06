import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Supported audio MIME types and extensions
const AUDIO_MIMES = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.webm': 'audio/webm'
};

const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50 MB

// Helper to create a synthesized upbeat electronic gym beat WAV if needed
function generateSynthesizedWav(bpm = 128, bars = 4, style = 'hype') {
  const sampleRate = 22050;
  const beatSec = 60 / bpm;
  const totalSec = beatSec * 4 * bars;
  const numSamples = Math.floor(sampleRate * totalSec);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beatPos = (t % beatSec) / beatSec;
    const eighthPos = (t % (beatSec / 2)) / (beatSec / 2);

    // Punchy Kick Drum
    let kick = 0;
    if (beatPos < 0.22) {
      const f = 140 * (1 - beatPos * 3.5) + 42;
      kick = Math.sin(2 * Math.PI * f * beatPos * beatSec) * Math.exp(-beatPos * 14);
    }

    // Hi-hat groove
    let hat = 0;
    if (eighthPos < 0.08) {
      hat = (Math.random() * 2 - 1) * Math.exp(-eighthPos * 28) * 0.28;
    }

    // Synth bassline / Lead
    let synth = 0;
    if (style === 'cardio') {
      const notes = [65, 78, 65, 98, 65, 78, 110, 98];
      const note = notes[Math.floor(t / (beatSec / 2)) % notes.length];
      synth = Math.sin(2 * Math.PI * note * t) * 0.25 * (1 - eighthPos * 0.5);
    } else {
      const notes = [55, 65, 55, 73, 55, 65, 82, 73];
      const note = notes[Math.floor(t / (beatSec / 2)) % notes.length];
      synth = Math.sin(2 * Math.PI * note * t) * 0.32 * (1 - eighthPos * 0.6);
    }

    let sample = (kick * 0.65 + hat + synth) * 0.85;
    sample = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.floor(sample * 32767), offset);
    offset += 2;
  }
  return buffer;
}

export function musicRoutes({ DATA, json, readSession, requireAdmin, audit }) {
  const musicDir = path.join(DATA, 'music');
  const dbFile = path.join(DATA, 'music.json');

  try { fs.mkdirSync(musicDir, { recursive: true }); } catch {}

  function atomicWrite(file, content) {
    const tmp = file + '.tmp.' + crypto.randomBytes(6).toString('hex');
    fs.writeFileSync(tmp, content, { mode: 0o600 });
    fs.renameSync(tmp, file);
  }

  function loadDb() {
    try {
      if (fs.existsSync(dbFile)) {
        return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      }
    } catch (e) {
      console.error('music.json read error:', e.message);
    }
    // Initialize default library if fresh
    const initialTracks = [
      {
        id: 'trk_power_anthem',
        title: 'Power Workout Anthem',
        artist: 'openGym Audio',
        category: 'Heavy Lifting',
        filename: 'power_anthem.wav',
        filesize: 0,
        mimeType: 'audio/wav',
        duration: 32,
        status: 'approved',
        uploadedBy: { id: 'admin', name: 'Coach' },
        createdAt: Date.now() - 3600000 * 24 * 3,
        approvedAt: Date.now() - 3600000 * 24 * 3,
        likes: 18,
        plays: 45
      },
      {
        id: 'trk_cardio_rush',
        title: 'High Energy Cardio Rush',
        artist: 'openGym Audio',
        category: 'High Energy',
        filename: 'cardio_rush.wav',
        filesize: 0,
        mimeType: 'audio/wav',
        duration: 32,
        status: 'approved',
        uploadedBy: { id: 'admin', name: 'Coach' },
        createdAt: Date.now() - 3600000 * 24 * 2,
        approvedAt: Date.now() - 3600000 * 24 * 2,
        likes: 24,
        plays: 68
      },
      {
        id: 'trk_beast_mode',
        title: 'Beast Mode Bassline',
        artist: 'openGym Audio',
        category: 'High Energy',
        filename: 'beast_mode.wav',
        filesize: 0,
        mimeType: 'audio/wav',
        duration: 32,
        status: 'approved',
        uploadedBy: { id: 'admin', name: 'Coach' },
        createdAt: Date.now() - 3600000 * 24 * 1,
        approvedAt: Date.now() - 3600000 * 24 * 1,
        likes: 31,
        plays: 89
      }
    ];

    // Create the default wav files if they don't exist
    try {
      const p1 = path.join(musicDir, 'power_anthem.wav');
      if (!fs.existsSync(p1)) {
        const b1 = generateSynthesizedWav(130, 8, 'hype');
        fs.writeFileSync(p1, b1);
        initialTracks[0].filesize = b1.length;
      } else {
        initialTracks[0].filesize = fs.statSync(p1).size;
      }

      const p2 = path.join(musicDir, 'cardio_rush.wav');
      if (!fs.existsSync(p2)) {
        const b2 = generateSynthesizedWav(140, 8, 'cardio');
        fs.writeFileSync(p2, b2);
        initialTracks[1].filesize = b2.length;
      } else {
        initialTracks[1].filesize = fs.statSync(p2).size;
      }

      const p3 = path.join(musicDir, 'beast_mode.wav');
      if (!fs.existsSync(p3)) {
        const b3 = generateSynthesizedWav(128, 8, 'hype');
        fs.writeFileSync(p3, b3);
        initialTracks[2].filesize = b3.length;
      } else {
        initialTracks[2].filesize = fs.statSync(p3).size;
      }
    } catch (err) {
      console.error('Failed to create sample wav files:', err.message);
    }

    const initial = { tracks: initialTracks, userLikes: {} };
    try { atomicWrite(dbFile, JSON.stringify(initial, null, 2)); } catch {}
    return initial;
  }

  function saveDb(data) {
    atomicWrite(dbFile, JSON.stringify(data, null, 2));
  }

  // Pre-seed on boot
  loadDb();

  function handleAudioStream(req, res, isHead = false) {
    const filename = path.basename(req.musicFilename || '');
    if (!filename || filename.startsWith('.')) {
      return json(res, 400, { error: 'invalid filename' });
    }

    const filePath = path.join(musicDir, filename);
    if (!fs.existsSync(filePath)) {
      return json(res, 404, { error: 'audio file not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const ext = path.extname(filename).toLowerCase();
    const mime = AUDIO_MIMES[ext] || 'audio/mpeg';

    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || start >= fileSize || (parts[1] && end >= fileSize) || start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
        return res.end();
      }

      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunksize),
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=604800, immutable'
      });

      if (isHead) return res.end();
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=604800, immutable'
      });

      if (isHead) return res.end();
      fs.createReadStream(filePath).pipe(res);
    }
  }

  return {
    // -------------------------------------------------------------
    // Public / Athlete Endpoints
    // -------------------------------------------------------------

    // GET /api/music — returns approved tracks and user's suggestions
    'GET /api/music': async (req, res) => {
      const user = readSession(req);
      const data = loadDb();
      const approved = (data.tracks || [])
        .filter(t => t.status === 'approved')
        .map(t => ({
          ...t,
          url: `/api/music/file/${encodeURIComponent(t.filename)}`,
          liked: user && data.userLikes?.[user.id]?.includes(t.id)
        }));

      const mySuggestions = user
        ? (data.tracks || [])
            .filter(t => t.suggestedBy?.id === user.id)
            .map(t => ({
              ...t,
              url: `/api/music/file/${encodeURIComponent(t.filename)}`
            }))
        : [];

      const totalPlays = approved.reduce((acc, t) => acc + (t.plays || 0), 0);

      json(res, 200, {
        ok: true,
        tracks: approved,
        mySuggestions,
        stats: {
          totalTracks: approved.length,
          totalPlays,
          myPendingCount: mySuggestions.filter(s => s.status === 'pending').length
        }
      });
    },

    // GET & HEAD /api/music/file/{filename} — streams audio with HTTP 206 Range support
    'GET /api/music/file/{filename}': async (req, res) => handleAudioStream(req, res, false),
    'HEAD /api/music/file/{filename}': async (req, res) => handleAudioStream(req, res, true),

    // POST /api/music/suggest — athlete suggests a track for coach review
    'POST /api/music/suggest': async (req, res) => {
      const user = readSession(req);
      if (!user) return json(res, 401, { error: 'not signed in' });

      try {
        const formData = await new Response(req, {
          headers: {
            'content-type': req.headers['content-type'] || '',
            'content-length': req.headers['content-length'] || ''
          }
        }).formData();

        const file = formData.get('file');
        const title = (formData.get('title') || '').toString().trim() || 'Untitled Track';
        const artist = (formData.get('artist') || '').toString().trim() || user.name || 'Unknown Artist';
        const category = (formData.get('category') || 'High Energy').toString().trim();
        const note = (formData.get('note') || '').toString().trim();
        const durationSec = Math.round(Number(formData.get('duration')) || 180);

        if (!file || typeof file.arrayBuffer !== 'function') {
          return json(res, 400, { error: 'Audio file is required' });
        }

        const originalName = file.name || 'track.mp3';
        const ext = path.extname(originalName).toLowerCase();
        if (!AUDIO_MIMES[ext]) {
          return json(res, 400, { error: `Unsupported audio format. Supported: ${Object.keys(AUDIO_MIMES).join(', ')}` });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        if (buffer.length > MAX_AUDIO_SIZE) {
          return json(res, 400, { error: 'Audio file exceeds 50MB limit' });
        }

        const trackId = 'trk_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
        const filename = `${trackId}${ext}`;
        const targetPath = path.join(musicDir, filename);

        fs.writeFileSync(targetPath, buffer);

        const newTrack = {
          id: trackId,
          title,
          artist,
          category,
          filename,
          filesize: buffer.length,
          mimeType: AUDIO_MIMES[ext] || 'audio/mpeg',
          duration: durationSec,
          status: 'pending', // Pending Coach review!
          suggestedBy: {
            id: user.id,
            name: user.name
          },
          athleteNote: note,
          createdAt: Date.now(),
          likes: 0,
          plays: 0
        };

        const data = loadDb();
        data.tracks = data.tracks || [];
        data.tracks.push(newTrack);
        saveDb(data);

        audit(req, 'music.suggest', { user, msg: `${title} by ${artist}` });

        json(res, 200, {
          ok: true,
          track: {
            ...newTrack,
            url: `/api/music/file/${encodeURIComponent(filename)}`
          },
          message: 'Track submitted for coach approval'
        });
      } catch (err) {
        console.error('Music suggestion error:', err);
        json(res, 500, { error: err.message || 'Failed to upload suggestion' });
      }
    },

    // POST /api/music/like — like / unlike track
    'POST /api/music/like': async (req, res) => {
      const user = readSession(req);
      if (!user) return json(res, 401, { error: 'not signed in' });

      let body;
      try {
        const text = await new Response(req).text();
        body = JSON.parse(text);
      } catch {
        return json(res, 400, { error: 'invalid json' });
      }

      const { id } = body;
      const data = loadDb();
      const track = (data.tracks || []).find(t => t.id === id);
      if (!track) return json(res, 404, { error: 'track not found' });

      data.userLikes = data.userLikes || {};
      data.userLikes[user.id] = data.userLikes[user.id] || [];

      const idx = data.userLikes[user.id].indexOf(id);
      let liked = false;
      if (idx >= 0) {
        data.userLikes[user.id].splice(idx, 1);
        track.likes = Math.max(0, (track.likes || 1) - 1);
      } else {
        data.userLikes[user.id].push(id);
        track.likes = (track.likes || 0) + 1;
        liked = true;
      }

      saveDb(data);
      json(res, 200, { ok: true, likes: track.likes, liked });
    },

    // POST /api/music/play — increment play counter
    'POST /api/music/play': async (req, res) => {
      let body;
      try {
        const text = await new Response(req).text();
        body = JSON.parse(text);
      } catch {
        return json(res, 400, { error: 'invalid json' });
      }

      const { id } = body;
      const data = loadDb();
      const track = (data.tracks || []).find(t => t.id === id);
      if (track) {
        track.plays = (track.plays || 0) + 1;
        saveDb(data);
      }
      json(res, 200, { ok: true, plays: track?.plays || 0 });
    },

    // -------------------------------------------------------------
    // Coach / Admin Management Endpoints
    // -------------------------------------------------------------

    // GET /api/admin/music — get all tracks including pending reviews
    'GET /api/admin/music': async (req, res) => {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const data = loadDb();
      const tracks = (data.tracks || []).map(t => ({
        ...t,
        url: `/api/music/file/${encodeURIComponent(t.filename)}`
      }));

      const pending = tracks.filter(t => t.status === 'pending');
      const approved = tracks.filter(t => t.status === 'approved');
      const rejected = tracks.filter(t => t.status === 'rejected');

      const storageBytes = tracks.reduce((acc, t) => acc + (t.filesize || 0), 0);
      const totalPlays = approved.reduce((acc, t) => acc + (t.plays || 0), 0);

      json(res, 200, {
        ok: true,
        pending,
        approved,
        rejected,
        stats: {
          totalTracks: tracks.length,
          pendingCount: pending.length,
          approvedCount: approved.length,
          rejectedCount: rejected.length,
          totalPlays,
          storageBytes
        }
      });
    },

    // POST /api/admin/music/upload — Coach directly uploads an approved gym track
    'POST /api/admin/music/upload': async (req, res) => {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      try {
        const formData = await new Response(req, {
          headers: {
            'content-type': req.headers['content-type'] || '',
            'content-length': req.headers['content-length'] || ''
          }
        }).formData();

        const file = formData.get('file');
        const title = (formData.get('title') || '').toString().trim() || 'Gym Track';
        const artist = (formData.get('artist') || '').toString().trim() || admin.name || 'Coach Selection';
        const category = (formData.get('category') || 'High Energy').toString().trim();
        const durationSec = Math.round(Number(formData.get('duration')) || 190);

        if (!file || typeof file.arrayBuffer !== 'function') {
          return json(res, 400, { error: 'Audio file is required' });
        }

        const originalName = file.name || 'track.mp3';
        const ext = path.extname(originalName).toLowerCase();
        if (!AUDIO_MIMES[ext]) {
          return json(res, 400, { error: `Unsupported audio format. Supported: ${Object.keys(AUDIO_MIMES).join(', ')}` });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        if (buffer.length > MAX_AUDIO_SIZE) {
          return json(res, 400, { error: 'Audio file exceeds 50MB limit' });
        }

        const trackId = 'trk_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
        const filename = `${trackId}${ext}`;
        const targetPath = path.join(musicDir, filename);

        fs.writeFileSync(targetPath, buffer);

        const newTrack = {
          id: trackId,
          title,
          artist,
          category,
          filename,
          filesize: buffer.length,
          mimeType: AUDIO_MIMES[ext] || 'audio/mpeg',
          duration: durationSec,
          status: 'approved', // Coach uploaded = automatically approved
          uploadedBy: {
            id: admin.id,
            name: admin.name,
            role: 'coach'
          },
          createdAt: Date.now(),
          approvedAt: Date.now(),
          likes: 0,
          plays: 0
        };

        const data = loadDb();
        data.tracks = data.tracks || [];
        data.tracks.unshift(newTrack);
        saveDb(data);

        audit(req, 'admin.music.upload', { user: admin, msg: `${title} (${category})` });

        json(res, 200, {
          ok: true,
          track: {
            ...newTrack,
            url: `/api/music/file/${encodeURIComponent(filename)}`
          }
        });
      } catch (err) {
        console.error('Coach music upload error:', err);
        json(res, 500, { error: err.message || 'Failed to upload audio' });
      }
    },

    // POST /api/admin/music/review — Coach approves or rejects athlete recommendation
    'POST /api/admin/music/review': async (req, res) => {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      let body;
      try {
        const text = await new Response(req).text();
        body = JSON.parse(text);
      } catch {
        return json(res, 400, { error: 'invalid json' });
      }

      const { id, action, title, artist, category } = body;
      if (!id || (action !== 'approve' && action !== 'reject')) {
        return json(res, 400, { error: 'id and valid action (approve/reject) required' });
      }

      const data = loadDb();
      const track = (data.tracks || []).find(t => t.id === id);
      if (!track) return json(res, 404, { error: 'track not found' });

      if (action === 'approve') {
        track.status = 'approved';
        track.approvedAt = Date.now();
        track.reviewedBy = { id: admin.id, name: admin.name };
        if (title) track.title = String(title).trim();
        if (artist) track.artist = String(artist).trim();
        if (category) track.category = String(category).trim();
        audit(req, 'admin.music.approve', { user: admin, msg: `${track.title} (suggested by ${track.suggestedBy?.name || 'user'})` });
      } else {
        track.status = 'rejected';
        track.rejectedAt = Date.now();
        track.reviewedBy = { id: admin.id, name: admin.name };
        audit(req, 'admin.music.reject', { user: admin, msg: `${track.title}` });
      }

      saveDb(data);
      json(res, 200, {
        ok: true,
        track: {
          ...track,
          url: `/api/music/file/${encodeURIComponent(track.filename)}`
        }
      });
    },

    // POST /api/admin/music/delete — Coach removes track & unlinks file
    'POST /api/admin/music/delete': async (req, res) => {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      let body;
      try {
        const text = await new Response(req).text();
        body = JSON.parse(text);
      } catch {
        return json(res, 400, { error: 'invalid json' });
      }

      const { id } = body;
      const data = loadDb();
      const idx = (data.tracks || []).findIndex(t => t.id === id);
      if (idx < 0) return json(res, 404, { error: 'track not found' });

      const track = data.tracks[idx];
      data.tracks.splice(idx, 1);

      // Clean up file from disk
      if (track.filename) {
        try {
          const filePath = path.join(musicDir, path.basename(track.filename));
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Failed to unlink audio file:', e.message);
        }
      }

      saveDb(data);
      audit(req, 'admin.music.delete', { user: admin, msg: track.title });
      json(res, 200, { ok: true, id });
    }
  };
}
