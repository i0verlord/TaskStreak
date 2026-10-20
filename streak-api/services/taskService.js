const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const TaskLog = require('../models/TaskLog');
const { isMongoConnected } = require('../db/mongo');
const { evaluateStreak, getLocalDateString } = require('../utils/streakCalculator');

// In-memory fallback stores when MongoDB Atlas is offline or not configured yet
let mockUsers = [
  {
    _id: '670000000000000000000001',
    id: '670000000000000000000001',
    email: 'alex@taskstreak.dev',
    password: bcrypt.hashSync('password123', 8),
    timezone: 'Asia/Calcutta',
    streak_freezes_available: 2,
    expo_push_token: null,
    notification: 'enabled',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  },
];

let mockTasks = [
  {
    _id: '670000000000000000000011',
    id: '670000000000000000000011',
    userId: '670000000000000000000001',
    title: 'Study Java & Data Structures',
    current_streak: 14,
    longest_streak: 21,
    createdAt: new Date('2026-09-01T00:00:00Z'),
  },
  {
    _id: '670000000000000000000012',
    id: '670000000000000000000012',
    userId: '670000000000000000000001',
    title: 'Morning 5km Run',
    current_streak: 5,
    longest_streak: 12,
    createdAt: new Date('2026-09-10T00:00:00Z'),
  },
  {
    _id: '670000000000000000000013',
    id: '670000000000000000000013',
    userId: '670000000000000000000001',
    title: 'Read 20 Pages',
    current_streak: 0,
    longest_streak: 8,
    createdAt: new Date('2026-09-15T00:00:00Z'),
  },
];

let mockTaskLogs = (() => {
  const logs = [];
  let logCounter = 1;
  const now = new Date();

  // 14 days consecutive logs for Task 1
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(14, 30, 0, 0); // 8:00 PM IST
    logs.push({
      _id: `log-${logCounter++}`,
      taskId: '670000000000000000000011',
      completed_at: d,
    });
  }

  // Task 2: 5 days
  for (let i = 1; i <= 5; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    logs.push({
      _id: `log-${logCounter++}`,
      taskId: '670000000000000000000012',
      completed_at: d,
    });
  }

  return logs;
})();

/**
 * Ensures the default demo user exists in MongoDB Atlas if connected
 */
async function seedDefaultUserIfMongo() {
  if (!isMongoConnected()) return;
  try {
    const existing = await User.findOne({ email: 'alex@taskstreak.dev' });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        email: 'alex@taskstreak.dev',
        password: hashedPassword,
        timezone: 'Asia/Calcutta',
        streak_freezes_available: 2,
        notification: 'enabled',
      });

      // Seed 3 initial demo tasks
      const t1 = await Task.create({
        userId: user._id,
        title: 'Study Java & Data Structures',
        current_streak: 14,
        longest_streak: 21,
      });

      const t2 = await Task.create({
        userId: user._id,
        title: 'Morning 5km Run',
        current_streak: 5,
        longest_streak: 12,
      });

      await Task.create({
        userId: user._id,
        title: 'Read 20 Pages',
        current_streak: 0,
        longest_streak: 8,
      });

      // Seed 14 days of logs for task 1
      const now = new Date();
      for (let i = 1; i <= 14; i++) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i);
        d.setUTCHours(14, 30, 0, 0);
        await TaskLog.create({ taskId: t1._id, completed_at: d });
      }

      console.log('✅ [MongoDB Seed] Initial demo user & tasks seeded.');
    }
  } catch (err) {
    console.warn('[MongoDB Seed] Seed check completed:', err.message);
  }
}

/**
 * Register a new user
 */
async function registerUser({ email, password, timezone = 'Asia/Calcutta' }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (isMongoConnected()) {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new Error('An account with this email already exists.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      timezone: timezone || 'Asia/Calcutta',
      streak_freezes_available: 2,
      notification: 'enabled',
    });
    return sanitizeUser(user);
  }

  // Mock store
  const existing = mockUsers.find((u) => u.email === normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }
  const newUser = {
    _id: `user-${Date.now()}`,
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    password: bcrypt.hashSync(password, 8),
    timezone: timezone || 'Asia/Calcutta',
    streak_freezes_available: 2,
    expo_push_token: null,
    notification: 'enabled',
    createdAt: new Date(),
  };
  mockUsers.push(newUser);
  return sanitizeUser(newUser);
}

/**
 * Login user
 */
async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (isMongoConnected()) {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw new Error('Invalid email or password.');
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }
    return sanitizeUser(user);
  }

  // Mock store
  const user = mockUsers.find((u) => u.email === normalizedEmail);
  if (!user) {
    throw new Error('Invalid email or password.');
  }
  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    throw new Error('Invalid email or password.');
  }
  return sanitizeUser(user);
}

/**
 * Get user by ID
 */
async function getUserById(id) {
  if (!id) return null;

  if (isMongoConnected()) {
    try {
      const user = await User.findById(id);
      return user ? sanitizeUser(user) : null;
    } catch {
      return null;
    }
  }

  const user = mockUsers.find((u) => u._id.toString() === id.toString() || u.id === id);
  return user ? sanitizeUser(user) : null;
}

