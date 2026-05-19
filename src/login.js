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

async function main() {
    console.log("=== Zalo Login ===\n");
    ensureDataDir();

    const zalo = new Zalo();

    const api = await zalo.loginQR(
        {
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
        },
        async (event) => {
            switch (event.type) {
                case LoginQRCallbackEventType.QRCodeGenerated: {
                    // Save QR image
                    const imageData = event.data.image; // base64
                    writeFileSync(QR_PATH, imageData, "base64");
                    console.log(`📱 QR code saved to ${QR_PATH}`);
                    console.log("   Open this file and scan it with Zalo app (Settings → Scan QR)\n");
                    break;
                }
                case LoginQRCallbackEventType.QRCodeScanned: {
                    console.log(`👤 Scanned by: ${event.data.display_name}`);
                    console.log("   Waiting for confirmation...\n");
                    break;
                }
                case LoginQRCallbackEventType.GotLoginInfo: {
                    console.log("🔐 Login successful!");
                    saveSession(event.data);
                    break;
                }
                case LoginQRCallbackEventType.QRCodeExpired: {
                    console.log("⏰ QR code expired. Retrying...\n");
                    break;
                }
                case LoginQRCallbackEventType.QRCodeDeclined: {
                    console.log("❌ QR code was declined. Retrying...\n");
                    break;
                }
            }
        }
    );

    console.log("🎉 Logged in successfully!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error:", err.message);
    process.exit(1);
});
