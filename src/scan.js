import { getAPI } from "./session.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const DATA_FILE = "data/zalo-watch.json";
const MESSAGES_DIR = "data/messages";
const SCAN_COUNT = 50;

function ensureDir(dir) {
    if (!existsSync(dir)) {
        const { mkdirSync } = require("node:fs");
        mkdirSync(dir, { recursive: true });
    }
}

function loadData() {
    if (!existsSync(DATA_FILE)) {
        return { tasks: [], agreements: [], important: [], lastScan: null, scannedMessages: {} };
    }
    return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
}

function saveData(data) {
    data.lastScan = new Date().toISOString();
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function formatTimestamp(ts) {
    return new Date(parseInt(ts)).toISOString();
}

function formatDate(ts) {
    return formatTimestamp(ts).split("T")[0];
}

async function scanGroup(api, groupInfo, data) {
    const groupId = groupInfo.groupId;
    const groupName = groupInfo.name || "Unknown Group";

    console.log(`  Scanning group: ${groupName} (${groupId})`);

    try {
        const history = await api.getGroupChatHistory(groupId, SCAN_COUNT);
        if (!history.groupMsgs || history.groupMsgs.length === 0) {
            console.log(`    No messages found`);
            return [];
        }

        console.log(`    Found ${history.groupMsgs.length} messages`);

        const messages = [];
        for (const msg of history.groupMsgs) {
            if (typeof msg.data.content !== "string") continue;

            const msgData = {
                msgId: msg.data.msgId,
                chatName: groupName,
                chatId: groupId,
                type: "group",
                sender: msg.data.dName || msg.data.uidFrom,
                senderId: msg.data.uidFrom,
                isSelf: msg.isSelf,
                content: msg.data.content,
                timestamp: formatTimestamp(msg.data.ts),
                date: formatDate(msg.data.ts),
            };

            messages.push(msgData);

            // Track scanned messages to avoid reprocessing
            if (!data.scannedMessages) data.scannedMessages = {};
            data.scannedMessages[msg.data.msgId] = true;
        }

        // Save raw messages for AI analysis
        ensureDir(MESSAGES_DIR);
        const msgFile = `${MESSAGES_DIR}/${groupId}-${Date.now()}.json`;
        writeFileSync(msgFile, JSON.stringify(messages, null, 2));
        console.log(`    Saved to ${msgFile}`);

        return messages;
    } catch (err) {
        console.error(`    Error scanning group ${groupName}:`, err.message);
        return [];
    }
}

async function main() {
    console.log("=== Zalo Watch - Scan ===");
    const api = await getAPI();
    const data = loadData();

    console.log("Fetching groups...");
    const groups = await api.getAllGroups();
    const groupIds = Object.keys(groups.gridVerMap || {});
    console.log(`Found ${groupIds.length} groups`);

    let totalMessages = 0;

    for (const groupId of groupIds) {
        try {
            const info = await api.getGroupInfo(groupId);
            const groupInfo = info.gridInfoMap?.[groupId];
            if (groupInfo) {
                const msgs = await scanGroup(api, groupInfo, data);
                totalMessages += msgs.length;
            }
        } catch (err) {
            console.error(`  Error getting info for group ${groupId}:`, err.message);
        }
    }

    saveData(data);

    console.log("\n=== Scan Complete ===");
    console.log(`Groups scanned: ${groupIds.length}`);
    console.log(`Total messages collected: ${totalMessages}`);
    console.log(`Data saved to ${DATA_FILE}`);
    console.log(`Raw messages saved to ${MESSAGES_DIR}/`);
    console.log("\nNext step: run AI analysis on the collected messages.");
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
