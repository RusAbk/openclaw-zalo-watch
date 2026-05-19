import { getAPI } from "./session.js";
import { ThreadType } from "zca-js";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";

const MESSAGES_DIR = "data/messages";

function ensureDir(dir) {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

const chatNamesCache = new Map();

async function getChatName(api, threadId, type, dName) {
    if (chatNamesCache.has(threadId)) return chatNamesCache.get(threadId);

    if (type === ThreadType.Group) {
        try {
            const info = await api.getGroupInfo(threadId);
            const name = info.gridInfoMap?.[threadId]?.name || `Group Chat (${threadId})`;
            chatNamesCache.set(threadId, name);
            return name;
        } catch {
            return `Group Chat (${threadId})`;
        }
    } else {
        const name = dName || `User (${threadId})`;
        chatNamesCache.set(threadId, name);
        return name;
    }
}

async function main() {
    console.log("=========================================");
    console.log("   Zalo Watch - Real-Time Message Listener");
    console.log("=========================================\n");

    const api = await getAPI();

    console.log("🔌 Connecting to Zalo WebSocket...");

    api.listener.on("connected", () => {
        console.log("\n🟢 WebSocket connected successfully!");
        console.log("🎧 Listening for incoming messages (1-on-1 and Group chats)...");
        console.log("💡 (Note: Only one listener session can be active per account.)\n");
    });

    api.listener.on("disconnected", (code, reason) => {
        console.log(`\n🔴 WebSocket disconnected! Code: ${code}, Reason: ${reason}`);
    });

    api.listener.on("closed", (code, reason) => {
        console.log(`\n❌ WebSocket connection closed permanently. Code: ${code}, Reason: ${reason}`);
    });

    api.listener.on("error", (error) => {
        console.error(`\n⚠️ WebSocket error:`, error);
    });

    api.listener.on("message", async (message) => {
        const isPlainText = typeof message.data.content === "string";
        if (!isPlainText) return;

        const isGroup = message.type === ThreadType.Group;
        const chatType = isGroup ? "group" : "user";
        
        // Resolve display name for the chat/thread
        const chatName = await getChatName(api, message.threadId, message.type, message.data.dName);
        const sender = message.data.dName || message.data.uidFrom || "Unknown";
        
        const timestamp = parseInt(message.data.ts);
        const dateStr = new Date(timestamp).toISOString();

        console.log(`[${dateStr.slice(11, 19)}] [${isGroup ? "GROUP" : "PERSONAL"}] [${chatName}] ${sender}: ${message.data.content}`);

        const msgData = {
            msgId: message.data.msgId,
            chatName: chatName,
            chatId: message.threadId,
            type: chatType,
            sender: sender,
            senderId: message.data.uidFrom,
            isSelf: message.isSelf,
            content: message.data.content,
            timestamp: dateStr,
            date: dateStr.split("T")[0],
        };

        try {
            ensureDir(MESSAGES_DIR);
            // Save as an array [msgData] so analyze.js can parse it seamlessly
            const msgFile = `${MESSAGES_DIR}/listen-${message.threadId}-${message.data.msgId}.json`;
            writeFileSync(msgFile, JSON.stringify([msgData], null, 2));
        } catch (err) {
            console.error(`  ❌ Failed to save message to disk:`, err.message);
        }
    });

    // Start listening and auto-retry on drop/close
    api.listener.start({ retryOnClose: true });
}

main().catch((err) => {
    console.error("Fatal listener error:", err);
    process.exit(1);
});
