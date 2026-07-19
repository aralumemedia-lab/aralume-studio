import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

export function evidenceDir(sprint) {
  const root = process.env.ARALUME_EVIDENCE_DIR?.trim() || path.join(process.cwd(), "screenshots");
  return path.join(root, `sprint-${sprint}`);
}

export function spawnCommand(command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    shell: false,
    windowsHide: true,
    stdio: "inherit",
    env: {
      ...process.env,
      ARALUME_ENV: process.env.ARALUME_ENV ?? "test",
      ARALUME_LOG_LEVEL: process.env.ARALUME_LOG_LEVEL ?? "info",
      ...extraEnv,
    },
  });

  child.once("exit", (code, signal) => {
    if (code !== 0 && signal !== "SIGTERM" && signal !== "SIGKILL") {
      console.error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`);
    }
  });
  return child;
}

export async function terminateProcess(child, timeoutMs = 10_000) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  const exited = new Promise((resolve) => child.once("exit", resolve));
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      windowsHide: true,
      stdio: "ignore",
    });
  } else {
    child.kill("SIGTERM");
  }

  await Promise.race([exited, delay(timeoutMs)]);
  if (child.exitCode === null && child.signalCode === null) {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        windowsHide: true,
        stdio: "ignore",
      });
    } else {
      child.kill("SIGKILL");
    }
    await Promise.race([exited, delay(2_000)]);
  }
}

export async function terminateProcesses(children) {
  for (const child of [...children].reverse()) {
    await terminateProcess(child);
  }
}

export async function waitForHttp(url, timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // The process may still be starting.
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

export async function runE2E(main) {
  try {
    await main();
    process.exitCode = 0;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
