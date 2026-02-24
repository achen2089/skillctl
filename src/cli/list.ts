import chalk from "chalk";
import { Command } from "commander";
import { readProjectConfig, readGlobalConfig } from "../core/config.js";
import * as log from "../core/utils.js";

export const listCommand = new Command("list")
  .description("List installed skills")
  .option("-g, --global", "List global skills", false)
  .action((opts: { global: boolean }) => {
    const config = opts.global ? readGlobalConfig() : readProjectConfig();
    const skills = config?.skills ?? [];
    const scope = opts.global ? "Global" : "Project";

    if (skills.length === 0) {
      log.info(`No ${scope.toLowerCase()} skills installed.`);
      return;
    }

    console.log(chalk.bold(`\n${scope} skills:\n`));
    for (const skill of skills) {
      console.log(`  ${chalk.cyan(skill.name)}`);
      console.log(`    Source:    ${skill.source}`);
      console.log(`    Installed: ${skill.installedAt}`);
      console.log();
    }
  });
