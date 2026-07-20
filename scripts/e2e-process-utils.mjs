import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const processRecords = new Set();

function createProcessRecord(child, command, args) {
  const record = {
    child,
    command,
    args,
    terminationRequested: false,
    exitCode: null,
    signalCode: null,
    spawnError: null,
    closed: false,
    unexpectedFailure: null,
  };
  processRecords.add(record);

  child.once("error", (error) => {
    record.spawnError = error;
    if (!record.terminationRequested) {
      record.unexpectedFailure = new Error(
        `E2E child process failed to start or emitted an error: ${command} ${args.join(" ")}`,
        { cause: error },
      );
    }
  });
  child.once("exit", (code, signal) => {
    record.exitCode = code;
    record.signalCode = signal;
    if (!record.terminationRequested && (code !== 0 || signal !== null)) {
      record.unexpectedFailure = new Error(
        `E2E child process exited unexpectedly: ${command} ${args.join(" ")} ` +
          `(code=${code ?? "null"}, signal=${signal ?? "null"})`,
      );
    }
  });
  child.once("close", () => {
    record.closed = true;
  });
  return record;
}

function failureFor(record) {
  return record.unexpectedFailure ?? record.spawnError;
}

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
  createProcessRecord(child, command, args);
  return child;
}

export async function terminateProcess(child, timeoutMs = 10_000) {
  const record = [...processRecords].find((entry) => entry.child === child);
  if (!record) {
    return;
  }

  if (!record.closed && record.exitCode === null && record.signalCode === null) {
    record.terminationRequested = true;
    const exited = new Promise((resolve) => child.once("close", resolve));
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
          windowsHide: true,
          stdio: "ignore",
        });
      } else if (child.pid) {
        process.kill(-child.pid, "SIGTERM");
      }
    } catch (error) {
      if (error?.code !== "ESRCH") {
        record.unexpectedFailure ??= error instanceof Error ? error : new Error(String(error));
      }
    }

    await Promise.race([exited, delay(timeoutMs)]);
    if (!record.closed && record.exitCode === null && record.signalCode === null) {
      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
            windowsHide: true,
            stdio: "ignore",
          });
        } else if (child.pid) {
          process.kill(-child.pid, "SIGKILL");
        }
      } catch (error) {
        if (error?.code !== "ESRCH") {
          record.unexpectedFailure ??= error instanceof Error ? error : new Error(String(error));
        }
      }
      await Promise.race([exited, delay(2_000)]);
    }
  }

  if (!record.closed && record.exitCode === null && record.signalCode === null) {
    throw new Error(`E2E child process ${child.pid} did not terminate.`);
  }
  const failure = failureFor(record);
  if (failure) {
    throw failure;
  }
}

export async function terminateProcesses(children) {
  const results = await Promise.allSettled(
    [...children].reverse().map((child) => terminateProcess(child)),
  );
  const failures = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason);
  if (failures.length > 0) {
    throw new AggregateError(failures, "One or more E2E child processes failed.");
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
    const failures = [...processRecords]
      .map(failureFor)
      .filter((failure) => failure instanceof Error);
    if (failures.length > 0) {
      throw new AggregateError(failures, "Unexpected E2E child process failure.");
    }
    process.exitCode = 0;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
