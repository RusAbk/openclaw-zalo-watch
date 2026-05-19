# Zalo Watch — OpenClaw Skill

Monitor Zalo conversations (both Group and Personal 1-on-1 chats), extract tasks/agreements/important info, and track task completion in real-time.

## When to use

Use this skill when the user asks to:
- Monitor Zalo chats for tasks, agreements, or important information.
- Run a real-time background daemon to capture new messages continuously.
- Check if existing tasks have been completed in Zalo conversations.
- Log in to Zalo via QR code.

## Prerequisites

- Node.js v18+
- Active Zalo account
- Dependencies installed (`npm install`)

---

## Step-by-Step Agent Execution Guide

To ensure high reliability and avoid any operational failures, follow these steps in order:

### Step 1: Install Dependencies
Run `npm install` inside the skill directory:
```bash
npm install
```

### Step 2: Zalo Authentication
Run the interactive login command:
```bash
npm run login
```
1. This launches the login client, fetches a Zalo Web session, and prints an **ASCII QR Code** directly into stdout.
2. **IMPORTANT**: Read the terminal/task log containing this ASCII QR code and immediately render/print it to the user's communication channel (e.g., chat/telegram/slack) as a code block.
3. The QR code expires in **~30-60 seconds**. Zalo automatically regenerates new codes when they expire. Send the updated code/link to the user immediately if it regenerates.
4. Once the user scans and approves on their phone, the session will be saved to `data/session.json`.

---

### Step 3: Run the Autonomous Background Daemon via PM2

> [!IMPORTANT]
> **Zalo API Limitation**: Zalo's Web/PC API (`zca-js`) does not allow fetching historical personal (1-on-1) messages. The only way to capture personal chat correspondence is to run a real-time WebSocket listener daemon in the background using PM2.

To manage the autonomous background daemon:

1. **Start the daemon**:
   ```bash
   npm run daemon:start
   ```
   This spawns the background listener under PM2 with the name `zalo-watch` (`pm2 start src/listen.js --name zalo-watch`).

2. **Monitor the daemon**:
   ```bash
   npm run daemon:status   # View process status and uptime
   npm run daemon:logs     # Stream real-time logs/captured messages
   ```

3. **Stop the daemon**:
   ```bash
   npm run daemon:stop     # Stops and shuts down the daemon process
   ```

4. **How it works**:
   - The daemon connects via Zalo WebSockets and is automatically restarted by PM2 upon crash or system reboot.
   - It listens to all incoming group and personal (1-on-1) messages.
   - It dynamically resolves group names and user display names.
   - Messages are saved directly as single-element JSON arrays `[msgData]` in `data/messages/listen-${threadId}-${msgId}.json`. This format ensures perfect compatibility with the parsing workflow of `analyze.js`.

5. **Crucial Limitations**:
   - **Single Active Session**: Only **one** WebSocket listener session can be active per Zalo account at any time. Opening Zalo in another browser or starting a second listener daemon will drop the connection.
   - **Auto-Recovery**: The daemon is configured with `retryOnClose: true` to automatically reconnect if Zalo momentarily drops the socket connection.

---

### Step 4: Analyze Captured Messages (AI Parsing)
To parse captured messages (whether scanned historically or logged in real-time by the listener daemon):
1. Load all message files from `data/messages/`.
2. Extract:
   - **Tasks**: Title, description, source details (chat name, sender, date, message ID). Tasks are created with `status: "open"`.
   - **Agreements**: Commitments, decisions, consensus.
   - **Important**: Urgent blocks, contacts, announcements.
3. Merge extracted items into `data/zalo-watch.json` using unique message ID matching to prevent duplicate records.

---

### Step 5: Check Task Completion
Run the task completion check script:
```bash
npm run check
```
This script reviews all open tasks in `data/zalo-watch.json`, scans recent correspondence in the respective chats, and updates the task status to `"done"` if it detects completion indicators (e.g. "готово", "сделано", "done").

---

## Data Structures & Files

- **Session Configuration**: `data/session.json` (Stores Zalo cookies and keys).
- **Extracted Analytics**: `data/zalo-watch.json` (Structured JSON containing tasks, agreements, and alerts).
- **Captured raw messages**: `data/messages/` (Each message file is a JSON array of objects).
- **QR Code Cache**: `data/qr.png` (Last generated QR code image).

## Error Recovery Checklists

- **Authentication Failure**: If you get "Session expired" or similar errors, delete `data/session.json` and repeat **Step 2 (Authentication)**.
- **WebSocket Disconnection (Code 1006 / 1008)**: Zalo closed the connection. Usually indicates that another device or browser logged in. Verify that no other active listener is running, and restart the `npm run listen` background task.
