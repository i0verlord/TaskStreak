const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./db');
const {
  getUser,
  updateUser,
  getTasks,
  createTask,
  logTaskCompletion,
  getTaskLogs,
} = require('./controllers/taskController');
const { initNotificationCron, checkAndSendReminders } = require('./services/notifier');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check & root status
app.get('/', (req, res) => {
  res.json({
    name: 'TaskStreak API',
    status: 'online',
    version: '1.0.0',
    documentation: {
      tasks: 'GET /api/tasks?userId=1',
      createTask: 'POST /api/tasks',
      logDone: 'POST /api/tasks/:id/log',
      heatmapLogs: 'GET /api/tasks/:id/logs',
      user: 'GET /api/users/:id',
      updateUser: 'PUT /api/users/:id',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User routes
app.get('/api/users/:id', getUser);
app.put('/api/users/:id', updateUser);

// Task routes
app.get('/api/tasks', getTasks);
app.post('/api/tasks', createTask);
app.post('/api/tasks/:id/log', logTaskCompletion);
app.get('/api/tasks/:id/logs', getTaskLogs);

// Push notification manual trigger (for testing / debugging)
app.post('/api/test/reminders', async (req, res) => {
  try {
    await checkAndSendReminders();
    res.json({ success: true, message: 'Triggered reminder checks' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-seed schema on boot if Postgres is available
async function initDbSchema() {
  try {
    const fs = require('fs');
    const path = require('path');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await db.query(schemaSql);
    console.log('[Database] PostgreSQL schema verified/initialized.');
  } catch (err) {
    console.log('[Database] Skipped direct schema execution (PostgreSQL offline or already initialized):', err.message);
  }
}

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`===============================================`);
    console.log(`🚀 TaskStreak API running on http://localhost:${PORT}`);
    console.log(`===============================================`);

    await initDbSchema();
    initNotificationCron();
  });
}

module.exports = app;

