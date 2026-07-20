import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test, { after, before } from "node:test";
import type { Server } from "node:http";

import { createApp } from "../src/app.js";
import { createErrorResponse, createSuccessResponse } from "../src/http/response.js";
import { exceedsJsonDepth, MAX_JSON_DEPTH } from "../src/http/middleware.js";

let server: Server;
let baseUrl = "";
const logLines: string[] = [];
const captureLogger = {
  info: (message: string) => {
    logLines.push(message);
  },
  warn: (message: string) => {
    logLines.push(message);
  },
  error: (message: string) => {
    logLines.push(message);
  },
};

before(async () => {
  const app = createApp({
    authTestBypass: true,
    env: {
      ARALUME_ENV: "development",
      ARALUME_LOG_LEVEL: "info",
    },
    logger: captureLogger,
  });

  server = app.listen(0);
  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected a TCP listener address");
  }

  baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test("response helpers create the standard envelopes", () => {
  const success = createSuccessResponse(
    { ok: true },
    {
      requestId: "req_123",
      generatedAt: "2026-07-12T00:00:00.000Z",
    },
  );

  assert.deepEqual(success, {
    data: { ok: true },
    meta: {
      requestId: "req_123",
      generatedAt: "2026-07-12T00:00:00.000Z",
    },
  });

  const error = createErrorResponse(
    "NOT_FOUND",
    "Route not found",
    { path: "/missing" },
    {
      requestId: "req_456",
      generatedAt: "2026-07-12T00:00:00.000Z",
    },
  );

  assert.deepEqual(error, {
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
      details: { path: "/missing" },
    },
    meta: {
      requestId: "req_456",
      generatedAt: "2026-07-12T00:00:00.000Z",
    },
  });
});

test("GET /health returns the foundation health payload", async () => {
  logLines.length = 0;
  const response = await fetch(`${baseUrl}/health`);
  const requestId = response.headers.get("x-request-id");
  const payload = (await response.json()) as {
    ok: boolean;
    service: string;
    environment: string;
    version: string;
  };

  assert.equal(response.status, 200);
  assert.deepEqual(payload, {
    ok: true,
    service: "aralume-api",
    environment: "development",
    version: "0.1.0",
  });
  assert.ok(requestId);
  assert.equal(
    logLines.some((line) => line.includes("/health")),
    true,
  );
  assert.equal(
    logLines.some((line) => line.includes(`[${requestId}]`)),
    true,
  );
  assert.equal(
    logLines.some((line) => line.includes("?")),
    false,
  );
});

