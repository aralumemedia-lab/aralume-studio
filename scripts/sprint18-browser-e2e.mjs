import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { chromium } from "playwright";

const BACKEND_BASE_URL = "http://127.0.0.1:3001";
const FRONTEND_BASE_URL = "http://127.0.0.1:4173";
const SCREENSHOT_DIR = path.join(process.cwd(), "screenshots", "sprint-18");

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const storageRoot = path.join(os.tmpdir(), `aralume-sprint18-${Date.now()}`);
  await mkdir(storageRoot, { recursive: true });
  await seedRenderPolicy(storageRoot);
  await seedRenderFixtures(storageRoot);

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
    const channelA =
      channels.data.find((channel) => channel.id === "ch_historia") ?? channels.data[0];
    const channelB =
      channels.data.find((channel) => channel.id === "ch_negocios") ??
      channels.data.find((channel) => channel.id !== channelA.id);
    assert.ok(channelA, "expected a primary channel");
    assert.ok(channelB, "expected a second channel for isolation");

    const suffix = String(Date.now());
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      const page = await context.newPage();
      let currentChannelName = channelA.name;

      await page.goto(`${FRONTEND_BASE_URL}/videos`);
      await page.waitForLoadState("networkidle");
      await selectChannel(page, currentChannelName, channelB.name);
      currentChannelName = channelB.name;
      await page.waitForLoadState("networkidle");
      await setViewport(page, 1366, 768);
      await toggleSidebar(page, false);
      await capture(page, "videos-1366-empty-collapsed.png");
      await toggleSidebar(page, true);
      await capture(page, "videos-1366-empty-expanded.png");
      await assertNoHorizontalOverflow(page);

      await selectChannel(page, currentChannelName, channelA.name);
      currentChannelName = channelA.name;
      await page.waitForLoadState("networkidle");
      await expectText(page, "Ativos de entrada");
      await page.getByRole("button", { name: "Usar primeiros 2" }).click();
      const selectedInputs = page.getByRole("checkbox");
      assert.ok((await selectedInputs.count()) >= 2, "expected two render inputs");

      let delayFirstRender = true;
      await page.route("**/api/renders", async (route) => {
        if (route.request().method() === "POST" && delayFirstRender) {
          delayFirstRender = false;
          await delay(700);
        }
        await route.continue();
      });
      const renderResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/renders") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      );
      await page.getByRole("button", { name: "Iniciar render controlado" }).click();
      await setViewport(page, 1600, 900);
      await capture(page, "videos-1600-running.png");
      const renderResponse = await renderResponsePromise;
      const renderPayload = await renderResponse.json();
      assert.equal(renderPayload.data.status, "completed");
      assert.ok(renderPayload.data.outputAssetId);
      await expectText(page, "rendered");
      await capture(page, "videos-1600-success.png");
      await assertNoHorizontalOverflow(page);

      const firstJobId = renderPayload.data.id;
      const firstOutputId = renderPayload.data.outputAssetId;
      const renderRequestId = renderPayload.meta.requestId;
      const auditAfterRender = await apiGet(`/audit-logs?channelId=${channelA.id}`);
      assert.ok(
        auditAfterRender.data.some(
          (log) =>
            log.entityId === firstJobId &&
            log.action === "render.execution_completed" &&
            log.requestId === renderRequestId,
        ),
        "expected render completion audit correlated to the HTTP request",
      );

      await page.reload();
      await page.waitForLoadState("networkidle");
      await setViewport(page, 1792, 1024);
      await expectText(page, firstJobId);
      await expectText(page, firstOutputId);
      await capture(page, "videos-1792-reload.png");
      await assertNoHorizontalOverflow(page);

      await page.getByRole("button", { name: "Usar primeiros 2" }).click();
      await page.getByLabel("Chave de idempotencia").fill(renderPayload.data.idempotencyKey);
      await page.getByRole("checkbox").nth(1).click();
      const conflictResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/renders") &&
          response.request().method() === "POST" &&
          response.status() === 409,
      );
      await setViewport(page, 1600, 900);
      await page.getByRole("button", { name: "Iniciar render controlado" }).click();
      await conflictResponsePromise;
      await expectText(page, "entrou em conflito");
      await capture(page, "videos-1600-error.png");

      await page.goto(
        `${FRONTEND_BASE_URL}/clips?parentVideoId=${encodeURIComponent(firstOutputId)}`,
      );
      await page.waitForLoadState("networkidle");
      await expectText(page, "Gerar corte");
      const numberInputs = page.locator('input[type="number"]');
      await numberInputs.nth(0).fill("0");
      await numberInputs.nth(1).fill("1");

      const clipResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/clips") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      );
      await page.getByRole("button", { name: "Gerar corte" }).click();
      const clipResponse = await clipResponsePromise;
      const clipPayload = await clipResponse.json();
      const clipIdempotencyKey = await readInputValue(page, "clip:");
      assert.equal(clipPayload.data.status, "completed");
      assert.equal(clipPayload.data.parentVideoId, firstOutputId);
      const clipTitle = clipPayload.data.title;
      await expectText(page, clipTitle);
      await setViewport(page, 1600, 900);
      await capture(page, "clips-1600-success.png");
      await assertNoHorizontalOverflow(page);

      const clipRequestId = clipPayload.meta.requestId;
      const clipJobId = clipPayload.data.renderJobId;
      const auditAfterClip = await apiGet(`/audit-logs?channelId=${channelA.id}`);
      assert.ok(
        auditAfterClip.data.some(
          (log) =>
            log.entityId === clipJobId &&
            log.action === "clip.execution_completed" &&
            log.requestId === clipRequestId,
        ),
        "expected clip completion audit correlated to the HTTP request",
      );

      await page.reload();
      await page.waitForLoadState("networkidle");
      await setViewport(page, 1792, 1024);
      await expectText(page, clipTitle);
      await capture(page, "clips-1792-reload.png");
      await assertNoHorizontalOverflow(page);

      await numberInputs.nth(0).fill("2");
      await numberInputs.nth(1).fill("1");
      await capture(page, "clips-1600-error.png");
      await expectText(page, "O fim precisa ser maior que o inicio");

      await numberInputs.nth(0).fill("0");
      await numberInputs.nth(1).fill("1.5");
      await page.getByLabel("Chave de idempotencia").fill(clipIdempotencyKey);
      await expectText(page, "Intervalo valido para envio");
      const clipSubmitButton = page.getByRole("button", { name: "Gerar corte" });
      await waitForEnabled(clipSubmitButton);
      const clipConflictPromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/clips") &&
          response.request().method() === "POST" &&
          response.status() === 409,
      );
      await clipSubmitButton.click();
      await clipConflictPromise;
      await expectText(page, "entrou em conflito");
      await capture(page, "clips-1600-conflict.png");

      await selectChannel(page, currentChannelName, channelB.name);
      currentChannelName = channelB.name;
      await page.waitForLoadState("networkidle");
      await setViewport(page, 1920, 1080);
      await expectText(page, "Nenhum corte encontrado");
      await capture(page, "clips-1920-isolation.png");
      await assertNoHorizontalOverflow(page);

      assert.equal(await apiGetStatus(`/videos/${firstOutputId}?channelId=${channelB.id}`), 404);
      assert.equal(
        await apiPostStatus("/clips", {
          channelId: channelB.id,
          parentVideoId: firstOutputId,
          startSeconds: 0,
          endSeconds: 1,
          idempotencyKey: `cross-channel-${suffix}`,
        }),
        404,
      );
      assert.equal(
        await apiGetStatus(`/clips/${clipPayload.data.id}?channelId=${channelB.id}`),
        404,
      );

      await selectChannel(page, currentChannelName, channelA.name);
      await page.waitForLoadState("networkidle");
      await expectText(page, clipTitle);

      console.log(
        JSON.stringify(
          {
            channelA: { id: channelA.id, name: channelA.name },
            channelB: { id: channelB.id, name: channelB.name },
            renderJobId: firstJobId,
            outputVideoId: firstOutputId,
            clipId: clipPayload.data.id,
            renderRequestId,
            clipRequestId,
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
      ...extraEnv,
    },
  });
}

