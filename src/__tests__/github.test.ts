import { describe, it, expect } from "vitest";
import { parseGitHubSource, getSkillName } from "../providers/github.js";

describe("parseGitHubSource", () => {
  it("parses shorthand owner/repo", () => {
    expect(parseGitHubSource("achen2089/skillctl")).toEqual({
      type: "github",
      owner: "achen2089",
      repo: "skillctl",
    });
  });

  it("parses full GitHub URL", () => {
    expect(parseGitHubSource("https://github.com/owner/repo")).toEqual({
      type: "github",
      owner: "owner",
      repo: "repo",
    });
  });

  it("parses URL with branch and subdir", () => {
    expect(
      parseGitHubSource(
        "https://github.com/owner/repo/tree/main/packages/cli",
      ),
    ).toEqual({
      type: "github",
      owner: "owner",
      repo: "repo",
      branch: "main",
      subdir: "packages/cli",
    });
  });

  it("parses URL with .git suffix", () => {
    expect(
      parseGitHubSource("https://github.com/owner/repo.git"),
    ).toEqual({
      type: "github",
      owner: "owner",
      repo: "repo",
    });
  });

  it("parses http URL", () => {
    expect(parseGitHubSource("http://github.com/owner/repo")).toEqual({
      type: "github",
      owner: "owner",
      repo: "repo",
    });
  });

  it("parses URL with branch only", () => {
    expect(
      parseGitHubSource("https://github.com/owner/repo/tree/develop"),
    ).toEqual({
      type: "github",
      owner: "owner",
      repo: "repo",
      branch: "develop",
    });
  });

  it("returns null for non-GitHub input", () => {
    expect(parseGitHubSource("/some/local/path")).toBeNull();
    expect(parseGitHubSource("just-a-word")).toBeNull();
    expect(parseGitHubSource("")).toBeNull();
    expect(parseGitHubSource("https://example.com/foo/bar")).toBeNull();
  });
});

describe("getSkillName", () => {
  it("uses repo name when no subdir", () => {
    expect(
      getSkillName({ type: "github", owner: "owner", repo: "my-skill" }),
    ).toBe("my-skill");
  });

  it("uses subdir basename when subdir present", () => {
    expect(
      getSkillName({
        type: "github",
        owner: "owner",
        repo: "repo",
        branch: "main",
        subdir: "skills/my-skill",
      }),
    ).toBe("my-skill");
  });

  it("handles single-level subdir", () => {
    expect(
      getSkillName({
        type: "github",
        owner: "owner",
        repo: "repo",
        subdir: "my-skill",
      }),
    ).toBe("my-skill");
  });
});
