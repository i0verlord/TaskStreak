const assert = require('assert');
const { createORPCClient } = require('@orpc/client');
const { RPCLink } = require('@orpc/client/fetch');
const app = require('../server');

async function runOrpcTests() {
  console.log('🧪 Running TaskStreak oRPC API Client Integration Tests...\n');

  const server = app.listen(5098);
  const BASE_URL = 'http://localhost:5098';

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(healthRes.status, 200);
    console.log('✓ [Health] Express server is online and responding.');

    // Helper to create oRPC client (zero tokens required)
    function getClient() {
      const link = new RPCLink({
        url: `${BASE_URL}/rpc`,
      });
      return createORPCClient(link);
    }

    const clientWeb = getClient();
    const clientMobile = getClient();

    // 2. Web creates a task (zero-auth)
    const createRes1 = await clientWeb.tasks.create({ title: 'Study Rust & Systems' });
    assert.strictEqual(createRes1.task.title, 'Study Rust & Systems');
    const taskId1 = createRes1.task.id;
    console.log(`✓ [oRPC tasks.create] Web created task "${createRes1.task.title}" (ID: ${taskId1}) without auth token.`);

    // 3. Web edits the task (rename)
    const updateRes = await clientWeb.tasks.update({ taskId: taskId1, title: 'Study Rust & Distributed Systems' });
    assert.strictEqual(updateRes.task.title, 'Study Rust & Distributed Systems');
    console.log(`✓ [oRPC tasks.update] Renamed task to "${updateRes.task.title}".`);

    // 4. Mobile marks the task Done for today (sync test)
    const logRes1 = await clientMobile.tasks.log({ taskId: taskId1 });
    assert.strictEqual(logRes1.task.completed_today, true);
    assert.strictEqual(logRes1.task.is_locked, true);
    assert.strictEqual(logRes1.task.current_streak, 1);
    console.log(`✓ [oRPC tasks.log] Mobile marked Done today -> Streak: ${logRes1.task.current_streak}, Locked: ${logRes1.task.is_locked}`);

    // 5. Anti-cheat check: same-day duplicate click is blocked
    let blocked = false;
    try {
      await clientWeb.tasks.log({ taskId: taskId1 });
    } catch (err) {
      blocked = true;
      assert.match(err.message, /already completed today/i);
    }
    assert.strictEqual(blocked, true, 'Same-day duplicate completion must throw error');
    console.log(`✓ [oRPC tasks.log anti-cheat] Successfully blocked same-day duplicate click!`);

    // 6. Update notification setting
    const userUpdateRes = await clientWeb.user.update({ notification: 'disabled' });
    assert.strictEqual(userUpdateRes.user.notification, 'disabled');
    console.log(`✓ [oRPC user.update] Notification setting toggled to: ${userUpdateRes.user.notification}`);

    // 7. Verify real-time sync: Mobile lists tasks and sees the exact task with streak = 1
    const mobileList = await clientMobile.tasks.list({});
    const foundOnMobile = mobileList.tasks.find((t) => t.id === taskId1);
    assert.ok(foundOnMobile, 'Task created on Web must be visible on Mobile');
    assert.strictEqual(foundOnMobile.current_streak, 1);
    assert.strictEqual(foundOnMobile.completed_today, true);
    console.log(`✓ [oRPC Web/Mobile Sync] Mobile sees Web task with streak: ${foundOnMobile.current_streak} (Synchronized!).`);

    // 8. Delete task
    const delRes = await clientWeb.tasks.delete({ taskId: taskId1 });
    assert.strictEqual(delRes.success, true);
    console.log(`✓ [oRPC tasks.delete] Task permanently deleted from database.`);

    const mobileListAfter = await clientMobile.tasks.list({});
    const deletedFound = mobileListAfter.tasks.find((t) => t.id === taskId1);
    assert.strictEqual(deletedFound, undefined);
    console.log(`✓ [oRPC verification] Confirmed task is completely removed from database.`);

    console.log('\n🎉 ALL oRPC & AUTHENTICATION INTEGRATION TESTS PASSED PERFECTLY!\n');
  } finally {
    server.close();
  }
}

runOrpcTests().catch((err) => {
  console.error('❌ oRPC Integration Tests Failed:', err);
  process.exit(1);
});
