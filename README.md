# 🔥 TaskStreak — Cross-Platform Habit & Task Tracker

> A resilient, timezone-aware cross-platform habit tracker built with **React (Next.js)**, **React Native (Expo)**, and a unified **Node.js/Express + PostgreSQL** backend.

---

## 🚀 4. Quick Start Guide

### Prerequisites
- **Node.js** (v20+ recommended)
- **npm** (v10+)
- *(Optional)* **PostgreSQL** (The API automatically operates in high-fidelity mock fallback mode if PostgreSQL is not active locally!)

---

### Step 1: Start the Backend API (`/streak-api`)

```bash
cd streak-api
npm install
npm run dev
```

Server will start on `http://localhost:5000`.

To run the streak engine test suite:
```bash
npm test
```

---

### Step 2: Start the Web Dashboard (`/streak-web`)

```bash
cd streak-web
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

### Step 3: Start the Mobile App (`/streak-mobile`)

```bash
cd streak-mobile
npm install
npx expo start
```

Press `w` to open in web browser, or scan the QR code using the **Expo Go** app on iOS / Android.

---

## 🛡️ License
MIT License.
