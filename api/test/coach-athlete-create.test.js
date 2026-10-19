import { test } from 'node:test';
import assert from 'node:assert/strict';
import { athleteCoachRoutes } from '../athlete-coach.js';

test('coach athlete creation endpoint validation and flow', async () => {
  let savedDb = false;
  let writtenState = null;

  const db = {
    users: [
      { id: 'coach_1', name: 'Master Coach', admin: true, role: 'coach' },
      { id: 'athlete_old', name: 'Existing Athlete', role: 'athlete' }
    ],
    coachSettings: { monthlyFee: 500000 }
  };

  const dummyDataDir = '.';
  let jsonResponse = null;

  const mockJson = (res, status, data) => {
    jsonResponse = { status, data };
    return jsonResponse;
  };

  const routes = athleteCoachRoutes({
    DATA: dummyDataDir,
    db,
    saveDb: () => { savedDb = true; },
    readState: () => ({}),
    stateFile: (id) => `state-${id}.json`,
    atomicWrite: (filePath, content) => { writtenState = { filePath, content }; },
    json: mockJson,
    readBody: async (req) => req.body,
    readSession: () => db.users[0],
    requireAdmin: (req, res) => {
      if (!req.isAdmin) {
        mockJson(res, 403, { error: 'forbidden' });
        return false;
      }
      return true;
    },
    isAdmin: (u) => !!u.admin,
    getSubscription: (u) => u.subscription || { status: 'none' },
    publicUser: (u) => ({ id: u.id, name: u.name }),
    lastSyncOf: () => null,
    records: (r) => r || [],
    text: (s) => (typeof s === 'string' ? s : ''),
    sessionCookie: () => 'gymsid=test',
    hashPassword: async (p) => `hashed_${p}`,
    verifyPassword: async () => true,
    nameKey: (n) => String(n).trim().toLowerCase()
  });

  const createHandler = routes['POST /api/coach/athlete/create'];
  assert.ok(typeof createHandler === 'function', 'create handler must exist');

  // 1. Non-admin is rejected
  await createHandler({ isAdmin: false, body: { name: 'New Guy', password: 'secret123' } }, {});
  assert.equal(jsonResponse.status, 403);

  // 2. Missing name is rejected
  await createHandler({ isAdmin: true, body: { name: ' ', password: 'secret123' } }, {});
  assert.equal(jsonResponse.status, 400);
  assert.match(jsonResponse.data.error, /نام شاگرد/);

  // 3. Short password (< 4 chars) is rejected
  await createHandler({ isAdmin: true, body: { name: 'Ali', password: '12' } }, {});
  assert.equal(jsonResponse.status, 400);
  assert.match(jsonResponse.data.error, /رمز عبور/);

  // 4. Duplicate athlete name is rejected
  await createHandler({ isAdmin: true, body: { name: 'Existing Athlete', password: 'secret123' } }, {});
  assert.equal(jsonResponse.status, 400);
  assert.match(jsonResponse.data.error, /قبلاً ثبت شده/);

  // 5. Successful creation
  savedDb = false;
  writtenState = null;
  await createHandler({
    isAdmin: true,
    body: {
      name: 'Reza Tehrani',
      password: 'password99',
      days: 45,
      status: 'active'
    }
  }, {});

  assert.equal(jsonResponse.status, 200);
  assert.equal(jsonResponse.data.ok, true);
  assert.equal(jsonResponse.data.athlete.name, 'Reza Tehrani');
  assert.equal(jsonResponse.data.athlete.subscription.status, 'active');
  assert.ok(savedDb, 'Database must be saved');
  assert.ok(writtenState, 'Athlete state file must be initialized');

  // Verify created user in db
  const createdInDb = db.users.find((u) => u.name === 'Reza Tehrani');
  assert.ok(createdInDb, 'User must exist in db.users');
  assert.equal(createdInDb.pw.h, 'hashed_password99');
  assert.equal(createdInDb.role, 'athlete');
  assert.equal(createdInDb.subscription.status, 'active');
});
