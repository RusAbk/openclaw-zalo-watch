import { Zalo, LoginQRCallbackEventType } from "zca-js";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";

const QR_PATH = "data/qr.png";

function ensureDataDir() {
    if (!existsSync("data")) mkdirSync("data", { recursive: true });
}

function saveSession(credentials) {
    writeFileSync("data/session.json", JSON.stringify(credentials, null, 2));
    console.log("\n✅ Session saved to data/session.json");
}

async function loginAttempt(zalo, resolve, reject) {
    try {
        const api = await zalo.loginQR(
            {
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
            },
            async (event) => {
                switch (event.type) {
                    case LoginQRCallbackEventType.QRCodeGenerated: {
                        const imageData = event.data.image;
                        ensureDataDir();
                        writeFileSync(QR_PATH, imageData, "base64");
                        console.log(`\n📱 QR code saved to ${QR_PATH}`);
                        console.log("   Scan it with Zalo app (Settings → Scan QR)");
                        console.log("   Waiting for scan...\n");
                        break;
                    }
                    case LoginQRCallbackEventType.QRCodeScanned: {
                        console.log(`👤 Scanned by: ${event.data.display_name}`);
                        console.log("   Waiting for confirmation on phone...\n");
                        break;
                    }
                    case LoginQRCallbackEventType.GotLoginInfo: {
                        console.log("🔐 Login successful!");
                        saveSession(event.data);
                        resolve(api);
                        break;
                    }
                    case LoginQRCallbackEventType.QRCodeExpired: {
                        console.log("⏰ QR expired, generating new one...\n");
                        // zca-js auto-retries, but if it fails we restart
                        break;
                    }
                    case LoginQRCallbackEventType.QRCodeDeclined: {
                        console.log("❌ Declined, generating new one...\n");
                        break;
                    }
                }
            }
        );
    } catch (err) {
        if (err.message && err.message.includes("Cannot get scan result")) {
            console.log("🔄 Restarting login...\n");
            return loginAttempt(zalo, resolve, reject);
        }
        reject(err);
    }
}

async function main() {
    console.log("=== Zalo Login ===\n");
    ensureDataDir();

    const zalo = new Zalo();

    await new Promise((resolve, reject) => {
        loginAttempt(zalo, resolve, reject);
    });

    console.log("\n🎉 Logged in successfully!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error:", err.message);
    process.exit(1);
});
