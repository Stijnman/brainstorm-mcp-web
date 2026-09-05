import { readFileSync } from "fs";
import { resolve } from "path";

export function loadConfig() {
  const configPath = resolve(process.cwd(), "config.json");
  try {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    return config;
  } catch {
    return {};
  }
}