# 🔥 TaskStreak — Cross-Platform Habit & Task Tracker

> A habit tracker with seamless Web & Mobile interfaces powered having completion logs, streak freezes, and automated push notifications.

## 💡 Overview

Most habit trackers fail at boundary conditions: they evaluate midnight in UTC, break streaks when users travel across timezones, or store streaks as arbitrary mutable counters (`current_streak = 5`) that are prone to client-side manipulation and desynchronization.

**TaskStreak** solves this with a modern full-stack architecture:
- **Shared Backend Logic**: Both Web and Mobile clients consume the same Express + oRPC backend, guaranteeing identical streak calculations, lock states, and history.
- **True Timezone Precision**: Completed tasks are recorded in pure UTC, but evaluated against each user's specific IANA timezone (e.g. `Asia/Calcutta`, `America/New_York`, `Europe/London`).
- **Cheat-Proof & Once-Per-Day Lock**: Once completed for the day in the user's local timezone, the action button locks until the next local calendar day arrives.
- **Per-User Isolation**: Built-in JWT authentication ensures each authenticated user exclusively accesses and manages their own habits and streaks.
- **Streak Freezes**: Missed a single day? Available streak freezes automatically protect user streaks without breaking momentum.
- **Push Notification Toggle**: Users can enable or disable 8:00 PM alerts directly in settings; background cron checks user preferences before dispatching notifications.
- **Contribution Heatmap**: Visual 365-day GitHub-style activity grid showing consistency and momentum over time.

## 🏃‍♂️ Running

### 1. API

```code
> npm run api
```

### 2. Start the App

```code
> npm run web

> npm run mobile
```