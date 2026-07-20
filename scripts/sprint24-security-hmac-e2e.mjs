import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import {
  assertPortsAvailable,
  runE2E,
  spawnCommand,
  terminateProcesses,
  waitForServiceIdentity,
} from "./e2e-process-utils.mjs";

const BACKEND_BASE_URL = "http://127.0.0.1:3001";
const FRONTEND_BASE_URL = "http://127.0.0.1:4173";
const SCREENSHOT_DIR = path.join(
  process.env.ARALUME_EVIDENCE_DIR?.trim() || path.join(process.cwd(), "screenshots"),
  "sprint-24-security-hmac",
);

function issueToken(principal, secret) {
  const payload = Buffer.from(JSON.stringify(principal), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(payload, "utf8").digest("base64url");
  return `${payload}.${signature}`;
}

async function main() {
  await rm(SCREENSHOT_DIR, { recursive: true, force: true });
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await assertPortsAvailable([BACKEND_BASE_URL, FRONTEND_BASE_URL]);

  const secret = randomBytes(32).toString("base64url");
  const requestId = `s24-hmac-${randomBytes(8).toString("hex")}`;
  const ownerToken = issueToken(
    { sub: "s24-hmac-owner", role: "owner", channelIds: ["ch_historia"] },
    secret,
  );
  const observerToken = issueToken(
    { sub: "s24-hmac-observer", role: "owner", channelIds: ["ch_historia", "ch_negocios"] },
    secret,
  );
  const viewerToken = issueToken(
    { sub: "s24-hmac-viewer", role: "viewer", channelIds: ["ch_historia"] },
    secret,
  );

  const backend = spawnCommand(
    process.execPath,
    [path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"), "server/src/index.ts"],
    {
      ARALUME_ENV: "test",
      ARALUME_AUTH_SIGNING_SECRET: secret,
      ARALUME_AUTH_TEST_BYPASS: "false",
    },
  );
  const frontend = spawnCommand(process.execPath, [
    path.join(process.cwd(), "node_modules", "vite", "bin", "vite.js"),
    "dev",
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
  ]);

  try {
    await waitForServiceIdentity(`${BACKEND_BASE_URL}/health`, backend, "aralume-api");
    await waitForServiceIdentity(
      `${FRONTEND_BASE_URL}/__aralume/e2e-identity`,
      frontend,
      "aralume-web",
    );

    const browser = await chromium.launch({ headless: true });
    try {
      const ownerContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      const ownerPage = await ownerContext.newPage();
      await installAuthTransport(ownerPage, ownerToken, requestId);
      await ownerPage.goto(`${FRONTEND_BASE_URL}/channels`);
      await ownerPage.waitForLoadState("networkidle");
      await ownerPage.screenshot({ path: path.join(SCREENSHOT_DIR, "authorized-channel.png") });

      const authorizedBefore = await requestApi(
        ownerPage,
        "/operational-modes?channelId=ch_historia",
      );
      assert.equal(authorizedBefore.status, 200);
      const nextAuthorizedMode =
        authorizedBefore.payload.data.effectivePolicy.mode === "paused" ? "demo" : "paused";
      const authorizedMutation = await requestApi(
        ownerPage,
        "/operational-modes/channels/ch_historia",
        {
          method: "PATCH",
          body: { mode: nextAuthorizedMode },
        },
      );
      assert.equal(authorizedMutation.status, 200);

      const observerContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      const observerPage = await observerContext.newPage();
      await installAuthTransport(observerPage, observerToken, requestId);
      await observerPage.goto(`${FRONTEND_BASE_URL}/channels`);
      const crossChannelBefore = await requestApi(
        observerPage,
        "/operational-modes?channelId=ch_negocios",
      );
      assert.equal(crossChannelBefore.status, 200);

      const rejectedCrossChannel = await requestApi(
        ownerPage,
        "/operational-modes/channels/ch_negocios",
        {
          method: "PATCH",
          body: { mode: crossChannelBefore.payload.data.effectivePolicy.mode },
        },
      );
      assert.equal(rejectedCrossChannel.status, 403);
      assert.equal(rejectedCrossChannel.payload.error.code, "FORBIDDEN");
      assertSanitized(rejectedCrossChannel.payload, secret);

      const bodyConflict = await requestApi(ownerPage, "/operational-modes/channels/ch_historia", {
        method: "PATCH",
        body: { channelId: "ch_negocios", mode: "paused" },
      });
      assert.equal(bodyConflict.status, 403);
      assertSanitized(bodyConflict.payload, secret);

      const queryConflict = await requestApi(
        ownerPage,
        "/operational-modes/channels/ch_historia?channelId=ch_negocios",
        { method: "PATCH", body: { mode: "paused" } },
      );
      assert.equal(queryConflict.status, 403);
      assertSanitized(queryConflict.payload, secret);

      const crossChannelAfter = await requestApi(
        observerPage,
        "/operational-modes?channelId=ch_negocios",
      );
      assert.deepEqual(
        withoutEvaluationVolatility(crossChannelAfter.payload.data),
        withoutEvaluationVolatility(crossChannelBefore.payload.data),
      );
      await observerPage.screenshot({
        path: path.join(SCREENSHOT_DIR, "cross-channel-rejected.png"),
      });

      const unauthenticatedContext = await browser.newContext();
      const unauthenticatedPage = await unauthenticatedContext.newPage();
      await unauthenticatedPage.goto(`${FRONTEND_BASE_URL}/channels`);
      const missingToken = await requestApi(unauthenticatedPage, "/channels");
      assert.equal(missingToken.status, 401);
      assert.equal(missingToken.payload.error.code, "UNAUTHORIZED");
      assertSanitized(missingToken.payload, secret);

      await installAuthTransport(unauthenticatedPage, "invalid-token", requestId);
      const invalidToken = await requestApi(unauthenticatedPage, "/channels");
      assert.equal(invalidToken.status, 401);
      assert.equal(invalidToken.payload.error.code, "UNAUTHORIZED");
      assertSanitized(invalidToken.payload, secret);

      const viewerContext = await browser.newContext();
      const viewerPage = await viewerContext.newPage();
      await installAuthTransport(viewerPage, viewerToken, requestId);
      await viewerPage.goto(`${FRONTEND_BASE_URL}/channels`);
      const viewerMutation = await requestApi(
        viewerPage,
        "/operational-modes/channels/ch_historia",
        { method: "PATCH", body: { mode: "paused" } },
      );
      assert.equal(viewerMutation.status, 403);
      assert.equal(viewerMutation.payload.error.code, "FORBIDDEN");
      assertSanitized(viewerMutation.payload, secret);

      const audit = await requestApi(ownerPage, "/audit-logs?channelId=ch_historia");
      assert.equal(audit.status, 200);
      const policyAudit = audit.payload.data.find(
        (entry) => entry.action === "cost.policy_updated" && entry.requestId === requestId,
      );
      assert.ok(policyAudit, "expected trusted policy audit with requestId");
      assert.equal(policyAudit.actorName, "s24-hmac-owner");
      assert.equal(policyAudit.channelId, "ch_historia");
      assert.equal(policyAudit.metadata.actorId, "s24-hmac-owner");
      assert.equal(policyAudit.metadata.role, "owner");
      assert.doesNotMatch(JSON.stringify(audit.payload), new RegExp(secret));

      await Promise.all([
        ownerContext.close(),
        observerContext.close(),
        unauthenticatedContext.close(),
        viewerContext.close(),
      ]);
    } finally {
      await browser.close();
    }

    console.info(
      "Sprint 24 HMAC E2E: authorized=200, cross-channel=403, conflicts=403, missing=401, invalid=401, viewer=403",
    );
    console.info(
      "Sprint 24 HMAC E2E: explicit channel scopes, no wildcard, sanitized errors, no rejected mutation, trusted audit requestId verified",
    );
  } finally {
    await terminateProcesses([frontend, backend]);
  }
}

async function installAuthTransport(page, token, currentRequestId) {
  await page.route("**/api/**", async (route) => {
    const headers = {
      ...route.request().headers(),
      authorization: `Bearer ${token}`,
      "x-request-id": currentRequestId,
    };
    await route.continue({ headers });
  });
}

async function requestApi(page, pathname, options = {}) {
  return page.evaluate(
    async ({ pathname: pathName, method, body }) => {
      const response = await fetch(`/api${pathName}`, {
        method: method ?? "GET",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: response.status, payload: await response.json() };
    },
    { pathname, method: options.method, body: options.body },
  );
}

function assertSanitized(payload, secret) {
  const serialized = JSON.stringify(payload);
  assert.equal(serialized.includes(secret), false);
  assert.equal(serialized.includes("stack"), false);
  assert.equal(serialized.includes("Bearer"), false);
}

function withoutEvaluationVolatility(value) {
  if (Array.isArray(value)) {
    return value.map(withoutEvaluationVolatility);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "evaluatedAt" && key !== "id")
        .map(([key, entry]) => [key, withoutEvaluationVolatility(entry)]),
    );
  }
  return value;
}

await runE2E(main);
