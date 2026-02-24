import { cpSync, existsSync } from "node:fs";
import { basename } from "node:path";

export function copyLocalSource(sourcePath: string, targetDir: string): void {
  if (!existsSync(sourcePath)) {
    throw new Error(`Local path does not exist: ${sourcePath}`);
  }
  cpSync(sourcePath, targetDir, { recursive: true });
}

export function getLocalSkillName(sourcePath: string): string {
  return basename(sourcePath);
}
