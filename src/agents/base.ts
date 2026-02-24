import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { AgentAdapter } from "../core/types.js";

function resolveHome(p: string): string {
  return p.startsWith("~") ? join(homedir(), p.slice(1)) : p;
}

export function createAgent(opts: {
  name: string;
  globalSkillsDir: string;
  projectSkillsDir: string;
  skillFormat: string;
  detectPaths: string[];
  globalMcpConfig?: string;
  projectMcpConfig?: string;
}): AgentAdapter {
  return {
    name: opts.name,
    detectInstalled() {
      return opts.detectPaths.some((p) => existsSync(resolveHome(p)));
    },
    getSkillsDir(global: boolean) {
      const dir = global ? opts.globalSkillsDir : opts.projectSkillsDir;
      return resolveHome(dir);
    },
    getSkillFormat() {
      return opts.skillFormat;
    },
    getMcpConfigPath(global: boolean) {
      const p = global ? opts.globalMcpConfig : opts.projectMcpConfig;
      return p ? resolveHome(p) : null;
    },
  };
}
