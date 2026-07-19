import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { chromium } from "playwright";
import { evidenceDir, runE2E } from "./e2e-process-utils.mjs";

const BACKEND_BASE_URL = "http://127.0.0.1:3001";
const FRONTEND_BASE_URL = "http://127.0.0.1:4173";
const SCREENSHOT_DIR = evidenceDir(20);

async function main() {
  await rm(SCREENSHOT_DIR, { recursive: true, force: true });
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const storageRoot = path.join(os.tmpdir(), `aralume-sprint20-${Date.now()}`);
  await mkdir(storageRoot, { recursive: true });

  const backend = spawnCommand(
    process.execPath,
    [path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"), "server/src/index.ts"],
    { ARALUME_ASSET_STORAGE_ROOT: storageRoot },
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
    await waitForHttp(`${BACKEND_BASE_URL}/api/channels`);
    await waitForHttp(FRONTEND_BASE_URL);

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
      const externalRequests = [];
      const uploadRequests = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (
          !url.hostname.endsWith("127.0.0.1") &&
          url.hostname !== "localhost" &&
          !["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname)
        ) {
          externalRequests.push(request.url());
        }
        if (request.method() !== "GET" && /upload|publish/i.test(url.pathname)) {
          uploadRequests.push(`${request.method()} ${url.pathname}`);
        }
      });

      await page.goto(`${FRONTEND_BASE_URL}/publications`);
      await page.waitForLoadState("networkidle");
      await expectText(page, "Publicacoes");
      await expectText(page, "Pode seguir");
      await setViewport(page, 1366, 768);
      await toggleSidebar(page, true);
      await capture(page, "publications-1366-expanded.png");
      await toggleSidebar(page, false);
      await capture(page, "publications-1366-collapsed.png");
      await toggleSidebar(page, true);

      const suffix = String(Date.now());
      const title = `Pacote Sprint 20 ${suffix}`;
      await page.getByLabel("Titulo").fill(title);
      await page
        .getByLabel("Descricao")
        .fill("Pacote preparado para revisao humana sem envio externo.");
      await page.getByLabel("Agendamento").fill("");
      await page.getByLabel("Privacidade").selectOption("unlisted");
      await page.getByLabel("Categoria permitida").fill("education");
      await page.getByLabel("Tags permitidas").fill("historia, sprint20");
      await page.getByRole("checkbox").check();

      const createResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/publications") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      );
      await page
        .getByRole("button", { name: /Preparar/ })
        .first()
        .click();
      const createResponse = await createResponsePromise;
      const createPayload = await createResponse.json();
      const job = createPayload.data;
      assert.equal(job.channelId, channelA.id);
      assert.equal(job.status, "draft");
      assert.equal(job.humanConfirmed, true);
      assert.equal(job.privacyStatus, "unlisted");
      assert.deepEqual(job.metadata.tags, ["historia", "sprint20"]);
      await expectText(page, title);
      await setViewport(page, 1600, 900);
      await capture(page, "publications-1600-success.png");
      await assertNoHorizontalOverflow(page);

      await page.reload();
      await page.waitForLoadState("networkidle");
      await expectText(page, title);
      await expectText(page, "Confirmacao humana");
      await page.getByRole("checkbox").uncheck();
      await setViewport(page, 1600, 900);
      await capture(page, "publications-1600-invalid.png");
      await setViewport(page, 1792, 1024);
      await capture(page, "publications-1792-reload.png");
      await assertNoHorizontalOverflow(page);

      const auditLogs = await apiGet(`/audit-logs?channelId=${channelA.id}`);
      assert.ok(
        auditLogs.data.some(
          (log) =>
            log.action === "publication.package_prepared" &&
            log.entityId === job.id &&
            log.requestId === createPayload.meta.requestId,
        ),
        "expected publication audit correlation",
      );

      await selectChannel(page, channelA.name, channelB.name);
      await page.waitForLoadState("networkidle");
      await expectText(page, "Nenhum job encontrado");
      await setViewport(page, 1920, 1080);
      await capture(page, "publications-1920-isolation.png");
      await assertNoHorizontalOverflow(page);

      assert.equal(
        await apiPostStatus("/publications", {
          channelId: channelB.id,
          publicationTargetId: job.publicationTargetId,
          contentId: job.contentId,
          sourceVideoAssetId: job.sourceVideoAssetId,
          title,
          description: "Cross-channel must be rejected.",
          idempotencyKey: `publication:cross-channel:${suffix}`,
          privacyStatus: "private",
          metadata: { tags: [] },
          humanConfirmed: true,
        }),
        404,
      );

      assert.equal(
        await apiPostStatus("/publications", {
          channelId: channelA.id,
          publicationTargetId: job.publicationTargetId,
          contentId: job.contentId,
          sourceVideoAssetId: job.sourceVideoAssetId,
          title: "Payload invalido",
          description: "Nao deve criar job.",
          idempotencyKey: `publication:invalid:${suffix}`,
          humanConfirmed: false,
        }),
        400,
      );

      await selectChannel(page, channelB.name, channelA.name);
      await page.waitForLoadState("networkidle");
      await expectText(page, title);
      await page.getByLabel("Titulo").fill(`${title} conflito`);
      await page.getByLabel("Idempotencia").fill(job.idempotencyKey);
      await page.getByRole("checkbox").check();
      const conflictResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/publications") &&
          response.request().method() === "POST" &&
          response.status() === 409,
      );
      await page
        .getByRole("button", { name: /Preparar/ })
        .first()
        .click();
      await conflictResponsePromise;
      await expectText(page, "entrou em conflito");
      await setViewport(page, 1600, 900);
      await capture(page, "publications-1600-conflict.png");

      assert.deepEqual(pageErrors, [], "browser page errors should remain empty");
      assert.deepEqual(
        externalRequests,
        [],
        "assisted preparation must not call external providers",
      );
      assert.deepEqual(uploadRequests, [], "assisted preparation must not upload or publish");
      console.log(
        JSON.stringify(
          {
            channelA: channelA.id,
            channelB: channelB.id,
            publicationJobId: job.id,
            requestId: createPayload.meta.requestId,
            externalRequests,
            uploadRequests,
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
    await terminateProcess(frontend);
    await terminateProcess(backend);
    await rm(storageRoot, { recursive: true, force: true });
  }
}

function spawnCommand(command, args, extraEnv = {}) {
  return spawn(command, args, {
    cwd: process.cwd(),
    shell: false,
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      ARALUME_ENV: "test",
      ARALUME_LOG_LEVEL: "info",
      ARALUME_AUTH_TEST_BYPASS: "true",
      ...extraEnv,
    },
  });
}

async function waitForHttp(url) {
  const started = Date.now();
  while (Date.now() - started < 120_000) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Keep retrying while child processes boot.
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function apiGet(pathname) {
  const response = await fetch(`${BACKEND_BASE_URL}/api${pathname}`);
  if (!response.ok) throw new Error(`GET ${pathname} failed with ${response.status}`);
  return response.json();
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
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
}

async function listScreenshots() {
  return (await readdir(SCREENSHOT_DIR)).sort();
}

async function terminateProcess(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      shell: false,
      windowsHide: true,
    });
    await waitForProcessExit(killer, 10_000);
  } else {
    child.kill("SIGTERM");
  }
  if (!(await waitForProcessExit(child, 5_000))) {
    child.kill("SIGKILL");
    await waitForProcessExit(child, 5_000);
  }
}

async function waitForProcessExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.removeListener("exit", onExit);
      resolve(false);
    }, timeoutMs);
    function onExit() {
      clearTimeout(timeout);
      resolve(true);
    }
    child.once("exit", onExit);
  });
}

await runE2E(main);