test("E2E identity challenges are single-use and expire", async () => {
  const e2eApp = createApp({
    authTestBypass: true,
    env: {
      ARALUME_ENV: "test",
      ARALUME_LOG_LEVEL: "info",
      ARALUME_E2E_RUN_ID: "http-test-run",
      ARALUME_E2E_STARTUP_NONCE: "http-test-nonce",
      ARALUME_E2E_IDENTITY_SECRET: "http-test-secret",
    },
    logger: captureLogger,
  });
  const e2eServer = e2eApp.listen(0);
  await once(e2eServer, "listening");
  const address = e2eServer.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/health`;
  const challenge = Date.now().toString(36) + "." + "a".repeat(64);
  const request = () => fetch(url, { headers: { "x-aralume-e2e-challenge": challenge } });

  try {
    const first = await request().then((response) => response.json());
    const replay = await request().then((response) => response.json());
    assert.equal(typeof first.identityMac, "string");
    assert.equal(replay.identityMac, undefined);

    const concurrentChallenge = Date.now().toString(36) + "." + "b".repeat(64);
    const concurrent = await Promise.all(
      Array.from({ length: 20 }, () =>
        fetch(url, { headers: { "x-aralume-e2e-challenge": concurrentChallenge } }).then(
          (response) => response.json(),
        ),
      ),
    );
    assert.equal(concurrent.filter((payload) => typeof payload.identityMac === "string").length, 1);

    const expired = await fetch(url, {
      headers: { "x-aralume-e2e-challenge": "0." + "c".repeat(64) },
    }).then((response) => response.json());
    assert.equal(expired.identityMac, undefined);
  } finally {
    await new Promise<void>((resolve, reject) =>
      e2eServer.close((error?: Error) => (error ? reject(error) : resolve())),
    );
  }
});

test("POST /health with invalid JSON returns the standard error envelope", async () => {
  logLines.length = 0;
  const response = await fetch(`${baseUrl}/health`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: '{"broken":',
  });
  const payload = (await response.json()) as {
    error: {
      code: string;
      message: string;
      details: Record<string, unknown>;
    };
    meta: {
      requestId: string;
      generatedAt: string;
    };
  };

  assert.equal(response.status, 400);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
  assert.equal(payload.error.message, "Invalid JSON payload");
  assert.deepEqual(payload.error.details, {});
  assert.equal(response.headers.get("content-type")?.startsWith("application/json"), true);
  assert.ok(payload.meta.requestId.length > 0);
  assert.ok(payload.meta.generatedAt.length > 0);
  assert.equal("stack" in payload.error, false);
});

test("JSON depth validation is iterative, bounded and applies to objects and arrays", async () => {
  const nested = (depth: number, array = false): unknown => {
    let value: unknown = true;
    for (let index = 0; index < depth; index += 1) {
      value = array ? [value] : { nested: value };
    }
    return value;
  };

  assert.equal(exceedsJsonDepth(nested(MAX_JSON_DEPTH - 1)), false);
  assert.equal(exceedsJsonDepth(nested(MAX_JSON_DEPTH)), false);
  assert.equal(exceedsJsonDepth(nested(MAX_JSON_DEPTH + 1)), true);
  assert.equal(exceedsJsonDepth(nested(1200)), true);
  assert.equal(exceedsJsonDepth(nested(MAX_JSON_DEPTH + 1, true)), true);

  const response = await fetch(`${baseUrl}/api/media-assets`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": "req_json_depth" },
    body: JSON.stringify({
      channelId: "ch_historia",
      type: "image",
      category: "visual",
      name: "Deep payload",
      description: "Rejected before schema processing or persistence.",
      mimeType: "image/png",
      extension: "png",
      sizeBytes: 1,
      checksum: "0".repeat(64),
      storagePath: "ch_historia/image/deep.png",
      origin: "generated",
      provenance: "Security regression test.",
      licenseStatus: "confirmed",
      status: "available",
      riskLevel: "ok",
      costActualCents: 0,
      technicalMetadata: nested(1200),
    }),
  });
  const payload = (await response.json()) as {
    error: { code: string; message: string; details: Record<string, unknown> };
  };

  assert.equal(response.status, 413);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
  assert.equal(payload.error.message, "Request JSON exceeds the allowed nesting depth");
  assert.deepEqual(payload.error.details, {});
  assert.equal(JSON.stringify(payload).includes("stack"), false);

  const healthResponse = await fetch(`${baseUrl}/health`);
  assert.equal(healthResponse.status, 200);
});

test("GET a missing route with query returns a sanitized not found envelope and log", async () => {
  logLines.length = 0;
  const response = await fetch(
    `${baseUrl}/rota-inexistente?token=segredo&email=teste%40example.com`,
  );
  const requestId = response.headers.get("x-request-id");
  const payload = (await response.json()) as {
    error: {
      code: string;
      message: string;
      details: Record<string, unknown>;
    };
    meta: {
      requestId: string;
      generatedAt: string;
    };
  };

  assert.equal(response.status, 404);
  assert.equal(payload.error.code, "NOT_FOUND");
  assert.equal(payload.error.message, "Route not found");
  assert.equal(payload.error.details.path, "/rota-inexistente");
  assert.equal(payload.error.details.method, "GET");
  assert.equal(JSON.stringify(payload).includes("token=segredo"), false);
  assert.equal(JSON.stringify(payload).includes("teste@example.com"), false);
  assert.ok(requestId);
  assert.equal(requestId, payload.meta.requestId);
  assert.equal(logLines.length > 0, true);
  assert.equal(
    logLines.some((line) => line.includes("token=segredo")),
    false,
  );
  assert.equal(
    logLines.some((line) => line.includes("teste@example.com")),
    false,
  );
  assert.equal(
    logLines.some((line) => line.includes("?")),
    false,
  );
  assert.equal(
    logLines.some((line) => line.includes("/rota-inexistente")),
    true,
  );
  assert.equal(
    logLines.some((line) => line.startsWith(`[${payload.meta.requestId}]`)),
    true,
  );
  assert.ok(payload.meta.requestId.length > 0);
  assert.ok(payload.meta.generatedAt.length > 0);
});
