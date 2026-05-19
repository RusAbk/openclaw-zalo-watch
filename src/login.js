import { loginQR } from "./session.js";

async function main() {
    console.log("=== Zalo Login ===");
    const api = await loginQR();
    console.log("Logged in successfully!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
