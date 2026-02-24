import { mkdirSync } from "node:fs";
import { Command } from "commander";
import { getDetectedAgents } from "../agents/index.js";
import { writeProjectConfig, readProjectConfig } from "../core/config.js";
import * as log from "../core/utils.js";

export const initCommand = new Command("init")
  .description("Detect installed agents and initialize skillctl config")
  .action(() => {
    const agents = getDetectedAgents();

    if (agents.length === 0) {
      log.warn("No supported AI agents detected on this system.");
      return;
    }

    log.info(`Detected agents: ${agents.map((a) => a.name).join(", ")}`);

    for (const agent of agents) {
      const dir = agent.getSkillsDir(false);
      mkdirSync(dir, { recursive: true });
      log.success(`Created ${dir}`);
    }

    const existing = readProjectConfig();
    writeProjectConfig({
      agents: agents.map((a) => a.name),
      skills: existing?.skills || [],
    });

    log.success("Initialized .skillctl.json");
  });
