import assert from "node:assert/strict";
import path from "node:path";

import { chromium } from "playwright";

import {
  evidenceDir,
  assertPortsAvailable,
  resetEvidenceDir,
  runE2E,
  spawnCommand,
  terminateProcesses,
  waitForHttp,
} from "./e2e-process-utils.mjs";

const BACKEND_BASE_URL = "http://127.0.0.1:3001";
const FRONTEND_BASE_URL = "http://127.0.0.1:4173";
const SCREENSHOT_DIR = evidenceDir(15);

async function main() {
  await resetEvidenceDir(15);
  await assertPortsAvailable([BACKEND_BASE_URL, FRONTEND_BASE_URL]);
  const backend = spawnCommand(process.execPath, [
    path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
    "server/src/index.ts",
  ]);
  const frontend = spawnCommand(process.execPath, [
    path.join(process.cwd(), "node_modules", "vite", "bin", "vite.js"),
    "dev",
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
  ]);

  try {
    await waitForHttp(`${BACKEND_BASE_URL}/api/channels`);
    await waitForHttp(FRONTEND_BASE_URL);
    const channels = await apiGet("/channels");
    assert.ok(channels.data.length >= 2, "expected two seeded channels");
    const channelA =
      channels.data.find((channel) => channel.id === "ch_historia") ?? channels.data[0];
    const channelB =
      channels.data.find((channel) => channel.id === "ch_negocios") ?? channels.data[1];
    const suffix = String(Date.now());
    const title = `Sprint 15 Pauta ${suffix}`;
    const editedTitle = `${title} editada`;
    const sessionTitle = `Sprint 15 Pesquisa ${suffix}`;

    const browser = await chromium.launch({ headless: true, timeout: 60_000 });
    try {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      const page = await context.newPage();
      page.setDefaultTimeout(45_000);
      page.setDefaultNavigationTimeout(60_000);

      await page.goto(`${FRONTEND_BASE_URL}/ideas`);
      await page.waitForLoadState("networkidle");
      await selectChannel(page, channelA.name);
      await page.waitForLoadState("networkidle");

      const ideasForm = page.locator("form").last();
      await ideasForm.locator('input[placeholder="Titulo da pauta"]').fill(title);
      await ideasForm
        .locator('textarea[placeholder="Resumo operacional da pauta"]')
        .fill("Resumo operacional da pauta da Sprint 15.");
      await ideasForm.locator('input[placeholder="Historia, ciencia..."]').fill("Historia");
      await ideasForm
        .locator('input[placeholder="Britannica, USP..."]')
        .fill("Fonte controlada Sprint 15");
      const scoreInputs = ideasForm.locator('input[type="number"]');
      await scoreInputs.nth(0).fill("90");
      await scoreInputs.nth(1).fill("85");
      await scoreInputs.nth(2).fill("88");
      await scoreInputs.nth(3).fill("80");
      const ideaResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/content-ideas") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      );
      await ideasForm.getByRole("button", { name: "Criar pauta" }).click();
      const ideaPayload = await (await ideaResponsePromise).json();
      await expectText(page, title);

      await ideasForm.locator('input[placeholder="Titulo da pauta"]').fill(editedTitle);
      const updateResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/content-ideas/") &&
          response.request().method() === "PATCH" &&
          response.status() === 200,
      );
      await ideasForm.getByRole("button", { name: "Salvar alteracoes" }).click();
      await updateResponsePromise;
      await expectText(page, editedTitle);
      await capture(page, "ideas-create-update.png");

      await page.goto(`${FRONTEND_BASE_URL}/research`);
      await page.waitForLoadState("networkidle");
      await selectChannel(page, channelA.name);
      await page.waitForLoadState("networkidle");
      const researchForms = page.locator("form");
      const sessionForm = researchForms.nth(0);
      const sourceForm = researchForms.nth(1);
      const claimForm = researchForms.nth(2);
      await sessionForm.locator('input[placeholder="Pesquisa para pauta X"]').fill(sessionTitle);
      await sessionForm
        .locator('textarea[placeholder="Objetivo da pesquisa, fontes esperadas e riscos"]')
        .fill("Pesquisa controlada para a pauta da Sprint 15.");
      await sessionForm.locator('input[type="number"]').fill("85");
      const sessionResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/research-sessions") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      );
      await page.getByRole("button", { name: "Criar sessao" }).click();
      const sessionPayload = await (await sessionResponsePromise).json();
      await expectText(page, sessionTitle);

      await sourceForm.locator('input[placeholder="Fonte principal"]').fill(`Fonte ${suffix}`);
      await sourceForm.locator('input[type="date"]').fill("2026-07-19");
      await sourceForm
        .locator('textarea[placeholder="Como a fonte sustenta a pauta"]')
        .fill("Fonte controlada para a pesquisa da Sprint 15.");
      const sourceResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/research-sessions/") &&
          response.url().includes("/sources?") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      );
      await page.getByRole("button", { name: "Salvar fonte" }).click();
      const sourcePayload = await (await sourceResponsePromise).json();
      await expectText(page, `Fonte ${suffix}`);

      await claimForm.locator("select").nth(0).selectOption(sourcePayload.data.id);
      await claimForm
        .locator('textarea[placeholder="Claim testavel e objetiva"]')
        .fill("A pauta possui fonte rastreavel.");
      await claimForm
        .locator('textarea[placeholder="Como a fonte sustenta a claim"]')
        .fill("A fonte controlada sustenta a claim.");
      const claimResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/research-sessions/") &&
          response.url().includes("/claims?") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      );
      await claimForm.getByRole("button", { name: "Salvar claim" }).click();
      await claimResponsePromise;
      await capture(page, "research-session-source-claim.png");

      await selectChannel(page, channelB.name);
      await page.waitForLoadState("networkidle");
      assert.equal(
        (await page.locator("body").innerText()).includes(title),
        false,
        "idea leaked across channels",
      );
      await capture(page, "research-channel-isolation.png");

      const auditLogs = await apiGet(`/audit-logs?channelId=${channelA.id}`);
      const expectedRequestIds = new Set([
        ideaPayload.meta.requestId,
        sessionPayload.meta.requestId,
        sourcePayload.meta.requestId,
      ]);
      assert.ok(
        auditLogs.data.some(
          (log) => log.action === "content_idea.created" && expectedRequestIds.has(log.requestId),
        ),
      );
      assert.ok(auditLogs.data.some((log) => log.action === "content_idea.updated"));
      assert.ok(
        auditLogs.data.some(
          (log) =>
            log.action === "research_session.created" && expectedRequestIds.has(log.requestId),
        ),
      );
      assert.ok(
        auditLogs.data.some(
          (log) =>
            log.action === "research_source.created" && expectedRequestIds.has(log.requestId),
        ),
      );
      assert.ok(auditLogs.data.every((log) => log.metadata?.requestId === undefined));

      console.log(
        JSON.stringify(
          {
            channelA: { id: channelA.id, name: channelA.name },
            channelB: { id: channelB.id, name: channelB.name },
            contentIdeaId: ideaPayload.data.id,
            researchSessionId: sessionPayload.data.id,
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
    await terminateProcesses([backend, frontend]);
  }
}

async function apiGet(pathname) {
  const response = await fetch(`${BACKEND_BASE_URL}/api${pathname}`);
  if (!response.ok) throw new Error(`GET ${pathname} failed with ${response.status}`);
  return response.json();
}

async function selectChannel(page, channelName) {
  const switcher = page.locator("header").getByRole("button").nth(1);
  await switcher.click();
  await page
    .locator("div.absolute.left-0.top-9.z-20")
    .getByRole("button")
    .filter({ hasText: channelName })
    .last()
    .click();
}

async function expectText(page, text) {
  await page.waitForFunction((needle) => document.body.innerText.includes(String(needle)), text, {
    timeout: 45_000,
  });
}

async function capture(page, fileName) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, fileName), fullPage: true });
}

async function listScreenshots() {
  const { readdir } = await import("node:fs/promises");
  return (await readdir(SCREENSHOT_DIR)).filter((entry) => entry.endsWith(".png")).sort();
}

await runE2E(main);
