import { resolve, join, basename } from "node:path";
import { existsSync, mkdirSync, cpSync, rmSync, mkdtempSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { Command } from "commander";
import { allAgents, getAgentByName, getDetectedAgents } from "../agents/index.js";
import { parseGitHubSource, cloneGitHubSource, getSkillName } from "../providers/github.js";
import { readProjectConfig, writeProjectConfig, readGlobalConfig, writeGlobalConfig } from "../core/config.js";
import type { AgentAdapter, SkillEntry } from "../core/types.js";
import * as log from "../core/utils.js";

export const installCommand = new Command("install")
  .argument("<source>", "GitHub URL, owner/repo, or local path")
  .description("Install a skill from GitHub or local path")
  .option("-g, --global", "Install globally", false)
  .option("--agent <name>", "Install for a specific agent only")
  .action((source: string, opts: { global: boolean; agent?: string }) => {
    let agents: AgentAdapter[];
    if (opts.agent) {
      const agent = getAgentByName(opts.agent);
      if (!agent) {
        log.error(`Unknown agent: ${opts.agent}. Available: ${allAgents.map((a) => a.name).join(", ")}`);
        process.exit(1);
      }
      agents = [agent];
    } else {
      agents = getDetectedAgents();
      if (agents.length === 0) {
        log.error("No agents detected. Run 'skillctl init' first.");
        process.exit(1);
      }
    }

    const isLocal = source.startsWith(".") || source.startsWith("/");

    if (isLocal) {
      installLocal(resolve(source), agents, opts.global);
    } else {
      const parsed = parseGitHubSource(source);
      if (!parsed) {
        log.error(`Could not parse source: ${source}`);
        process.exit(1);
      }
      installGitHub(parsed, agents, opts.global);
    }
  });

function installLocal(srcPath: string, agents: AgentAdapter[], global: boolean): void {
  if (!existsSync(srcPath)) {
    log.error(`Path not found: ${srcPath}`);
    process.exit(1);
  }

  const skillName = basename(srcPath);
  log.info(`Installing "${skillName}" from local path...`);

  const agentNames: string[] = [];
  for (const agent of agents) {
    const dest = join(agent.getSkillsDir(global), skillName);
    copySkill(srcPath, dest, agent);
    agentNames.push(agent.name);
  }

  recordSkill(skillName, srcPath, global);
  log.success(`Installed "${skillName}" to ${agentNames.join(", ")}`);
}

function installGitHub(
  parsed: ReturnType<typeof parseGitHubSource> & object,
  agents: AgentAdapter[],
  global: boolean,
): void {
  const skillName = getSkillName(parsed);
  const sourceLabel = `${parsed.owner}/${parsed.repo}${parsed.subdir ? "/" + parsed.subdir : ""}`;
  log.info(`Installing "${skillName}" from GitHub (${sourceLabel})...`);

  const tmpDir = mkdtempSync(join(tmpdir(), "skillctl-"));
  try {
    cloneGitHubSource(parsed, tmpDir);

    const agentNames: string[] = [];
    for (const agent of agents) {
      const dest = join(agent.getSkillsDir(global), skillName);
      copySkill(tmpDir, dest, agent);
      agentNames.push(agent.name);
    }

    recordSkill(skillName, sourceLabel, global);
    log.success(`Installed "${skillName}" to ${agentNames.join(", ")}`);
  } catch (err) {
    log.error(`Failed to install: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

function copySkill(src: string, dest: string, agent: AgentAdapter): void {
  if (existsSync(dest)) {
    rmSync(dest, { recursive: true, force: true });
  }
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });

  // Rename SKILL.md -> <name>.mdc for Cursor
  if (agent.getSkillFormat() === ".mdc") {
    const skillMd = join(dest, "SKILL.md");
    if (existsSync(skillMd)) {
      renameSync(skillMd, join(dest, `${basename(dest)}.mdc`));
    }
  }
}

function recordSkill(name: string, source: string, global: boolean): void {
  const entry: SkillEntry = {
    name,
    source,
    installedAt: new Date().toISOString(),
  };

  if (global) {
    const config = readGlobalConfig();
    config.skills = config.skills.filter((s) => s.name !== name);
    config.skills.push(entry);
    writeGlobalConfig(config);
  } else {
    const config = readProjectConfig() ?? { agents: [], skills: [] };
    config.skills = config.skills.filter((s) => s.name !== name);
    config.skills.push(entry);
    writeProjectConfig(config);
  }
}
