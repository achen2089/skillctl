import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { McpConfig, McpServerConfig } from "../core/types.js";

export function readMcpConfig(path: string): McpConfig {
  if (!existsSync(path)) return { mcpServers: {} };
  try {
    const raw = JSON.parse(readFileSync(path, "utf-8")) as Record<
      string,
      unknown
    >;
    return {
      mcpServers:
        (raw.mcpServers as Record<string, McpServerConfig>) || {},
    };
  } catch {
    return { mcpServers: {} };
  }
}

export function writeMcpConfig(path: string, config: McpConfig): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
}

export function addMcpServer(
  path: string,
  name: string,
  server: McpServerConfig
): void {
  const config = readMcpConfig(path);
  config.mcpServers[name] = server;
  writeMcpConfig(path, config);
}

export function removeMcpServer(path: string, name: string): boolean {
  const config = readMcpConfig(path);
  if (!(name in config.mcpServers)) return false;
  delete config.mcpServers[name];
  writeMcpConfig(path, config);
  return true;
}

export function listMcpServers(
  path: string
): Record<string, McpServerConfig> {
  return readMcpConfig(path).mcpServers;
}
