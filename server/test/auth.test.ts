import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import test, { after, before } from "node:test";

import { createApp } from "../src/app.js";
import { issueAuthToken, type AuthPrincipal } from "../src/http/auth.js";
import { createAuditRepository } from "../src/modules/audit/audit.repository.js";

const secret = "sprint24-test-signing-secret";
const auditRepository = createAuditRepository();
const owner: AuthPrincipal = {
  sub: "owner-24",
  role: "owner",
  channelIds: ["ch_historia"],
};
const viewer: AuthPrincipal = {
  sub: "viewer-24",
  role: "viewer",
  channelIds: ["ch_historia"],
};
const multiChannelOwner: AuthPrincipal = {
  sub: "owner-multi-24",
  role: "owner",
  channelIds: ["ch_historia", "ch_curiosidades"],
};
const wildcardOwner: AuthPrincipal = {
  sub: "owner-wildcard-24",
  role: "owner",
  channelIds: ["*"],
};

let server: Server;
let baseUrl = "";

before(async () => {
  const app = createApp({
    env: {
      ARALUME_ENV: "test",
      ARALUME_LOG_LEVEL: "error",
      ARALUME_AUTH_SIGNING_SECRET: secret,
    },
    auditRepository,
  });
  server = app.listen(0);
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => (error ? reject(error) : resolve()));
  });
});

function authHeader(principal: AuthPrincipal): string {
  return `Bearer ${issueAuthToken(principal, secret)}`;
}

test("health remains public while operational API is fail-closed", async () => {
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);

  const response = await fetch(`${baseUrl}/api/scripts?channelId=ch_historia`);
  const payload = (await response.json()) as {
    error: { code: string; message: string; details: Record<string, unknown> };
    meta: { requestId: string };
  };

  assert.equal(response.status, 401);
  assert.equal(payload.error.code, "UNAUTHORIZED");
  assert.equal(payload.error.message, "Authentication is required.");
  assert.deepEqual(payload.error.details, {});
  assert.ok(payload.meta.requestId);
});

test("invalid identity and client-supplied identity are rejected and sanitized", async () => {
  const forged = await fetch(`${baseUrl}/api/scripts?channelId=ch_historia`, {
    headers: {
      authorization: "Bearer forged.invalid",
      "x-aralume-principal": "owner-24",
    },
  });
  const payload = (await forged.json()) as { error: { code: string; details: unknown } };

  assert.equal(forged.status, 401);
  assert.equal(payload.error.code, "UNAUTHORIZED");
  assert.deepEqual(payload.error.details, {});
  assert.equal(JSON.stringify(payload).includes("forged.invalid"), false);

  const expired = await fetch(`${baseUrl}/api/scripts?channelId=ch_historia`, {
    headers: {
      authorization: `Bearer ${issueAuthToken(
        { ...owner, exp: Math.floor(Date.now() / 1000) - 1 },
        secret,
      )}`,
    },
  });
  assert.equal(expired.status, 401);
});

test("valid principal can read its channel and cannot read another channel", async () => {
  const allowed = await fetch(`${baseUrl}/api/scripts?channelId=ch_historia`, {
    headers: { authorization: authHeader(owner) },
  });
  assert.equal(allowed.status, 200);

  const crossChannel = await fetch(`${baseUrl}/api/scripts?channelId=ch_curiosidades`, {
    headers: { authorization: authHeader(owner) },
  });
  const payload = (await crossChannel.json()) as {
    error: { code: string; details: Record<string, unknown> };
  };

  assert.equal(crossChannel.status, 403);
  assert.equal(payload.error.code, "FORBIDDEN");
  assert.deepEqual(payload.error.details, {});
  assert.equal(JSON.stringify(payload).includes("ch_curiosidades"), false);
});

test("channel-scoped operational surfaces fail closed without context and reject cross-channel reads", async () => {
  const noContext = await fetch(`${baseUrl}/api/costs`, {
    headers: { authorization: authHeader(owner) },
  });
  assert.equal(noContext.status, 403);

  const crossChannelPaths = [
    "/api/content-ideas?channelId=ch_curiosidades",
    "/api/research-sessions?channelId=ch_curiosidades",
    "/api/media-assets?channelId=ch_curiosidades",
    "/api/videos?channelId=ch_curiosidades",
    "/api/clips?channelId=ch_curiosidades",
    "/api/renders?channelId=ch_curiosidades",
    "/api/metrics?channelId=ch_curiosidades",
  ];

  for (const path of crossChannelPaths) {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { authorization: authHeader(owner) },
    });
    const payload = (await response.json()) as {
      error: { code: string; details: Record<string, unknown> };
    };
    assert.equal(response.status, 403, path);
    assert.equal(payload.error.code, "FORBIDDEN", path);
    assert.deepEqual(payload.error.details, {}, path);
    assert.equal(JSON.stringify(payload).includes("ch_curiosidades"), false, path);
  }
});

test("role without write permission is forbidden before mutation", async () => {
  const response = await fetch(`${baseUrl}/api/content-ideas`, {
    method: "POST",
    headers: {
      authorization: authHeader(viewer),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      channelId: "ch_historia",
      title: "Should not be created",
      summary: "This request must be rejected by authorization.",
      requestedBy: "client-forged-identity",
    }),
  });

  const payload = (await response.json()) as { error: { code: string; details: unknown } };
  assert.equal(response.status, 403);
  assert.equal(payload.error.code, "FORBIDDEN");
  assert.deepEqual(payload.error.details, {});
  assert.equal(
    JSON.stringify(auditRepository.listAuditLogs()).includes("client-forged-identity"),
    false,
  );
});

