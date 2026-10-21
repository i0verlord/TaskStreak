const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const TaskLog = require('../models/TaskLog');
const { isMongoConnected } = require('../db/mongo');
const { evaluateStreak, getLocalDateString } = require('../utils/streakCalculator');

let mockUsers = [
  {
    _id: '670000000000000000000001',
    id: '670000000000000000000001',
    name: 'Admin',
    email: 'admin@taskstreak.dev',
    password: bcrypt.hashSync('admin123', 8),
    timezone: 'Asia/Calcutta',
    expo_push_token: null,
    notification: 'enabled',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  },
];

let mockTasks = [];
let mockTaskLogs = [];

async function seedDefaultUserIfMongo() {
  if (!isMongoConnected()) return;
  try {
    let user = await User.findOne({
      $or: [
        { email: 'admin' },
        { email: 'admin@taskstreak.dev' },
        { email: 'alex@taskstreak.dev' },
      ],
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      user = await User.create({
        name: 'Admin',
        email: 'admin@taskstreak.dev',
        password: hashedPassword,
        timezone: 'Asia/Calcutta',
        notification: 'enabled',
      });
      console.log('✅ [MongoDB Seed] Admin user created (password: admin123). 0 default tasks.');
    } else {
      user.name = 'Admin';
      user.email = 'admin@taskstreak.dev';
      user.password = await bcrypt.hash('admin123', 10);
      await user.save();
    }
  } catch (err) {
    console.warn('[MongoDB Seed] Seed check completed:', err.message);
  }
}

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
      notification: 'enabled',
    });
    return sanitizeUser(user);
  }

  const existing = mockUsers.find((u) => u.email === normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }
  const newUser = {
    _id: `user-${Date.now()}`,
    id: `user-${Date.now()}`,
    name: normalizedEmail.split('@')[0],
    email: normalizedEmail,
    password: bcrypt.hashSync(password, 8),
    timezone: timezone || 'Asia/Calcutta',
    expo_push_token: null,
    notification: 'enabled',
    createdAt: new Date(),
  };
  mockUsers.push(newUser);
  return sanitizeUser(newUser);
}

async function loginUser({ email, password }) {
  const normalizedInput = email.trim().toLowerCase();

  if (isMongoConnected()) {
    const user = await User.findOne({
      $or: [
        { email: normalizedInput },
        { email: normalizedInput === 'admin' ? 'admin@taskstreak.dev' : normalizedInput },
        { name: normalizedInput },
      ],
    });
    if (!user) {
      throw new Error('Invalid email or password.');
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }
    return sanitizeUser(user);
  }

  const user = mockUsers.find(
    (u) =>
      u.email.toLowerCase() === normalizedInput ||
      u.email.toLowerCase() === (normalizedInput === 'admin' ? 'admin@taskstreak.dev' : normalizedInput) ||
      (u.name && u.name.toLowerCase() === normalizedInput)
  );
  if (!user) {
    throw new Error('Invalid email or password.');
  }
  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    throw new Error('Invalid email or password.');
  }
  return sanitizeUser(user);
}

async function getDefaultDemoUser() {
  if (isMongoConnected()) {
    try {
      let user = await User.findOne({
        $or: [
          { email: 'admin' },
          { email: 'admin@taskstreak.dev' },
          { name: 'Admin' },
        ],
      });
      if (!user) {
        user = await User.findOne();
      }
      if (!user) {
        await seedDefaultUserIfMongo();
        user = await User.findOne({
          $or: [
            { email: 'admin' },
            { email: 'admin@taskstreak.dev' },
            { name: 'Admin' },
          ],
        });
      }
      if (user) return sanitizeUser(user);
    } catch (e) {
      console.warn('[getDefaultDemoUser] Atlas lookup error, falling back:', e.message);
    }
  }

  return sanitizeUser(mockUsers[0]);
}

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

async function getTasksForUser(userId) {
  const user = (userId ? await getUserById(userId) : null) || (await getDefaultDemoUser());
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

async function createTaskForUser(userId, title) {
  const user = (userId ? await getUserById(userId) : null) || (await getDefaultDemoUser());
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

async function updateTaskForUser(userId, taskId, title) {
  const user = (userId ? await getUserById(userId) : null) || (await getDefaultDemoUser());
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

async function deleteTaskForUser(userId, taskId) {
  const user = (userId ? await getUserById(userId) : null) || (await getDefaultDemoUser());
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

async function logTaskCompletion(userId, taskId, simulatedNowUtc) {
  const user = (userId ? await getUserById(userId) : null) || (await getDefaultDemoUser());
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
    });

    if (!evaluation.allowed) {
      const err = new Error(evaluation.reason);
      err.details = evaluation;
      throw err;
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
      message: `Streak updated to ${evaluation.newStreak} days! 🔥`,
    };
  }

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
  });

  if (!evaluation.allowed) {
    const err = new Error(evaluation.reason);
    err.details = evaluation;
    throw err;
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
    message: `Streak updated to ${evaluation.newStreak} days! 🔥`,
  };
}

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

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  obj.id = (obj._id || obj.id).toString();
  obj._id = obj.id;
  return obj;
}

module.exports = {
  seedDefaultUserIfMongo,
  getDefaultDemoUser,
  getSingleUser: getDefaultDemoUser,
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
