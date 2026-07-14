import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import { resolveAbsoluteStoragePath } from "../media-assets/media-assets.storage.js";
import type { RenderEngine, RenderEngineInput, RenderEngineResult } from "./renders.types.js";

export type RenderEngineErrorKind = "unavailable" | "timeout" | "process_failed";

export class RenderEngineError extends Error {
  readonly kind: RenderEngineErrorKind;
  readonly exitCode?: number;

  constructor(kind: RenderEngineErrorKind, message: string, exitCode?: number) {
    super(message);
    this.name = "RenderEngineError";
    this.kind = kind;
    this.exitCode = exitCode;
  }
}

export type CreateFfmpegRenderEngineOptions = {
  ffmpegPath?: string;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 30_000;

export function createFfmpegRenderEngine(
  options: CreateFfmpegRenderEngineOptions = {},
): RenderEngine {
  const ffmpegCommand = options.ffmpegPath?.trim() || "ffmpeg";
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return async function render(input: RenderEngineInput): Promise<RenderEngineResult> {
    const startedAt = performance.now();
    const outputResolution = resolveAbsoluteStoragePath(input.storageRoot, input.tempOutputPath);
    mkdirSync(path.dirname(outputResolution.absolutePath), { recursive: true });

    const args = [
      "-hide_banner",
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=0x111827:s=1280x720:r=30",
      "-t",
      "3",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputResolution.absolutePath,
    ];

    const child = spawn(ffmpegCommand, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    const exitCode = await new Promise<number>((resolve, reject) => {
      let finished = false;
      const timer = setTimeout(() => {
        if (finished) {
          return;
        }
        finished = true;
        child.kill();
        reject(new RenderEngineError("timeout", "FFmpeg execution timed out."));
      }, timeoutMs);

      child.once("error", (error) => {
        if (finished) {
          return;
        }
        finished = true;
        clearTimeout(timer);
        if (isMissingBinaryError(error)) {
          reject(new RenderEngineError("unavailable", "FFmpeg is not available."));
          return;
        }

        reject(new RenderEngineError("process_failed", "FFmpeg execution failed.", undefined));
      });

      child.once("close", (code) => {
        if (finished) {
          return;
        }
        finished = true;
        clearTimeout(timer);

        if (code === 0) {
          resolve(0);
          return;
        }

        reject(
          new RenderEngineError(
            "process_failed",
            "FFmpeg exited with a non-zero code.",
            code ?? undefined,
          ),
        );
      });
    });

    const outputSizeBytes = statSync(outputResolution.absolutePath).size;
    if (outputSizeBytes <= 0) {
      throw new RenderEngineError(
        "process_failed",
        "FFmpeg produced an empty output file.",
        exitCode,
      );
    }

    const outputChecksum = checksumFile(outputResolution.absolutePath);
    const durationMilliseconds = Math.max(1, Math.round(performance.now() - startedAt));

    return {
      stdout,
      stderr,
      exitCode,
      durationMilliseconds,
      outputSizeBytes,
      outputChecksum,
      technicalMetadata: {
        ffmpegCommand,
        ffmpegTimeoutMs: timeoutMs,
        codec: "libx264",
        container: "mp4",
        resolution: "1280x720",
        frameRate: 30,
        durationSeconds: 3,
        source: "lavfi/color",
        startedAt: new Date(Date.now() - durationMilliseconds).toISOString(),
      },
    };
  };
}

function checksumFile(filePath: string): string {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex");
}

function isMissingBinaryError(error: NodeJS.ErrnoException): boolean {
  return error.code === "ENOENT" || error.code === "EACCES";
}