/**
 * Update user settings
 */
async function updateUser(id, { timezone, expo_push_token, notification }) {
  if (isMongoConnected()) {
    const updateData = {};
    if (timezone !== undefined) updateData.timezone = timezone;
    if (expo_push_token !== undefined) updateData.expo_push_token = expo_push_token;
    if (notification !== undefined) updateData.notification = notification;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });
    return user ? sanitizeUser(user) : null;
  }

  const user = mockUsers.find((u) => u._id.toString() === id.toString() || u.id === id);
  if (!user) throw new Error('User not found');
  if (timezone !== undefined) user.timezone = timezone;
  if (expo_push_token !== undefined) user.expo_push_token = expo_push_token;
  if (notification !== undefined) user.notification = notification;

  return sanitizeUser(user);
}

/**
 * Get user's tasks with dynamic completion status based on user's timezone
 */
async function getTasksForUser(userId) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const nowUtc = new Date();
  const todayLocal = getLocalDateString(nowUtc, user.timezone);

  if (isMongoConnected()) {
    const tasks = await Task.find({ userId: user._id }).sort({ createdAt: 1 });
    const tasksWithStatus = await Promise.all(
      tasks.map(async (task) => {
        const lastLog = await TaskLog.findOne({ taskId: task._id }).sort({ completed_at: -1 });
        const lastCompletedAt = lastLog ? lastLog.completed_at : null;
        const lastLocalDate = lastCompletedAt ? getLocalDateString(lastCompletedAt, user.timezone) : null;
        const completedToday = lastLocalDate === todayLocal;

        return {
          id: task._id.toString(),
          _id: task._id.toString(),
          userId: task.userId.toString(),
          title: task.title,
          current_streak: task.current_streak,
          longest_streak: task.longest_streak,
          last_completed_at: lastCompletedAt,
          completed_today: completedToday,
          is_locked: completedToday,
          user_timezone: user.timezone,
          today_local_date: todayLocal,
          createdAt: task.createdAt,
        };
      })
    );
    return { tasks: tasksWithStatus, user };
  }

  // In-memory fallback
  const tasks = mockTasks.filter((t) => t.userId.toString() === user._id.toString());
  const tasksWithStatus = tasks.map((task) => {
    const logs = mockTaskLogs
      .filter((l) => l.taskId.toString() === task._id.toString())
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

    const lastCompletedAt = logs.length > 0 ? logs[0].completed_at : null;
    const lastLocalDate = lastCompletedAt ? getLocalDateString(lastCompletedAt, user.timezone) : null;
    const completedToday = lastLocalDate === todayLocal;

    return {
      id: task._id.toString(),
      _id: task._id.toString(),
      userId: task.userId.toString(),
      title: task.title,
      current_streak: task.current_streak,
      longest_streak: task.longest_streak,
      last_completed_at: lastCompletedAt,
      completed_today: completedToday,
      is_locked: completedToday,
      user_timezone: user.timezone,
      today_local_date: todayLocal,
      createdAt: task.createdAt,
    };
  });

  return { tasks: tasksWithStatus, user };
}

/**
 * Create a new task for user
 */
async function createTaskForUser(userId, title) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  if (isMongoConnected()) {
    const task = await Task.create({
      userId: user._id,
      title: title.trim(),
      current_streak: 0,
      longest_streak: 0,
    });
    return {
      id: task._id.toString(),
      _id: task._id.toString(),
      userId: task.userId.toString(),
      title: task.title,
      current_streak: 0,
      longest_streak: 0,
      completed_today: false,
      is_locked: false,
    };
  }

  const newTask = {
    _id: `task-${Date.now()}`,
    id: `task-${Date.now()}`,
    userId: user._id.toString(),
    title: title.trim(),
    current_streak: 0,
    longest_streak: 0,
    createdAt: new Date(),
  };
  mockTasks.push(newTask);
  return {
    ...newTask,
    completed_today: false,
    is_locked: false,
  };
}

/**
 * Rename/Edit a task for user
 */
async function updateTaskForUser(userId, taskId, title) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  if (isMongoConnected()) {
    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId: user._id },
      { title: title.trim() },
      { new: true }
    );
    if (!task) throw new Error('Task not found');
    return {
      id: task._id.toString(),
      _id: task._id.toString(),
      title: task.title,
      current_streak: task.current_streak,
      longest_streak: task.longest_streak,
    };
  }

  const task = mockTasks.find((t) => (t._id.toString() === taskId.toString() || t.id === taskId) && t.userId.toString() === user._id.toString());
  if (!task) throw new Error('Task not found');
  task.title = title.trim();
  return {
    id: task._id.toString(),
    _id: task._id.toString(),
    title: task.title,
    current_streak: task.current_streak,
    longest_streak: task.longest_streak,
  };
}

/**
 * Delete a task and its logs from database
 */
