import { getAPI } from "./session.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const DATA_FILE = "data/zalo-watch.json";
const SCAN_COUNT = 50;

function loadData() {
    if (!existsSync(DATA_FILE)) {
        console.log("No data file found. Run scan first.");
        process.exit(0);
    }
    return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
}

function saveData(data) {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function formatTimestamp(ts) {
    return new Date(parseInt(ts)).toISOString();
}

function formatDate(ts) {
    return formatTimestamp(ts).split("T")[0];
}

async function checkTaskInChat(api, task, data) {
    const source = task.source;
    if (!source || !source.chatId) return false;

    try {
        const history = await api.getGroupChatHistory(source.chatId, SCAN_COUNT);
        if (!history.groupMsgs) return false;

        // Look for messages that indicate task completion
        const completionPatterns = [
            /(?:готово|сделано|выполнено|завершено|закрыто|done|completed|finished|fixed|resolved|approved|подтверждено|согласовано)/i,
            /(?:окей|ок|хорошо|отлично|супер|класс|молодец|спасибо|thanks|thank you)/i,
        ];

        const taskKeywords = task.title.toLowerCase().split(" ").filter((w) => w.length > 3);

        for (const msg of history.groupMsgs) {
            if (typeof msg.data.content !== "string") continue;
            if (msg.isSelf) continue;

            const text = msg.data.content.toLowerCase();

            // Check if message is related to the task
            const isRelated = taskKeywords.some((kw) => text.includes(kw));
            if (!isRelated) continue;

            // Check if it indicates completion
            const isComplete = completionPatterns.some((p) => p.test(text));
            if (isComplete) {
                return {
                    found: true,
                        message: msg.data.content,
                        sender: msg.data.dName || msg.data.uidFrom,
                        date: formatDate(msg.data.ts),
                };
            }
        }

        return { found: false };
    } catch (err) {
        console.error(`    Error checking task in chat ${source.chat}:`, err.message);
        return { found: false, error: err.message };
    }
}

async function main() {
    console.log("=== Zalo Watch - Check Tasks ===");
    const api = await getAPI();
    const data = loadData();

    const openTasks = data.tasks.filter((t) => t.status === "open");
    console.log(`Checking ${openTasks.length} open tasks...\n`);

    let updated = 0;

    for (const task of openTasks) {
        console.log(`  [Task #${task.id}] ${task.title}`);
        const result = await checkTaskInChat(api, task, data);

        if (result.found) {
            console.log(`    ✅ Possibly completed!`);
            console.log(`       ${result.sender} (${result.date}): ${result.message}`);
            task.status = "done";
            task.updated_at = new Date().toISOString();
            task.completionEvidence = {
                message: result.message,
                sender: result.sender,
                date: result.date,
            };
            updated++;
        } else if (result.error) {
            console.log(`    ⚠️ Error: ${result.error}`);
        } else {
            console.log(`    ⏳ No completion evidence found`);
        }
    }

    saveData(data);

    console.log("\n=== Check Complete ===");
    console.log(`Tasks checked: ${openTasks.length}`);
    console.log(`Tasks marked done: ${updated}`);
    console.log(`Remaining open: ${data.tasks.filter((t) => t.status === "open").length}`);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
