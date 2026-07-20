import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { test } from "node:test";

import {
  e2eRunId,
  processRecordCount,
  runE2E,
  spawnCommand,
  terminateProcess,
  terminateProcesses,
  waitForProcessClose,
  waitForProcessStartup,
  waitForServiceIdentity,
} from "./e2e-process-utils.mjs";

function waitForClose(child) {
  return waitForProcessClose(child);
}

function waitForMessage(child, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.off("message", onMessage);
      reject(new Error("Timed out waiting for child IPC message."));
    }, 2_000);
    function onMessage(message) {
      if (!predicate(message)) {
        return;
      }
      clearTimeout(timer);
      child.off("message", onMessage);
      resolve(message);
    }
    child.on("message", onMessage);
  });
}

function longRunningChild(extraEnv = {}) {
  return spawnCommand(process.execPath, ["-e", "setTimeout(() => {}, 30_000)"], {
    ARALUME_AUTH_TEST_BYPASS: "false",
    ...extraEnv,
  });
}

async function startIdentityChild({ exitAfterStartup = false } = {}) {
  const child = spawnCommand(
    process.execPath,
    [
      "-e",
      [
        "const { createServer } = require('node:http');",
        "const runId = process.env.ARALUME_E2E_RUN_ID;",
        "const startupNonce = process.env.ARALUME_E2E_STARTUP_NONCE;",
        "const server = createServer((request, response) => {",
        "  response.setHeader('content-type', 'application/json');",
        "  response.end(JSON.stringify({ ok: true, service: 'aralume-api', runId, startupNonce, pid: process.pid, port: response.socket.localPort }));",
        "});",
        "server.listen(0, '127.0.0.1', () => {",
        "  process.send({ type: 'identity-port', port: server.address().port });",
        "});",
        exitAfterStartup ? "setTimeout(() => process.exit(0), 100);" : "",
      ].join(" "),
    ],
    { ARALUME_AUTH_TEST_BYPASS: "false" },
  );
  const message = await waitForMessage(child, (value) => value?.type === "identity-port");
  return { child, url: "http://127.0.0.1:" + message.port + "/health" };
}

