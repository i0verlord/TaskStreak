const db = require('../db');
const { evaluateStreak, getLocalDateString } = require('../utils/streakCalculator');

// Mock fallback data for when PostgreSQL is not running locally during development
let mockUsers = [
  {
    id: 1,
    email: 'alex@taskstreak.dev',
    timezone: 'Asia/Calcutta',
    streak_freezes_available: 2,
    expo_push_token: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
  },
];

let mockTasks = [
  {
    id: 1,
    user_id: 1,
    title: 'Study Java & Data Structures',
    current_streak: 14,
    longest_streak: 21,
    created_at: new Date('2026-09-01T00:00:00Z'),
  },
  {
    id: 2,
    user_id: 1,
    title: 'Morning 5km Run',
    current_streak: 5,
    longest_streak: 12,
    created_at: new Date('2026-09-10T00:00:00Z'),
  },
  {
    id: 3,
    user_id: 1,
    title: 'Read 20 Pages',
    current_streak: 0,
    longest_streak: 8,
    created_at: new Date('2026-09-15T00:00:00Z'),
  },
];

// Seed 30 days of mock logs for task 1 to demonstrate the heatmap immediately
let mockTaskLogs = (() => {
  const logs = [];
  let logId = 1;
  const now = new Date();
  
  // Yesterday's completion for task 1 (14-day streak active!)
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(14, 30, 0, 0); // 8:00 PM IST is 14:30 UTC
    logs.push({
      id: logId++,
      task_id: 1,
      completed_at: d,
    });
  }

  // Scattered completions for task 1 over the last 90 days
  for (let i = 20; i <= 50; i += 2) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(14, 0, 0, 0);
    logs.push({
      id: logId++,
      task_id: 1,
      completed_at: d,
    });
  }

  // Task 2: completed yesterday
  for (let i = 1; i <= 5; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    logs.push({
      id: logId++,
      task_id: 2,
      completed_at: d,
    });
  }

  return logs;
})();

let isPostgresHealthy = null;

async function checkPostgres() {
  if (isPostgresHealthy !== null) return isPostgresHealthy;
  try {
    await db.query('SELECT 1');
    isPostgresHealthy = true;
    console.log('[Database] PostgreSQL connection verified.');
  } catch (err) {
    isPostgresHealthy = false;
    console.warn('[Database] PostgreSQL connection failed. Operating in high-fidelity mock fallback mode.', err.message);
  }
  return isPostgresHealthy;
}

/**
 * GET /api/users/:id
 */