test("missing channel context is rejected by the route contract", async () => {
  const response = await fetch(`${baseUrl}/api/scripts`, {
    headers: { authorization: authHeader(owner) },
  });
  const payload = (await response.json()) as { error: { code: string } };

  assert.equal(response.status, 403);
  assert.equal(payload.error.code, "FORBIDDEN");
});

test("conflicting channel context is rejected before the domain operation", async () => {
  const response = await fetch(`${baseUrl}/api/content-ideas?channelId=ch_historia`, {
    method: "POST",
    headers: {
      authorization: authHeader(owner),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      channelId: "ch_curiosidades",
      title: "Conflicting channel",
      summary: "The query and body must agree.",
    }),
  });
  const payload = (await response.json()) as { error: { code: string; details: unknown } };

  assert.equal(response.status, 403);
  assert.equal(payload.error.code, "FORBIDDEN");
  assert.deepEqual(payload.error.details, {});
});

test("path channel authorization uses explicit scopes and cannot be replaced by body or query", async () => {
  const channelResponse = await fetch(`${baseUrl}/api/channels/ch_historia`, {
    headers: { authorization: authHeader(owner) },
  });
  assert.equal(channelResponse.status, 200);

  const requestId = "auth-path-channel-explicit-scope";
  const allowed = await fetch(`${baseUrl}/api/operational-modes/channels/ch_historia`, {
    method: "PATCH",
    headers: {
      authorization: authHeader(owner),
      "content-type": "application/json",
      "x-request-id": requestId,
    },
    body: JSON.stringify({ mode: "paused" }),
  });
  assert.equal(allowed.status, 200);

  const beforeRejectedMutations = await fetch(
    `${baseUrl}/api/operational-modes?channelId=ch_historia`,
    { headers: { authorization: authHeader(owner) } },
  );
  const beforePayload = (await beforeRejectedMutations.json()) as {
    data: { effectivePolicy: { mode: string } };
  };

  const crossChannel = await fetch(`${baseUrl}/api/operational-modes/channels/ch_curiosidades`, {
    method: "PATCH",
    headers: {
      authorization: authHeader(owner),
      "content-type": "application/json",
    },
    body: JSON.stringify({ mode: "paused" }),
  });
  assert.equal(crossChannel.status, 403);

  const bodyOverride = await fetch(`${baseUrl}/api/operational-modes/channels/ch_historia`, {
    method: "PATCH",
    headers: {
      authorization: authHeader(multiChannelOwner),
      "content-type": "application/json",
    },
    body: JSON.stringify({ mode: "demo", channelId: "ch_curiosidades" }),
  });
  assert.equal(bodyOverride.status, 403);

  const queryOverride = await fetch(
    `${baseUrl}/api/operational-modes/channels/ch_historia?channelId=ch_curiosidades`,
    {
      method: "PATCH",
      headers: {
        authorization: authHeader(multiChannelOwner),
        "content-type": "application/json",
      },
      body: JSON.stringify({ mode: "demo" }),
    },
  );
  assert.equal(queryOverride.status, 403);

  const afterRejectedMutations = await fetch(
    `${baseUrl}/api/operational-modes?channelId=ch_historia`,
    { headers: { authorization: authHeader(owner) } },
  );
  const afterPayload = (await afterRejectedMutations.json()) as {
    data: { effectivePolicy: { mode: string } };
  };
  assert.equal(afterPayload.data.effectivePolicy.mode, beforePayload.data.effectivePolicy.mode);

  const audit = auditRepository
    .listAuditLogs()
    .find((entry) => entry.action === "cost.policy_updated" && entry.requestId === requestId);
  assert.equal(audit?.actorName, owner.sub);
  assert.equal(audit?.channelId, "ch_historia");
  assert.equal(audit?.metadata?.actorId, owner.sub);
  assert.equal(audit?.metadata?.role, owner.role);

  const wildcard = await fetch(`${baseUrl}/api/operational-modes/channels/ch_curiosidades`, {
    method: "PATCH",
    headers: {
      authorization: authHeader(wildcardOwner),
      "content-type": "application/json",
    },
    body: JSON.stringify({ mode: "paused" }),
  });
  assert.equal(wildcard.status, 200);
});

test("oversized payload is rejected with a sanitized limit error", async () => {
  const response = await fetch(`${baseUrl}/api/media-assets`, {
    method: "POST",
    headers: {
      authorization: authHeader(owner),
      "content-type": "application/json",
    },
    body: JSON.stringify({ channelId: "ch_historia", description: "x".repeat(1_100_000) }),
  });
  const payload = (await response.json()) as {
    error: { code: string; message: string; details: unknown };
  };

  assert.equal(response.status, 413);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
  assert.equal(payload.error.message, "Request payload exceeds the allowed limit");
  assert.deepEqual(payload.error.details, {});
});

test("render input count is bounded before the operation starts", async () => {
  const response = await fetch(`${baseUrl}/api/renders`, {
    method: "POST",
    headers: {
      authorization: authHeader(owner),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      channelId: "ch_historia",
      inputAssetIds: Array.from({ length: 13 }, (_, index) => `ma_${index}`),
      renderType: "controlled_video",
      renderProfile: "controlled_demo_short_v1",
      idempotencyKey: "sprint24-limit-test",
    }),
  });
  const payload = (await response.json()) as { error: { code: string; details: unknown } };

  assert.equal(response.status, 400);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
  assert.ok(payload.error.details);
});

test("authorization decisions are audited with requestId and without credentials", () => {
  const logs = auditRepository.listAuditLogs();
  assert.ok(logs.some((log) => log.action === "auth.request_rejected" && log.requestId));
  assert.ok(logs.every((log) => log.actorName !== "client-forged-identity"));
  assert.equal(JSON.stringify(logs).includes(secret), false);
  assert.equal(JSON.stringify(logs).includes("Bearer "), false);
});
