import path from "node:path";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  statSync,
} from "node:fs";
import { spawn } from "node:child_process";

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
  const decoded = decodeStoragePath(input);
  const normalized = decoded.replaceAll("\\", "/");

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

function decodeStoragePath(input: string): string {
  let current = input;

  for (let i = 0; i < 2; i += 1) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) {
        break;
      }

      current = next;
    } catch {
      throw validation("Storage path contains invalid escape sequences", {
        storagePath: input,
      });
    }
  }

  return current;
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

export function detectFileMimeType(filePath: string): string | undefined {
  const descriptor = openSync(filePath, "r");
  const header = Buffer.alloc(4096);
  let bytesRead = 0;
  try {
    bytesRead = readSync(descriptor, header, 0, header.length, 0);
  } finally {
    closeSync(descriptor);
  }

  const bytes = header.subarray(0, bytesRead);
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return "image/webp";
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WAVE") {
    return "audio/wav";
  }
  if (ascii(bytes, 0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) {
    return "audio/mpeg";
  }
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) {
    return "video/webm";
  }
  if (ascii(bytes, 4, 8) === "ftyp") {
    if (!isStructurallyValidIsoBmff(filePath)) {
      return undefined;
    }
    return ascii(bytes, 8, 12) === "qt  " ? "video/quicktime" : "video/mp4";
  }
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    return "application/zip";
  }

  const text = bytes.toString("utf8").replace(/^\ufeff/, "");
  if (/^WEBVTT(?:\s|$)/.test(text)) {
    return "text/vtt";
  }
  if (/^\d+\s*\r?\n\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+/m.test(text)) {
    return "application/x-subrip";
  }

  return undefined;
}

function startsWith(value: Uint8Array, expected: number[]): boolean {
  return expected.every((byte, index) => value[index] === byte);
}

function ascii(value: Uint8Array, start: number, end: number): string {
  return Buffer.from(value.subarray(start, end)).toString("ascii");
}

function isStructurallyValidIsoBmff(filePath: string): boolean {
  const file = readFileSync(filePath);
  let offset = 0;
  let boxCount = 0;
  let hasFileType = false;
  let hasMovie = false;
  let hasMediaData = false;

  while (offset + 8 <= file.length && boxCount < 4096) {
    const declaredSize = file.readUInt32BE(offset);
    const type = file.toString("ascii", offset + 4, offset + 8);
    let headerSize = 8;
    let boxSize = declaredSize;

    if (declaredSize === 1) {
      if (offset + 16 > file.length) {
        return false;
      }
      const extendedSize = Number(file.readBigUInt64BE(offset + 8));
      headerSize = 16;
      boxSize = extendedSize;
    } else if (declaredSize === 0) {
      boxSize = file.length - offset;
    }

    if (!Number.isSafeInteger(boxSize) || boxSize < headerSize || offset + boxSize > file.length) {
      return false;
    }

    if (boxCount === 0 && type !== "ftyp") {
      return false;
    }
    if (type === "ftyp") {
      hasFileType = boxSize >= 16;
    } else if (type === "moov") {
      hasMovie = true;
    } else if (type === "mdat") {
      hasMediaData = true;
    }

    offset += boxSize;
    boxCount += 1;
  }

  return offset === file.length && boxCount > 0 && hasFileType && hasMovie && hasMediaData;
}

export type VideoFileProbe = {
  containerFormat: string;
  videoCodec: string;
  durationSeconds: number;
  width: number;
  height: number;
};

export async function probeVideoFile(
  filePath: string,
  options: { ffprobePath?: string; timeoutMs?: number } = {},
): Promise<VideoFileProbe> {
  const command = options.ffprobePath?.trim() || "ffprobe";
  const timeoutMs = options.timeoutMs ?? 30_000;
  const args = [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_entries",
    "format=format_name,duration:stream=codec_type,codec_name,width,height",
    filePath,
  ];
  const result = await new Promise<{ stdout: string; code: number }>((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, stdio: ["ignore", "pipe", "ignore"] });
    let stdout = "";
    let settled = false;
    const finish = (callback: () => void) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        callback();
      }
    };
    const timer = setTimeout(
      () =>
        finish(() => {
          child.kill();
          reject(validation("Video inspection timed out", { reason: "FFPROBE_TIMEOUT" }));
        }),
      timeoutMs,
    );
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.once("error", () =>
      finish(() =>
        reject(validation("Video inspection is unavailable", { reason: "FFPROBE_UNAVAILABLE" })),
      ),
    );
    child.once("close", (code) => finish(() => resolve({ stdout, code: code ?? -1 })));
  });

  if (result.code !== 0) {
    throw validation("Video inspection failed", { reason: "FFPROBE_INVALID_VIDEO" });
  }

  let parsed: {
    format?: { format_name?: string; duration?: string };
    streams?: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number }>;
  };
  try {
    parsed = JSON.parse(result.stdout || "{}");
  } catch {
    throw validation("Video inspection returned invalid metadata", {
      reason: "FFPROBE_INVALID_OUTPUT",
    });
  }
  const stream = parsed.streams?.find((entry) => entry.codec_type === "video");
  const duration = Number(parsed.format?.duration);
  const width = stream?.width;
  const height = stream?.height;
  const container = parsed.format?.format_name?.split(",")[0];
  if (
    !container ||
    !stream?.codec_name ||
    !Number.isFinite(duration) ||
    duration <= 0 ||
    !width ||
    !height ||
    width <= 0 ||
    height <= 0
  ) {
    throw validation("Video file is not publishable", { reason: "FFPROBE_INVALID_VIDEO" });
  }
  return {
    containerFormat: container,
    videoCodec: stream.codec_name,
    durationSeconds: duration,
    width,
    height,
  };
}

export function validation(message: string, details: Record<string, unknown>): AppError {
  return new AppError({
    code: "VALIDATION_ERROR",
    status: 400,
    message,
    details,
  });
}
