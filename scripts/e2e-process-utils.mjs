import { AsyncLocalStorage } from "node:async_hooks";
import { spawn } from "node:child_process";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { createServer } from "node:net";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const executionStorage = new AsyncLocalStorage();
const recordByChild = new WeakMap();
const fallbackContext = { records: new Set() };
const bootstrapModule = pathToFileURL(
  path.join(process.cwd(), "scripts", "e2e-process-bootstrap.mjs"),
).href;

export const e2eRunId = randomUUID();

const identityChallengeHeader = "x-aralume-e2e-challenge";
const identityChallengeIssueHeader = "x-aralume-e2e-issue-challenge";

function identityProofMessage({ challenge, service, runId, pid, port }) {
  return [challenge, service, runId, String(pid), String(port)].join("\n");
}

function identityMac(secret, values) {
  return createHmac("sha256", secret).update(identityProofMessage(values)).digest("hex");
}

function hasValidIdentityMac(actual, expected) {
  if (typeof actual !== "string" || !/^[0-9a-f]{64}$/i.test(actual)) {
    return false;
  }
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function combineFailures(primary, cleanup) {
  const failures = [];
  const seen = new Set();
  const add = (failure) => {
    if (failure instanceof AggregateError) {
      failure.errors.forEach(add);
      return;
    }
    if (failure instanceof Error && !seen.has(failure)) {
      seen.add(failure);
      failures.push(failure);
    }
  };
  add(primary);
  add(cleanup);
  if (failures.length === 0) {
    return null;
  }
  if (failures.length === 1) {
    return failures[0];
  }
  return new AggregateError(failures, "E2E execution and teardown failed.");
}

function currentContext() {
  return executionStorage.getStore() ?? fallbackContext;
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function withTimeout(promise, timeoutMs, onTimeout) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(onTimeout()), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function describe(record) {
  return record.command + " " + record.args.join(" ");
}

function removeRecord(record) {
  record.context.records.delete(record);
}

function cleanupStartupListener(record) {
  record.child.off("message", record.onMessage);
}

function settleStartup(record, error) {
  if (record.startupSettled) {
    return;
  }
  record.startupSettled = true;
  record.startupError = error ?? null;
  record.startupTimer && clearTimeout(record.startupTimer);
  record.startup.resolve(error ? { error } : record);
}

function createProcessRecord(
  child,
  command,
  args,
  runId,
  startupNonce,
  startupCorrelationId,
  identitySecret,
  context,
) {
  const startup = createDeferred();
  const closed = createDeferred();
  const record = {
    child,
    command,
    args,
    context,
    runId,
    startupNonce,
    startupCorrelationId,
    identitySecret,
    terminationRequested: false,
    exitCode: null,
    signalCode: null,
    spawnError: null,
    unexpectedFailure: null,
    startup,
    startupSettled: false,
    startupError: null,
    startupConfirmed: false,
    startupPids: new Set([child.pid]),
    closed: false,
    closePromise: closed.promise,
    closeResolve: closed.resolve,
    terminationPromise: null,
    identityConfirmed: false,
    onMessage: null,
    startupTimer: null,
  };
  recordByChild.set(child, record);
  context.records.add(record);

  record.onMessage = (message) => {
    if (message?.type !== "aralume-e2e-started") {
      return;
    }
    if (
      message.runId !== record.runId ||
      message.nonce !== record.startupNonce ||
      message.correlationId !== record.startupCorrelationId ||
      !Number.isInteger(message.pid) ||
      message.pid <= 0
    ) {
      const error = new Error("E2E child startup nonce/runId/PID mismatch.");
      record.unexpectedFailure ??= error;
      settleStartup(record, error);
      return;
    }
    record.startupPids.add(message.pid);
    record.startupConfirmed = true;
    settleStartup(record);
  };
  child.on("message", record.onMessage);
  child.once("error", (error) => {
    record.spawnError = error;
    if (!record.terminationRequested) {
      record.unexpectedFailure = new Error(
        "E2E child process failed to start or emitted an error: " + describe(record),
        { cause: error },
      );
    }
    settleStartup(record, record.unexpectedFailure ?? record.spawnError);
  });
  child.once("exit", (code, signal) => {
    record.exitCode = code;
    record.signalCode = signal;
    if (!record.terminationRequested) {
      const exitFailure = !record.startupConfirmed
        ? new Error(
            "E2E child process exited before startup handshake: " +
              describe(record) +
              " (code=" +
              (code ?? "null") +
              ", signal=" +
              (signal ?? "null") +
              ")",
          )
        : new Error(
            "E2E child process exited unexpectedly: " +
              describe(record) +
              " (code=" +
              (code ?? "null") +
              ", signal=" +
              (signal ?? "null") +
              ")",
          );
      record.unexpectedFailure ??= exitFailure;
      if (!record.startupSettled) {
        settleStartup(record, exitFailure);
      }
    }
  });
  child.once("close", () => {
    record.closed = true;
    cleanupStartupListener(record);
    if (!record.startupSettled) {
      settleStartup(
        record,
        new Error("E2E child process closed before startup handshake: " + describe(record)),
      );
    }
    record.closeResolve(record);
  });
  return record;
}

function findRecord(child) {
  return recordByChild.get(child);
}

function failureFor(record) {
  return record.unexpectedFailure ?? record.spawnError ?? record.startupError;
}

export function processRecordCount() {
  return currentContext().records.size;
}

export function evidenceDir(sprint) {
  const root = process.env.ARALUME_EVIDENCE_DIR?.trim() || path.join(process.cwd(), "screenshots");
  return path.join(root, "sprint-" + sprint);
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
        reject(new Error("E2E port " + port + " is already in use; refusing stale-process reuse."));
        return;
      }
      reject(error);
    });
    probe.listen(port, "127.0.0.1", () => {
      probe.close(() => resolve());
    });
  });
}

