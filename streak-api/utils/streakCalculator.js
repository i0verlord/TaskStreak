const { parseISO, differenceInCalendarDays } = require('date-fns');

/**
 * Returns YYYY-MM-DD string for a given Date/UTC string in the user's IANA timezone.
 * Uses native Intl.DateTimeFormat for accuracy across all standard timezones.
 * @param {Date|string} date
 * @param {string} timeZone e.g., 'Asia/Calcutta', 'America/New_York', 'UTC'
 * @returns {string} 'YYYY-MM-DD'
 */
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
    // Fallback to UTC if timezone is invalid
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d);
  }
}

/**
 * Evaluates the new streak count when a user marks a task as Done.
 * 
 * @param {Object} options
 * @param {Date|string} options.nowUtc Current UTC time
 * @param {Date|string|null} options.lastCompletedAtUtc UTC timestamp of the most recent log
 * @param {number} options.currentStreak Current streak count of the task
 * @param {number} options.longestStreak Longest streak count recorded for the task
 * @param {string} options.userTimezone User's IANA timezone
 * @param {number} options.streakFreezesAvailable Number of streak freezes user currently has
 * @returns {Object} Result { allowed: boolean, reason?: string, newStreak: number, newLongestStreak: number, usedFreeze: boolean, remainingFreezes: number }
 */
function evaluateStreak({
  nowUtc = new Date(),
  lastCompletedAtUtc,
  currentStreak = 0,
  longestStreak = 0,
  userTimezone = 'UTC',
  streakFreezesAvailable = 0,
}) {
  const todayLocalDateStr = getLocalDateString(nowUtc, userTimezone);

  // If no prior logs, this is day 1
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
      usedFreeze: false,
      remainingFreezes: streakFreezesAvailable,
    };
  }

  const lastLocalDateStr = getLocalDateString(lastCompletedAtUtc, userTimezone);
  const diffDays = differenceInCalendarDays(
    parseISO(todayLocalDateStr),
    parseISO(lastLocalDateStr)
  );

  // Difference = 0: Same day in local timezone -> Action locked
  if (diffDays === 0) {
    return {
      allowed: false,
      reason: 'Task already completed today in local timezone',
      differenceInDays: 0,
      todayLocalDate: todayLocalDateStr,
      lastLocalDate: lastLocalDateStr,
      newStreak: currentStreak,
      newLongestStreak: longestStreak,
      usedFreeze: false,
      remainingFreezes: streakFreezesAvailable,
    };
  }

  // Difference = 1: Yesterday -> Valid streak continuation
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
      usedFreeze: false,
      remainingFreezes: streakFreezesAvailable,
    };
  }

  // Difference = 2: Missed exactly one day. Check if user has a streak freeze.
  if (diffDays === 2 && streakFreezesAvailable > 0) {
    const newStreak = currentStreak + 1;
    return {
      allowed: true,
      reason: 'Streak freeze saved the streak after 1 missed day',
      differenceInDays: diffDays,
      todayLocalDate: todayLocalDateStr,
      lastLocalDate: lastLocalDateStr,
      newStreak,
      newLongestStreak: Math.max(longestStreak, newStreak),
      usedFreeze: true,
      remainingFreezes: streakFreezesAvailable - 1,
    };
  }

  // Difference > 1 (and no freeze applied): Streak broke, resets to 1
  const newStreak = 1;
  return {
    allowed: true,
    reason: `Streak broke after ${diffDays} days without completion; reset to 1`,
    differenceInDays: diffDays,
    todayLocalDate: todayLocalDateStr,
    lastLocalDate: lastLocalDateStr,
    newStreak,
    newLongestStreak: Math.max(longestStreak, newStreak),
    usedFreeze: false,
    remainingFreezes: streakFreezesAvailable,
  };
}

module.exports = {
  getLocalDateString,
  evaluateStreak,
};
