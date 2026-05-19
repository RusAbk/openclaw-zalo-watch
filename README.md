# Zalo Watch — OpenClaw Skill

Monitor Zalo conversations (both Group and Personal 1-on-1 chats) in real-time, extract tasks/agreements/important info, and track task completion status.

## What it does

- **Interactive Terminal Login**: Generates Zalo login QR codes directly inside your terminal stdout as clean ASCII graphics using dynamic QR decoding.
- **Real-Time Listener Daemon**: Leverages WebSocket connection under the hood to continuously capture incoming messages from both **Group and Personal (1-on-1) chats**.
- **PM2 Built-in Daemon Management**: Easily start, stop, check status, and monitor daemon logs in the background.
- **Information Extractor**: Scans and parses collected messages to extract tasks, agreements, and important information.
- **Task Tracking**: Automatically checks open tasks against recent messages in their respective source chats to track completion status.

## Requirements

- Node.js v18+
- Active Zalo personal account
- PM2 (automatically installed as a dependency)

## Installation

```bash
git clone https://github.com/<your-username>/openclaw-zalo-watch.git
cd openclaw-zalo-watch
npm install
```

---

## Usage

### 1. Login to Zalo (One-Time Setup)

```bash
npm run login
```

This starts the authentication client, dynamically decodes the Zalo server QR code, and prints a **clean ASCII QR art** directly into your terminal. Scan it with your Zalo mobile app (**Settings → Scan QR**). The session will be saved automatically to `data/session.json`.

---

### 2. Start the Real-Time Background Daemon (PM2)

Since Zalo's API does not allow fetching historical personal (1-on-1) chat logs, a real-time listener daemon is used to continuously capture incoming messages in the background.

To start and manage the daemon:

*   **Start the daemon**:
    ```bash
    npm run daemon:start
    ```
    *This runs the listener under PM2 with the process name `zalo-watch`.*

*   **Check status**:
    ```bash
    npm run daemon:status
    ```

*   **View real-time logs**:
    ```bash
    npm run daemon:logs
    ```

*   **Stop the daemon**:
    ```bash
    npm run daemon:stop
    ```

All captured messages are instantly saved to `data/messages/` in an array format compatible with `analyze.js`.

---

### 3. Analyze Messages (AI Extraction)

Once messages are collected (via the real-time daemon or batch group scan), they are processed to extract structured information:

*   **Tasks** — Action items, assignments, or expectations.
*   **Agreements** — Commitments, decisions, or consensus points.
*   **Important** — Blockers, announcements, or urgent status updates.

Results are compiled into `data/zalo-watch.json`.

---

### 4. Check Task Completion

```bash
npm run check-tasks
```

Reviews all open tasks inside `data/zalo-watch.json`, cross-references recent chat messages, and updates task statuses to `"done"` if it matches completion phrases (e.g. "готово", "сделано", "done").

---

## File Structure

```
openclaw-zalo-watch/
├── SKILL.md              # OpenClaw skill instructions for AI agents
├── README.md             # This file
├── package.json
├── .gitignore
├── data/
│   ├── session.json      # Zalo session keys (auto-generated, do not commit)
│   ├── qr.png            # Downloaded QR code image (auto-generated)
│   ├── zalo-watch.json   # Unified JSON database for tasks/agreements/alerts
│   └── messages/         # Saved raw messages
└── src/
    ├── session.js        # Session parser
    ├── login.js          # QR login with dynamic decoding
    ├── listen.js         # Real-time WebSocket listener daemon
    ├── scan.js           # Batch group history scanner
    ├── check-tasks.js    # Task completion heuristic checker
    └── analyze.js        # Main message parsing & merging library
```

---

## Notes

- **Personal (1-on-1) Chats**: Fully supported in real-time when the PM2 daemon is running.
- **Single Session Limitation**: Only **one** WebSocket listener session can be active per Zalo account. Opening Zalo Web in another browser while the daemon is listening will drop the socket connection.
- **Uses [zca-js](https://github.com/RFS-ADRENO/zca-js)**: Unofficial Zalo API wrapper for personal accounts.

## Disclaimer

This tool uses an unofficial Zalo API. Using it may violate Zalo's terms of service and could result in account restrictions. Use at your own risk.
