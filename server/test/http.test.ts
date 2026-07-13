import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test, { after, before } from "node:test";
import type { Server } from "node:http";

import { createApp } from "../src/app.js";
import { createErrorResponse, createSuccessResponse } from "../src/http/response.js";

let server: Server;
let baseUrl = "";

before(async () => {
  const app = createApp({
    env: {
      ARALUME_ENV: "development",
      ARALUME_LOG_LEVEL: "error",
    },
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
  const response = await fetch(`${baseUrl}/health`);
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
});

test("POST /health with invalid JSON returns the standard error envelope", async () => {
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
  assert.ok(payload.meta.requestId.length > 0);
  assert.ok(payload.meta.generatedAt.length > 0);
  assert.equal("stack" in payload.error, false);
});

test("GET a missing route returns a not found envelope", async () => {
  const response = await fetch(`${baseUrl}/missing-route`);
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
  assert.equal(payload.error.details.path, "/missing-route");
  assert.equal(payload.error.details.method, "GET");
  assert.ok(payload.meta.requestId.length > 0);
  assert.ok(payload.meta.generatedAt.length > 0);
});
