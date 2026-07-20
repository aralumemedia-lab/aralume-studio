import assert from "node:assert/strict";
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
const SCREENSHOT_DIR = evidenceDir(16);

async function main() {
  await resetEvidenceDir(16);
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
    await waitForServiceIdentity(`${BACKEND_BASE_URL}/health`, backend, "aralume-api");
    await waitForServiceIdentity(
      `${FRONTEND_BASE_URL}/__aralume/e2e-identity`,
      frontend,
      "aralume-web",
    );

    const channels = await apiGet("/channels");
    assert.ok(Array.isArray(channels.data));
    assert.ok(channels.data.length > 1, "expected at least two seeded channels");
    const channelA = channels.data[0];
    const channelB = channels.data[1];

    const uniqueSuffix = String(Date.now());
    const ideas = await apiGet(`/content-ideas?channelId=${channelA.id}`);
    assert.ok(Array.isArray(ideas.data));
    assert.ok(ideas.data.length > 0, "expected at least one seeded idea");
    const idea = ideas.data[0];

    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      const page = await context.newPage();

      await page.goto(`${FRONTEND_BASE_URL}/scripts`);
      await page.waitForLoadState("networkidle");

      await selectChannel(page, channelA.name);
      await page.waitForLoadState("networkidle");

      const scriptFlow = await createScriptVersionedFlow(page, idea.id, uniqueSuffix);
      await setViewport(page, 1366, 768);
      await toggleSidebar(page, true);
      await capture(page, "scripts-1366-expanded.png");
      await toggleSidebar(page, false);
      await capture(page, "scripts-1366-collapsed.png");
      await toggleSidebar(page, true);
      await expectText(page, `Sprint 16 Script ${uniqueSuffix}`);
      await expectText(page, "v1");

      await page.getByRole("link", { name: "Produção" }).click();
      await page.waitForLoadState("networkidle");
      await expectText(page, `Sprint 16 Script ${uniqueSuffix}`);
      await setViewport(page, 1600, 900);
      await toggleSidebar(page, true);
      await capture(page, "production-1600-success.png");
      await toggleSidebar(page, false);
      await capture(page, "production-1600-collapsed.png");
      await toggleSidebar(page, true);

      const planFlow = await createPlanAndScenes(page, uniqueSuffix, channelA.id);

      await duplicateVersionConflict(scriptFlow.scriptId, uniqueSuffix, channelA.id);
      await duplicateSceneConflict(planFlow.visualPlanId, channelA.id);
      await capture(page, "production-1600-conflict.png");

      await setViewport(page, 1792, 1024);
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expectText(page, `Sprint 16 Visual Plan ${uniqueSuffix}`);
      await expectText(page, `Scene 1 ${uniqueSuffix}`);
      await expectText(page, `Scene 2 ${uniqueSuffix}`);
      await capture(page, "production-1792-reload.png");

      await selectChannel(page, channelB.name);
      await page.waitForLoadState("networkidle");
      await setViewport(page, 1920, 1080);
      await expectText(page, "Selecione um roteiro");
      await capture(page, "production-1920-isolation.png");

      assert.equal(
        await apiGetStatus(
          `/visual-plans/${planFlow.visualPlanId}/scenes?channelId=${encodeURIComponent(
            channelB.id,
          )}`,
        ),
        404,
      );
      assert.equal(
        await apiPostStatus(
          `/visual-plans/${planFlow.visualPlanId}/scenes?channelId=${channelA.id}`,
          {
            channelId: channelB.id,
            order: 3,
            title: `Cross-channel ${uniqueSuffix}`,
            narrationExcerpt: "Narracao cross-channel.",
            durationSeconds: 30,
            visualDescription: "Visual cross-channel.",
            assetRequirements: ["asset-x"],
          },
        ),
        403,
      );

      await page.locator("aside").getByRole("link", { name: "Roteiros", exact: true }).click();
      await page.waitForLoadState("networkidle");
      await expectText(page, "Sem roteiros no canal selecionado");
      await capture(page, "scripts-1920-isolation.png");

      console.log(
        JSON.stringify(
          {
            channelA: { id: channelA.id, name: channelA.name },
            channelB: { id: channelB.id, name: channelB.name },
            ideaId: idea.id,
            screenshots: await listScreenshots(),
          },
          null,
          2,
        ),
      );
    } finally {
      await browser.close();
    }
  } finally {
    await terminateProcesses([backend, frontend]);
  }
}

