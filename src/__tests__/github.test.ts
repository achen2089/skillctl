import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseGitHubSource, getSkillName, hasGhCli, validateRepoWithGh, listRepoContents } from "../providers/github.js";
import { execFileSync } from "node:child_process";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

const mockedExecFileSync = vi.mocked(execFileSync);

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

describe("hasGhCli", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when gh is available", () => {
    mockedExecFileSync.mockReturnValueOnce(Buffer.from("gh version 2.50.0"));
    expect(hasGhCli()).toBe(true);
    expect(mockedExecFileSync).toHaveBeenCalledWith("gh", ["--version"], { stdio: "pipe" });
  });

  it("returns false when gh is not available", () => {
    mockedExecFileSync.mockImplementationOnce(() => {
      throw new Error("command not found: gh");
    });
    expect(hasGhCli()).toBe(false);
  });
});

describe("validateRepoWithGh", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true for an existing repo", () => {
    mockedExecFileSync.mockReturnValueOnce(Buffer.from(""));
    expect(validateRepoWithGh("anthropics", "skills")).toBe(true);
    expect(mockedExecFileSync).toHaveBeenCalledWith(
      "gh",
      ["api", "repos/anthropics/skills", "--silent"],
      { stdio: "pipe" },
    );
  });

  it("returns false for a non-existing repo", () => {
    mockedExecFileSync.mockImplementationOnce(() => {
      throw new Error("HTTP 404");
    });
    expect(validateRepoWithGh("owner", "nonexistent")).toBe(false);
  });
});

describe("listRepoContents", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lists root contents of a repo", () => {
    const mockContents = [
      { name: "README.md", type: "file", path: "README.md" },
      { name: "skills", type: "dir", path: "skills" },
    ];
    mockedExecFileSync.mockReturnValueOnce(JSON.stringify(mockContents));
    const result = listRepoContents("owner", "repo");
    expect(result).toEqual(mockContents);
    expect(mockedExecFileSync).toHaveBeenCalledWith(
      "gh",
      ["api", "repos/owner/repo/contents"],
      { stdio: "pipe", encoding: "utf-8" },
    );
  });

  it("lists contents of a subdirectory with ref", () => {
    const mockContents = [
      { name: "SKILL.md", type: "file", path: "skills/pdf/SKILL.md" },
    ];
    mockedExecFileSync.mockReturnValueOnce(JSON.stringify(mockContents));
    const result = listRepoContents("owner", "repo", "skills/pdf", "main");
    expect(result).toEqual(mockContents);
    expect(mockedExecFileSync).toHaveBeenCalledWith(
      "gh",
      ["api", "repos/owner/repo/contents/skills/pdf", "-f", "ref=main"],
      { stdio: "pipe", encoding: "utf-8" },
    );
  });
});
