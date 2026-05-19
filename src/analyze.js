import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";

const DATA_FILE = "data/zalo-watch.json";
const MESSAGES_DIR = "data/messages";

function loadData() {
    if (!existsSync(DATA_FILE)) {
        return { tasks: [], agreements: [], important: [], scannedMessages: {} };
    }
    return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
}

function saveData(data) {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getNextId(items) {
    if (!items || items.length === 0) return 1;
    return Math.max(...items.map((i) => i.id)) + 1;
}

function loadMessages() {
    if (!existsSync(MESSAGES_DIR)) return [];
    const files = readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json"));
    const allMessages = [];
    for (const file of files) {
        const msgs = JSON.parse(readFileSync(`${MESSAGES_DIR}/${file}`, "utf-8"));
        allMessages.push(...msgs);
    }
    return allMessages;
}

/**
 * Analyze messages and extract tasks, agreements, and important info.
 * 
 * @param {Array} messages - Array of message objects
 * @param {Object} existingData - Existing data to merge with
 * @param {Function} analyzeFn - AI analysis function that takes messages and returns { tasks, agreements, important }
 */
function analyzeMessages(messages, existingData, analyzeFn) {
    const result = analyzeFn(messages);
    
    // Merge with existing data, avoiding duplicates
    for (const task of result.tasks || []) {
        const exists = existingData.tasks.some(
            (t) => t.source?.messageId === task.source?.messageId
        );
        if (!exists) {
            task.id = getNextId(existingData.tasks);
            task.status = "open";
            task.created_at = task.created_at || new Date().toISOString();
            task.updated_at = task.updated_at || new Date().toISOString();
            existingData.tasks.push(task);
        }
    }

    for (const agr of result.agreements || []) {
        const exists = existingData.agreements.some(
            (a) => a.source?.messageId === agr.source?.messageId
        );
        if (!exists) {
            agr.id = getNextId(existingData.agreements);
            agr.created_at = agr.created_at || new Date().toISOString();
            existingData.agreements.push(agr);
        }
    }

    for (const imp of result.important || []) {
        const exists = existingData.important.some(
            (i) => i.source?.messageId === imp.source?.messageId
        );
        if (!exists) {
            imp.id = getNextId(existingData.important);
            imp.created_at = imp.created_at || new Date().toISOString();
            existingData.important.push(imp);
        }
    }

    return existingData;
}

/**
 * CLI output of current data
 */
function printSummary(data) {
    console.log("\n=== Zalo Watch Summary ===\n");

    const openTasks = data.tasks.filter((t) => t.status === "open");
    const doneTasks = data.tasks.filter((t) => t.status === "done");

    console.log(`📋 Tasks: ${data.tasks.length} total (${openTasks.length} open, ${doneTasks.length} done)`);
    if (openTasks.length > 0) {
        console.log("  Open tasks:");
        for (const t of openTasks) {
            console.log(`    #${t.id} [${t.source?.chat || "?"}] ${t.title}`);
        }
    }

    console.log(`\n🤝 Agreements: ${data.agreements.length}`);
    for (const a of data.agreements) {
        console.log(`    #${a.id} [${a.source?.chat || "?"}] ${a.description.substring(0, 80)}...`);
    }

    console.log(`\n⚠️ Important: ${data.important.length}`);
    for (const i of data.important) {
        console.log(`    #${i.id} [${i.source?.chat || "?"}] ${i.description.substring(0, 80)}...`);
    }

    console.log(`\nLast scan: ${data.lastScan || "never"}`);
}

export { loadData, saveData, loadMessages, analyzeMessages, printSummary };
