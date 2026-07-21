#!/usr/bin/env node

import { appendFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const backendPort = 3001;
const frontendPort = 4173;
const backendBase = `http://127.0.0.1:${backendPort}`;
const frontendBase = `http://127.0.0.1:${frontendPort}`;
const smokeTraceFile = join(tmpdir(), "aralume-release-smoke.log");
const storageRoot = mkdtempSync(join(tmpdir(), "aralume-release-smoke-"));

function trace(message) {
  appendFileSync(smokeTraceFile, `${new Date().toISOString()} ${message}\n`, "utf8");
  console.log(message);
}

const env = {
  ...process.env,
  ARALUME_ENV: "staging",
  ARALUME_LOG_LEVEL: "info",
  ARALUME_AUTH_SIGNING_SECRET: randomBytes(32).toString("hex"),
  ARALUME_ASSET_STORAGE_ROOT: storageRoot,
  ARALUME_TRUSTED_PROXY_HOPS: "1",
  ARALUME_ALLOWED_HOSTS: "127.0.0.1,localhost",
  ARALUME_ALLOWED_ORIGINS: "http://127.0.0.1,http://localhost",
  ARALUME_BUILD_ID: "release-smoke",
};

const backendBuild = spawnSync("bun", ["run", "backend:build"], {
  env,
  stdio: "inherit",
});

if ((backendBuild.status ?? 1) !== 0) {
  rmSync(storageRoot, { recursive: true, force: true });
  process.exitCode = backendBuild.status ?? 1;
  throw new Error("backend build failed before smoke");
}

trace(`smoke: backend build complete (${smokeTraceFile})`);

if (!existsSync(join(".output", "server", "index.mjs"))) {
  rmSync(storageRoot, { recursive: true, force: true });
  throw new Error("frontend build output missing before smoke");
}

trace("smoke: frontend build output detected");

const backendProbeInit = {
  headers: {
    "X-Forwarded-Proto": "https",
  },
};

const backend = spawn("bun", ["run", "backend:start"], {
  env,
  stdio: ["ignore", "pipe", "pipe"],
});

const frontend = spawn(
  "npx",
  ["--yes", "wrangler", "dev", "--ip", "127.0.0.1", "--port", String(frontendPort)],
  {
    cwd: ".output",
    detached: true,
    env,
    shell: true,
    stdio: "ignore",
  },
);

frontend.unref();

const children = [backend, frontend];
for (const child of [backend]) {
  child.stdout?.on("data", (chunk) => {
    appendFileSync(smokeTraceFile, chunk);
    process.stdout.write(chunk);
  });
  child.stderr?.on("data", (chunk) => {
    appendFileSync(smokeTraceFile, chunk);
    process.stderr.write(chunk);
  });
  child.on("exit", (code, signal) => {
    trace(`child exit: code=${code ?? "null"} signal=${signal ?? "null"}`);
  });
  child.on("error", (error) => {
    trace(`child error: ${error instanceof Error ? error.message : String(error)}`);
  });
}

trace("smoke: backend and frontend processes spawned");

async function waitFor(url, predicate, timeoutMs = 120_000, init = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, init);
      if (predicate(response)) {
        return response;
      }
    } catch {
      // retry until timeout
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function shutdown(code = 0) {
  const exitPromises = children.map((child) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      child.once("exit", () => resolve(undefined));
    });
  });

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
    terminateProcessGroup(child, "SIGTERM");
  }

  if (process.platform === "win32") {
    for (const child of children) {
      if (child.pid) {
        spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
          stdio: "ignore",
        });
      }
    }
    cleanupWindowsPreviewProcesses();
  }

  const cleanupTimeout = new Promise((resolve) => {
    setTimeout(() => {
      for (const child of children) {
        if (child.exitCode === null && child.signalCode === null && !child.killed) {
          child.kill("SIGKILL");
        }
        terminateProcessGroup(child, "SIGKILL");
      }
      resolve(undefined);
    }, 15_000);
  });

  await Promise.race([Promise.all(exitPromises), cleanupTimeout]);

  rmSync(storageRoot, { recursive: true, force: true });
  if (code !== 0) {
    process.exitCode = code;
  }
}

function terminateProcessGroup(child, signal) {
  if (process.platform === "win32" || !child.pid) {
    return;
  }

  try {
    process.kill(-child.pid, signal);
  } catch {
    // Ignore ESRCH/EPERM; child.kill() already covered the direct process.
  }
}

function cleanupWindowsPreviewProcesses() {
  if (process.platform !== "win32") {
    return;
  }

  const command = `
    Get-CimInstance Win32_Process |
      Where-Object {
        $_.CommandLine -match 'wrangler dev --ip 127\\.0\\.0\\.1 --port ${frontendPort}|--socket-addr=entry=127\\.0\\.0\\.1:${frontendPort}|--socket-addr=entry=127\\.0\\.0\\.1:0'
      } |
      ForEach-Object {
        try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
      }
  `;

  spawnSync("powershell", ["-NoProfile", "-Command", command], {
    stdio: "ignore",
  });
}

try {
  trace("smoke: waiting for /live");
  await waitFor(`${backendBase}/live`, (response) => response.ok, 120_000, backendProbeInit);
  trace("smoke: /live is ready");
  trace("smoke: waiting for /ready");
  await waitFor(`${backendBase}/ready`, (response) => response.ok, 120_000, backendProbeInit);
  trace("smoke: /ready is ready");
  trace("smoke: waiting for frontend preview");
  await waitFor(`${frontendBase}/`, (response) => response.ok);
  trace("smoke: frontend preview is ready");

  const health = await fetch(`${backendBase}/health`, backendProbeInit).then((response) =>
    response.json(),
  );
  if (health?.ok !== true || health?.liveness?.ok !== true) {
    throw new Error("backend health was not ready");
  }
  trace("smoke: health payload validated");

  const ready = await fetch(`${backendBase}/ready`, backendProbeInit).then((response) =>
    response.json(),
  );
  if (ready?.status !== "ready" && ready?.status !== "degraded") {
    throw new Error("backend readiness was not available");
  }
  trace("smoke: readiness payload validated");

  const metrics = await fetch(`${backendBase}/ops/metrics`, backendProbeInit).then((response) =>
    response.json(),
  );
  if (!metrics?.metrics || typeof metrics.metrics.totalRequests !== "number") {
    throw new Error("operational metrics payload missing");
  }
  trace("smoke: metrics payload validated");

  const frontendHtml = await fetch(`${frontendBase}/`).then((response) => response.text());
  if (!frontendHtml.includes("<html")) {
    throw new Error("frontend preview response did not look like the app shell");
  }
  trace("smoke: frontend shell validated");

  trace("smoke: shutting down");
  await shutdown(0);
  trace(JSON.stringify({ status: "pass", backendBase, frontendBase }, null, 2));
} catch (error) {
  trace(error instanceof Error ? (error.stack ?? error.message) : String(error));
  await shutdown(1);
}
