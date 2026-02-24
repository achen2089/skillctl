export interface AgentAdapter {
  name: string;
  detectInstalled(): boolean;
  getSkillsDir(global: boolean): string;
  getSkillFormat(): string;
  getMcpConfigPath(global: boolean): string | null;
}

export interface ParsedGitHubSource {
  type: "github";
  owner: string;
  repo: string;
  branch?: string;
  subdir?: string;
}

export interface LocalSource {
  type: "local";
  path: string;
}

export type SkillSource = ParsedGitHubSource | LocalSource;

export interface SkillEntry {
  name: string;
  source: string;
  installedAt: string;
}

export interface McpServerStdio {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpServerHttp {
  url: string;
}

export type McpServerConfig = McpServerStdio | McpServerHttp;

export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

export interface ProjectConfig {
  agents: string[];
  skills: SkillEntry[];
}

export interface GlobalConfig {
  skills: SkillEntry[];
}