async function deleteTaskForUser(userId, taskId) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  if (isMongoConnected()) {
    const task = await Task.findOneAndDelete({ _id: taskId, userId: user._id });
    if (!task) throw new Error('Task not found');
    await TaskLog.deleteMany({ taskId: task._id });
    return { success: true, message: 'Task deleted successfully from database' };
  }

  const initialCount = mockTasks.length;
  mockTasks = mockTasks.filter(
    (t) => !(t._id.toString() === taskId.toString() && t.userId.toString() === user._id.toString())
  );
  mockTaskLogs = mockTaskLogs.filter((l) => l.taskId.toString() !== taskId.toString());

  if (mockTasks.length === initialCount) {
    throw new Error('Task not found');
  }
  return { success: true, message: 'Task deleted successfully from database' };
}

/**
 * Log task completion with timezone validation and streak freeze deduction
 */
async function logTaskCompletion(userId, taskId, simulatedNowUtc) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const nowUtc = simulatedNowUtc ? new Date(simulatedNowUtc) : new Date();

  if (isMongoConnected()) {
    const task = await Task.findOne({ _id: taskId, userId: user._id });
    if (!task) throw new Error('Task not found');

    const lastLog = await TaskLog.findOne({ taskId: task._id }).sort({ completed_at: -1 });
    const lastCompletedAtUtc = lastLog ? lastLog.completed_at : null;

    const evaluation = evaluateStreak({
      nowUtc,
      lastCompletedAtUtc,
      currentStreak: task.current_streak,
      longestStreak: task.longest_streak,
      userTimezone: user.timezone,
      streakFreezesAvailable: user.streak_freezes_available,
    });

    if (!evaluation.allowed) {
      const err = new Error(evaluation.reason);
      err.details = evaluation;
      throw err;
    }

    if (evaluation.usedFreeze) {
      await User.findByIdAndUpdate(user._id, {
        $inc: { streak_freezes_available: -1 },
      });
    }

    await TaskLog.create({
      taskId: task._id,
      completed_at: nowUtc,
    });

    task.current_streak = evaluation.newStreak;
    task.longest_streak = evaluation.newLongestStreak;
    await task.save();

    return {
      success: true,
      task: {
        id: task._id.toString(),
        _id: task._id.toString(),
        title: task.title,
        current_streak: task.current_streak,
        longest_streak: task.longest_streak,
        completed_today: true,
        is_locked: true,
      },
      evaluation,
      message: evaluation.usedFreeze
        ? `Freeze used! Your streak continues at ${evaluation.newStreak} days 🔥`
        : `Streak updated to ${evaluation.newStreak} days! 🔥`,
    };
  }

  // In-memory fallback
  const task = mockTasks.find((t) => (t._id.toString() === taskId.toString() || t.id === taskId) && t.userId.toString() === user._id.toString());
  if (!task) throw new Error('Task not found');

  const logs = mockTaskLogs
    .filter((l) => l.taskId.toString() === task._id.toString())
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
  const lastCompletedAtUtc = logs.length > 0 ? logs[0].completed_at : null;

  const evaluation = evaluateStreak({
    nowUtc,
    lastCompletedAtUtc,
    currentStreak: task.current_streak,
    longestStreak: task.longest_streak,
    userTimezone: user.timezone,
    streakFreezesAvailable: user.streak_freezes_available,
  });

  if (!evaluation.allowed) {
    const err = new Error(evaluation.reason);
    err.details = evaluation;
    throw err;
  }

  if (evaluation.usedFreeze) {
    const targetUser = mockUsers.find((u) => u._id.toString() === user._id.toString());
    if (targetUser && targetUser.streak_freezes_available > 0) {
      targetUser.streak_freezes_available -= 1;
    }
  }

  mockTaskLogs.unshift({
    _id: `log-${Date.now()}`,
    taskId: task._id.toString(),
    completed_at: nowUtc,
  });

  task.current_streak = evaluation.newStreak;
  task.longest_streak = evaluation.newLongestStreak;

  return {
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
  };
}

/**
 * Get all completion logs for a task to render heatmap
 */
async function getTaskLogs(taskId) {
  if (isMongoConnected()) {
    const logs = await TaskLog.find({ taskId }).sort({ completed_at: 1 });
    return logs.map((l) => ({
      id: l._id.toString(),
      taskId: l.taskId.toString(),
      completed_at: l.completed_at,
    }));
  }

  return mockTaskLogs
    .filter((l) => l.taskId.toString() === taskId.toString())
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
    .map((l) => ({
      id: l._id.toString(),
      taskId: l.taskId.toString(),
      completed_at: l.completed_at,
    }));
}

/**
 * Remove sensitive fields from user object
 */
function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  obj.id = (obj._id || obj.id).toString();
  obj._id = obj.id;
  return obj;
}

module.exports = {
  seedDefaultUserIfMongo,
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  getTasksForUser,
  createTaskForUser,
  updateTaskForUser,
  deleteTaskForUser,
  logTaskCompletion,
  getTaskLogs,
  mockUsers,
};
