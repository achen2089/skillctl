import { describe, it, expect } from "vitest";
import { allAgents, getAgentByName } from "../agents/index.js";

describe("Agent adapters", () => {
  it("has all 5 agents", () => {
    expect(allAgents).toHaveLength(5);
    const names = allAgents.map((a) => a.name);
    expect(names).toContain("claude-code");
    expect(names).toContain("openclaw");
    expect(names).toContain("codex");
    expect(names).toContain("opencode");
    expect(names).toContain("cursor");
  });

  it("looks up agent by name", () => {
    const agent = getAgentByName("claude-code");
    expect(agent).toBeDefined();
    expect(agent!.name).toBe("claude-code");
  });

  it("returns undefined for unknown agent", () => {
    expect(getAgentByName("unknown")).toBeUndefined();
  });

  it("cursor has .mdc format", () => {
    expect(getAgentByName("cursor")!.getSkillFormat()).toBe(".mdc");
  });

  it("agents without MCP return null", () => {
    expect(getAgentByName("codex")!.getMcpConfigPath(false)).toBeNull();
  });
});
