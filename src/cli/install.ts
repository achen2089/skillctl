import { join } from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import { Command } from "commander";
import { getDetectedAgents, getAgentByName } from "../agents/index.js";
import {
  parseGitHubSource,
  cloneGitHubSource,
  getSkillName,
} from "../providers/github.js";
import { copyLocalSource, getLocalSkillName } from "../providers/local.js";
import {
  readProjectConfig,
  writeProjectConfig,
  readGlobalConfig,
  writeGlobalConfig,
} from "../core/config.js";
import type { AgentAdapter, SkillSource } from "../core/types.js";
import * as log from "../core/utils.js";

function resolveSource(source: string): SkillSource {
  const gh = parseGitHubSource(source);
  if (gh) return gh;
  return { type: "local", path: source };
}

function getTargetAgents(
  agentName?: string,
  global?: boolean
): AgentAdapter[] {
  if (agentName) {
    const agent = getAgentByName(agentName);
    if (!agent) {
      log.error(`Unknown agent: ${agentName}`);
      process.exit(1);
    }
    return [agent];
  }

  if (global) {
    return getDetectedAgents();
  }

  const config = readProjectConfig();
  if (config?.agents.length) {
    return config.agents
      .map((n) => getAgentByName(n))
      .filter((a): a is AgentAdapter => !!a);
  }

  return getDetectedAgents();
}

export const installCommand = new Command("install")
  .description("Install a skill from GitHub or local path")
  .argument("<source>", "GitHub URL, owner/repo, or local path")
  .option("-g, --global", "Install globally", false)
  .option("--agent <name>", "Target specific agent")
  .action((source: string, opts: { global: boolean; agent?: string }) => {
    const resolved = resolveSource(source);
    const agents = getTargetAgents(opts.agent, opts.global);

    if (agents.length === 0) {
      log.error("No agents found. Run 'skillctl init' first.");
      process.exit(1);
    }

    const skillName =
      resolved.type === "github"
        ? getSkillName(resolved)
        : getLocalSkillName(resolved.path);

    for (const agent of agents) {
      const baseDir = agent.getSkillsDir(opts.global);
      const targetDir = join(baseDir, skillName);

      if (existsSync(targetDir)) {
        log.warn(
          `Skill '${skillName}' already exists for ${agent.name}, skipping`
        );
        continue;
      }

      mkdirSync(baseDir, { recursive: true });

      try {
        if (resolved.type === "github") {
          log.info(`Cloning ${source} for ${agent.name}...`);
          cloneGitHubSource(resolved, targetDir);
        } else {
          log.info(`Copying ${source} for ${agent.name}...`);
          copyLocalSource(resolved.path, targetDir);
        }
        log.success(`Installed '${skillName}' for ${agent.name}`);
      } catch (e) {
        log.error(
          `Failed to install for ${agent.name}: ${
            e instanceof Error ? e.message : String(e)
          }`
        );
      }
    }

    const entry = {
      name: skillName,
      source,
      installedAt: new Date().toISOString(),
    };

    if (opts.global) {
      const config = readGlobalConfig();
      if (!config.skills.find((s) => s.name === skillName)) {
        config.skills.push(entry);
        writeGlobalConfig(config);
      }
    } else {
      const config = readProjectConfig() || {
        agents: agents.map((a) => a.name),
        skills: [],
      };
      if (!config.skills.find((s) => s.name === skillName)) {
        config.skills.push(entry);
        writeProjectConfig(config);
      }
    }
  });