async function apiGet(pathname) {
  const response = await fetchWithRetry(`${BACKEND_BASE_URL}/api${pathname}`);
  if (!response.ok) {
    throw new Error(`GET ${pathname} failed with ${response.status}`);
  }

  return response.json();
}

async function apiPostStatus(pathname, body) {
  const response = await fetchWithRetry(`${BACKEND_BASE_URL}/api${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  return response.status;
}

async function apiGetStatus(pathname) {
  const response = await fetchWithRetry(`${BACKEND_BASE_URL}/api${pathname}`);
  return response.status;
}

async function fetchWithRetry(input, init, attempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        throw error;
      }

      await delay(500 * attempt);
    }
  }

  throw lastError ?? new Error(`Unable to fetch ${String(input)}`);
}

async function selectChannel(page, channelName) {
  const switcher = page.locator("header").getByRole("button").nth(1);
  await switcher.click();
  const button = page
    .locator("div.absolute.left-0.top-9.z-20")
    .getByRole("button")
    .filter({ hasText: channelName })
    .last();
  await button.click();
}

async function toggleSidebar(page, expanded) {
  const button = page.getByRole("button", { name: "Alternar sidebar" });
  const sidebar = page.locator("aside");
  const currentWidth = await sidebar.boundingBox();
  const isCollapsed = currentWidth ? currentWidth.width < 100 : false;
  if ((expanded && !isCollapsed) || (!expanded && isCollapsed)) {
    return;
  }

  await button.click();
  await page.waitForTimeout(250);
}

async function createScriptVersionedFlow(page, ideaId, uniqueSuffix) {
  const createForm = page.getByTestId("scripts-create-form");
  await createForm.locator("select").nth(0).selectOption(ideaId);
  await createForm.locator("input").nth(0).fill(`Sprint 16 Script ${uniqueSuffix}`);
  await createForm.locator("select").nth(1).selectOption("script");
  await createForm.locator("select").nth(2).selectOption("ok");
  await createForm.locator("input").nth(1).fill("720");
  await createForm.locator("textarea").nth(0).fill("Gancho controlado da Sprint 16.");
  await createForm.locator("textarea").nth(1).fill("Promessa controlada da Sprint 16.");
  await createForm.locator("textarea").nth(2).fill("CTA controlada da Sprint 16.");
  await createForm.locator("input").nth(2).fill(`Versao inicial ${uniqueSuffix}`);
  await createForm.locator("input").nth(3).fill("4");
  await createForm.locator("input").nth(4).fill("720");
  await createForm.locator("textarea").nth(3).fill("Narracao inicial da Sprint 16.");
  await createForm.locator("textarea").nth(4).fill("Primeira versao para rastreio.");
  const createScriptResponsePromise = Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith("/api/scripts") &&
        response.status() >= 200 &&
        response.status() < 300,
    ),
    createForm.getByTestId("create-script-submit").click(),
  ]);
  const [createScriptResponse] = await createScriptResponsePromise;
  const createScriptPayload = await createScriptResponse.json();
  const scriptTitle = `Sprint 16 Script ${uniqueSuffix}`;
  await expectText(page, scriptTitle);
  await expectText(page, "v1");
  await page.locator("table").getByRole("button").filter({ hasText: scriptTitle }).first().click();
  await page.waitForLoadState("networkidle");
  await expectText(page, scriptTitle);

  const versionForm = page.getByTestId("scripts-version-form");
  await versionForm.locator("input").nth(0).fill("2");
  await versionForm.locator("input").nth(1).fill(`${scriptTitle} - v2`);
  await versionForm.locator("input").nth(2).fill("5");
  await versionForm.locator("input").nth(3).fill("760");
  await versionForm.locator("textarea").nth(0).fill("Narracao atualizada para a segunda versao.");
  await versionForm.locator("textarea").nth(1).fill("Ajuste da segunda versao.");
  const createVersionResponsePromise = Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/api/scripts/") &&
        response.url().includes("/versions") &&
        response.status() >= 200 &&
        response.status() < 300,
    ),
    versionForm.getByTestId("create-version-submit").click(),
  ]);
  const [createVersionResponse] = await createVersionResponsePromise;
  const createVersionPayload = await createVersionResponse.json();
  return {
    scriptId: createScriptPayload.data.id,
    currentVersionId: createVersionPayload.data.id,
  };
}

async function createPlanAndScenes(page, uniqueSuffix, channelId) {
  const planForm = page.getByTestId("production-plan-form");
  await planForm.locator("input").nth(0).fill(`Sprint 16 Visual Plan ${uniqueSuffix}`);
  await planForm.locator("select").nth(0).selectOption("visual_plan");
  await planForm.locator("input").nth(1).fill("5");
  await planForm.locator("input").nth(2).fill("760");
  await planForm.locator("textarea").nth(0).fill(`Estilo visual ${uniqueSuffix}`);
  const createPlanResponsePromise = Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith("/api/visual-plans") &&
        response.status() >= 200 &&
        response.status() < 300,
    ),
    planForm.getByTestId("create-plan-submit").click(),
  ]);
  const [createPlanResponse] = await createPlanResponsePromise;
  const createPlanPayload = await createPlanResponse.json();
  await expectText(page, `Sprint 16 Visual Plan ${uniqueSuffix}`);

  const sceneStatuses = [
    await apiPostStatus(
      `/visual-plans/${createPlanPayload.data.id}/scenes?channelId=${channelId}`,
      {
        channelId,
        order: 1,
        title: `Scene 1 ${uniqueSuffix}`,
        narrationExcerpt: "Narracao da cena 1.",
        durationSeconds: 30,
        visualDescription: "Visual da cena 1.",
        assetRequirements: ["asset-a", "asset-b"],
      },
    ),
    await apiPostStatus(
      `/visual-plans/${createPlanPayload.data.id}/scenes?channelId=${channelId}`,
      {
        channelId,
        order: 2,
        title: `Scene 2 ${uniqueSuffix}`,
        narrationExcerpt: "Narracao da cena 2.",
        durationSeconds: 35,
        visualDescription: "Visual da cena 2.",
        assetRequirements: ["asset-c"],
      },
    ),
  ];
  assert.deepEqual(sceneStatuses, [201, 201]);

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expectText(page, `Sprint 16 Visual Plan ${uniqueSuffix}`);
  await expectText(page, `Scene 1 ${uniqueSuffix}`);
  await expectText(page, `Scene 2 ${uniqueSuffix}`);

  return {
    visualPlanId: createPlanPayload.data.id,
  };
}

async function duplicateVersionConflict(scriptId, uniqueSuffix, channelId) {
  const status = await apiPostStatus(`/scripts/${scriptId}/versions?channelId=${channelId}`, {
    versionNumber: 1,
    title: `Duplicate ${uniqueSuffix}`,
    narrationText: "Narracao duplicada.",
    sceneCount: 5,
    estimatedDurationSeconds: 760,
    changeSummary: "Conflito controlado.",
  });
  assert.equal(status, 409);
}

async function duplicateSceneConflict(visualPlanId, channelId) {
  const status = await apiPostStatus(
    `/visual-plans/${visualPlanId}/scenes?channelId=${channelId}`,
    {
      channelId,
      order: 1,
      title: "Scene duplicate",
      narrationExcerpt: "Narracao duplicada.",
      durationSeconds: 30,
      visualDescription: "Visual duplicado.",
      assetRequirements: ["asset-z"],
    },
  );
  assert.equal(status, 409);
}

async function capture(page, fileName) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, fileName), fullPage: true });
}

async function setViewport(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(200);
}

async function expectText(page, text) {
  await page.waitForFunction((needle) => document.body.innerText.includes(String(needle)), text, {
    timeout: 30_000,
  });
}

async function listScreenshots() {
  const entries = await import("node:fs/promises").then((m) => m.readdir(SCREENSHOT_DIR));
  return entries.filter((entry) => entry.endsWith(".png")).sort();
}

await runE2E(main);