export function spawnCommand(
  command,
  args,
  extraEnv = {},
  stdio = ["inherit", "inherit", "inherit", "ipc"],
) {
  const context = currentContext();
  const runId =
    extraEnv.ARALUME_E2E_RUN_ID ?? context.runId ?? process.env.ARALUME_E2E_RUN_ID ?? e2eRunId;
  const startupNonce = randomUUID();
  const startupCorrelationId = randomUUID();
  const identitySecret = randomBytes(32).toString("hex");
  const inheritedNodeOptions = extraEnv.NODE_OPTIONS ?? process.env.NODE_OPTIONS ?? "";
  const nodeOptions =
    extraEnv.ARALUME_E2E_BOOTSTRAP_DISABLED === "true"
      ? inheritedNodeOptions
      : inheritedNodeOptions + (inheritedNodeOptions ? " " : "") + "--import=" + bootstrapModule;
  const child = spawn(command, args, {
    cwd: process.cwd(),
    shell: false,
    windowsHide: true,
    detached: process.platform !== "win32",
    stdio,
    env: {
      ...process.env,
      ARALUME_ENV: process.env.ARALUME_ENV ?? "test",
      ARALUME_LOG_LEVEL: process.env.ARALUME_LOG_LEVEL ?? "info",
      ARALUME_AUTH_TEST_BYPASS: process.env.ARALUME_AUTH_TEST_BYPASS ?? "true",
      ARALUME_E2E_RUN_ID: runId,
      ARALUME_E2E_STARTUP_NONCE: startupNonce,
      ...extraEnv,
      ARALUME_E2E_STARTUP_CORRELATION_ID: startupCorrelationId,
      ARALUME_E2E_IDENTITY_SECRET: identitySecret,
      NODE_OPTIONS: nodeOptions,
    },
  });
  createProcessRecord(
    child,
    command,
    args,
    runId,
    startupNonce,
    startupCorrelationId,
    identitySecret,
    context,
  );
  return child;
}

export async function waitForProcessStartup(child, timeoutMs = 120_000) {
  const record = findRecord(child);
  if (!record) {
    throw new Error("Unknown E2E child process.");
  }
  if (record.startupSettled) {
    if (record.startupError) {
      throw record.startupError;
    }
    return record;
  }
  const result = await withTimeout(record.startup.promise, timeoutMs, () => {
    return new Error("Timed out waiting for E2E child startup handshake: " + describe(record));
  });
  if (result?.error) {
    throw result.error;
  }
  return result;
}

export async function waitForProcessClose(child, timeoutMs = 120_000) {
  const record = findRecord(child);
  if (!record) {
    throw new Error("Unknown E2E child process.");
  }
  return withTimeout(
    record.closePromise,
    timeoutMs,
    () => new Error("Timed out waiting for E2E child close: " + describe(record)),
  );
}

async function terminateProcessOnce(record, timeoutMs) {
  record.terminationRequested = true;
  const sendSignal = (signal) => {
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(record.child.pid), "/t", "/f"], {
          windowsHide: true,
          stdio: "ignore",
        });
      } else if (record.child.pid) {
        process.kill(-record.child.pid, signal);
      }
    } catch (error) {
      if (error?.code !== "ESRCH") {
        record.unexpectedFailure ??= error instanceof Error ? error : new Error(String(error));
      }
    }
  };

  if (!record.closed) {
    sendSignal("SIGTERM");
    try {
      await withTimeout(record.closePromise, timeoutMs, () => new Error("termination-timeout"));
    } catch (error) {
      if (error.message !== "termination-timeout") {
        throw error;
      }
      sendSignal("SIGKILL");
      await withTimeout(
        record.closePromise,
        2_000,
        () => new Error("E2E child process " + record.child.pid + " did not terminate."),
      );
    }
  }

  const failure = failureFor(record);
  if (failure) {
    throw failure;
  }
}

