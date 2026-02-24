import { Command } from "commander";
import { readProjectConfig, readGlobalConfig } from "../core/config.js";
import * as log from "../core/utils.js";

export const listCommand = new Command("list")
  .description("List installed skills")
  .option("-g, --global", "List global skills", false)
  .action((opts: { global: boolean }) => {
    const config = opts.global ? readGlobalConfig() : readProjectConfig();
    const skills = config?.skills || [];

    if (skills.length === 0) {
      log.info(
        opts.global
          ? "No global skills installed."
          : "No project skills installed."
      );
      return;
    }

    console.log(opts.global ? "\nGlobal skills:" : "\nProject skills:");
    for (const skill of skills) {
      console.log(`  ${skill.name}  (${skill.source})`);
    }
    console.log();
  });
