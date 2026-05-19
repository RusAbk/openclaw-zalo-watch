import { Zalo } from "zca-js";
import { readFileSync, existsSync } from "node:fs";

const SESSION_FILE = "data/session.json";

export function loadSession() {
    if (!existsSync(SESSION_FILE)) return null;
    try {
        return JSON.parse(readFileSync(SESSION_FILE, "utf-8"));
    } catch {
        return null;
    }
}

export async function getAPI() {
    const session = loadSession();
    if (!session) {
        console.log("No session found. Please run: npm run login");
        process.exit(1);
    }

    const zalo = new Zalo();
    const api = await zalo.login({
        cookie: session.cookie,
        imei: session.imei,
        userAgent: session.userAgent,
    });

    return api;
}
