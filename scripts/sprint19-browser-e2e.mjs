import assert from "node:assert/strict";
import { mkdir, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { chromium } from "playwright";
import {
  assertPortsAvailable,
  evidenceDir,
  resetEvidenceDir,
  runE2E,
  spawnCommand,
  terminateProcesses,
  waitForServiceIdentity,
} from "./e2e-process-utils.mjs";

const BACKEND_BASE_URL = "http://127.0.0.1:3001";
const FRONTEND_BASE_URL = "http://127.0.0.1:4173";
const SCREENSHOT_DIR = evidenceDir(19);

async function main() {
  await resetEvidenceDir(19);
  await assertPortsAvailable([BACKEND_BASE_URL, FRONTEND_BASE_URL]);
  const storageRoot = path.join(os.tmpdir(), `aralume-sprint19-${Date.now()}`);
  await mkdir(storageRoot, { recursive: true });

  const backend = spawnCommand(
    process.execPath,
    [path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"), "server/src/index.ts"],
    {
      ARALUME_ASSET_STORAGE_ROOT: storageRoot,
      ARALUME_ENV: "test",
      ARALUME_AUTH_TEST_BYPASS: "true",
    },
  );
  const frontend = spawnCommand(
    process.execPath,
    [
      path.join(process.cwd(), "node_modules", "vite", "bin", "vite.js"),
      "dev",
      "--force",
      "--mode",
      "production",
      "--host",
      "127.0.0.1",
      "--port",
      "4173",
    ],
    { ARALUME_ENV: "test", ARALUME_AUTH_TEST_BYPASS: "true" },
  );

  try {
    await waitForServiceIdentity(`${BACKEND_BASE_URL}/health`, backend, "aralume-api");
    await waitForServiceIdentity(
      `${FRONTEND_BASE_URL}/__aralume/e2e-identity`,
      frontend,
      "aralume-web",
    );
    const channels = await apiGet("/channels");
    const channelA = channels.data.find((channel) => channel.id === "ch_historia");
    const channelB = channels.data.find((channel) => channel.id === "ch_negocios");
    assert.ok(channelA, "expected ch_historia");
    assert.ok(channelB, "expected ch_negocios");

    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      const page = await context.newPage();
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await page.goto(`${FRONTEND_BASE_URL}/approvals`);
      await page.waitForLoadState("networkidle");
      await expectText(page, "Aprovacoes");

      await page.getByLabel("Tipo de artefato da verificacao").selectOption("script");
      await page.getByLabel("ID do artefato da verificacao").fill("sc_01");
      const qualityResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/quality-checks") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      );
      await page.getByRole("button", { name: "Executar qualidade" }).click();
      const qualityPayload = await (await qualityResponsePromise).json();
      assert.equal(qualityPayload.data.status, "passed");

      const complianceResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/compliance-checks") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      );
      await page.getByRole("button", { name: "Executar compliance" }).click();
      const compliancePayload = await (await complianceResponsePromise).json();
      assert.notEqual(compliancePayload.data.status, "blocked");
      await expectText(page, "Verificacao registrada");
      await capture(page, "approvals-1366-expanded.png");

      await toggleSidebar(page, false);
      await capture(page, "approvals-1366-collapsed.png");
      await toggleSidebar(page, true);

      const suffix = String(Date.now());
      const title = `Aprovacao Sprint 19 ${suffix}`;
      await page.getByLabel("Tipo de artefato da aprovacao").selectOption("script");
      await page.getByLabel("ID do artefato da aprovacao").fill("sc_01");
      await page.getByLabel("Titulo da aprovacao").fill(title);
      await page
        .getByLabel("Resumo da aprovacao")
        .fill("Solicitacao criada pelo fluxo E2E da Sprint 19.");
      const approvalResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/approvals") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      );
      await page.getByRole("button", { name: "Criar aprovacao" }).click();
      const approvalResponse = await approvalResponsePromise;
      const approvalPayload = await approvalResponse.json();
      const approvalId = approvalPayload.data.id;
      assert.equal(approvalPayload.data.channelId, channelA.id);
      await expectText(page, title);
      assert.deepEqual(pageErrors, [], "browser page errors should remain empty");
      await page.getByText(title, { exact: true }).click();
      await expectText(page, "Decisao humana");
      await setViewport(page, 1600, 900);
      await capture(page, "approvals-1600-success.png");

      await page
        .getByLabel("Justificativa da decisao")
        .fill("Aprovado apos os gates de qualidade e compliance.");
      const decisionResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/approvals/${approvalId}/approve`) &&
          response.request().method() === "POST" &&
          response.status() === 200,
      );
      await page.getByRole("button", { name: "Aprovar" }).click();
      const decisionResponse = await decisionResponsePromise;
      const decisionPayload = await decisionResponse.json();
      assert.equal(decisionPayload.data.status, "approved");
      await expectText(page, "Aprovado");
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expectText(page, title);
      await page.getByText(title, { exact: true }).first().click();
      await expectText(page, "Historico de decisoes");
      await expectText(page, "approve");
      await setViewport(page, 1792, 1024);
      await capture(page, "approvals-1792-reload.png");
      await assertNoHorizontalOverflow(page);

      const auditLogs = await apiGet(`/audit-logs?channelId=${channelA.id}`);
      assert.ok(
        auditLogs.data.some(
          (log) =>
            log.action === "approval.created" &&
            log.entityId === approvalId &&
            log.requestId === approvalPayload.meta.requestId,
        ),
        "expected approval creation audit correlation",
      );
      assert.ok(
        auditLogs.data.some(
          (log) =>
            log.action === "approval.approved" &&
            log.entityId === approvalId &&
            log.requestId === decisionPayload.meta.requestId,
        ),
        "expected approval decision audit correlation",
      );

      await page.goto(`${FRONTEND_BASE_URL}/compliance`);
      await page.waitForLoadState("networkidle");
      await expectText(page, "Conformidade");
      await page.getByLabel("Tipo de artefato da verificacao").selectOption("visual_plan");
      await page.getByLabel("ID do artefato da verificacao").fill("vp_01");
      const blockedResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/compliance-checks") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      );
      await page.getByRole("button", { name: "Executar compliance" }).click();
      const blockedPayload = await (await blockedResponsePromise).json();
      assert.equal(blockedPayload.data.status, "blocked");
      await expectText(page, "Bloqueado");
      await setViewport(page, 1600, 900);
      await capture(page, "compliance-1600-blocked.png");

      await page.goto(`${FRONTEND_BASE_URL}/approvals`);
      await page.waitForLoadState("networkidle");
      await selectChannel(page, channelA.name, channelB.name);
      await page.waitForLoadState("networkidle");
      await expectText(page, "Nenhuma aprovacao");
      await setViewport(page, 1920, 1080);
      await capture(page, "approvals-1920-isolation.png");
      await assertNoHorizontalOverflow(page);

      assert.equal(await apiGetStatus(`/approvals/${approvalId}?channelId=${channelB.id}`), 404);
      assert.equal(
        await apiPostStatus("/quality-checks", {
          channelId: channelB.id,
          entityType: "script",
          entityId: "sc_01",
        }),
        409,
      );

      await page.getByLabel("Tipo de artefato da verificacao").selectOption("script");
      await page.getByLabel("ID do artefato da verificacao").fill("sc_01");
      const conflictResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/quality-checks") &&
          response.request().method() === "POST" &&
          response.status() === 409,
      );
      await page.getByRole("button", { name: "Executar qualidade" }).click();
      await conflictResponsePromise;
      await expectText(page, "entrou em conflito");
      await setViewport(page, 1600, 900);
      await capture(page, "approvals-1600-conflict.png");

      await selectChannel(page, channelB.name, channelA.name);
      await page.waitForLoadState("networkidle");
      await expectText(page, title);

      console.log(
        JSON.stringify(
          {
            channelA: channelA.id,
            channelB: channelB.id,
            approvalId,
            qualityCheckId: qualityPayload.data.id,
            complianceCheckId: compliancePayload.data.id,
            screenshots: await listScreenshots(),
          },
          null,
          2,
        ),
      );
      await context.close();
    } finally {
      await browser.close();
    }
  } finally {
    let teardownError;
    try {
      await terminateProcesses([frontend, backend]);
    } catch (error) {
      teardownError = error;
    }
    try {
      await rm(storageRoot, { recursive: true, force: true });
    } finally {
      if (teardownError) throw teardownError;
    }
  }
}

async function apiGet(pathname) {
  const response = await fetch(`${BACKEND_BASE_URL}/api${pathname}`);
  if (!response.ok) throw new Error(`GET ${pathname} failed with ${response.status}`);
  return response.json();
}

async function apiGetStatus(pathname) {
  return (await fetch(`${BACKEND_BASE_URL}/api${pathname}`)).status;
}

async function apiPostStatus(pathname, body) {
  return (
    await fetch(`${BACKEND_BASE_URL}/api${pathname}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  ).status;
}

async function selectChannel(page, currentChannelName, nextChannelName) {
  await page.getByRole("button", { name: currentChannelName, exact: true }).click();
  const dropdown = page.locator("div.absolute.left-0.top-9.z-20");
  await dropdown.waitFor({ state: "visible" });
  await dropdown.getByRole("button").filter({ hasText: nextChannelName }).last().click();
}

async function toggleSidebar(page, expanded) {
  const sidebar = page.locator("aside");
  const box = await sidebar.boundingBox();
  const isCollapsed = box ? box.width < 100 : false;
  if ((expanded && !isCollapsed) || (!expanded && isCollapsed)) return;
  await page.getByRole("button", { name: "Alternar sidebar" }).click();
  await page.waitForTimeout(200);
}

async function setViewport(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(150);
}

async function expectText(page, text) {
  const candidates = page.getByText(text, { exact: false });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    for (let index = 0; index < (await candidates.count()); index += 1) {
      if (await candidates.nth(index).isVisible()) return;
    }
    await delay(250);
  }
  throw new Error(`Expected visible text: ${text}`);
}

async function assertNoHorizontalOverflow(page) {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
    `horizontal overflow at ${await page.evaluate(() => `${window.innerWidth}x${window.innerHeight}`)}`,
  );
}

async function capture(page, filename) {
  await page.evaluate(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) activeElement.blur();
  });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
}

async function listScreenshots() {
  return (await readdir(SCREENSHOT_DIR)).sort();
}

await runE2E(main);
