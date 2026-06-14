import { indexRemoteDatabase } from "./src/actions/rag";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const FALLBACK_URI = process.env.NEXT_PUBLIC_FALLBACK_URI;

async function main() {
    console.log("Starting sync with URI:", FALLBACK_URI);
    const res = await indexRemoteDatabase("demo-neon-db", FALLBACK_URI!);
    console.log("Result:", res);
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
