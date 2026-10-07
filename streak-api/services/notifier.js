const cron = require('node-cron');
const { Expo } = require('expo-server-sdk');
const db = require('../db');
const { getLocalDateString } = require('../utils/streakCalculator');

// Initialize Expo SDK client
const expo = new Expo();

/**
 * Sends push notifications to a list of messages using Expo Push API
 * @param {Array<Object>} messages 
 */
async function sendExpoPushNotifications(messages) {
  if (!messages || messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending Expo push notification chunk:', error);
    }
  }

  return tickets;
}

/**
 * Checks all users whose local time is 8:00 PM (20:00) and who have incomplete tasks for today.
 * Triggers reminder push notifications.
 */
async function checkAndSendReminders() {
  console.log('[Notifier] Checking for users needing reminders at 8:00 PM local time...');
  const now = new Date();

  try {
    // 1. Fetch users with valid Expo push tokens
    const usersResult = await db.query(
      `SELECT id, email, timezone, expo_push_token FROM users WHERE expo_push_token IS NOT NULL AND expo_push_token != ''`
    );

    const users = usersResult.rows;
    const messages = [];

    for (const user of users) {
      const userTz = user.timezone || 'UTC';

      // Check current local hour in user's timezone
      let localHour;
      try {
        const hourFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: userTz,
          hour: 'numeric',
          hour12: false,
        });
        localHour = parseInt(hourFormatter.format(now), 10);
      } catch (err) {
        localHour = now.getUTCHours();
      }

      // If it's 8:00 PM (hour 20) in the user's timezone
      if (localHour === 20) {
        const todayLocal = getLocalDateString(now, userTz);

        // Fetch user's tasks
        const tasksResult = await db.query(
          `SELECT t.id, t.title, t.current_streak,
                  (SELECT completed_at FROM task_logs tl WHERE tl.task_id = t.id ORDER BY completed_at DESC LIMIT 1) as last_completed_at
           FROM tasks t
           WHERE t.user_id = $1`,
          [user.id]
        );

        for (const task of tasksResult.rows) {
          const lastCompletedAt = task.last_completed_at;
          const completedToday = lastCompletedAt && getLocalDateString(lastCompletedAt, userTz) === todayLocal;

          // If task is not completed today
          if (!completedToday) {
            const streakCount = task.current_streak || 0;
            const body = streakCount > 0
              ? `You are about to lose your ${streakCount}-day "${task.title}" streak!`
              : `Don't forget to complete your task "${task.title}" today!`;

            if (Expo.isExpoPushToken(user.expo_push_token)) {
              messages.push({
                to: user.expo_push_token,
                sound: 'default',
                title: '🔥 Task Streak Alert',
                body,
                data: { taskId: task.id, title: task.title },
              });
            }
          }
        }
      }
    }

    if (messages.length > 0) {
      console.log(`[Notifier] Sending ${messages.length} push notification reminders...`);
      await sendExpoPushNotifications(messages);
    } else {
      console.log('[Notifier] No reminders needed for current hour window.');
    }
  } catch (error) {
    console.error('[Notifier] Error in checkAndSendReminders:', error.message);
  }
}

/**
 * Starts the hourly cron job to monitor and send streak reminders.
 */
function initNotificationCron() {
  // Run at the top of every hour (0 * * * *)
  cron.schedule('0 * * * *', () => {
    console.log('[Notifier Cron] Running hourly streak reminder job...');
    checkAndSendReminders();
  });
  console.log('[Notifier Cron] Hourly streak reminder scheduler initialized.');
}

module.exports = {
  checkAndSendReminders,
  initNotificationCron,
  sendExpoPushNotifications,
};
