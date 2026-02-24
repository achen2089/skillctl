import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import { allAgents } from "../agents/index.js";
import { readProjectConfig, writeProjectConfig, readGlobalConfig, writeGlobalConfig } from "../core/config.js";
import * as log from "../core/utils.js";

export const removeCommand = new Command("remove")
  .argument("<name>", "Name of the skill to remove")
  .description("Remove an installed skill")
  .option("-g, --global", "Remove from global", false)
  .action((name: string, opts: { global: boolean }) => {
    const config = opts.global ? readGlobalConfig() : readProjectConfig();
    const skills = config?.skills ?? [];
    const skill = skills.find((s) => s.name === name);

    if (!skill) {
      log.error(`Skill "${name}" not found in ${opts.global ? "global" : "project"} config.`);
      process.exit(1);
    }

    // Remove skill directory from all agents
    for (const agent of allAgents) {
      const skillDir = join(agent.getSkillsDir(opts.global), name);
      if (existsSync(skillDir)) {
        rmSync(skillDir, { recursive: true, force: true });
        log.success(`Removed ${skillDir}`);
      }
    }

    // Update config
    const updatedSkills = skills.filter((s) => s.name !== name);
    if (opts.global) {
      writeGlobalConfig({ skills: updatedSkills });
    } else {
      writeProjectConfig({
        agents: (config && "agents" in config ? config.agents : []) as string[],
        skills: updatedSkills,
      });
    }

    log.success(`Removed skill "${name}"`);
  });
