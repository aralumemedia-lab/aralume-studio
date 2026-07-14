import path from "node:path";
import { createHash } from "node:crypto";
import { existsSync, realpathSync, statSync, readFileSync } from "node:fs";

import { AppError } from "../../http/errors.js";

export type StorageResolution = {
  normalizedStoragePath: string;
  absolutePath: string;
};

export function resolveStorageRoot(storageRoot: string | undefined, fallbackRoot: string): string {
  const resolved = path.resolve(storageRoot?.trim() || fallbackRoot);
  return resolved;
}

export function buildInternalUri(channelId: string, assetId: string): string {
  return `aralume://media-assets/${encodeURIComponent(channelId)}/${encodeURIComponent(assetId)}`;
}

export function parseInternalUri(value: string): { channelId: string; assetId: string } | null {
  const match = /^aralume:\/\/media-assets\/([^/]+)\/([^/]+)$/.exec(value);
  if (!match) {
    return null;
  }

  return {
    channelId: decodeURIComponent(match[1]),
    assetId: decodeURIComponent(match[2]),
  };
}

export function normalizeRelativeStoragePath(input: string): string {
  const normalized = input.replaceAll("\\", "/");

  if (!normalized || normalized.trim().length === 0) {
    throw validation("Storage path is required", { storagePath: input });
  }

  if (normalized.startsWith("/") || normalized.startsWith("//")) {
    throw validation("Storage path must be relative", { storagePath: input });
  }

  if (/^[A-Za-z]:/.test(normalized) || normalized.includes(":")) {
    throw validation("Storage path must not contain a drive or scheme", { storagePath: input });
  }

  const segments = normalized.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    throw validation("Storage path escapes the authorized root", { storagePath: input });
  }

  return path.posix.normalize(normalized);
}

export function resolveAbsoluteStoragePath(
  storageRoot: string,
  relativeStoragePath: string,
): StorageResolution {
  const normalizedStoragePath = normalizeRelativeStoragePath(relativeStoragePath);
  const absolutePath = path.resolve(storageRoot, normalizedStoragePath);
  const relative = path.relative(storageRoot, absolutePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw validation("Storage path escapes the authorized root", {
      storagePath: relativeStoragePath,
    });
  }

  if (existsSync(absolutePath)) {
    const real = realpathSync(absolutePath);
    const realRelative = path.relative(storageRoot, real);
    if (realRelative.startsWith("..") || path.isAbsolute(realRelative)) {
      throw validation("Storage target escapes the authorized root", {
        storagePath: relativeStoragePath,
      });
    }
  }

  return {
    normalizedStoragePath,
    absolutePath,
  };
}

export function checksumFile(filePath: string): string {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex");
}

export function readFileSizeBytes(filePath: string): number {
  return statSync(filePath).size;
}

export function validation(message: string, details: Record<string, unknown>): AppError {
  return new AppError({
    code: "VALIDATION_ERROR",
    status: 400,
    message,
    details,
  });
}
