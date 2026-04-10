import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

let loaded = false;

export function loadScriptEnv() {
  if (loaded) {
    return;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rootDir = path.resolve(__dirname, "..", "..");

  dotenv.config({
    path: path.join(rootDir, ".env.local"),
    quiet: true,
  });
  dotenv.config({
    path: path.join(rootDir, ".env"),
    quiet: true,
  });

  loaded = true;
}