async function startIdentityServer(payload, { hang = false } = {}) {
  const server = createServer((_request, response) => {
    if (hang) {
      return;
    }
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(payload));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return { server, url: "http://127.0.0.1:" + address.port + "/identity" };
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

test("accepts only the spawned process identity", async () => {
  const { child, url } = await startIdentityChild();
  try {
    const identity = await waitForServiceIdentity(url, child, "aralume-api", 1_000);
    assert.equal(identity.runId, e2eRunId);
    assert.equal(identity.pid, child.pid);
    assert.equal(identity.port, Number(new URL(url).port));
  } finally {
    await terminateProcess(child);
  }
});

test("rejects an endpoint served by another process", async () => {
  const child = longRunningChild();
  const { server, url } = await startIdentityServer({
    ok: true,
    service: "aralume-api",
    runId: e2eRunId,
    startupNonce: "wrong-process",
    pid: child.pid,
    port: 1,
  });
  try {
    await assert.rejects(
      () => waitForServiceIdentity(url, child, "aralume-api", 200),
      /identity mismatch/,
    );
  } finally {
    await terminateProcess(child);
    await closeServer(server);
  }
});

test("rejects stale and wrong service identities", async () => {
  const child = longRunningChild();
  const stale = await startIdentityServer({
    ok: true,
    service: "aralume-api",
    runId: "stale-execution",
  });
  try {
    await assert.rejects(
      () => waitForServiceIdentity(stale.url, child, "aralume-api", 200),
      /identity mismatch/,
    );
  } finally {
    await terminateProcess(child);
    await closeServer(stale.server);
  }

  const wrongChild = longRunningChild();
  const wrong = await startIdentityServer({
    ok: true,
    service: "wrong-service",
    runId: e2eRunId,
  });
  try {
    await assert.rejects(
      () => waitForServiceIdentity(wrong.url, wrongChild, "aralume-api", 200),
      /identity mismatch/,
    );
  } finally {
    await terminateProcess(wrongChild);
    await closeServer(wrong.server);
  }
});

test("rejects a child that closes before the startup handshake", async () => {
  const child = spawnCommand(process.execPath, ["-e", "process.exit(0)"], {
    ARALUME_E2E_BOOTSTRAP_DISABLED: "true",
  });
  await assert.rejects(() => waitForProcessStartup(child, 1_000), /before startup handshake/);
  await waitForClose(child);
  await terminateProcess(child).catch(() => {});
});

test("cancels a stalled identity fetch at the operation timeout", async () => {
  const child = longRunningChild();
  const stalled = await startIdentityServer({}, { hang: true });
  const started = Date.now();
  try {
    await assert.rejects(
      () => waitForServiceIdentity(stalled.url, child, "aralume-api", 150),
      /Timed out waiting for aralume-api identity/,
    );
    assert.ok(Date.now() - started < 2_000);
  } finally {
    await terminateProcess(child);
    await closeServer(stalled.server);
  }
});

test("rejects a service whose child dies after the startup handshake", async () => {
  const { child, url } = await startIdentityChild({ exitAfterStartup: true });
  await new Promise((resolve) => setTimeout(resolve, 150));
  await assert.rejects(
    () => waitForServiceIdentity(url, child, "aralume-api", 1_000),
    /exited unexpectedly|exited before identity confirmation|identity mismatch/,
  );
  await waitForClose(child);
  await terminateProcess(child).catch(() => {});
});

test("rejects an explicit runId override that does not match the endpoint", async () => {
  const child = longRunningChild({ ARALUME_E2E_RUN_ID: "different-execution" });
  const { server, url } = await startIdentityServer({
    ok: true,
    service: "aralume-api",
    runId: e2eRunId,
  });
  try {
    await assert.rejects(
      () => waitForServiceIdentity(url, child, "aralume-api", 200),
      /identity mismatch/,
    );
  } finally {
    await terminateProcess(child);
    await closeServer(server);
  }
});

test("propagates an unexpected non-zero child exit after close", async () => {
  const child = spawnCommand(process.execPath, ["-e", "process.exit(7)"], {
    ARALUME_AUTH_TEST_BYPASS: "false",
  });
  await waitForClose(child);
  await assert.rejects(() => terminateProcess(child), /exited unexpectedly.*code=7/);
});

test("teardown is single-flight and successful for expected termination", async () => {
  const child = longRunningChild();
  const first = terminateProcess(child);
  const second = terminateProcess(child);
  assert.equal(first, second);
  await Promise.all([first, second]);
  assert.notEqual(child.exitCode, null);
});

test("attempts every teardown and aggregates a failed child", async () => {
  const failed = spawnCommand(process.execPath, ["-e", "process.exit(7)"], {
    ARALUME_AUTH_TEST_BYPASS: "false",
  });
  const running = longRunningChild();
  await waitForClose(failed);
  await assert.rejects(
    () => terminateProcesses([failed, running]),
    /One or more E2E child processes failed/,
  );
  await waitForClose(running);
  assert.notEqual(running.exitCode, null);
});

test("converts a spawn error into a controlled failure", async () => {
  const child = spawnCommand("aralume-command-that-does-not-exist", [], {
    ARALUME_AUTH_TEST_BYPASS: "false",
  });
  await waitForClose(child);
  await assert.rejects(() => terminateProcess(child), /E2E child process failed to start/);
});

test("runE2E cleans active children and reports a child failure", () => {
  const script = [
    'import { runE2E, spawnCommand } from "./scripts/e2e-process-utils.mjs";',
    "await runE2E(async () => {",
    "  const child = spawnCommand(process.execPath, ['-e', 'setTimeout(() => process.exit(7), 10)'], { ARALUME_AUTH_TEST_BYPASS: 'false' });",
    "  await new Promise((resolve) => child.once('close', resolve));",
    "});",
  ].join("\n");
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 1, result.stderr);
});

test("registry returns to baseline after independent executions", async () => {
  const baseline = processRecordCount();
  const first = longRunningChild();
  await terminateProcess(first);
  assert.equal(processRecordCount(), baseline);
  const second = longRunningChild();
  await terminateProcess(second);
  assert.equal(processRecordCount(), baseline);
});
