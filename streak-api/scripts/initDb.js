const fs = require('fs');
const path = require('path');
const db = require('../db');

async function initializeDatabase() {
  console.log('🔄 Connecting to PostgreSQL database...');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
    
    // Execute DDL
    await db.query(schemaSql);
    console.log('✅ Tables created/verified (users, tasks, task_logs).');

    // Seed default user if not exists
    const userRes = await db.query(
      `INSERT INTO users (email, timezone, streak_freezes_available)
       VALUES ('alex@taskstreak.dev', 'Asia/Calcutta', 2)
       ON CONFLICT (email) DO UPDATE
       SET timezone = EXCLUDED.timezone
       RETURNING id, email, timezone, streak_freezes_available;`
    );
    const user = userRes.rows[0];
    console.log(`✅ Default user configured: ${user.email} (ID: ${user.id}, TZ: ${user.timezone})`);

    // Seed tasks if not exists
    const tasksCount = await db.query('SELECT COUNT(*) FROM tasks WHERE user_id = $1', [user.id]);
    if (parseInt(tasksCount.rows[0].count, 10) === 0) {
      const task1 = await db.query(
        `INSERT INTO tasks (user_id, title, current_streak, longest_streak)
         VALUES ($1, 'Study Java & Data Structures', 14, 21) RETURNING id`,
        [user.id]
      );
      const task2 = await db.query(
        `INSERT INTO tasks (user_id, title, current_streak, longest_streak)
         VALUES ($1, 'Morning 5km Run', 5, 12) RETURNING id`,
        [user.id]
      );
      const task3 = await db.query(
        `INSERT INTO tasks (user_id, title, current_streak, longest_streak)
         VALUES ($1, 'Read 20 Pages', 0, 8) RETURNING id`,
        [user.id]
      );

      console.log('✅ Seeded 3 default tasks.');

      // Seed 14 days of logs for task 1 (yesterday and prior)
      const now = new Date();
      for (let i = 1; i <= 14; i++) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i);
        d.setUTCHours(14, 30, 0, 0); // 8:00 PM IST = 14:30 UTC
        await db.query(
          'INSERT INTO task_logs (task_id, completed_at) VALUES ($1, $2)',
          [task1.rows[0].id, d]
        );
      }
      console.log('✅ Seeded 14 consecutive UTC logs for task 1.');
    } else {
      console.log('ℹ️ Tasks already seeded.');
    }

    console.log('🎉 Database initialization complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    console.error('If PostgreSQL is not running locally, set DATABASE_URL in streak-api/.env to a hosted instance (e.g., Supabase / Neon / Railway).');
    process.exit(1);
  }
}

initializeDatabase();
