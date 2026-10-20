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

    // 2. GET /api/tasks (verify clean array)
    const tasksRes = await fetch(`${BASE_URL}/api/tasks`);
    assert.strictEqual(tasksRes.status, 200);
    const tasksData = await tasksRes.json();
    assert.ok(Array.isArray(tasksData.tasks), 'tasks should be an array');
    console.log(`✓ [GET /api/tasks] Successfully fetched tasks. Count: ${tasksData.tasks.length}`);

    // 3. POST /api/tasks (Create a new task)
    const createRes = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Daily Habit' }),
    });
    assert.strictEqual(createRes.status, 201);
    const createData = await createRes.json();
    const testTaskId = createData.task.id;
    assert.ok(testTaskId, 'Created task must have an ID');
    console.log(`✓ [POST /api/tasks] Created dynamic task: "${createData.task.title}" (ID: ${testTaskId})`);

    // 4. POST /api/tasks/:id/log (Click "Done" today)
    console.log('\n--- Test Scenario A: Click Done today (Valid completion) ---');
    const doneRes1 = await fetch(`${BASE_URL}/api/tasks/${testTaskId}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const doneData1 = await doneRes1.json();
    assert.strictEqual(doneRes1.status, 200);
    assert.strictEqual(doneData1.success, true);
    assert.strictEqual(doneData1.task.completed_today, true);
    assert.strictEqual(doneData1.task.is_locked, true);
    assert.strictEqual(doneData1.task.current_streak, 1);
    console.log(`✓ [POST /api/tasks/:id/log] Succeeded: ${doneData1.message} (Streak: ${doneData1.task.current_streak})`);

    // 5. POST /api/tasks/:id/log again today (MUST BLOCK)
    console.log('\n--- Test Scenario B: Click Done again on SAME day (MUST BLOCK) ---');
    const doneRes2 = await fetch(`${BASE_URL}/api/tasks/${testTaskId}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const doneData2 = await doneRes2.json();
    assert.strictEqual(doneRes2.status, 400);
    assert.strictEqual(doneData2.success, false);
    assert.match(doneData2.error, /already completed today/i);
    console.log(`✓ [POST /api/tasks/:id/log] Successfully BLOCKED with 400 Bad Request: "${doneData2.error}"`);

    // 6. POST /api/tasks/:id/log (Simulate NEXT DAY in user timezone)
    console.log('\n--- Test Scenario C: Simulate clicking Done NEXT DAY (MUST INCREMENT) ---');
    const tomorrowUtc = new Date();
    tomorrowUtc.setUTCDate(tomorrowUtc.getUTCDate() + 1);

    const doneRes3 = await fetch(`${BASE_URL}/api/tasks/${testTaskId}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulatedNowUtc: tomorrowUtc.toISOString() }),
    });
    const doneData3 = await doneRes3.json();
    assert.strictEqual(doneRes3.status, 200);
    assert.strictEqual(doneData3.success, true);
    assert.strictEqual(doneData3.task.current_streak, 2);
    console.log(`✓ [POST /api/tasks/:id/log] Next day accepted: ${doneData3.message} (New streak: ${doneData3.task.current_streak})`);

    // 7. POST /api/tasks/:id/log (Simulate 3 MISSED DAYS -> Reset to 1, preserve longest streak)
    console.log('\n--- Test Scenario D: Simulate 3 MISSED DAYS (MUST RESET TO 1) ---');
    const fourDaysLaterUtc = new Date(tomorrowUtc);
    fourDaysLaterUtc.setUTCDate(fourDaysLaterUtc.getUTCDate() + 4);

    const doneRes5 = await fetch(`${BASE_URL}/api/tasks/${testTaskId}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulatedNowUtc: fourDaysLaterUtc.toISOString() }),
    });
    const doneData5 = await doneRes5.json();
    assert.strictEqual(doneRes5.status, 200);
    assert.strictEqual(doneData5.success, true);
    assert.strictEqual(doneData5.task.current_streak, 1);
    assert.strictEqual(doneData5.task.longest_streak, 2);
    console.log(`✓ [POST /api/tasks/:id/log] Broken streak reset to 1. Longest streak preserved: ${doneData5.task.longest_streak}`);

    // 8. GET /api/tasks/:id/logs (Verify Immutable Task Logs)
    console.log('\n--- Test Scenario E: Verify Immutable Task Logs ---');
    const logsRes = await fetch(`${BASE_URL}/api/tasks/${testTaskId}/logs`);
    assert.strictEqual(logsRes.status, 200);
    const logsData = await logsRes.json();
    assert.ok(Array.isArray(logsData.logs));
    assert.ok(logsData.logs.length >= 3, 'Should have recorded 3 completions');
    console.log(`✓ [GET /api/tasks/:id/logs] Found ${logsData.logs.length} immutable UTC completion records.`);

    // 9. DELETE /api/tasks/:id
    console.log('\n--- Test Scenario F: Delete Task ---');
    const delRes = await fetch(`${BASE_URL}/api/tasks/${testTaskId}`, {
      method: 'DELETE',
    });
    assert.strictEqual(delRes.status, 200);
    console.log('✓ [DELETE /api/tasks/:id] Task permanently deleted.');

    console.log('\n🎉 ALL PHASE 1 INTEGRATION TESTS PASSED PERFECTLY!\n');
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

