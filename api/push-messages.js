const COPY = {
  en: {
    restTitle: 'Rest over 💪',
    restBody: 'Time for your next set.',
    testBody: 'Test notification ✅ — this is what alerts look like.',
    dayFallbackTitle: 'Workout planned today',
    dayRoutineSuffix: 'today',
    dayBody: "It's on your plan — let's go 💪",
  },
  fa: {
    restTitle: 'استراحت تمام شد 💪',
    restBody: 'زمان ست بعدی شماست.',
    testBody: 'نوتیفیکیشن تستی ✅ — اعلان‌ها به این صورت نمایش داده می‌شوند.',
    dayFallbackTitle: 'تمرین برنامه‌ریزی شده برای امروز',
    dayRoutineSuffix: 'امروز',
    dayBody: 'در برنامه شماست — بریم برای تمرین 💪',
  },
};

const copyFor = lang => COPY[lang] || COPY.en;

export function restTimerPush(lang) {
  const copy = copyFor(lang);
  return { title: copy.restTitle, body: copy.restBody, tag: 'rest-timer' };
}

export function testPush(lang) {
  return { title: 'emadgym', body: copyFor(lang).testBody, tag: 'test' };
}

export function dayReminderPush(lang, routine) {
  const copy = copyFor(lang);
  return {
    title: routine
      ? `${routine.emoji || '🏋️'} ${routine.name} ${copy.dayRoutineSuffix}`
      : copy.dayFallbackTitle,
    body: copy.dayBody,
    tag: 'day-reminder',
  };
}
