import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  addMcpServer,
  removeMcpServer,
  readMcpConfig,
  listMcpServers,
} from "../mcp/index.js";

describe("MCP config management", () => {
  let tmp: string;
  let configPath: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "skillctl-test-"));
    configPath = join(tmp, "mcp.json");
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("reads empty config from non-existent file", () => {
    expect(readMcpConfig(configPath).mcpServers).toEqual({});
  });

  it("adds a stdio server", () => {
    addMcpServer(configPath, "test-server", {
      command: "node",
      args: ["server.js"],
      env: { PORT: "3000" },
    });
    const raw = JSON.parse(readFileSync(configPath, "utf-8"));
    expect(raw.mcpServers["test-server"]).toEqual({
      command: "node",
      args: ["server.js"],
      env: { PORT: "3000" },
    });
  });

  it("adds an HTTP server", () => {
    addMcpServer(configPath, "http-server", {
      url: "https://mcp.example.com",
    });
    expect(listMcpServers(configPath)["http-server"]).toEqual({
      url: "https://mcp.example.com",
    });
  });

  it("removes a server", () => {
    addMcpServer(configPath, "s1", { command: "cmd1" });
    addMcpServer(configPath, "s2", { command: "cmd2" });
    expect(removeMcpServer(configPath, "s1")).toBe(true);
    const servers = listMcpServers(configPath);
    expect(servers["s1"]).toBeUndefined();
    expect(servers["s2"]).toBeDefined();
  });

  it("returns false when removing non-existent server", () => {
    expect(removeMcpServer(configPath, "nope")).toBe(false);
  });
});