async function waitForHttp(url) {
  const started = Date.now();
  while (Date.now() - started < 120_000) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Keep retrying while the child process boots.
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function seedRenderPolicy(storageRoot) {
  const stateRoot = path.join(storageRoot, ".aralume-state");
  await mkdir(stateRoot, { recursive: true });
  const now = new Date().toISOString();
  const policy = (id, scope, channelId) => ({
    id,
    scope,
    ...(channelId ? { channelId } : {}),
    mode: "supervised_production",
    allowRealAi: false,
    allowRealTts: false,
    allowRealImageGeneration: false,
    allowRealVideoGeneration: true,
    allowExternalPublication: false,
    requireHumanApproval: false,
    budgetConfigured: true,
    dailyBudgetLimitCents: 200000,
    monthlyBudgetLimitCents: 500000,
    createdAt: now,
    updatedAt: now,
  });

  await writeFile(
    path.join(stateRoot, "costs.json"),
    JSON.stringify(
      {
        costEntries: [],
        operationalModePolicies: [
          policy("e2e_global", "global"),
          policy("e2e_ch_historia", "channel", "ch_historia"),
        ],
      },
      null,
      2,
    ),
    "utf8",
  );
}

async function seedRenderFixtures(storageRoot) {
  for (const relativePath of [
    "ch_historia/narration/ma_hist_narration_01.wav",
    "ch_historia/image/ma_hist_image_01.jpg",
    "ch_historia/audio/ma_hist_music_01.mp3",
  ]) {
    const absolutePath = path.join(storageRoot, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, Buffer.from("controlled-render-fixture"));
  }
}

async function apiGet(pathname) {
  const response = await fetchWithRetry(`${BACKEND_BASE_URL}/api${pathname}`);
  if (!response.ok) throw new Error(`GET ${pathname} failed with ${response.status}`);
  return response.json();
}

async function apiGetStatus(pathname) {
  return (await fetchWithRetry(`${BACKEND_BASE_URL}/api${pathname}`)).status;
}

async function apiPostStatus(pathname, body) {
  return (
    await fetchWithRetry(`${BACKEND_BASE_URL}/api${pathname}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  ).status;
}

async function fetchWithRetry(input, init, attempts = 6) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
      await delay(300 * attempt);
    }
  }
  throw lastError ?? new Error(`Unable to fetch ${String(input)}`);
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
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible" });
}

async function findInputByValuePrefix(page, prefix) {
  const index = await page
    .locator("input")
    .evaluateAll(
      (inputs, valuePrefix) =>
        inputs.findIndex((input) =>
          (input instanceof HTMLInputElement ? input.value : "").startsWith(valuePrefix),
        ),
      prefix,
    );
  assert.ok(index >= 0, `expected an input starting with ${prefix}`);
  return page.locator("input").nth(index);
}

async function readInputValue(page, prefix) {
  return (await findInputByValuePrefix(page, prefix)).inputValue();
}

async function waitForEnabled(locator) {
  await locator.waitFor({ state: "visible" });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await locator.isEnabled()) return;
    await delay(50);
  }
  throw new Error("Expected control to become enabled");
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
  const fs = await import("node:fs/promises");
  return (await fs.readdir(SCREENSHOT_DIR)).sort();
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
