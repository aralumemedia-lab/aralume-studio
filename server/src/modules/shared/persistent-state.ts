import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

export function resolveStateFilePath(
  storageRoot: string | undefined,
  fileName: string,
): string | undefined {
  if (!storageRoot?.trim()) {
    return undefined;
  }

  return path.join(path.resolve(storageRoot), ".aralume-state", fileName);
}

export function readJsonFile<T>(filePath: string | undefined): T | undefined {
  if (!filePath || !existsSync(filePath)) {
    return undefined;
  }

  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function writeJsonFile(filePath: string | undefined, value: unknown): void {
  if (!filePath) {
    return;
  }

  mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(tempPath, filePath);
}
