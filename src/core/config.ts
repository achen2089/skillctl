import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { ProjectConfig, GlobalConfig } from "./types.js";

const PROJECT_CONFIG = ".skillctl.json";
const GLOBAL_DIR = join(homedir(), ".skillctl");
const GLOBAL_CONFIG = join(GLOBAL_DIR, "config.json");

export function getProjectConfigPath(): string {
  return join(process.cwd(), PROJECT_CONFIG);
}

export function getGlobalConfigPath(): string {
  return GLOBAL_CONFIG;
}

export function readProjectConfig(): ProjectConfig | null {
  const p = getProjectConfigPath();
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as ProjectConfig;
  } catch {
    return null;
  }
}

export function writeProjectConfig(config: ProjectConfig): void {
  writeFileSync(getProjectConfigPath(), JSON.stringify(config, null, 2) + "\n");
}

export function readGlobalConfig(): GlobalConfig {
  if (!existsSync(GLOBAL_CONFIG)) return { skills: [] };
  try {
    return JSON.parse(readFileSync(GLOBAL_CONFIG, "utf-8")) as GlobalConfig;
  } catch {
    return { skills: [] };
  }
}

export function writeGlobalConfig(config: GlobalConfig): void {
  mkdirSync(GLOBAL_DIR, { recursive: true });
  writeFileSync(GLOBAL_CONFIG, JSON.stringify(config, null, 2) + "\n");
}
