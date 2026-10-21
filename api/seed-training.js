import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDemoState } from '../frontend/src/lib/demoSeed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, '../data');

export function seedTraining({ force = true, targetUid = null } = {}) {
  const dbFile = path.join(dir, 'db.json');
  let uids = [];

  if (targetUid) {
    uids = [targetUid];
  } else if (fs.existsSync(dbFile)) {
    try {
      const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      uids = (db.users || []).map(u => u.id);
    } catch {
      uids = [];
    }
  }

  // Also include any other state-ath-*.json files found in data/
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const m = f.match(/^state-(ath-[^.]+)\.json$/);
      if (m && !uids.includes(m[1])) {
        uids.push(m[1]);
      }
    }
  } catch {}

  if (uids.length === 0) {
    uids = ['ath-mohammad'];
  }

  const marker = 'openGymDemoSeedV1';

  for (let i = 0; i < uids.length; i++) {
    const uid = uids[i];
    const file = path.join(dir, `state-${uid}.json`);
    if (!fs.existsSync(file)) {
      console.log(`Skipping ${uid}: state file does not exist.`);
      continue;
    }

    let state;
    try {
      state = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      console.error(`Error parsing state for ${uid}:`, err.message);
      continue;
    }

    if (!force && state[marker] && Array.isArray(state.workouts) && state.workouts.length >= 10) {
      console.log(`Training seed already present for ${uid} (${state.workouts.length} workouts); skipping.`);
      continue;
    }

    const demo = buildDemoState(20260723 + i * 1013);
    for (const key of ['routines', 'week', 'dayPlan', 'workouts', 'bodyweight', 'exWeights', 'targetW', 'effort']) {
      state[key] = demo[key];
    }
    state.assignedWorkout = {
      routines: demo.routines,
      week: demo.week
    };
    state[marker] = new Date().toISOString();

    fs.writeFileSync(file, JSON.stringify(state, null, 2) + '\n');
    console.log(`Seeded ${uid}: ${demo.routines.length} routines, ${demo.workouts.length} workouts, ${demo.bodyweight.length} weigh-ins.`);
  }
}

seedTraining({
  force: process.env.FORCE === '1' || process.argv.includes('--force') || !process.env.SEED_USER,
  targetUid: process.env.SEED_USER || null
});
