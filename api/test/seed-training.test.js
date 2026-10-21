import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoState } from '../../frontend/src/lib/demoSeed.js';

test('buildDemoState produces full workout dataset', () => {
  const state = buildDemoState(20260723);
  assert.ok(Array.isArray(state.workouts), 'workouts is an array');
  assert.ok(state.workouts.length >= 30, 'has at least 30 workouts across 12 weeks');
  assert.ok(Array.isArray(state.routines), 'routines is an array');
  assert.equal(state.routines.length, 3, 'has 3 starter routines');
  assert.ok(Array.isArray(state.bodyweight), 'has bodyweight weigh-ins');
  assert.ok(state.bodyweight.length >= 20, 'has regular weigh-ins');
  assert.equal(state.effort, 'rir');

  // Verify first workout shape
  const first = state.workouts[0];
  assert.ok(first.id, 'workout has id');
  assert.ok(first.d, 'workout has date');
  assert.ok(typeof first.start === 'number', 'workout has start timestamp');
  assert.ok(typeof first.end === 'number', 'workout has end timestamp');
  assert.ok(first.routineId, 'workout has routineId');
  assert.ok(first.name, 'workout has name');
  assert.ok(Array.isArray(first.entries), 'workout has entries');
  assert.ok(first.entries.length > 0, 'workout has exercise entries');
  assert.ok(typeof first.vol === 'number', 'workout has total volume');

  // Verify custom seed produces distinct variation
  const state2 = buildDemoState(999999);
  assert.ok(state2.workouts.length >= 30);
  assert.notEqual(state.workouts[0].id, state2.workouts[0].id);
});
