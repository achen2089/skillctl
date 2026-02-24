import chalk from "chalk";
import { Command } from "commander";
import type { AgentAdapter, McpServerConfig } from "../core/types.js";
import { getDetectedAgents } from "../agents/index.js";
import { addMcpServer, removeMcpServer, listMcpServers } from "../mcp/index.js";
import * as log from "../core/utils.js";

function getMcpAgents(global: boolean): { agent: AgentAdapter; configPath: string }[] {
  const agents = getDetectedAgents();
  const result: { agent: AgentAdapter; configPath: string }[] = [];
  for (const agent of agents) {
    const p = agent.getMcpConfigPath(global);
    if (p) result.push({ agent, configPath: p });
  }
  return result;
}

export const mcpCommand = new Command("mcp").description("Manage MCP servers");

mcpCommand
  .command("add <name>")
  .description("Add an MCP server")
  .option("--command <cmd>", "Command for stdio MCP server")
  .option("--args <args...>", "Arguments for the command")
  .option("--env <env...>", "Environment variables (KEY=VALUE)")
  .option("--url <url>", "URL for HTTP MCP server")
  .option("-g, --global", "Add globally", false)
  .action(
    (
      name: string,
      opts: {
        command?: string;
        args?: string[];
        env?: string[];
        url?: string;
        global: boolean;
      },
    ) => {
      if (!opts.command && !opts.url) {
        log.error("Provide either --command (stdio) or --url (HTTP).");
        process.exit(1);
      }

      const mcpAgents = getMcpAgents(opts.global);
      if (mcpAgents.length === 0) {
        log.error("No agents with MCP support detected.");
        process.exit(1);
      }

      let server: McpServerConfig;
      if (opts.url) {
        server = { url: opts.url };
      } else {
        const env: Record<string, string> = {};
        if (opts.env) {
          for (const pair of opts.env) {
            const eqIdx = pair.indexOf("=");
            if (eqIdx === -1) {
              log.error(`Invalid env format: ${pair}. Use KEY=VALUE.`);
              process.exit(1);
            }
            env[pair.slice(0, eqIdx)] = pair.slice(eqIdx + 1);
          }
        }
        server = {
          command: opts.command!,
          ...(opts.args?.length ? { args: opts.args } : {}),
          ...(Object.keys(env).length > 0 ? { env } : {}),
        };
      }

      for (const { agent, configPath } of mcpAgents) {
        addMcpServer(configPath, name, server);
        log.success(`Added MCP server "${name}" to ${agent.name} (${configPath})`);
      }
    },
  );

mcpCommand
  .command("list")
  .description("List MCP servers")
  .option("-g, --global", "List global servers", false)
  .action((opts: { global: boolean }) => {
    const mcpAgents = getMcpAgents(opts.global);
    if (mcpAgents.length === 0) {
      log.info("No agents with MCP support detected.");
      return;
    }

    for (const { agent, configPath } of mcpAgents) {
      const servers = listMcpServers(configPath);
      const entries = Object.entries(servers);
      console.log(chalk.bold(`\n${agent.name} (${configPath}):\n`));

      if (entries.length === 0) {
        log.info("  No servers configured.");
      } else {
        for (const [serverName, config] of entries) {
          console.log(`  ${chalk.cyan(serverName)}`);
          if ("url" in config) {
            console.log(`    URL: ${config.url}`);
          } else {
            console.log(`    Command: ${config.command} ${(config.args ?? []).join(" ")}`);
            if (config.env && Object.keys(config.env).length > 0) {
              console.log(`    Env: ${Object.entries(config.env).map(([k, v]) => `${k}=${v}`).join(", ")}`);
            }
          }
          console.log();
        }
      }
    }
  });

mcpCommand
  .command("remove <name>")
  .description("Remove an MCP server")
  .option("-g, --global", "Remove from global", false)
  .action((name: string, opts: { global: boolean }) => {
    const mcpAgents = getMcpAgents(opts.global);
    if (mcpAgents.length === 0) {
      log.error("No agents with MCP support detected.");
      process.exit(1);
    }

    let removed = false;
    for (const { agent, configPath } of mcpAgents) {
      if (removeMcpServer(configPath, name)) {
        log.success(`Removed MCP server "${name}" from ${agent.name}`);
        removed = true;
      }
    }

    if (!removed) {
      log.info(`MCP server "${name}" not found in any agent config.`);
    }
  });
