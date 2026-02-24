import { describe, it, expect } from "vitest";
import { parseGitHubSource } from "../providers/github.js";

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
        "https://github.com/owner/repo/tree/main/packages/cli"
      )
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
      parseGitHubSource("https://github.com/owner/repo.git")
    ).toEqual({
      type: "github",
      owner: "owner",
      repo: "repo",
    });
  });

  it("returns null for non-GitHub input", () => {
    expect(parseGitHubSource("/some/local/path")).toBeNull();
    expect(parseGitHubSource("just-a-word")).toBeNull();
  });
});
