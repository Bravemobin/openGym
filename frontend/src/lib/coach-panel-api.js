import { api, appBase } from './api.js';

export async function getAthleteStatus() {
  return api('/api/athlete/status');
}

export async function uploadReceipt({ image, amount, note }) {
  return api('/api/athlete/receipt/upload', {
    method: 'POST',
    body: JSON.stringify({ image, amount, note })
  });
}

export async function getCoachAthletes() {
  return api('/api/coach/athletes');
}

export async function getCoachAthlete(id) {
  return api('/api/coach/athlete?id=' + encodeURIComponent(id));
}

export async function saveAthletePlan(athleteId, { assignedWorkout, assignedDiet }) {
  return api('/api/coach/athlete/plan', {
    method: 'POST',
    body: JSON.stringify({ athleteId, assignedWorkout, assignedDiet })
  });
}

export async function verifyReceipt(athleteId, { action, reason, days }) {
  return api('/api/coach/receipt/verify', {
    method: 'POST',
    body: JSON.stringify({ athleteId, action, reason, days })
  });
}

export async function updateCoachSubscription(athleteId, { status, days }) {
  return api('/api/coach/athlete/subscription', {
    method: 'POST',
    body: JSON.stringify({ athleteId, status, days })
  });
}

export async function getCoachPaymentSettings() {
  return api('/api/coach/payment-settings');
}

export async function saveCoachPaymentSettings(settings) {
  return api('/api/coach/payment-settings', {
    method: 'POST',
    body: JSON.stringify(settings)
  });
}

export async function coachLogin({ username, password }) {
  return api('/api/coach/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function coachRegister({ name, password, coachSecret }) {
  return api('/api/coach/register', {
    method: 'POST',
    body: JSON.stringify({ name, password, coachSecret })
  });
}

export function receiptImageUrl(filename) {
  if (!filename) return '';
  const base = appBase().replace(/\/$/, '');
  return `${base}/api/receipt/file?filename=${encodeURIComponent(filename)}`;
}