async function getUser(req, res) {
  const userId = parseInt(req.params.id, 10) || 1;
  const hasPg = await checkPostgres();

  if (hasPg) {
    try {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({ user: result.rows[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const user = mockUsers.find((u) => u.id === userId) || mockUsers[0];
  return res.json({ user });
}

/**
 * PUT /api/users/:id
 */
async function updateUser(req, res) {
  const userId = parseInt(req.params.id, 10) || 1;
  const { timezone, expo_push_token, streak_freezes_available } = req.body;
  const hasPg = await checkPostgres();

  if (hasPg) {
    try {
      const result = await db.query(
        `UPDATE users
         SET timezone = COALESCE($1, timezone),
             expo_push_token = COALESCE($2, expo_push_token),
             streak_freezes_available = COALESCE($3, streak_freezes_available)
         WHERE id = $4
         RETURNING *`,
        [timezone, expo_push_token, streak_freezes_available, userId]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.json({ user: result.rows[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const user = mockUsers.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (timezone !== undefined) user.timezone = timezone;
  if (expo_push_token !== undefined) user.expo_push_token = expo_push_token;
  if (streak_freezes_available !== undefined) user.streak_freezes_available = streak_freezes_available;

  return res.json({ user });
}

/**
 * GET /api/tasks
 * Returns user's tasks with today's completion status based on user's timezone
 */
async function getTasks(req, res) {
  const userId = parseInt(req.query.userId || req.headers['x-user-id'] || 1, 10);
  const nowUtc = new Date();
  const hasPg = await checkPostgres();

  if (hasPg) {
    try {
      // 1. Get user timezone
      const userRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      const user = userRes.rows[0] || { timezone: 'UTC' };
      const todayLocal = getLocalDateString(nowUtc, user.timezone);

      // 2. Get tasks with latest log
      const tasksRes = await db.query(
        `SELECT t.*,
                (SELECT completed_at FROM task_logs tl WHERE tl.task_id = t.id ORDER BY completed_at DESC LIMIT 1) as last_completed_at
         FROM tasks t
         WHERE t.user_id = $1
         ORDER BY t.id ASC`,
        [userId]
      );

      const tasksWithStatus = tasksRes.rows.map((task) => {
        const lastCompletedAt = task.last_completed_at ? new Date(task.last_completed_at) : null;
        const lastLocalDate = lastCompletedAt ? getLocalDateString(lastCompletedAt, user.timezone) : null;
        const completedToday = lastLocalDate === todayLocal;

        return {
          ...task,
          last_completed_at: lastCompletedAt,
          completed_today: completedToday,
          is_locked: completedToday,
          user_timezone: user.timezone,
          today_local_date: todayLocal,
        };
      });

      return res.json({ tasks: tasksWithStatus, user });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback mock
  const user = mockUsers.find((u) => u.id === userId) || mockUsers[0];
  const todayLocal = getLocalDateString(nowUtc, user.timezone);

  const tasksWithStatus = mockTasks
    .filter((t) => t.user_id === user.id)
    .map((task) => {
      const logsForTask = mockTaskLogs
        .filter((l) => l.task_id === task.id)
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

      const lastCompletedAt = logsForTask.length > 0 ? logsForTask[0].completed_at : null;
      const lastLocalDate = lastCompletedAt ? getLocalDateString(lastCompletedAt, user.timezone) : null;
      const completedToday = lastLocalDate === todayLocal;

      return {
        ...task,
        last_completed_at: lastCompletedAt,
        completed_today: completedToday,
        is_locked: completedToday,
        user_timezone: user.timezone,
        today_local_date: todayLocal,
      };
    });

  return res.json({ tasks: tasksWithStatus, user });
}

/**
 * POST /api/tasks
 * Create a new task
 */
async function createTask(req, res) {
  const userId = parseInt(req.body.userId || 1, 10);
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const hasPg = await checkPostgres();

  if (hasPg) {
    try {
      const result = await db.query(
        'INSERT INTO tasks (user_id, title, current_streak, longest_streak) VALUES ($1, $2, 0, 0) RETURNING *',
        [userId, title.trim()]
      );
      return res.status(201).json({ task: result.rows[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const maxId = mockTasks.length > 0 ? Math.max(...mockTasks.map(t => t.id)) : 0;
  const newTask = {
    id: maxId + 1,
    user_id: userId,
    title: title.trim(),
    current_streak: 0,
    longest_streak: 0,
    created_at: new Date(),
  };
  mockTasks.push(newTask);
  return res.status(201).json({ task: newTask });
}

/**
 * POST /api/tasks/:id/log
 * Primary endpoint for clicking "Done".
 * Evaluates timezone-aware streak math and records immutable log.
 */
async function logTaskCompletion(req, res) {
  const taskId = parseInt(req.params.id, 10);
  // Default to current UTC server time, or allow simulatedNowUtc for Postman / day-increment simulation testing
  const nowUtc = req.body && req.body.simulatedNowUtc ? new Date(req.body.simulatedNowUtc) : new Date();
  const hasPg = await checkPostgres();

  if (hasPg) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch task and owner user details
      const taskRes = await client.query(
        `SELECT t.*, u.timezone, u.streak_freezes_available
         FROM tasks t
         JOIN users u ON t.user_id = u.id
         WHERE t.id = $1
         FOR UPDATE`,
        [taskId]
      );

      if (taskRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Task not found' });
      }

      const task = taskRes.rows[0];

      // 2. Fetch most recent task log
      const lastLogRes = await client.query(
        `SELECT completed_at FROM task_logs WHERE task_id = $1 ORDER BY completed_at DESC LIMIT 1`,
        [taskId]
      );
      const lastCompletedAtUtc = lastLogRes.rows.length > 0 ? lastLogRes.rows[0].completed_at : null;

      // 3. Evaluate streak with timezone engine
      const evaluation = evaluateStreak({
        nowUtc,
        lastCompletedAtUtc,
        currentStreak: task.current_streak,
        longestStreak: task.longest_streak,
        userTimezone: task.timezone,
        streakFreezesAvailable: task.streak_freezes_available,
      });

      if (!evaluation.allowed) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: evaluation.reason,
          details: evaluation,
        });
      }

      // 4. If streak freeze was used, decrement user's freeze counter
      if (evaluation.usedFreeze) {
        await client.query(
          'UPDATE users SET streak_freezes_available = streak_freezes_available - 1 WHERE id = $1',
          [task.user_id]
        );
      }

      // 5. Insert immutable log
      await client.query(
        'INSERT INTO task_logs (task_id, completed_at) VALUES ($1, $2)',
        [taskId, nowUtc]
      );

      // 6. Update task current and longest streak
      const updateTaskRes = await client.query(
        `UPDATE tasks
         SET current_streak = $1, longest_streak = $2
         WHERE id = $3
         RETURNING *`,
        [evaluation.newStreak, evaluation.newLongestStreak, taskId]
      );

      await client.query('COMMIT');

      return res.json({
        success: true,
        task: {
          ...updateTaskRes.rows[0],
          completed_today: true,
          is_locked: true,
        },
        evaluation,
        message: evaluation.usedFreeze
          ? `Freeze used! Your streak continues at ${evaluation.newStreak} days 🔥`
          : `Streak updated to ${evaluation.newStreak} days! 🔥`,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }

  // Fallback mock mode
  const task = mockTasks.find((t) => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const user = mockUsers.find((u) => u.id === task.user_id) || mockUsers[0];

  const logsForTask = mockTaskLogs
    .filter((l) => l.task_id === taskId)
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
  const lastCompletedAtUtc = logsForTask.length > 0 ? logsForTask[0].completed_at : null;

  const evaluation = evaluateStreak({
    nowUtc,
    lastCompletedAtUtc,
    currentStreak: task.current_streak,
    longestStreak: task.longest_streak,
    userTimezone: user.timezone,
    streakFreezesAvailable: user.streak_freezes_available,
  });

  if (!evaluation.allowed) {
    return res.status(400).json({
      success: false,
      error: evaluation.reason,
      details: evaluation,
    });
  }

  if (evaluation.usedFreeze) {
    user.streak_freezes_available -= 1;
  }

  // Append new log
  mockTaskLogs.unshift({
    id: mockTaskLogs.length + 1,
    task_id: taskId,
    completed_at: nowUtc,
  });

  task.current_streak = evaluation.newStreak;
  task.longest_streak = evaluation.newLongestStreak;

  return res.json({
    success: true,
    task: {
      ...task,
      completed_today: true,
      is_locked: true,
    },
    evaluation,
    message: evaluation.usedFreeze
      ? `Freeze used! Your streak continues at ${evaluation.newStreak} days 🔥`
      : `Streak updated to ${evaluation.newStreak} days! 🔥`,
  });
}

/**
 * GET /api/tasks/:id/logs
 * Fetches all completion logs for heatmap rendering
 */
async function getTaskLogs(req, res) {
  const taskId = parseInt(req.params.id, 10);
  const hasPg = await checkPostgres();

  if (hasPg) {
    try {
      const result = await db.query(
        'SELECT * FROM task_logs WHERE task_id = $1 ORDER BY completed_at ASC',
        [taskId]
      );
      return res.json({ logs: result.rows });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const logs = mockTaskLogs
    .filter((l) => l.task_id === taskId)
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));

  return res.json({ logs });
}

/**
 * DELETE /api/tasks/:id
 * Delete a task and its logs
 */
async function deleteTask(req, res) {
  const taskId = parseInt(req.params.id, 10);
  const hasPg = await checkPostgres();

  if (hasPg) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM task_logs WHERE task_id = $1', [taskId]);
      const result = await client.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [taskId]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Task not found' });
      }
      
      await client.query('COMMIT');
      return res.json({ success: true, message: 'Task deleted successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }

  // Fallback mock mode
  const initialLength = mockTasks.length;
  mockTasks = mockTasks.filter(t => t.id !== taskId);
  
  if (mockTasks.length === initialLength) {
    return res.status(404).json({ error: 'Task not found' });
  }

  return res.json({ success: true, message: 'Task deleted successfully' });
}

module.exports = {
  getUser,
  updateUser,
  getTasks,
  createTask,
  logTaskCompletion,
  getTaskLogs,
  deleteTask,
};
