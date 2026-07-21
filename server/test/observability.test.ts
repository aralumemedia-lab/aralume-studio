import assert from "node:assert/strict";
import http from "node:http";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test, { afterEach } from "node:test";

import { createApp } from "../src/app.js";
import type { OperationalRuntime } from "../src/operational.js";
import { attachGracefulShutdown } from "../src/server-lifecycle.js";

type Harness = {
  app: ReturnType<typeof createApp>;
  runtime: OperationalRuntime;
  server: import("node:http").Server;
  baseUrl: string;
  logs: string[];
  shutdown: (signal?: NodeJS.Signals) => Promise<void>;
};

const harnesses = new Set<Harness>();

afterEach(async () => {
  const pending = [...harnesses];
  harnesses.clear();
  await Promise.allSettled(
    pending.map(async (harness) => {
      harness.shutdown = harness.shutdown ?? (async () => {});
      try {
        await harness.shutdown("SIGTERM");
      } catch {
        // Best-effort cleanup for failed assertions.
      }
      await new Promise<void>((resolve) => harness.server.close(() => resolve()));
    }),
  );
});

async function startHarness(
  envOverrides: Record<string, unknown> = {},
  options: { productionLike?: boolean } = {},
): Promise<Harness> {
  const logs: string[] = [];
  const app = createApp({
    authTestBypass: true,
    logger: {
      info: (message: string) => logs.push(message),
      warn: (message: string) => logs.push(message),
      error: (message: string) => logs.push(message),
    },
    env: {
      ARALUME_ENV: options.productionLike ? "production" : "development",
      ARALUME_LOG_LEVEL: "info",
      ARALUME_ASSET_STORAGE_ROOT: options.productionLike
        ? mkdtempSync(path.join(os.tmpdir(), "aralume-ops-"))
        : undefined,
      ARALUME_AUTH_SIGNING_SECRET: options.productionLike
        ? "production-observability-secret-32-chars"
        : undefined,
      ARALUME_TRUSTED_PROXY_HOPS: options.productionLike ? 1 : undefined,
      ARALUME_ALLOWED_HOSTS: options.productionLike ? "127.0.0.1,localhost" : undefined,
      ARALUME_ALLOWED_ORIGINS: options.productionLike
        ? "https://127.0.0.1,https://localhost"
        : undefined,
      ARALUME_BUILD_ID: "observability-test-build",
      ...envOverrides,
    } as never,
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const runtime = app.locals.operational as OperationalRuntime;
  runtime.setListening(address.address, address.port);
  const shutdown = attachGracefulShutdown(server, runtime, {
    info: (message: string) => logs.push(message),
    warn: (message: string) => logs.push(message),
    error: (message: string) => logs.push(message),
  }).shutdown;

  const harness = {
    app,
    runtime,
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    logs,
    shutdown,
  };
  harnesses.add(harness);
  return harness;
}

function parseLogEntry(line: string): Record<string, unknown> {
  return JSON.parse(line) as Record<string, unknown>;
}

function rawRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const request = http.request(
      {
        method: options.method ?? "GET",
        hostname: parsed.hostname,
        port: Number(parsed.port),
        path: `${parsed.pathname}${parsed.search}`,
        headers: options.headers,
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve({ status: response.statusCode ?? 0, body });
        });
      },
    );
    request.once("error", reject);
    if (options.body) {
      request.write(options.body);
    }
    request.end();
  });
}

test("operational health surfaces and logs are structured", async () => {
  const harness = await startHarness();

  const live = (await fetch(`${harness.baseUrl}/live`).then((response) => response.json())) as {
    ok: boolean;
    status: string;
  };
  const ready = (await fetch(`${harness.baseUrl}/ready`).then((response) => response.json())) as {
    ok: boolean;
    status: string;
    checks: Array<{ name: string; status: string }>;
  };
  const health = (await fetch(`${harness.baseUrl}/health`).then((response) => response.json())) as {
    build: { buildId: string; source: string };
    metrics: { totalRequests: number };
    topology: { requireHttps: boolean };
  };
  const metrics = (await fetch(`${harness.baseUrl}/ops/metrics`).then((response) =>
    response.json(),
  )) as {
    metrics: { totalRequests: number; activeRequests: number };
  };

  assert.equal(live.ok, true);
  assert.equal(live.status, "alive");
  assert.equal(ready.ok, true);
  assert.equal(ready.status, "ready");
  assert.ok(ready.checks.some((check) => check.name === "storage"));
  assert.equal(typeof health.build.buildId, "string");
  assert.equal(typeof health.build.source, "string");
  assert.equal(typeof health.topology.requireHttps, "boolean");
  assert.equal(metrics.metrics.totalRequests >= 3, true);

  const requestLog = parseLogEntry(harness.logs.at(-1) ?? "{}");
  assert.equal(requestLog.route, "/ops/metrics");
  assert.equal(requestLog.method, "GET");
  assert.equal(requestLog.status, 200);
  assert.equal(typeof requestLog.requestId, "string");
  assert.equal(JSON.stringify(requestLog).includes("?"), false);
});

test("ingress rejects forged host, origin and protocol headers", async () => {
  const harness = await startHarness({}, { productionLike: true });
  const invalidHost = await rawRequest(`${harness.baseUrl}/ready`, {
    headers: {
      Host: "evil.example.test",
      Origin: "https://127.0.0.1",
      "x-forwarded-proto": "https",
    },
  });
  assert.equal(invalidHost.status, 403);

  const invalidOrigin = await rawRequest(`${harness.baseUrl}/ready`, {
    headers: {
      Host: "127.0.0.1",
      Origin: "https://evil.example.test",
      "x-forwarded-proto": "https",
    },
  });
  assert.equal(invalidOrigin.status, 403);

  const insecure = await rawRequest(`${harness.baseUrl}/ready`, {
    headers: {
      Host: "127.0.0.1",
      Origin: "https://127.0.0.1",
    },
  });
  assert.equal(insecure.status, 403);
});

test("request body limits reject oversized JSON before the route completes", async () => {
  const harness = await startHarness();
  const oversized = JSON.stringify({
    payload: "a".repeat(1_200_000),
  });
  const response = await fetch(`${harness.baseUrl}/health`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_body_limit",
    },
    body: oversized,
  });

  assert.equal(response.status, 413);
});

test("shutdown withdraws readiness and closes the listener", async () => {
  const harness = await startHarness();
  assert.equal(harness.runtime.snapshotReady().ok, true);

  const shutdownPromise = harness.shutdown("SIGTERM");
  assert.equal(harness.runtime.snapshotReady().status, "shutting_down");
  await shutdownPromise;
  assert.equal(harness.runtime.state.phase, "stopped");
  assert.equal(harness.runtime.snapshotReady().ok, false);
  await assert.rejects(() => fetch(`${harness.baseUrl}/ready`));
});
