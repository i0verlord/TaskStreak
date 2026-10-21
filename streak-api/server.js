const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const { RPCHandler } = require('@orpc/server/node');
require('dotenv').config();

const { connectMongo } = require('./db/mongo');
const { seedDefaultUserIfMongo, ...taskService } = require('./services/taskService');
const { appRouter, JWT_SECRET } = require('./orpc/router');
const { initNotificationCron, checkAndSendReminders } = require('./services/notifier');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const rpcHandler = new RPCHandler(appRouter);

app.use('/rpc', async (req, res, next) => {
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
      userId = decoded.userId;
    } catch {}
  }

  const { matched } = await rpcHandler.handle(req, res, {
    prefix: '/rpc',
    context: {
      userId,
      req,
      res,
    },
  });

  if (matched) return;
  next();
});

app.get('/', (req, res) => {
  res.json({
    name: 'TaskStreak API',
    status: 'online',
    version: '2.0.0',
    protocol: 'oRPC + Express (Node.js)',
    database: 'MongoDB Atlas (with Mongoose ODM)',
    endpoints: {
      orpc: 'POST /rpc/<procedure>',
      health: 'GET /health',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function resolveUserId(req) {
  let userId = req.query?.userId || req.body?.userId;
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
      userId = decoded.userId;
    } catch {}
  }
  if (!userId || userId === 'guest') {
    const singleUser = await taskService.getSingleUser();
    userId = (singleUser._id || singleUser.id).toString();
  }
  return userId;
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await taskService.getSingleUser();
    const token = 'single-user-token';
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const user = await taskService.getSingleUser();
    const token = 'single-user-token';
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const result = await taskService.getTasksForUser(userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const task = await taskService.createTaskForUser(userId, req.body.title);
    res.status(201).json({ task });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const task = await taskService.updateTaskForUser(userId, req.params.id, req.body.title);
    res.json({ task });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const result = await taskService.deleteTaskForUser(userId, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/log', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const result = await taskService.logTaskCompletion(
      userId,
      req.params.id,
      req.body.simulatedNowUtc
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
      details: err.details,
    });
  }
});


app.get('/api/tasks/:id/logs', async (req, res) => {
  try {
    const logs = await taskService.getTaskLogs(req.params.id);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await taskService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await taskService.updateUser(req.params.id, req.body);
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/test/reminders', async (req, res) => {
  try {
    await checkAndSendReminders();
    res.json({ success: true, message: 'Triggered reminder checks' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`================================================`);
    console.log(`🚀 TaskStreak API running on http://localhost:${PORT}`);
    console.log(`🔌 oRPC Endpoint: http://localhost:${PORT}/rpc`);
    console.log(`================================================`);

    await connectMongo();
    await seedDefaultUserIfMongo();
    initNotificationCron();
  });
}

module.exports = app;
