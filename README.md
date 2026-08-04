# Facebook Post Sharing Automation

A full-stack automation tool and dashboard for auto-sharing Facebook posts to joined Facebook groups using **Playwright**, **Node.js Express**, and a **Real-Time Web UI Dashboard**.

---

## 🚀 Key Features

- 🔑 **1-Click Facebook Authentication**: Launches a visible browser for safe, manual Facebook login. Cookies and sessions are preserved in a local persistent Chrome profile (`user_data/chrome_profile`).
- 🔎 **Real-Time Group Search**: Instantly filter loaded Facebook groups as you type in the search box, complete with quick **Select All Filtered** and **Deselect All** bulk controls.
- 🔍 **Automated Group Discovery & Presets**: Scans joined groups and allows saving custom **Group Presets** (e.g. "Tech Groups", "Marketing Groups") persistent on disk (`user_data/group_presets.json`).
- ⚡ **Background Sharing Engine**: Auto-shares any target Facebook post to selected groups with customizable captions and link preview support.
- 🧪 **Dry-Run / Simulation Mode**: Test post sharing safely! Fills the group post box and link preview card, but skips clicking publish.
- 🛡️ **Anti-Spam & De-duplication History**: Automatically logs share history (`user_data/share_history.json`) and skips groups if the post was already shared within a configurable cooldown period (e.g. 7 or 30 days) to prevent group admin spam flags.
- 📡 **Real-Time WebSocket Log Stream**: Live dashboard terminal streaming every step, status update, and log message directly to your browser.
- 🎨 **Modern Web UI Dashboard**: Clean dark-mode control panel for managing logins, group search, presets, dry-run testing, history logs, and live execution.

---

## 🏗️ Architecture Overview

```
automation-sharing-facebook-post/
├── backend/
│   ├── index.js             # Express server & WebSocket initialization
│   ├── lib/
│   │   ├── auth.js          # Facebook session status & login launcher
│   │   ├── browser.js       # Playwright browser instance manager
│   │   ├── discovery.js     # Facebook group extraction engine
│   │   ├── facebook-core.js # Main automation orchestrator
│   │   ├── history.js       # Anti-spam history & group preset manager
│   │   ├── sharing.js       # Post sharing automation pipeline (with Dry-Run support)
│   │   └── utils.js         # Logging & delay helpers
│   ├── routes/
│   │   └── api.js           # REST API endpoints
│   └── websocket/
│       └── logger.js        # Real-time WebSocket log streamer
├── frontend/
│   ├── index.html           # Web Dashboard interface with Real-Time Group Search
│   ├── app.js               # Frontend UI logic, Real-time Group Search & Presets Manager
│   └── styles.css           # Modern dark-mode styling
├── tests/                   # Automated API test suite
├── user_data/               # Persistent browser session storage, group presets & share history
└── index.js                 # Application entry point
```

---

## 📦 Prerequisites & Installation

### Requirements
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Operating System**: Windows, macOS, or Linux

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/savewaris/automation-sharing-facebook-post.git
   cd automation-sharing-facebook-post
   ```

2. **Install Node Dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright Chromium Browser Binaries**
   ```bash
   npx playwright install chromium
   ```

4. **Environment Setup (Optional)**
   Create a `.env` file in the root directory if you want to customize the server port:
   ```env
   PORT=3000
   ```

---

## 🚦 How to Run & Use the System

### 1. Launch the Server
Start the backend server and web dashboard:
```bash
npm start
```
Upon starting, you will see the confirmation message:
```
====================================================
🚀 Facebook Automation Dashboard: http://localhost:3000
📡 WebSocket Log Stream: ws://localhost:3000/ws/logs
====================================================
```

### 2. Open the Web Dashboard
Open your browser and navigate to:
[http://localhost:3000](http://localhost:3000)

---

## 📖 Detailed Feature Walkthrough

### 1. Real-Time Group Search & Presets
- **Real-Time Search**: Type any group name or keyword in the **"🔎 Search groups by name or URL in real-time..."** input box. The group list will update instantly as you type.
- **Bulk Select All Filtered**: Search for a keyword (e.g. *"Crypto"* or *"Tech"*), then click **"☑️ Select All Filtered"** to select all matching groups at once.
- **Save Presets**: Click **"💾 Save Selected as Preset"** to save your filtered selection into a custom named group list (e.g., *Crypto Groups*). Presets are saved in `user_data/group_presets.json`.
- **Load Presets**: Select any saved preset from the dropdown menu to instantly load and check those groups.

---

### 2. Anti-Spam History Log & De-duplication
To prevent group admins from marking your account as spam:
- **Automatic History Logging**: Every successful or dry-run post is recorded in `user_data/share_history.json`.
- **Cooldown Protection**: Set the **Anti-Spam Cooldown (Days)** (default: `7` days). If you attempt to share a post URL to a group it was already shared to within the cooldown period, the system will **automatically skip that group** and log a warning.
- **Bypass Cooldown**: Check **"Allow Duplicate Sharing"** if you explicitly want to re-post to the same group regardless of history.
- **View History**: Click **"📜 View Share History"** on the dashboard to inspect past shares.

---

### 3. Safe Testing: How to Test Sharing
You do **not** have to risk your primary account or spam live groups during development/testing:

#### Method A: Dry-Run / Simulation Mode (Built-In)
1. On the Web Dashboard, check the **"🧪 Dry-Run Mode (Simulation only)"** checkbox.
2. Click **"Start Sharing Task"**.
3. Playwright will navigate to each target group, click the post box, type your caption, and generate the link preview card—**without clicking the final "Post" button**.
4. You can observe the exact behavior in real-time without publishing any live posts to Facebook.

#### Method B: Secondary / Throwaway Facebook Account
1. Launch the login browser via **"🌐 Launch Chrome Login Window"**.
2. Log into a secondary or test Facebook account instead of your primary personal account.
3. The session profile will be stored isolated in `user_data/chrome_profile`, allowing safe test runs.

---

## 📄 License

[ISC](LICENSE) - Free to use and modify for personal automation projects.
