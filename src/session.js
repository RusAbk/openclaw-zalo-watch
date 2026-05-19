import { Zalo } from "zca-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SESSION_FILE = "data/session.json";

export function saveSession(credentials) {
    writeFileSync(SESSION_FILE, JSON.stringify(credentials, null, 2));
    console.log("Session saved to", SESSION_FILE);
}

export function loadSession() {
    if (!existsSync(SESSION_FILE)) return null;
    try {
        return JSON.parse(readFileSync(SESSION_FILE, "utf-8"));
    } catch {
        return null;
    }
}

export async function loginQR() {
    const zalo = new Zalo();

    console.log("Generating QR code...");
    console.log("Scan the QR code in the Zalo app (Settings -> Scan QR)");

    const api = await zalo.loginQR(
        {
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
            qrPath: "data/qr.png",
        },
        (event) => {
            if (event.type === "qr") {
                console.log("QR code saved to data/qr.png");
                console.log("Please scan it with your Zalo app");
            }
            if (event.type === "got_login_info") {
                console.log("Login successful!");
                saveSession(event.data);
            }
            if (event.type === "error") {
                console.error("Login error:", event.data);
            }
        }
    );

    return api;
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
