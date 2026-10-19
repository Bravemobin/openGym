import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Sniff image magic bytes to ensure valid JPG, PNG, or WebP
function sniffImage(buf) {
  if (!buf || buf.length < 8) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { mime: 'image/png', ext: 'png' };
  }
  // WebP: RIFF .... WEBP
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

export function athleteCoachRoutes({
  DATA,
  db,
  saveDb,
  readState,
  stateFile,
  atomicWrite,
  json,
  readBody,
  readSession,
  requireAdmin,
  isAdmin,
  getSubscription,
  publicUser,
  lastSyncOf,
  records,
  text,
  sessionCookie,
  hashPassword,
  verifyPassword,
  nameKey
}) {
  const RECEIPTS_DIR = path.join(DATA, 'receipts');
  try {
    if (!fs.existsSync(RECEIPTS_DIR)) {
      fs.mkdirSync(RECEIPTS_DIR, { recursive: true, mode: 0o700 });
    }
    // ponytail: fallback sample receipt for mock/demo view
    const sampleFile = path.join(RECEIPTS_DIR, 'rec_sample.jpg');
    if (!fs.existsSync(sampleFile)) {
      fs.writeFileSync(sampleFile, Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64'));
    }
  } catch (e) {
    console.error('Failed to create receipts directory:', e.message);
  }

  return {
    /* -------------------- ATHLETE ROUTES -------------------- */

    // Status: subscription info, expiration, and coach bank details
    'GET /api/athlete/status': async (req, res) => {
      const user = readSession(req);
      if (!user) return json(res, 401, { error: 'not signed in' });
      const sub = getSubscription(user);
      json(res, 200, {
        user: publicUser(user),
        subscription: sub,
        coachSettings: db.coachSettings || {
          cardNumber: '',
          cardHolder: '',
          bankName: '',
          monthlyFee: 500000,
          description: ''
        }
      });
    },

    // Upload tuition payment receipt
    'POST /api/athlete/receipt/upload': async (req, res) => {
      const user = readSession(req);
      if (!user) return json(res, 401, { error: 'not signed in' });
      const body = await readBody(req);
      let raw = text(body.image).trim();
      if (!raw) return json(res, 400, { error: 'تصویر رسید ارسال نشده است' });

      // Strip data:image/...;base64, if present
      const m = /^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/.exec(raw);
      if (m) raw = m[1];

      let buf;
      try {
        buf = Buffer.from(raw, 'base64');
      } catch {
        return json(res, 400, { error: 'فرمت داده‌های تصویر نامعتبر است' });
      }

      if (buf.length === 0) return json(res, 400, { error: 'فایل تصویر خالی است' });
      if (buf.length > 5 * 1024 * 1024) return json(res, 400, { error: 'حجم تصویر نباید بیشتر از ۵ مگابایت باشد' });

      const sniffed = sniffImage(buf);
      if (!sniffed) {
        return json(res, 400, { error: 'فرمت تصویر باید JPG یا PNG یا WebP باشد' });
      }

      const receiptId = 'rec_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      const filename = `${receiptId}.${sniffed.ext}`;
      const filePath = path.join(RECEIPTS_DIR, filename);

      try {
        fs.writeFileSync(filePath, buf, { mode: 0o600 });
      } catch (err) {
        return json(res, 500, { error: 'خطا در ذخیره‌سازی تصویر رسید' });
      }

      const target = db.users.find(u => u.id === user.id) || user;
      const sub = {
        status: 'pending',
        expiresAt: null,
        rejectReason: null,
        lastReceipt: {
          id: receiptId,
          filename,
          mime: sniffed.mime,
          amount: Number(body.amount) || db.coachSettings?.monthlyFee || 0,
          note: text(body.note).slice(0, 300),
          uploadedAt: new Date().toISOString()
        }
      };
      target.subscription = sub;
      try { saveDb(); } catch (err) { console.error('saveDb error:', err); }

      json(res, 200, { ok: true, subscription: sub });
    },

    // View receipt file (accessible by admin/coach or the athlete who owns it)
    'GET /api/receipt/file': async (req, res) => {
      const user = readSession(req);
      if (!user) return json(res, 401, { error: 'not signed in' });
      let url;
      try { url = new URL(req.url, 'http://x'); } catch { return json(res, 400, { error: 'bad url' }); }
      const filename = path.basename(text(url.searchParams.get('filename') || url.searchParams.get('id')));
      if (!filename || !/^[a-zA-Z0-9_.-]+$/.test(filename)) {
        return json(res, 400, { error: 'نام فایل نامعتبر است' });
      }

      const isOwner = (user.subscription?.lastReceipt?.filename === filename) ||
        (db.users.find(u => u.id === user.id)?.subscription?.lastReceipt?.filename === filename);
      if (!isAdmin(user) && !isOwner) {
        return json(res, 403, { error: 'دسترسی غیرمجاز' });
      }

      const filePath = path.join(RECEIPTS_DIR, filename);
      if (!fs.existsSync(filePath)) return json(res, 404, { error: 'تصویر رسید یافت نشد' });

      const ext = path.extname(filename).toLowerCase().replace('.', '');
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': 'private, max-age=86400'
      });
      fs.createReadStream(filePath).pipe(res);
    },

    /* -------------------- COACH AUTH & LOGIN ROUTES -------------------- */

    // Coach login with username/email and password
    'POST /api/coach/login': async (req, res) => {
      const body = await readBody(req);
      const username = text(body.username || body.name).trim();
      const password = typeof body.password === 'string' ? body.password : '';

      if (!username || !password) {
        return json(res, 400, { error: 'نام کاربری و رمز عبور الزامی است' });
      }

      // Find user by name or email
      const u = db.users.find(x =>
        (nameKey ? nameKey(x.name) === nameKey(username) : x.name.toLowerCase() === username.toLowerCase()) ||
        (x.email && x.email.toLowerCase() === username.toLowerCase())
      );

      // If no admin or coach exists at all in the database yet, auto-create the initial coach!
      const anyCoach = db.users.some(x => isAdmin(x));
      if (!anyCoach && !u) {
        if (password.length < 6) {
          return json(res, 400, { error: 'رمز عبور مربی باید حداقل ۶ کاراکتر باشد' });
        }
        const created = new Date().toISOString();
        const h = hashPassword ? await hashPassword(password) : password;
        const newCoach = {
          id: crypto.randomBytes(12).toString('base64url'),
          name: username,
          admin: true,
          role: 'coach',
          created,
          pw: { h, set: created }
        };
        db.users.push(newCoach);
        saveDb();
        return json(res, 200, {
          ok: true,
          user: publicUser(newCoach),
          isInitialSetup: true
        }, { 'Set-Cookie': sessionCookie(newCoach) });
      }

      if (!u) {
        return json(res, 401, { error: 'کاربری با این مشخصات یافت نشد' });
      }

      // Check if user is an admin or coach
      if (!isAdmin(u)) {
        return json(res, 403, { error: 'این حساب دسترسی مربی یا مدیریت ندارد' });
      }

      // Check password
      if (!u.pw || !u.pw.h) {
        return json(res, 401, { error: 'برای این حساب رمز عبور تنظیم نشده است' });
      }

      let matches = false;
      try {
        if (verifyPassword) {
          matches = await verifyPassword(password, u.pw.h);
        } else {
          matches = password === u.pw.h;
        }
      } catch (err) {
        return json(res, 500, { error: 'خطا در بررسی رمز عبور' });
      }

      if (!matches) {
        return json(res, 401, { error: 'رمز عبور اشتباه است' });
      }

      return json(res, 200, {
        ok: true,
        user: publicUser(u)
      }, { 'Set-Cookie': sessionCookie(u) });
    },

    // Register a new coach
    'POST /api/coach/register': async (req, res) => {
      const body = await readBody(req);
      const name = text(body.name).trim();
      const password = typeof body.password === 'string' ? body.password : '';
      const coachSecret = text(body.coachSecret || body.secretCode).trim();

      if (!name || !password) {
        return json(res, 400, { error: 'نام و رمز عبور الزامی است' });
      }
      if (password.length < 6) {
        return json(res, 400, { error: 'رمز عبور مربی باید حداقل ۶ کاراکتر باشد' });
      }

      const anyCoach = db.users.some(x => isAdmin(x));
      const expectedSecret = process.env.COACH_KEY || 'emadcoach';
      if (anyCoach && coachSecret !== expectedSecret) {
        return json(res, 403, { error: 'کد امنیتی مربی صحیح نیست' });
      }

      if (db.users.some(x => (nameKey ? nameKey(x.name) === nameKey(name) : x.name.toLowerCase() === name.toLowerCase()))) {
        return json(res, 400, { error: 'این نام کاربری قبلاً استفاده شده است' });
      }

      const created = new Date().toISOString();
      const h = hashPassword ? await hashPassword(password) : password;
      const coachUser = {
        id: crypto.randomBytes(12).toString('base64url'),
        name,
        admin: true,
        role: 'coach',
        created,
        pw: { h, set: created }
      };
      db.users.push(coachUser);
      saveDb();

      return json(res, 200, {
        ok: true,
        user: publicUser(coachUser)
      }, { 'Set-Cookie': sessionCookie(coachUser) });
    },

    /* -------------------- COACH (ADMIN) ROUTES -------------------- */

    // Create a new athlete account by coach
    'POST /api/coach/athlete/create': async (req, res) => {
      if (!requireAdmin(req, res)) return;
      const body = await readBody(req);
      const name = text(body.name).trim();
      const password = typeof body.password === 'string' ? body.password : '';
      const days = Math.max(1, Number(body.days) || 30);
      const status = body.status === 'unpaid' ? 'unpaid' : 'active';
      const email = text(body.email).trim().toLowerCase();

      if (!name) {
        return json(res, 400, { error: 'نام شاگرد الزامی است' });
      }
      if (!password || password.length < 4) {
        return json(res, 400, { error: 'رمز عبور باید حداقل ۴ کاراکتر باشد' });
      }

      const isTaken = db.users.some(u => {
        const nMatch = nameKey ? nameKey(u.name) === nameKey(name) : u.name.toLowerCase() === name.toLowerCase();
        const eMatch = email && u.email && u.email.toLowerCase() === email;
        return nMatch || eMatch;
      });
      if (isTaken) {
        return json(res, 400, { error: 'کاربری با این نام یا ایمیل قبلاً ثبت شده است' });
      }

      const id = crypto.randomBytes(12).toString('base64url');
      const created = new Date().toISOString();
      const h = hashPassword ? await hashPassword(password) : password;

      const sub = {
        status,
        expiresAt: status === 'active' ? (Date.now() + days * 24 * 3600 * 1000) : null,
        rejectReason: null,
        approvedAt: status === 'active' ? created : null
      };

      const athleteUser = {
        id,
        name,
        role: 'athlete',
        created,
        pw: { h, set: created },
        ...(email ? { email } : {}),
        subscription: sub
      };

      db.users.push(athleteUser);
      saveDb();

      // ponytail: initial state minimal seed so sync won't hit an uninitialized file; full profile expands on first sync
      try {
        const S = {
          _ts: Date.now(),
          _rev: 1,
          subscription: sub,
          locked: status !== 'active',
          routines: [],
          workouts: [],
          bodyweight: [],
          assignedWorkout: { routines: [], week: {} },
          assignedDiet: { meals: [], notes: '' }
        };
        atomicWrite(stateFile(id), JSON.stringify(S, null, 2));
      } catch (err) {
        console.error('Error creating athlete state:', err);
      }

      json(res, 200, {
        ok: true,
        athlete: {
          id: athleteUser.id,
          name: athleteUser.name,
          created: athleteUser.created,
          subscription: athleteUser.subscription,
          hasAssignedWorkout: false,
          hasAssignedDiet: false
        }
      });
    },

    // List all athletes and their subscription/plan summary
    'GET /api/coach/athletes': async (req, res) => {
      if (!requireAdmin(req, res)) return;
      const athletes = db.users.filter(u => !isAdmin(u)).map(u => {
        const S = readState(u.id) || {};
        const sub = getSubscription(u);
        return {
          id: u.id,
          name: u.name,
          created: u.created || null,
          disabled: !!u.disabled,
          lastSync: lastSyncOf(u, S),
          subscription: sub,
          hasAssignedWorkout: !!(S.assignedWorkout && Array.isArray(S.assignedWorkout.routines) && S.assignedWorkout.routines.length > 0),
          hasAssignedDiet: !!(S.assignedDiet && Array.isArray(S.assignedDiet.meals) && S.assignedDiet.meals.length > 0)
        };
      });
      json(res, 200, {
        athletes,
        coachSettings: db.coachSettings || {
          cardNumber: '',
          cardHolder: '',
          bankName: '',
          monthlyFee: 500000,
          description: ''
        }
      });
    },

    // Detailed view of an athlete
    'GET /api/coach/athlete': async (req, res) => {
      if (!requireAdmin(req, res)) return;
      let url;
      try { url = new URL(req.url, 'http://x'); } catch { return json(res, 400, { error: 'bad url' }); }
      const id = url.searchParams.get('id');
      const u = db.users.find(x => x.id === id);
      if (!u) return json(res, 404, { error: 'ورزشکار یافت نشد' });
      const S = readState(u.id) || {};
      const sub = getSubscription(u);
      json(res, 200, {
        athlete: {
          id: u.id,
          name: u.name,
          created: u.created || null,
          disabled: !!u.disabled,
          subscription: sub
        },
        assignedWorkout: S.assignedWorkout || { routines: [], week: {} },
        assignedDiet: S.assignedDiet || { meals: [], notes: '' },
        bodyweight: records(S.bodyweight),
        workoutsCount: records(S.workouts).length
      });
    },

    // Save workout & diet plan for an athlete
    'POST /api/coach/athlete/plan': async (req, res) => {
      if (!requireAdmin(req, res)) return;
      const body = await readBody(req);
      const athleteId = text(body.athleteId);
      const u = db.users.find(x => x.id === athleteId);
      if (!u) return json(res, 404, { error: 'ورزشکار یافت نشد' });

      let S = readState(u.id) || {};
      if (body.assignedWorkout !== undefined) {
        S.assignedWorkout = body.assignedWorkout;
        if (Array.isArray(body.assignedWorkout.routines)) {
          S.routines = body.assignedWorkout.routines;
        }
        if (body.assignedWorkout.week) {
          S.week = body.assignedWorkout.week;
        }
      }
      if (body.assignedDiet !== undefined) {
        S.assignedDiet = body.assignedDiet;
      }
      S._ts = Date.now();
      S._rev = (S._rev || 0) + 1;
      atomicWrite(stateFile(u.id), JSON.stringify(S, null, 2));

      json(res, 200, {
        ok: true,
        assignedWorkout: S.assignedWorkout,
        assignedDiet: S.assignedDiet
      });
    },

    // Verify (Approve/Reject) a receipt
    'POST /api/coach/receipt/verify': async (req, res) => {
      if (!requireAdmin(req, res)) return;
      const body = await readBody(req);
      const athleteId = text(body.athleteId);
      const target = db.users.find(u => u.id === athleteId);
      if (!target) return json(res, 404, { error: 'ورزشکار یافت نشد' });

      const action = body.action; // 'approve' | 'reject'
      target.subscription = target.subscription || {};

      if (action === 'approve') {
        const days = Math.max(1, Number(body.days) || 30);
        const expiresAt = Date.now() + days * 24 * 3600 * 1000;
        target.subscription.status = 'active';
        target.subscription.expiresAt = expiresAt;
        target.subscription.rejectReason = null;
        target.subscription.approvedAt = new Date().toISOString();
        saveDb();

        try {
          let S = readState(target.id) || {};
          S.subscription = target.subscription;
          S.locked = false;
          S._rev = (S._rev || 0) + 1;
          S._ts = Date.now();
          atomicWrite(stateFile(target.id), JSON.stringify(S, null, 2));
        } catch (err) {
          console.error('Error syncing state on receipt approval:', err);
        }

        return json(res, 200, { ok: true, subscription: target.subscription });
      }

      if (action === 'reject') {
        target.subscription.status = 'rejected';
        target.subscription.rejectReason = text(body.reason || 'فیش نامعتبر است یا مبلغ واریزی کسری دارد').slice(0, 300);
        saveDb();

        try {
          let S = readState(target.id) || {};
          S.subscription = target.subscription;
          S.locked = true;
          S._rev = (S._rev || 0) + 1;
          S._ts = Date.now();
          atomicWrite(stateFile(target.id), JSON.stringify(S, null, 2));
        } catch (err) {
          console.error('Error syncing state on receipt rejection:', err);
        }

        return json(res, 200, { ok: true, subscription: target.subscription });
      }

      return json(res, 400, { error: 'عملیات نامعتبر است' });
    },

    // Manual subscription override by coach (e.g. cash payment)
    'POST /api/coach/athlete/subscription': async (req, res) => {
      if (!requireAdmin(req, res)) return;
      const body = await readBody(req);
      const athleteId = text(body.athleteId);
      const target = db.users.find(u => u.id === athleteId);
      if (!target) return json(res, 404, { error: 'ورزشکار یافت نشد' });

      const days = Math.max(1, Number(body.days) || 30);
      const status = body.status === 'unpaid' ? 'unpaid' : 'active';
      target.subscription = target.subscription || {};
      target.subscription.status = status;
      target.subscription.expiresAt = status === 'active' ? (Date.now() + days * 24 * 3600 * 1000) : null;
      target.subscription.rejectReason = null;
      saveDb();

      try {
        let S = readState(target.id) || {};
        S.subscription = target.subscription;
        S.locked = (status !== 'active');
        S._rev = (S._rev || 0) + 1;
        S._ts = Date.now();
        atomicWrite(stateFile(target.id), JSON.stringify(S, null, 2));
      } catch (err) {
        console.error('Error syncing state on subscription change:', err);
      }

      json(res, 200, { ok: true, subscription: target.subscription });
    },

    // Get coach payment settings
    'GET /api/coach/payment-settings': async (req, res) => {
      if (!requireAdmin(req, res)) return;
      json(res, 200, {
        coachSettings: db.coachSettings || {
          cardNumber: '',
          cardHolder: '',
          bankName: '',
          monthlyFee: 500000,
          description: ''
        }
      });
    },

    // Update coach payment settings
    'POST /api/coach/payment-settings': async (req, res) => {
      if (!requireAdmin(req, res)) return;
      const body = await readBody(req);
      db.coachSettings = {
        cardNumber: text(body.cardNumber).slice(0, 30),
        cardHolder: text(body.cardHolder).slice(0, 60),
        bankName: text(body.bankName).slice(0, 40),
        monthlyFee: Math.max(0, Number(body.monthlyFee) || 0),
        description: text(body.description).slice(0, 300)
      };
      saveDb();
      json(res, 200, { ok: true, coachSettings: db.coachSettings });
    }
  };
}
