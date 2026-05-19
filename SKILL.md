# Zalo Watch — OpenClaw Skill

Monitor Zalo conversations, extract tasks/agreements/important info, and track task completion.

## When to use

Use this skill when Руслан asks to:
- Scan Zalo chats for tasks, agreements, or important information
- Check if existing tasks have been completed in Zalo conversations
- Get a summary of open tasks/agreements from Zalo
- Log in to Zalo via QR code

## Prerequisites

- Node.js v18+
- `zca-js` installed (`npm install` in skill directory)
- Active Zalo account

## Setup

1. Install dependencies:
   ```bash
   cd ~/.openclaw/skills/openclaw-zalo-watch && npm install
   ```

2. Log in to Zalo (one-time):
   ```bash
   npm run login
   ```
   This generates a QR code at `data/qr.png`. Scan it with the Zalo app.
   Session credentials are saved to `data/session.json`.

## Workflow

### 1. Scan for new information

```bash
npm run scan
```

This fetches recent messages from all Zalo groups and saves raw messages to `data/messages/`.
After scanning, analyze the messages to extract tasks/agreements/important info.

### 2. Analyze messages (AI step)

After running `scan`, read the message files from `data/messages/` and analyze them:

For each message, determine if it contains:
- **Task**: Someone is asked/expected to do something. Extract: title, description, source (chat, sender, date, message ID).
- **Agreement**: A decision was made or something was agreed upon. Extract: description, source.
- **Important**: Urgent info, blockers, critical updates. Extract: description, source.

Add extracted items to `data/zalo-watch.json`:
- Tasks get `status: "open"`, unique auto-incrementing `id`
- Avoid duplicates by checking if `source.messageId` already exists

### 3. Check task completion

```bash
npm run check-tasks
```

This checks open tasks against recent messages in their source chats, looking for completion indicators (готово, сделано, done, etc.).

### 4. Get summary

Read `data/zalo-watch.json` and present:
- Open tasks (with source chat and date)
- Recent agreements
- Important items

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
      "source": { ... },
      "created_at": "2026-05-19T12:00:00Z"
    }
  ],
  "important": [
    {
      "id": 1,
      "description": "**Important info**\n\nFull message: ...",
      "source": { ... },
      "created_at": "2026-05-19T12:00:00Z"
    }
  ],
  "scannedMessages": {
    "msg_abc123": true
  },
  "lastScan": "2026-05-19T12:00:00Z"
}
```

## File locations

- Skill directory: `~/.openclaw/skills/openclaw-zalo-watch/`
- Session: `~/.openclaw/skills/openclaw-zalo-watch/data/session.json`
- Data: `~/.openclaw/skills/openclaw-zalo-watch/data/zalo-watch.json`
- Raw messages: `~/.openclaw/skills/openclaw-zalo-watch/data/messages/`
- QR code: `~/.openclaw/skills/openclaw-zalo-watch/data/qr.png`

## Notes

- Only group chat history is supported (personal chats require a different API approach)
- The `scan` script collects raw messages; AI analysis is done separately
- Task completion checking uses keyword heuristics — results are suggestive, not definitive
- Session persists until Zalo expires it; re-run `npm run login` if auth fails
