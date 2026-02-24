import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import type { ParsedGitHubSource } from "../core/types.js";

const GITHUB_URL_RE =
  /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+)(?:\/(.+))?)?$/;
const SHORTHAND_RE = /^([^/]+)\/([^/]+)$/;

export function parseGitHubSource(input: string): ParsedGitHubSource | null {
  const urlMatch = input.match(GITHUB_URL_RE);
  if (urlMatch) {
    return {
      type: "github",
      owner: urlMatch[1],
      repo: urlMatch[2],
      branch: urlMatch[3] || undefined,
      subdir: urlMatch[4] || undefined,
    };
  }

  const shortMatch = input.match(SHORTHAND_RE);
  if (shortMatch) {
    return {
      type: "github",
      owner: shortMatch[1],
      repo: shortMatch[2],
    };
  }

  return null;
}

/** Check whether the `gh` CLI is available on PATH. */
export function hasGhCli(): boolean {
  try {
    execFileSync("gh", ["--version"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/** Validate that a GitHub repository exists using `gh api`. */
export function validateRepoWithGh(owner: string, repo: string): boolean {
  try {
    execFileSync("gh", ["api", `repos/${owner}/${repo}`, "--silent"], {
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

/** List contents of a path in a repo using `gh api` (returns parsed JSON). */
export function listRepoContents(
  owner: string,
  repo: string,
  path?: string,
  ref?: string,
): Array<{ name: string; type: string; path: string }> {
  const endpoint = path
    ? `repos/${owner}/${repo}/contents/${path}`
    : `repos/${owner}/${repo}/contents`;
  const refArgs = ref ? ["-f", `ref=${ref}`] : [];
  const out = execFileSync("gh", ["api", endpoint, ...refArgs], {
    stdio: "pipe",
    encoding: "utf-8",
  });
  return JSON.parse(out);
}

function cloneWithGit(
  repoUrl: string,
  targetDir: string,
  branchArgs: string[],
): void {
  execFileSync(
    "git",
    ["clone", "--depth", "1", ...branchArgs, repoUrl, targetDir],
    { stdio: "pipe" },
  );
}

function cloneWithGh(
  owner: string,
  repo: string,
  targetDir: string,
): void {
  execFileSync(
    "gh",
    ["repo", "clone", `${owner}/${repo}`, targetDir, "--", "--depth", "1"],
    { stdio: "pipe" },
  );
}

export function cloneGitHubSource(
  source: ParsedGitHubSource,
  targetDir: string,
): void {
  const repoUrl = `https://github.com/${source.owner}/${source.repo}.git`;
  mkdirSync(targetDir, { recursive: true });

  if (source.subdir) {
    const tmp = join(tmpdir(), `skillctl-${Date.now()}`);
    mkdirSync(tmp, { recursive: true });
    const branchArgs = source.branch ? ["-b", source.branch] : [];

    execFileSync(
      "git",
      [
        "clone",
        "--depth",
        "1",
        "--filter=blob:none",
        "--sparse",
        ...branchArgs,
        repoUrl,
        tmp,
      ],
      { stdio: "pipe" },
    );
    execFileSync(
      "git",
      ["-C", tmp, "sparse-checkout", "set", source.subdir],
      { stdio: "pipe" },
    );

    // Copy the *contents* of the subfolder into targetDir (not the folder itself).
    // Previously used `cp -r srcDir targetDir` which nested the dir inside targetDir.
    const srcDir = join(tmp, source.subdir);
    cpSync(srcDir, targetDir, { recursive: true });
    rmSync(tmp, { recursive: true, force: true });
  } else {
    const branchArgs = source.branch ? ["-b", source.branch] : [];
    try {
      cloneWithGit(repoUrl, targetDir, branchArgs);
    } catch {
      if (hasGhCli()) {
        cloneWithGh(source.owner, source.repo, targetDir);
      } else {
        throw new Error(
          `git clone failed and gh CLI is not available. Install git or gh to continue.`,
        );
      }
    }
    rmSync(join(targetDir, ".git"), { recursive: true, force: true });
  }
}

export function getSkillName(source: ParsedGitHubSource): string {
  return source.subdir
    ? source.subdir.split("/").pop() || source.repo
    : source.repo;
}
