import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { test } from "node:test";

import {
  runE2E,
  spawnCommand,
  terminateProcess,
  terminateProcesses,
  e2eRunId,
  waitForServiceIdentity,
} from "./e2e-process-utils.mjs";

function waitForClose(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }
  return new Promise((resolve) => child.once("close", resolve));
}

function longRunningChild() {
  return spawnCommand(process.execPath, ["-e", "setTimeout(() => {}, 30_000)"], {
    ARALUME_AUTH_TEST_BYPASS: "false",
  });
}

async function startIdentityServer(payload) {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(payload));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return { server, url: `http://127.0.0.1:${address.port}/identity` };
}

test("accepts only the expected service and current execution identity", async () => {
  const child = longRunningChild();
  const { server, url } = await startIdentityServer({
    ok: true,
    service: "aralume-api",
    runId: e2eRunId,
  });

  try {
    const identity = await waitForServiceIdentity(url, child, "aralume-api", 1_000);
    assert.equal(identity.runId, e2eRunId);
  } finally {
    await terminateProcess(child);
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("rejects a stale execution identity even when HTTP is healthy", async () => {
  const child = longRunningChild();
  const { server, url } = await startIdentityServer({
    ok: true,
    service: "aralume-api",
    runId: "stale-execution",
  });

  try {
    await assert.rejects(
      () => waitForServiceIdentity(url, child, "aralume-api", 50),
      /Timed out waiting for aralume-api identity/,
    );
  } finally {
    await terminateProcess(child);
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("rejects a healthy process advertising the wrong service", async () => {
  const child = longRunningChild();
  const { server, url } = await startIdentityServer({
    ok: true,
    service: "wrong-service",
    runId: e2eRunId,
  });

  try {
    await assert.rejects(
      () => waitForServiceIdentity(url, child, "aralume-api", 50),
      /Timed out waiting for aralume-api identity/,
    );
  } finally {
    await terminateProcess(child);
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("propagates an unexpected non-zero child exit after the child already stopped", async () => {
  const child = spawnCommand(process.execPath, ["-e", "process.exit(7)"], {
    ARALUME_AUTH_TEST_BYPASS: "false",
  });
  await waitForClose(child);

  await assert.rejects(() => terminateProcess(child), /exited unexpectedly.*code=7/);
});

test("teardown remains successful for an expected termination", async () => {
  const child = longRunningChild();

  await terminateProcesses([child]);
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

test("runE2E exits non-zero when a child fails after startup", () => {
  const script = `
    import { runE2E, spawnCommand } from "./scripts/e2e-process-utils.mjs";
    await runE2E(async () => {
      spawnCommand(process.execPath, ["-e", "process.exit(7)"], { ARALUME_AUTH_TEST_BYPASS: "false" });
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 1, result.stderr);
});
