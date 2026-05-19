# Zalo Watch — OpenClaw Skill

Monitor Zalo conversations, extract tasks/agreements/important info, and track task completion status.

## What it does

- **Login** to Zalo via QR code (one-time setup)
- **Scan** all group chats and collect recent messages
- **Analyze** messages to extract tasks, agreements, and important information
- **Track** task completion by checking for follow-up messages

## Requirements

- Node.js v18+
- Active Zalo personal account
- OpenClaw agent (to run AI analysis)

## Installation

```bash
git clone https://github.com/<your-username>/openclaw-zalo-watch.git
cd openclaw-zalo-watch
npm install
```

## Usage

### 1. Login to Zalo

```bash
npm run login
```

This generates a QR code at `data/qr.png`. Scan it with the Zalo mobile app (Settings → Scan QR). Session credentials are saved automatically.

### 2. Scan conversations

```bash
npm run scan
```

Fetches recent messages from all Zalo groups and saves raw data to `data/messages/`.

### 3. Analyze messages

After scanning, the collected messages should be analyzed to extract:

- **Tasks** — action items, requests, things someone needs to do
- **Agreements** — decisions made, things people agreed on
- **Important** — urgent info, blockers, critical updates

Results are stored in `data/zalo-watch.json`.

### 4. Check task completion

```bash
npm run check-tasks
```

Checks open tasks against recent messages in their source chats, looking for completion indicators (e.g. "готово", "сделано", "done", "completed").

## Data format

`data/zalo-watch.json`:

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Brief task title",
      "description": "**Original message excerpt**\n\nFull message: ...",
      "source": {
        "chat": "Group Name",
        "chatId": "123456",
        "type": "group",
        "date": "2026-05-19",
        "sender": "Sender Name",
        "messageId": "msg_abc123"
      },
      "status": "open",
      "created_at": "2026-05-19T12:00:00Z",
      "updated_at": "2026-05-19T12:00:00Z"
    }
  ],
  "agreements": [
    {
      "id": 1,
      "description": "**Agreement excerpt**\n\nFull message: ...",
      "source": { "chat": "...", "chatId": "...", "type": "group", "date": "...", "sender": "...", "messageId": "..." },
      "created_at": "2026-05-19T12:00:00Z"
    }
  ],
  "important": [
    {
      "id": 1,
      "description": "**Important info**\n\nFull message: ...",
      "source": { "chat": "...", "chatId": "...", "type": "group", "date": "...", "sender": "...", "messageId": "..." },
      "created_at": "2026-05-19T12:00:00Z"
    }
  ],
  "scannedMessages": {
    "msg_abc123": true
  },
  "lastScan": "2026-05-19T12:00:00Z"
}
```

## File structure

```
openclaw-zalo-watch/
├── SKILL.md              # OpenClaw skill instructions
├── README.md             # This file
├── package.json
├── .gitignore
├── data/
│   ├── session.json      # Zalo session (auto-generated, do not commit)
│   ├── qr.png            # QR code for login (auto-generated)
│   ├── zalo-watch.json   # Extracted tasks/agreements/important
│   └── messages/         # Raw scanned messages
└── src/
    ├── session.js        # Session management
    ├── login.js          # QR login script
    ├── scan.js           # Message collection script
    ├── check-tasks.js    # Task completion checker
    └── analyze.js        # Analysis utilities
```

## Notes

- Only group chat history is currently supported
- Personal (1-on-1) chat history requires a different API approach
- Task completion checking uses keyword heuristics — results are suggestive, not definitive
- Session persists until Zalo expires it; re-run `npm run login` if auth fails
- Uses [zca-js](https://github.com/RFS-ADRENO/zca-js) — unofficial Zalo API for personal accounts

## Disclaimer

This tool uses an unofficial Zalo API. Using it may violate Zalo's terms of service and could result in account restrictions. Use at your own risk.
