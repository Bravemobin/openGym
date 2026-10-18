import test from 'node:test';
import assert from 'node:assert/strict';
import { dayReminderPush, restTimerPush, testPush } from '../push-messages.js';

test('localizes every server-generated notification in fa', () => {
  assert.deepEqual(restTimerPush('fa'), {
    title: 'استراحت تمام شد 💪',
    body: 'زمان ست بعدی شماست.',
    tag: 'rest-timer',
  });
  assert.deepEqual(testPush('fa'), {
    title: 'emadgym',
    body: 'نوتیفیکیشن تستی ✅ — اعلان‌ها به این صورت نمایش داده می‌شوند.',
    tag: 'test',
  });
  assert.deepEqual(dayReminderPush('fa', { name: 'تمرین الف', emoji: '💪' }), {
    title: '💪 تمرین الف امروز',
    body: 'در برنامه شماست — بریم برای تمرین 💪',
    tag: 'day-reminder',
  });
});

test('keeps the existing English copy as the fallback', () => {
  assert.deepEqual(restTimerPush('fr'), restTimerPush('en'));
  assert.equal(dayReminderPush('unknown', null).title, 'Workout planned today');
  assert.equal(testPush(undefined).body, 'Test notification ✅ — this is what alerts look like.');
});
