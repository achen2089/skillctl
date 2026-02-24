import { Command } from "commander";
import { initCommand } from "./init.js";
import { installCommand } from "./install.js";
import { listCommand } from "./list.js";
import { removeCommand } from "./remove.js";
import { mcpCommand } from "./mcp.js";

const program = new Command()
  .name("skillctl")
  .description(
    "A minimal CLI for installing skills and MCP servers across AI coding agents"
  )
  .version("0.1.0");

program.addCommand(initCommand);
program.addCommand(installCommand);
program.addCommand(listCommand);
program.addCommand(removeCommand);
program.addCommand(mcpCommand);

program.parse();