export function terminateProcess(child, timeoutMs = 10_000) {
  const record = findRecord(child);
  if (!record) {
    return Promise.resolve();
  }
  if (!record.terminationPromise) {
    record.terminationPromise = terminateProcessOnce(record, timeoutMs).finally(() => {
      removeRecord(record);
    });
  }
  return record.terminationPromise;
}

export async function terminateProcesses(children) {
  const uniqueChildren = [...new Set([...children])];
  const results = await Promise.allSettled(
    uniqueChildren.reverse().map((child) => terminateProcess(child)),
  );
  const failures = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason);
  if (failures.length > 0) {
    throw new AggregateError(failures, "One or more E2E child processes failed.");
  }
}

async function fetchWithTimeout(url, timeoutMs, options = {}, { parseJson = false } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const body = await response.text();
    return { response, body: parseJson ? JSON.parse(body) : body };
  } finally {
    clearTimeout(timer);
  }
}

export async function waitForHttp(url, timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const remaining = timeoutMs - (Date.now() - started);
    try {
      const { response } = await fetchWithTimeout(url, Math.min(1_000, remaining));
      if (response.ok) {
        return;
      }
    } catch {
      // The process may still be starting or the attempt may have been aborted.
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(500, Math.max(1, remaining))));
  }
  throw new Error("Timed out waiting for " + url);
}

export async function waitForServiceIdentity(url, child, expectedService, timeoutMs = 120_000) {
  const started = Date.now();
  const record = findRecord(child);
  if (!record) {
    throw new Error("Unknown E2E child process.");
  }
  await waitForProcessStartup(child, timeoutMs);
  const expectedPort = Number(new URL(url).port || 80);

  while (Date.now() - started < timeoutMs) {
    const failure = failureFor(record);
    if (failure) {
      throw failure;
    }
    if (record.closed || child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        "E2E service process exited before identity confirmation: " + expectedService,
      );
    }

    const remaining = timeoutMs - (Date.now() - started);
    try {
      const issued = await fetchWithTimeout(
        url,
        Math.min(1_000, remaining),
        { headers: { [identityChallengeIssueHeader]: "1" } },
        { parseJson: true },
      );
      if (!issued.response.ok || typeof issued.body?.identityChallenge !== "string") {
        throw new Error(
          "E2E service did not issue a challenge for " +
            expectedService +
            ": expected a server-issued single-use identity challenge.",
        );
      }
      const challenge = issued.body.identityChallenge;
      const proofRemaining = timeoutMs - (Date.now() - started);
      if (proofRemaining <= 0) {
        throw new Error("Timed out waiting for " + expectedService + " identity proof.");
      }
      const { response, body: payload } = await fetchWithTimeout(
        url,
        Math.min(1_000, proofRemaining),
        { headers: { [identityChallengeHeader]: challenge } },
        { parseJson: true },
      );
      if (response.ok) {
        const expectedMac = identityMac(record.identitySecret, {
          challenge,
          service: expectedService,
          runId: record.runId,
          pid: payload?.pid,
          port: payload?.port,
        });
        const valid =
          payload?.ok === true &&
          payload.service === expectedService &&
          payload.runId === record.runId &&
          payload.startupNonce === record.startupNonce &&
          record.startupPids.has(payload.pid) &&
          payload.port === expectedPort &&
          hasValidIdentityMac(payload.identityMac, expectedMac);
        if (valid) {
          if (record.closed || child.exitCode !== null || child.signalCode !== null) {
            throw new Error(
              "E2E service process exited before identity confirmation: " + expectedService,
            );
          }
          record.identityConfirmed = true;
          return payload;
        }
        throw new Error(
          "E2E service identity mismatch for " +
            expectedService +
            ": expected runId, startupNonce, IPC-confirmed PID, port and challenge-response proof belonging to the spawned process.",
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("E2E service identity mismatch")) {
        throw error;
      }
      // The process may still be starting or the attempt may have been aborted.
    }
    const sleepMs = Math.min(500, Math.max(1, timeoutMs - (Date.now() - started)));
    await new Promise((resolve) => setTimeout(resolve, sleepMs));
  }

  throw new Error(
    "Timed out waiting for " + expectedService + " identity at " + url + " for run " + record.runId,
  );
}

export async function runE2E(main) {
  const context = { records: new Set(), runId: randomUUID() };
  let failure = null;
  await executionStorage.run(context, async () => {
    try {
      await main();
      const failures = [...context.records]
        .map(failureFor)
        .filter((entry) => entry instanceof Error);
      if (failures.length > 0) {
        failure = new AggregateError(failures, "Unexpected E2E child process failure.");
      }
    } catch (error) {
      failure = error;
    } finally {
      try {
        await terminateProcesses([...context.records].map((record) => record.child));
      } catch (cleanupError) {
        failure = combineFailures(failure, cleanupError);
      }
      context.records.clear();
    }
  });
  if (failure) {
    console.error(failure);
    process.exitCode = 1;
  }
}
