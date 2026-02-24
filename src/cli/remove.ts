import { join } from "node:path";
import { rmSync, existsSync } from "node:fs";
import { Command } from "commander";
import { getDetectedAgents, getAgentByName } from "../agents/index.js";
import {
  readProjectConfig,
  writeProjectConfig,
  readGlobalConfig,
  writeGlobalConfig,
} from "../core/config.js";
import type { AgentAdapter } from "../core/types.js";
import * as log from "../core/utils.js";

export const removeCommand = new Command("remove")
  .description("Remove an installed skill")
  .argument("<name>", "Skill name to remove")
  .option("-g, --global", "Remove global skill", false)
  .action((name: string, opts: { global: boolean }) => {
    const agents: AgentAdapter[] = opts.global
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

    let removed = false;
    for (const agent of agents) {
      const dir = join(agent.getSkillsDir(opts.global), name);
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
        log.success(`Removed '${name}' from ${agent.name}`);
        removed = true;
      }
    }

    if (!removed) {
      log.warn(`Skill '${name}' not found.`);
      return;
    }

    if (opts.global) {
      const config = readGlobalConfig();
      config.skills = config.skills.filter((s) => s.name !== name);
      writeGlobalConfig(config);
    } else {
      const config = readProjectConfig();
      if (config) {
        config.skills = config.skills.filter((s) => s.name !== name);
        writeProjectConfig(config);
      }
    }
  });
