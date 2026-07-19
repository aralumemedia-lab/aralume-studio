import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test, { after, before } from "node:test";
import type { Server } from "node:http";

import { createApp } from "../src/app.js";
import { createErrorResponse, createSuccessResponse } from "../src/http/response.js";

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
