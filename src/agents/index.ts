import { createAgent } from "./base.js";
import type { AgentAdapter } from "../core/types.js";

export const claudeCode: AgentAdapter = createAgent({
  name: "claude-code",
  globalSkillsDir: "~/.claude/skills",
  projectSkillsDir: ".claude/skills",
  skillFormat: "SKILL.md",
  detectPaths: ["~/.claude"],
  globalMcpConfig: "~/.claude/mcp.json",
  projectMcpConfig: ".claude/mcp.json",
});

export const openclaw: AgentAdapter = createAgent({
  name: "openclaw",
  globalSkillsDir: "~/.openclaw/skills",
  projectSkillsDir: ".openclaw/skills",
  skillFormat: "SKILL.md",
  detectPaths: ["~/.openclaw"],
});

export const codex: AgentAdapter = createAgent({
  name: "codex",
  globalSkillsDir: "~/.codex/skills",
  projectSkillsDir: ".codex/skills",
  skillFormat: "SKILL.md",
  detectPaths: ["~/.codex"],
});

export const opencode: AgentAdapter = createAgent({
  name: "opencode",
  globalSkillsDir: "~/.opencode/skills",
  projectSkillsDir: ".opencode/skills",
  skillFormat: "SKILL.md",
  detectPaths: ["~/.opencode"],
});

export const cursor: AgentAdapter = createAgent({
  name: "cursor",
  globalSkillsDir: "~/.cursor/skills",
  projectSkillsDir: ".cursor/skills",
  skillFormat: ".mdc",
  detectPaths: ["~/.cursor"],
  globalMcpConfig: "~/.cursor/mcp.json",
  projectMcpConfig: ".cursor/mcp.json",
});

export const allAgents: AgentAdapter[] = [
  claudeCode,
  openclaw,
  codex,
  opencode,
  cursor,
];

export function getDetectedAgents(): AgentAdapter[] {
  return allAgents.filter((a) => a.detectInstalled());
}

export function getAgentByName(name: string): AgentAdapter | undefined {
  return allAgents.find((a) => a.name === name);
}
