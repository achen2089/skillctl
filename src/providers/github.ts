import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { mkdirSync, rmSync } from "node:fs";
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

export function cloneGitHubSource(
  source: ParsedGitHubSource,
  targetDir: string
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
      { stdio: "pipe" }
    );
    execFileSync(
      "git",
      ["-C", tmp, "sparse-checkout", "set", source.subdir],
      { stdio: "pipe" }
    );

    const srcDir = join(tmp, source.subdir);
    execFileSync("cp", ["-r", srcDir, targetDir], { stdio: "pipe" });
    rmSync(tmp, { recursive: true, force: true });
  } else {
    const branchArgs = source.branch ? ["-b", source.branch] : [];
    execFileSync(
      "git",
      ["clone", "--depth", "1", ...branchArgs, repoUrl, targetDir],
      { stdio: "pipe" }
    );
    rmSync(join(targetDir, ".git"), { recursive: true, force: true });
  }
}

export function getSkillName(source: ParsedGitHubSource): string {
  return source.subdir
    ? source.subdir.split("/").pop() || source.repo
    : source.repo;
}
