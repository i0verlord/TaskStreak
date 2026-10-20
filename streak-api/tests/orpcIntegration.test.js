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

    // Helper to create an authenticated or unauthenticated oRPC client
    function getClient(token) {
      const link = new RPCLink({
        url: `${BASE_URL}/rpc`,
        headers: () => (token ? { Authorization: `Bearer ${token}` } : {}),
      });
      return createORPCClient(link);
    }

    const publicClient = getClient();

    // 2. Auth: Register User A
    const userAEmail = `alex_${Date.now()}@taskstreak.dev`;
    const regResultA = await publicClient.auth.register({
      email: userAEmail,
      password: 'password123',
      timezone: 'Asia/Calcutta',
    });
    assert.ok(regResultA.token, 'Should return JWT token');
    assert.strictEqual(regResultA.user.email, userAEmail);
    const tokenA = regResultA.token;
    console.log(`✓ [oRPC auth.register] Registered User A (${userAEmail}).`);

    // Authenticated client for User A
    const clientA = getClient(tokenA);

    // 3. User A creates a task
    const createRes1 = await clientA.tasks.create({ title: 'Study Rust & Systems' });
    assert.strictEqual(createRes1.task.title, 'Study Rust & Systems');
    const taskId1 = createRes1.task.id;
    console.log(`✓ [oRPC tasks.create] Created task "${createRes1.task.title}" (ID: ${taskId1}).`);

    // 4. User A edits the task (rename)
    const updateRes = await clientA.tasks.update({ taskId: taskId1, title: 'Study Rust & Distributed Systems' });
    assert.strictEqual(updateRes.task.title, 'Study Rust & Distributed Systems');
    console.log(`✓ [oRPC tasks.update] Renamed task to "${updateRes.task.title}".`);

    // 5. User A completes the task for today
    const logRes1 = await clientA.tasks.log({ taskId: taskId1 });
    assert.strictEqual(logRes1.task.completed_today, true);
    assert.strictEqual(logRes1.task.is_locked, true);
    assert.strictEqual(logRes1.task.current_streak, 1);
    console.log(`✓ [oRPC tasks.log] Marked Done today -> Streak: ${logRes1.task.current_streak}, Locked: ${logRes1.task.is_locked}`);

    // 6. User A tries to complete the task AGAIN today (MUST BLOCK)
    let blocked = false;
    try {
      await clientA.tasks.log({ taskId: taskId1 });
    } catch (err) {
      blocked = true;
      assert.match(err.message, /already completed today/i);
    }
    assert.strictEqual(blocked, true, 'Same-day duplicate completion must throw error');
    console.log(`✓ [oRPC tasks.log anti-cheat] Successfully blocked same-day duplicate click!`);

    // 7. User A updates notification setting (disable/enable)
    const userUpdateRes = await clientA.user.update({ notification: 'disabled' });
    assert.strictEqual(userUpdateRes.user.notification, 'disabled');
    console.log(`✓ [oRPC user.update] Notification setting toggled to: ${userUpdateRes.user.notification}`);

    // 8. Register User B -> Verify Per-User Data Isolation
    const userBEmail = `bob_${Date.now()}@taskstreak.dev`;
    const regResultB = await publicClient.auth.register({
      email: userBEmail,
      password: 'password123',
    });
    const clientB = getClient(regResultB.token);

    const listResB = await clientB.tasks.list({});
    const foundTaskInB = listResB.tasks.find((t) => t.id === taskId1);
    assert.strictEqual(foundTaskInB, undefined, 'User B must NOT see User A tasks');
    console.log(`✓ [oRPC Data Isolation] User B has 0 of User A's tasks (Per-user data isolation verified!).`);

    // 9. User A deletes the task
    const delRes = await clientA.tasks.delete({ taskId: taskId1 });
    assert.strictEqual(delRes.success, true);
    console.log(`✓ [oRPC tasks.delete] Task permanently deleted from database.`);

    const listResAAfter = await clientA.tasks.list({});
    const deletedFound = listResAAfter.tasks.find((t) => t.id === taskId1);
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
