const cron = require('node-cron');
const { Expo } = require('expo-server-sdk');
const User = require('../models/User');
const Task = require('../models/Task');
const TaskLog = require('../models/TaskLog');
const { isMongoConnected } = require('../db/mongo');
const { getLocalDateString } = require('../utils/streakCalculator');
const { mockUsers, getTasksForUser } = require('./taskService');

const expo = new Expo();

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

async function checkAndSendReminders() {
  console.log('[Notifier] Checking for users needing reminders at 8:00 PM local time...');
  const now = new Date();

  try {
    let eligibleUsers = [];

    if (isMongoConnected()) {
      eligibleUsers = await User.find({
        notification: 'enabled',
        expo_push_token: { $ne: null, $exists: true, $nin: [''] },
      });
    } else {
      eligibleUsers = mockUsers.filter(
        (u) => u.notification === 'enabled' && u.expo_push_token
      );
    }

    const messages = [];

    for (const user of eligibleUsers) {
      const userTz = user.timezone || 'Asia/Calcutta';

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

      if (localHour === 20) {
        const { tasks } = await getTasksForUser(user._id.toString());

        for (const task of tasks) {
          if (!task.completed_today) {
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

function initNotificationCron() {
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
