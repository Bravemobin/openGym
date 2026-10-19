import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDemoState } from '../frontend/src/lib/demoSeed.js';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data');
const uid = process.env.SEED_USER || 'ath-mohammad';
const file = path.join(dir, `state-${uid}.json`);
if (!fs.existsSync(file)) throw new Error(`Profile state not found for ${uid}`);

const state = JSON.parse(fs.readFileSync(file, 'utf8'));
const marker = 'openGymDemoSeedV1';
if (state[marker]) {
  console.log(`Training seed already present for ${uid}; leaving it unchanged.`);
} else {
  const demo = buildDemoState();
  for (const key of ['routines', 'week', 'dayPlan', 'workouts', 'bodyweight', 'exWeights', 'targetW', 'effort']) {
    state[key] = demo[key];
  }
  state[marker] = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(state, null, 2) + '\n');
  console.log(`Seeded ${uid}: ${demo.routines.length} routines, ${demo.workouts.length} workouts, ${demo.bodyweight.length} weigh-ins.`);
}
