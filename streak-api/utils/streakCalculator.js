const { parseISO, differenceInCalendarDays } = require('date-fns');

function getLocalDateString(date, timeZone = 'UTC') {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d);
  } catch (err) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d);
  }
}

function evaluateStreak({
  nowUtc = new Date(),
  lastCompletedAtUtc,
  currentStreak = 0,
  longestStreak = 0,
  userTimezone = 'UTC',
}) {
  const todayLocalDateStr = getLocalDateString(nowUtc, userTimezone);

  if (!lastCompletedAtUtc) {
    const newStreak = 1;
    return {
      allowed: true,
      reason: 'First completion',
      differenceInDays: null,
      todayLocalDate: todayLocalDateStr,
      lastLocalDate: null,
      newStreak,
      newLongestStreak: Math.max(longestStreak, newStreak),
    };
  }

  const lastLocalDateStr = getLocalDateString(lastCompletedAtUtc, userTimezone);
  const diffDays = differenceInCalendarDays(
    parseISO(todayLocalDateStr),
    parseISO(lastLocalDateStr)
  );

  if (diffDays === 0) {
    return {
      allowed: false,
      reason: 'Task already completed today in local timezone',
      differenceInDays: 0,
      todayLocalDate: todayLocalDateStr,
      lastLocalDate: lastLocalDateStr,
      newStreak: currentStreak,
      newLongestStreak: longestStreak,
    };
  }

  if (diffDays === 1) {
    const newStreak = currentStreak + 1;
    return {
      allowed: true,
      reason: 'Consecutive day streak continuation',
      differenceInDays: 1,
      todayLocalDate: todayLocalDateStr,
      lastLocalDate: lastLocalDateStr,
      newStreak,
      newLongestStreak: Math.max(longestStreak, newStreak),
    };
  }

  const newStreak = 1;
  return {
    allowed: true,
    reason: `Streak broke after ${diffDays} days without completion; reset to 1`,
    differenceInDays: diffDays,
    todayLocalDate: todayLocalDateStr,
    lastLocalDate: lastLocalDateStr,
    newStreak,
    newLongestStreak: Math.max(longestStreak, newStreak),
  };
}

module.exports = {
  getLocalDateString,
  evaluateStreak,
};
