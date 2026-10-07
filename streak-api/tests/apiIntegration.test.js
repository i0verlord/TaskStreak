const assert = require('assert');
const app = require('../server');

async function runIntegrationTests() {
  console.log('🚀 Running TaskStreak API Phase 1 Integration Tests...\n');

  // Start server on a dedicated test port
  const server = app.listen(5099);
  const BASE_URL = 'http://localhost:5099';

  try {
    // 1. GET /health
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'ok');
    console.log('✓ [GET /health] Server is responsive and healthy.');

    // 2. GET /api/tasks?userId=1
    const tasksRes = await fetch(`${BASE_URL}/api/tasks?userId=1`);
    assert.strictEqual(tasksRes.status, 200);
    const tasksData = await tasksRes.json();
    assert.ok(Array.isArray(tasksData.tasks), 'tasks should be an array');
    const task1 = tasksData.tasks.find((t) => t.id === 1);
    assert.ok(task1, 'Task 1 must exist');
    console.log(`✓ [GET /api/tasks] Fetched ${tasksData.tasks.length} tasks. Task 1 streak: ${task1.current_streak}`);

    // 3. POST /api/tasks/1/log (Click "Done" today)
    console.log('\n--- Test Scenario A: Click Done today (Valid continuation) ---');
    const doneRes1 = await fetch(`${BASE_URL}/api/tasks/1/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const doneData1 = await doneRes1.json();
    assert.strictEqual(doneRes1.status, 200);
    assert.strictEqual(doneData1.success, true);
    assert.strictEqual(doneData1.task.completed_today, true);
    assert.strictEqual(doneData1.task.is_locked, true);
    console.log(`✓ [POST /api/tasks/1/log] Succeeded: ${doneData1.message} (Streak: ${doneData1.task.current_streak})`);

    // 4. POST /api/tasks/1/log again today (MUST BLOCK)
    console.log('\n--- Test Scenario B: Click Done again on SAME day (MUST BLOCK) ---');
    const doneRes2 = await fetch(`${BASE_URL}/api/tasks/1/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const doneData2 = await doneRes2.json();
    assert.strictEqual(doneRes2.status, 400);
    assert.strictEqual(doneData2.success, false);
    assert.match(doneData2.error, /already completed today/i);
    console.log(`✓ [POST /api/tasks/1/log] Successfully BLOCKED with 400 Bad Request: "${doneData2.error}"`);

    // 5. POST /api/tasks/1/log (Simulate NEXT DAY in user timezone)
    console.log('\n--- Test Scenario C: Simulate clicking Done NEXT DAY (MUST INCREMENT) ---');
    const tomorrowUtc = new Date();
    tomorrowUtc.setUTCDate(tomorrowUtc.getUTCDate() + 1);

    const doneRes3 = await fetch(`${BASE_URL}/api/tasks/1/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulatedNowUtc: tomorrowUtc.toISOString() }),
    });
    const doneData3 = await doneRes3.json();
    assert.strictEqual(doneRes3.status, 200);
    assert.strictEqual(doneData3.success, true);
    assert.strictEqual(doneData3.evaluation.differenceInDays, 1);
    console.log(`✓ [POST /api/tasks/1/log] Next day accepted: ${doneData3.message} (New streak: ${doneData3.task.current_streak})`);

    // 6. POST /api/tasks/1/log (Simulate 1 MISSED DAY with Streak Freeze available)
    console.log('\n--- Test Scenario D: Simulate 1 MISSED DAY with Streak Freeze (MUST SAVE STREAK) ---');
    const afterTomorrowPlusOneUtc = new Date(tomorrowUtc);
    afterTomorrowPlusOneUtc.setUTCDate(afterTomorrowPlusOneUtc.getUTCDate() + 2); // Diff = 2 days (missed 1)

    const doneRes4 = await fetch(`${BASE_URL}/api/tasks/1/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulatedNowUtc: afterTomorrowPlusOneUtc.toISOString() }),
    });
    const doneData4 = await doneRes4.json();
    assert.strictEqual(doneRes4.status, 200);
    assert.strictEqual(doneData4.success, true);
    assert.strictEqual(doneData4.evaluation.usedFreeze, true);
    console.log(`✓ [POST /api/tasks/1/log] Streak Freeze deployed: ${doneData4.message} (Streak preserved at: ${doneData4.task.current_streak})`);

    // 7. POST /api/tasks/1/log (Simulate 4 MISSED DAYS without freeze -> Streak breaks)
    console.log('\n--- Test Scenario E: Simulate 4 MISSED DAYS (MUST BREAK & RESET TO 1) ---');
    const fourDaysLaterUtc = new Date(afterTomorrowPlusOneUtc);
    fourDaysLaterUtc.setUTCDate(fourDaysLaterUtc.getUTCDate() + 4);

    const doneRes5 = await fetch(`${BASE_URL}/api/tasks/1/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulatedNowUtc: fourDaysLaterUtc.toISOString() }),
    });
    const doneData5 = await doneRes5.json();
    assert.strictEqual(doneRes5.status, 200);
    assert.strictEqual(doneData5.success, true);
    assert.strictEqual(doneData5.task.current_streak, 1);
    assert.ok(doneData5.task.longest_streak >= 15, 'Longest streak must be retained');
    console.log(`✓ [POST /api/tasks/1/log] Broken streak reset to 1. All-time longest streak preserved: ${doneData5.task.longest_streak}`);

    // 8. GET /api/tasks/1/logs (Verify Heatmap Logs)
    console.log('\n--- Test Scenario F: Verify Immutable Task Logs (Heatmap Data) ---');
    const logsRes = await fetch(`${BASE_URL}/api/tasks/1/logs`);
    assert.strictEqual(logsRes.status, 200);
    const logsData = await logsRes.json();
    assert.ok(Array.isArray(logsData.logs));
    assert.ok(logsData.logs.length >= 10, 'Should have recorded logs');
    console.log(`✓ [GET /api/tasks/1/logs] Found ${logsData.logs.length} immutable UTC completion records for Heatmap.`);

    console.log('\n🎉 ALL PHASE 1 INTEGRATION & POSTMAN SIMULATION TESTS PASSED!\n');
    server.close(() => {
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Integration test assertion error:', err);
    server.close(() => {
      process.exit(1);
    });
  }
}

runIntegrationTests();

