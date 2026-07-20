import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

import {
  runE2E,
  spawnCommand,
  terminateProcess,
  terminateProcesses,
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
