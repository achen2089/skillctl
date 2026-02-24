import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { addMcpServer, removeMcpServer, listMcpServers } from "../mcp/index.js";

describe("MCP config read/write", () => {
  let tmpDir: string;
  let mcpPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "skillctl-mcp-test-"));
    mcpPath = path.join(tmpDir, "mcp.json");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates MCP file if it doesn't exist", () => {
    addMcpServer(mcpPath, "test-server", {
      command: "node",
      args: ["server.js"],
    });

    expect(fs.existsSync(mcpPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(mcpPath, "utf-8"));
    expect(content.mcpServers["test-server"]).toBeDefined();
    expect(content.mcpServers["test-server"].command).toBe("node");
    expect(content.mcpServers["test-server"].args).toEqual(["server.js"]);
  });

  it("adds stdio server with env", () => {
    addMcpServer(mcpPath, "my-server", {
      command: "npx",
      args: ["some-server"],
      env: { PORT: "3000", API_KEY: "secret" },
    });

    const servers = listMcpServers(mcpPath);
    const entries = Object.entries(servers);
    expect(entries).toHaveLength(1);
    const [name, config] = entries[0];
    expect(name).toBe("my-server");
    expect("command" in config && config.command).toBe("npx");
    expect("env" in config && config.env).toEqual({ PORT: "3000", API_KEY: "secret" });
  });

  it("adds HTTP server", () => {
    addMcpServer(mcpPath, "http-server", {
      url: "https://mcp.example.com",
    });

    const servers = listMcpServers(mcpPath);
    const entries = Object.entries(servers);
    expect(entries).toHaveLength(1);
    const [, config] = entries[0];
    expect("url" in config && config.url).toBe("https://mcp.example.com");
  });

  it("adds multiple servers", () => {
    addMcpServer(mcpPath, "server-1", { command: "cmd1" });
    addMcpServer(mcpPath, "server-2", { command: "cmd2" });

    const servers = listMcpServers(mcpPath);
    expect(Object.keys(servers)).toHaveLength(2);
  });

  it("overwrites existing server with same name", () => {
    addMcpServer(mcpPath, "test", { command: "old" });
    addMcpServer(mcpPath, "test", { command: "new" });

    const servers = listMcpServers(mcpPath);
    expect(Object.keys(servers)).toHaveLength(1);
    const config = servers["test"];
    expect("command" in config && config.command).toBe("new");
  });

  it("removes a server", () => {
    addMcpServer(mcpPath, "server-1", { command: "cmd1" });
    addMcpServer(mcpPath, "server-2", { command: "cmd2" });

    const removed = removeMcpServer(mcpPath, "server-1");
    expect(removed).toBe(true);

    const servers = listMcpServers(mcpPath);
    expect(Object.keys(servers)).toHaveLength(1);
    expect(servers["server-2"]).toBeDefined();
  });

  it("returns false when removing non-existent server", () => {
    addMcpServer(mcpPath, "server-1", { command: "cmd1" });
    const removed = removeMcpServer(mcpPath, "non-existent");
    expect(removed).toBe(false);
  });

  it("lists empty when no file exists", () => {
    const servers = listMcpServers(mcpPath);
    expect(Object.keys(servers)).toHaveLength(0);
  });

  it("creates nested directories for MCP file", () => {
    const nestedPath = path.join(tmpDir, "a", "b", "mcp.json");
    addMcpServer(nestedPath, "test", { command: "node" });
    expect(fs.existsSync(nestedPath)).toBe(true);
  });
});
