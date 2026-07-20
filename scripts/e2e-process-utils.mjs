import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

export function evidenceDir(sprint) {
  const root = process.env.ARALUME_EVIDENCE_DIR?.trim() || path.join(process.cwd(), "screenshots");
  return path.join(root, `sprint-${sprint}`);
}

export async function resetEvidenceDir(sprint) {
  const directory = evidenceDir(sprint);
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  return directory;
}

export async function assertPortsAvailable(urls) {
  for (const url of urls) {
    const parsed = new URL(url);
    const port = Number(parsed.port || (parsed.protocol === "https:" ? 443 : 80));
    await assertPortAvailable(port);
  }
}

function assertPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        reject(new Error(`E2E port ${port} is already in use; refusing stale-process reuse.`));
        return;
      }
      reject(error);
    });
    probe.listen(port, "127.0.0.1", () => {
      probe.close(() => resolve());
    });
  });
}

export function spawnCommand(command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    shell: false,
    windowsHide: true,
    detached: process.platform !== "win32",
    stdio: "inherit",
    env: {
      ...process.env,
      ARALUME_ENV: process.env.ARALUME_ENV ?? "test",
      ARALUME_LOG_LEVEL: process.env.ARALUME_LOG_LEVEL ?? "info",
      ARALUME_AUTH_TEST_BYPASS: process.env.ARALUME_AUTH_TEST_BYPASS ?? "true",
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
    process.kill(-child.pid, "SIGTERM");
  }

  await Promise.race([exited, delay(timeoutMs)]);
  if (child.exitCode === null && child.signalCode === null) {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        windowsHide: true,
        stdio: "ignore",
      });
    } else {
      process.kill(-child.pid, "SIGKILL");
    }
    await Promise.race([exited, delay(2_000)]);
  }

  if (child.exitCode === null && child.signalCode === null) {
    throw new Error(`E2E child process ${child.pid} did not terminate.`);
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
