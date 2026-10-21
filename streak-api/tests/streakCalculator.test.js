const assert = require('assert');
const { getLocalDateString, evaluateStreak } = require('../utils/streakCalculator');

console.log('🧪 Running Streak Calculator Engine Verification Tests...\n');

{
  const utcDate = new Date('2026-10-07T01:00:00.000Z');
  
  const calcuttaDate = getLocalDateString(utcDate, 'Asia/Calcutta');
  const nyDate = getLocalDateString(utcDate, 'America/New_York');

  assert.strictEqual(calcuttaDate, '2026-10-07', 'Should be Oct 7 in Calcutta');
  assert.strictEqual(nyDate, '2026-10-06', 'Should still be Oct 6 in New York');
  console.log('✓ Timezone boundary conversion verified (Calcutta: Oct 7, New York: Oct 6)');
}

{
  const result = evaluateStreak({
    nowUtc: new Date('2026-10-07T12:00:00Z'),
    lastCompletedAtUtc: null,
    currentStreak: 0,
    longestStreak: 0,
    userTimezone: 'Asia/Calcutta',
  });

  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.newStreak, 1);
  assert.strictEqual(result.newLongestStreak, 1);
  console.log('✓ First task completion initializes streak to 1');
}

{
  const result = evaluateStreak({
    nowUtc: new Date('2026-10-07T18:00:00Z'),
    lastCompletedAtUtc: new Date('2026-10-07T08:00:00Z'),
    currentStreak: 5,
    longestStreak: 5,
    userTimezone: 'Asia/Calcutta',
  });

  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.newStreak, 5);
  console.log('✓ Same-day click blocked: button locked for today');
}

{
  const result = evaluateStreak({
    nowUtc: new Date('2026-10-07T10:00:00Z'),
    lastCompletedAtUtc: new Date('2026-10-06T15:00:00Z'),
    currentStreak: 14,
    longestStreak: 14,
    userTimezone: 'Asia/Calcutta',
  });

  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.newStreak, 15);
  assert.strictEqual(result.newLongestStreak, 15);
  console.log('✓ Consecutive day completion increments streak from 14 to 15');
}

{
  const result = evaluateStreak({
    nowUtc: new Date('2026-10-07T10:00:00Z'),
    lastCompletedAtUtc: new Date('2026-10-05T10:00:00Z'),
    currentStreak: 10,
    longestStreak: 10,
    userTimezone: 'Asia/Calcutta',
  });

  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.newStreak, 1);
  assert.strictEqual(result.newLongestStreak, 10);
  console.log('✓ Missed day resets streak to 1 while preserving longest streak (10)');
}

console.log('\n🎉 All Streak Engine Unit Tests Passed Successfully!\n');
