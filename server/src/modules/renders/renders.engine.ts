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
  ffprobePath?: string;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_LAVFI_DURATION_SECONDS = 3;
const DEFAULT_LAVFI_RESOLUTION = "1280x720";
const DEFAULT_LAVFI_FRAMERATE = 30;
const DEFAULT_CLIP_TOLERANCE_SECONDS = 1;

export function createFfmpegRenderEngine(
  options: CreateFfmpegRenderEngineOptions = {},
): RenderEngine {
  const ffmpegCommand = options.ffmpegPath?.trim() || "ffmpeg";
  const ffprobeCommand = options.ffprobePath?.trim() || "ffprobe";
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return async function render(input: RenderEngineInput): Promise<RenderEngineResult> {
    if (input.job.renderType === "controlled_clip") {
      return renderControlledClip({
        input,
        ffmpegCommand,
        ffprobeCommand,
        timeoutMs,
      });
    }

    return renderControlledVideo({
      input,
      ffmpegCommand,
      ffprobeCommand,
      timeoutMs,
    });
  };
}

async function renderControlledVideo(input: {
  input: RenderEngineInput;
  ffmpegCommand: string;
  ffprobeCommand: string;
  timeoutMs: number;
}): Promise<RenderEngineResult> {
  const startedAt = performance.now();
  const outputResolution = resolveAbsoluteStoragePath(
    input.input.storageRoot,
    input.input.tempOutputPath,
  );
  mkdirSync(path.dirname(outputResolution.absolutePath), { recursive: true });

  const ffmpegArgs = [
    "-hide_banner",
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=0x111827:s=${DEFAULT_LAVFI_RESOLUTION}:r=${DEFAULT_LAVFI_FRAMERATE}`,
    "-t",
    String(DEFAULT_LAVFI_DURATION_SECONDS),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    outputResolution.absolutePath,
  ];

  const ffmpegResult = await runProcess(input.ffmpegCommand, ffmpegArgs, input.timeoutMs);
  if (ffmpegResult.exitCode !== 0) {
    throw new RenderEngineError(
      "process_failed",
      "FFmpeg exited with a non-zero code.",
      ffmpegResult.exitCode,
    );
  }

  const outputStats = statSync(outputResolution.absolutePath);
  if (outputStats.size <= 0) {
    throw new RenderEngineError(
      "process_failed",
      "FFmpeg produced an empty output file.",
      ffmpegResult.exitCode,
    );
  }

  const probe = await probeMediaFile({
    ffprobeCommand: input.ffprobeCommand,
    timeoutMs: input.timeoutMs,
    filePath: outputResolution.absolutePath,
  });

  const durationMilliseconds = Math.max(1, Math.round(performance.now() - startedAt));
  return {
    stdout: ffmpegResult.stdout,
    stderr: ffmpegResult.stderr,
    exitCode: ffmpegResult.exitCode,
    durationMilliseconds,
    outputSizeBytes: outputStats.size,
    outputChecksum: checksumFile(outputResolution.absolutePath),
    technicalMetadata: {
      ffmpegCommand: input.ffmpegCommand,
      ffprobeCommand: input.ffprobeCommand,
      ffmpegTimeoutMs: input.timeoutMs,
      codec: probe.videoCodec ?? "libx264",
      container: probe.containerFormat ?? "mp4",
      resolution: probe.resolution ?? DEFAULT_LAVFI_RESOLUTION,
      width: probe.width,
      height: probe.height,
      aspectRatio: probe.aspectRatio,
      frameRate: DEFAULT_LAVFI_FRAMERATE,
      durationSeconds: probe.durationSeconds ?? DEFAULT_LAVFI_DURATION_SECONDS,
      source: "lavfi/color",
      probeDurationSeconds: probe.durationSeconds,
      probeRaw: probe.raw,
      startedAt: new Date(Date.now() - durationMilliseconds).toISOString(),
    },
  };
}

async function renderControlledClip(input: {
  input: RenderEngineInput;
  ffmpegCommand: string;
  ffprobeCommand: string;
  timeoutMs: number;
}): Promise<RenderEngineResult> {
  const startedAt = performance.now();
  const outputResolution = resolveAbsoluteStoragePath(
    input.input.storageRoot,
    input.input.tempOutputPath,
  );
  mkdirSync(path.dirname(outputResolution.absolutePath), { recursive: true });

  const sourceAsset = input.input.inputAssets[0];
  if (!sourceAsset || !("storagePath" in sourceAsset) || !sourceAsset.storagePath) {
    throw new RenderEngineError("process_failed", "Controlled clip source asset is unavailable.");
  }

  const sourceResolution = resolveAbsoluteStoragePath(
    input.input.storageRoot,
    sourceAsset.storagePath,
  );
  const startSeconds = Math.max(0, input.input.job.startSeconds ?? 0);
  const endSeconds = Math.max(startSeconds, input.input.job.endSeconds ?? startSeconds);
  const requestedDurationSeconds = Math.max(0, endSeconds - startSeconds);

  const ffmpegArgs = [
    "-hide_banner",
    "-y",
    "-ss",
    String(startSeconds),
    "-to",
    String(endSeconds),
    "-i",
    sourceResolution.absolutePath,
    "-map",
    "0:v:0",
    "-map",
    "0:a?",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-avoid_negative_ts",
    "make_zero",
    outputResolution.absolutePath,
  ];

  const ffmpegResult = await runProcess(input.ffmpegCommand, ffmpegArgs, input.timeoutMs);
  if (ffmpegResult.exitCode !== 0) {
    throw new RenderEngineError(
      "process_failed",
      "FFmpeg exited with a non-zero code.",
      ffmpegResult.exitCode,
    );
  }

  const outputStats = statSync(outputResolution.absolutePath);
  if (outputStats.size <= 0) {
    throw new RenderEngineError(
      "process_failed",
      "FFmpeg produced an empty output file.",
      ffmpegResult.exitCode,
    );
  }

  const probe = await probeMediaFile({
    ffprobeCommand: input.ffprobeCommand,
    timeoutMs: input.timeoutMs,
    filePath: outputResolution.absolutePath,
  });

  if (probe.durationSeconds !== undefined) {
    const delta = Math.abs(probe.durationSeconds - requestedDurationSeconds);
    if (delta > DEFAULT_CLIP_TOLERANCE_SECONDS) {
      throw new RenderEngineError(
        "process_failed",
        "FFprobe duration is not compatible with the requested clip interval.",
        ffmpegResult.exitCode,
      );
    }
  }

  const durationMilliseconds = Math.max(1, Math.round(performance.now() - startedAt));
  return {
    stdout: ffmpegResult.stdout,
    stderr: ffmpegResult.stderr,
    exitCode: ffmpegResult.exitCode,
    durationMilliseconds,
    outputSizeBytes: outputStats.size,
    outputChecksum: checksumFile(outputResolution.absolutePath),
    technicalMetadata: {
      ffmpegCommand: input.ffmpegCommand,
      ffprobeCommand: input.ffprobeCommand,
      ffmpegTimeoutMs: input.timeoutMs,
      codec: probe.videoCodec ?? "libx264",
      container: probe.containerFormat ?? "mp4",
      resolution: probe.resolution,
      width: probe.width,
      height: probe.height,
      aspectRatio: probe.aspectRatio,
      durationSeconds: probe.durationSeconds,
      requestedStartSeconds: startSeconds,
      requestedEndSeconds: endSeconds,
      requestedDurationSeconds,
      sourceStoragePath: sourceAsset.storagePath,
      source: "parent_video",
      probeDurationSeconds: probe.durationSeconds,
      probeRaw: probe.raw,
      startedAt: new Date(Date.now() - durationMilliseconds).toISOString(),
    },
  };
}

async function runProcess(
  command: string,
  args: string[],
  timeoutMs: number,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const child = spawn(command, args, {
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

  return await new Promise((resolve, reject) => {
    let finished = false;
    const timer = setTimeout(() => {
      if (finished) {
        return;
      }
      finished = true;
      child.kill();
      reject(new RenderEngineError("timeout", `${command} execution timed out.`));
    }, timeoutMs);

    child.once("error", (error) => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timer);
      if (isMissingBinaryError(error)) {
        reject(new RenderEngineError("unavailable", `${command} is not available.`));
        return;
      }

      reject(new RenderEngineError("process_failed", `${command} execution failed.`));
    });

    child.once("close", (code) => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: code ?? -1,
      });
    });
  });
}

async function probeMediaFile(input: {
  ffprobeCommand: string;
  timeoutMs: number;
  filePath: string;
}): Promise<{
  durationSeconds?: number;
  containerFormat?: string;
  videoCodec?: string;
  resolution?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  raw: string;
}> {
  const args = [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_entries",
    "format=format_name,duration:stream=index,codec_name,codec_type,width,height,display_aspect_ratio",
    input.filePath,
  ];
  const result = await runProcess(input.ffprobeCommand, args, input.timeoutMs);
  if (result.exitCode !== 0) {
    throw new RenderEngineError(
      "process_failed",
      "FFprobe exited with a non-zero code.",
      result.exitCode,
    );
  }

  const parsed = JSON.parse(result.stdout || "{}") as {
    format?: { format_name?: string; duration?: string };
    streams?: Array<{
      codec_type?: string;
      codec_name?: string;
      width?: number;
      height?: number;
      display_aspect_ratio?: string;
    }>;
  };

  const videoStream = parsed.streams?.find((stream) => stream.codec_type === "video");
  const durationSeconds = parsed.format?.duration ? Number(parsed.format.duration) : undefined;
  const width = videoStream?.width;
  const height = videoStream?.height;
  const aspectRatio =
    videoStream?.display_aspect_ratio || (width && height ? `${width}:${height}` : undefined);

  return {
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : undefined,
    containerFormat: parsed.format?.format_name,
    videoCodec: videoStream?.codec_name,
    resolution: width && height ? `${width}x${height}` : undefined,
    width,
    height,
    aspectRatio,
    raw: result.stdout,
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
