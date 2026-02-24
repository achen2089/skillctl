import { Command } from "commander";
import { getDetectedAgents, getAgentByName } from "../agents/index.js";
import { readProjectConfig } from "../core/config.js";
import {
  addMcpServer,
  removeMcpServer,
  listMcpServers,
} from "../mcp/index.js";
import type { AgentAdapter, McpServerConfig } from "../core/types.js";
import * as log from "../core/utils.js";

function getMcpAgents(global: boolean): AgentAdapter[] {
  const agents = global
    ? getDetectedAgents()
    : (() => {
        const config = readProjectConfig();
        return (
          config?.agents
            .map((n) => getAgentByName(n))
            .filter((a): a is AgentAdapter => !!a) ||
          getDetectedAgents()
        );
      })();

  return agents.filter((a) => a.getMcpConfigPath(global) !== null);
}

export const mcpCommand = new Command("mcp").description(
  "Manage MCP server configurations"
);

mcpCommand
  .command("add")
  .description("Add an MCP server to agent configs")
  .argument("<name>", "Server name")
  .option("--command <cmd>", "Command for stdio server")
  .option("--args <args...>", "Arguments for stdio server")
  .option("--env <env...>", "Environment variables (KEY=VAL)")
  .option("--url <url>", "URL for HTTP server")
  .option("-g, --global", "Add to global config", false)
  .action(
    (
      name: string,
      opts: {
        command?: string;
        args?: string[];
        env?: string[];
        url?: string;
        global: boolean;
      }
    ) => {
      let server: McpServerConfig;

      if (opts.url) {
        server = { url: opts.url };
      } else if (opts.command) {
        const s: McpServerConfig & { args?: string[]; env?: Record<string, string> } = {
          command: opts.command,
        };
        if (opts.args) s.args = opts.args;
        if (opts.env) {
          const env: Record<string, string> = {};
          for (const e of opts.env) {
            const [k, ...v] = e.split("=");
            env[k] = v.join("=");
          }
          s.env = env;
        }
        server = s;
      } else {
        log.error("Must specify --command or --url");
        process.exit(1);
      }

      const agents = getMcpAgents(opts.global);
      if (agents.length === 0) {
        log.error("No agents with MCP support found.");
        process.exit(1);
      }

      for (const agent of agents) {
        const path = agent.getMcpConfigPath(opts.global)!;
        addMcpServer(path, name, server);
        log.success(`Added MCP server '${name}' to ${agent.name}`);
      }
    }
  );

mcpCommand
  .command("list")
  .description("List configured MCP servers")
  .option("-g, --global", "List global servers", false)
  .action((opts: { global: boolean }) => {
    const agents = getMcpAgents(opts.global);

    if (agents.length === 0) {
      log.info("No agents with MCP support found.");
      return;
    }

    for (const agent of agents) {
      const path = agent.getMcpConfigPath(opts.global)!;
      const servers = listMcpServers(path);
      const names = Object.keys(servers);

      console.log(`\n${agent.name}:`);
      if (names.length === 0) {
        console.log("  (none)");
      } else {
        for (const [sname, config] of Object.entries(servers)) {
          if ("url" in config) {
            console.log(`  ${sname}  (http: ${config.url})`);
          } else {
            console.log(
              `  ${sname}  (stdio: ${(config as { command: string }).command})`
            );
          }
        }
      }
    }
    console.log();
  });

mcpCommand
  .command("remove")
  .description("Remove an MCP server from agent configs")
  .argument("<name>", "Server name")
  .option("-g, --global", "Remove from global config", false)
  .action((name: string, opts: { global: boolean }) => {
    const agents = getMcpAgents(opts.global);

    let removed = false;
    for (const agent of agents) {
      const path = agent.getMcpConfigPath(opts.global)!;
      if (removeMcpServer(path, name)) {
        log.success(`Removed '${name}' from ${agent.name}`);
        removed = true;
      }
    }

    if (!removed) {
      log.warn(`MCP server '${name}' not found in any agent config.`);
    }
  });
