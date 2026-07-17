import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { chromium } from "playwright";

const BACKEND_BASE_URL = "http://127.0.0.1:3001";
const FRONTEND_BASE_URL = "http://127.0.0.1:4173";
const SCREENSHOT_DIR = path.join(process.cwd(), "screenshots", "sprint-17");

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });

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
    assert.ok(Array.isArray(channels.data));
    assert.ok(channels.data.length >= 2, "expected at least two seeded channels");

    const channelA =
      channels.data.find((channel) => channel.id === "ch_historia") ?? channels.data[0];
    const channelB =
      channels.data.find((channel) => channel.id === "ch_negocios") ??
      channels.data.find((channel) => channel.id !== channelA.id);
    const initialChannelName = channels.data[0].name;

    assert.ok(channelA, "expected a primary editorial channel");
    assert.ok(channelB, "expected a second channel for isolation checks");

    const initialAssetsA = await apiGet(`/media-assets?channelId=${channelA.id}`);
    const initialAssetsB = await apiGet(`/media-assets?channelId=${channelB.id}`);
    assert.ok(Array.isArray(initialAssetsA.data));
    assert.ok(Array.isArray(initialAssetsB.data));
    assert.equal(initialAssetsB.data.length, 0, "expected ch_negocios to start empty");

    const suffix = String(Date.now());
    const narrationName = `Sprint 17 narration ${suffix}`;
    const visualName = `Sprint 17 visual ${suffix}`;
    const invalidName = `Sprint 17 invalid ${suffix}`;

    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      const page = await context.newPage();

      await page.goto(`${FRONTEND_BASE_URL}/media-assets`);
      await page.waitForLoadState("networkidle");

      let currentChannelName = initialChannelName;

      await selectChannel(page, currentChannelName, channelB.name);
      currentChannelName = channelB.name;
      await page.waitForLoadState("networkidle");
      await setViewport(page, 1366, 768);
      await toggleSidebar(page, true);
      await capture(page, "media-assets-1366-empty-expanded.png");
      await toggleSidebar(page, false);
      await capture(page, "media-assets-1366-empty-collapsed.png");
      await toggleSidebar(page, true);
      await expectText(page, "Nenhum ativo encontrado");

      await selectChannel(page, currentChannelName, channelA.name);
      currentChannelName = channelA.name;
      await page.waitForLoadState("networkidle");
      await waitForFormReady(page);
      await setViewport(page, 1600, 900);
      await createNarrationAsset(page, {
        name: narrationName,
        title: narrationName,
        storagePath: `ch_historia/narration/${suffix}.wav`,
        checksum: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        sizeBytes: "2048",
        costActualCents: "0",
        provenance: "Controlled narration asset created by the Sprint 17 runner.",
        providerName: "Aralume TTS",
        modelName: "voice-v3",
      });
      await expectText(page, narrationName);

      await page
        .getByTestId("media-assets-form")
        .getByRole("button", { name: "Novo ativo" })
        .click();
      await waitForCreateMode(page);

      const visualResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/media-assets") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      );
      await fillAssetForm(page, {
        type: "image",
        name: visualName,
        title: visualName,
        description: "Controlled visual asset created by the Sprint 17 runner.",
        storagePath: `ch_historia/image/${suffix}.png`,
        provenance: "Controlled visual asset with provenance and integrity metadata.",
        origin: "generated",
        licenseStatus: "known",
        licenseName: "",
        mimeType: "image/png",
        extension: "png",
        sizeBytes: "4096",
        checksum: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        providerName: "Aralume Vision",
        modelName: "img-v2",
        prompt: "Frame de referencia para a Sprint 17.",
        usageSummary: "Visible asset for channel-scoped editorial pipeline checks.",
        costActualCents: "0",
        riskLevel: "ok",
        status: "available",
      });
      await page.getByTestId("media-assets-submit").click();
      const visualResponse = await visualResponsePromise;
      const visualPayload = await visualResponse.json();
      assert.equal(visualPayload.data.name, visualName);
      assert.equal(visualPayload.data.channelId, channelA.id);
      await expectText(page, visualName);
      await capture(page, "media-assets-1600-success.png");

      const updatedVisualDescription = "Controlled visual asset updated by the Sprint 17 runner.";
      const updatedVisualUsage = "Updated usage summary for audit and persistence checks.";
      const visualUpdateResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/media-assets/") &&
          response.request().method() === "PATCH" &&
          response.status() === 200,
      );
      await page.getByLabel("Descricao").fill(updatedVisualDescription);
      await page.getByLabel("Resumo de uso").fill(updatedVisualUsage);
      await page.getByTestId("media-assets-submit").click();
      const visualUpdateResponse = await visualUpdateResponsePromise;
      const visualUpdatePayload = await visualUpdateResponse.json();
      assert.equal(visualUpdatePayload.data.description, updatedVisualDescription);
      assert.equal(visualUpdatePayload.data.usageSummary, updatedVisualUsage);

      await page
        .getByTestId("media-assets-form")
        .getByRole("button", { name: "Novo ativo" })
        .click();
      await waitForCreateMode(page);
      const invalidForm = page.getByTestId("media-assets-form");
      const invalidSelects = invalidForm.locator("select");
      const invalidInputs = invalidForm.locator("input");
      const invalidTextareas = invalidForm.locator("textarea");

      await invalidSelects.nth(0).selectOption("image");
      await invalidInputs.nth(0).fill(invalidName);
      await invalidInputs.nth(1).fill(invalidName);
      await invalidTextareas.nth(0).fill("Invalid media asset submission.");
      await invalidTextareas.nth(1).fill("Controlled invalid submission for validation checks.");
      await invalidInputs.nth(2).fill("../escape.png");
      await invalidInputs.nth(3).fill("image/png");
      await invalidInputs.nth(4).fill("png");
      await invalidInputs.nth(5).fill("512");
      await invalidInputs
        .nth(6)
        .fill("cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc");
      await invalidInputs.nth(7).fill("0");
      await invalidSelects.nth(1).selectOption("generated");
      await invalidSelects.nth(2).selectOption("known");
      await invalidSelects.nth(3).selectOption("ok");
      await invalidSelects.nth(4).selectOption("available");
      const invalidResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/media-assets") &&
          response.request().method() === "POST" &&
          response.status() === 400,
      );
      await page.getByTestId("media-assets-submit").click();
      await invalidResponsePromise;
      await expectText(page, "Os dados de midia enviados sao invalidos.");
      await capture(page, "media-assets-1600-error.png");

      const narrationListResponse = await apiGet(`/media-assets?channelId=${channelA.id}`);
      assert.ok(
        narrationListResponse.data.some((asset) => asset.name === narrationName),
        "expected the narration asset to be listed through the API",
      );
      assert.ok(
        narrationListResponse.data.some((asset) => asset.name === visualName),
        "expected the visual asset to be listed through the API",
      );

      await page.reload();
      await page.waitForLoadState("networkidle");
      await selectChannel(page, currentChannelName, channelA.name);
      currentChannelName = channelA.name;
      await page.waitForLoadState("networkidle");
      await setViewport(page, 1792, 1024);
      await expectText(page, narrationName);
      await expectText(page, visualName);
      await capture(page, "media-assets-1792-reload.png");

      const auditLogsA = await apiGet(`/audit-logs?channelId=${channelA.id}`);
      const auditActionsA = auditLogsA.data.map((log) => log.action);
      assert.ok(
        auditActionsA.includes("media_asset.registered"),
        `expected registration audit entries, got: ${auditActionsA.join(", ")}`,
      );
      assert.ok(
        auditActionsA.includes("media_asset.updated"),
        `expected update or rejection audit entries, got: ${auditActionsA.join(", ")}`,
      );

      await selectChannel(page, currentChannelName, channelB.name);
      currentChannelName = channelB.name;
      await page.waitForLoadState("networkidle");
      await setViewport(page, 1920, 1080);
      await expectText(page, "Nenhum ativo encontrado");
      await capture(page, "media-assets-1920-isolation.png");

      assert.equal(
        await apiGetStatus(`/media-assets/${visualPayload.data.id}?channelId=${channelB.id}`),
        404,
      );
      assert.equal(
        await apiPatchStatus(`/media-assets/${visualPayload.data.id}`, {
          channelId: channelB.id,
          description: "Cross-channel attempt from Sprint 17 runner.",
        }),
        404,
      );

      assert.equal(
        await apiGetStatus(`/media-assets/${visualPayload.data.id}?channelId=${channelA.id}`),
        200,
      );

      console.log(
        JSON.stringify(
          {
            channelA: { id: channelA.id, name: channelA.name },
            channelB: { id: channelB.id, name: channelB.name },
            narrationName,
            visualName,
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
    await terminateProcess(frontend);
    await terminateProcess(backend);
  }
}

function spawnCommand(command, args) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    shell: false,
    stdio: "inherit",
    env: {
      ...process.env,
      ARALUME_ENV: process.env.ARALUME_ENV ?? "test",
      ARALUME_LOG_LEVEL: process.env.ARALUME_LOG_LEVEL ?? "info",
    },
  });

  return child;
}

async function waitForHttp(url) {
  const started = Date.now();
  while (Date.now() - started < 120_000) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep retrying
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function apiGet(pathname) {
  const response = await fetchWithRetry(`${BACKEND_BASE_URL}/api${pathname}`);
  if (!response.ok) {
    throw new Error(`GET ${pathname} failed with ${response.status}`);
  }

  return response.json();
}

async function apiGetStatus(pathname) {
  const response = await fetchWithRetry(`${BACKEND_BASE_URL}/api${pathname}`);
  return response.status;
}

async function apiPatchStatus(pathname, body) {
  const response = await fetchWithRetry(`${BACKEND_BASE_URL}/api${pathname}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

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

async function selectChannel(page, currentChannelName, nextChannelName) {
  const switcher = page.getByRole("button", { name: currentChannelName, exact: true });
  await switcher.click();
  const dropdown = page.locator("div.absolute.left-0.top-9.z-20");
  await dropdown.waitFor({ state: "visible" });
  const button = dropdown.getByRole("button").filter({ hasText: nextChannelName }).last();
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

async function setViewport(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(250);
}

async function createNarrationAsset(page, values) {
  await page.getByTestId("media-assets-form").getByRole("button", { name: "Novo ativo" }).click();
  await waitForCreateMode(page);
  await fillAssetForm(page, {
    type: "narration",
    name: values.name,
    title: values.title,
    description: "Controlled narration asset created by the Sprint 17 runner.",
    storagePath: values.storagePath,
    provenance: values.provenance,
    origin: "generated",
    licenseStatus: "confirmed",
    licenseName: "",
    mimeType: "audio/wav",
    extension: "wav",
    sizeBytes: values.sizeBytes,
    checksum: values.checksum,
    providerName: values.providerName,
    modelName: values.modelName,
    prompt: "",
    usageSummary: "Narration metadata recorded for channel-scoped editorial checks.",
    costActualCents: values.costActualCents,
    riskLevel: "ok",
    status: "available",
  });

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/media-assets") &&
      response.request().method() === "POST" &&
      response.status() === 201,
  );
  await page.getByTestId("media-assets-submit").click();
  const response = await responsePromise;
  const payload = await response.json();
  assert.equal(payload.data.name, values.name);
  assert.equal(payload.data.type, "narration");
  assert.ok(payload.data.id);
  return payload.data;
}

async function fillAssetForm(page, values) {
  await waitForFormReady(page);
  const form = page.getByTestId("media-assets-form");
  const selects = form.locator("select");
  const inputs = form.locator("input");
  const textareas = form.locator("textarea");

  await selects.nth(0).selectOption(values.type);
  await inputs.nth(0).fill(values.name);
  await inputs.nth(1).fill(values.title);
  await textareas.nth(0).fill(values.description);
  await textareas.nth(1).fill(values.provenance);
  await inputs.nth(2).fill(values.storagePath);
  await inputs.nth(3).fill(values.mimeType);
  await inputs.nth(4).fill(values.extension);
  await inputs.nth(5).fill(values.sizeBytes);
  await inputs.nth(6).fill(values.checksum);
  await inputs.nth(7).fill(values.costActualCents);
  await selects.nth(1).selectOption(values.origin);
  await selects.nth(2).selectOption(values.licenseStatus);

  if (values.licenseName) {
    await inputs.nth(8).fill(values.licenseName);
  }

  await selects.nth(3).selectOption(values.riskLevel);
  await selects.nth(4).selectOption(values.status);

  if (values.providerName) {
    await inputs.nth(9).fill(values.providerName);
  }
  if (values.modelName) {
    await inputs.nth(10).fill(values.modelName);
  }
  if (values.prompt) {
    await textareas.nth(2).fill(values.prompt);
  }
  if (values.usageSummary) {
    await textareas.nth(3).fill(values.usageSummary);
  }
}

async function expectText(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible" });
}

async function waitForFormReady(page) {
  await page.waitForSelector('[data-testid="media-assets-form"]', { state: "visible" });
}

async function waitForCreateMode(page) {
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="media-assets-submit"]');
    return button?.textContent?.includes("Criar ativo") ?? false;
  });
}

async function capture(page, filename) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
}

async function listScreenshots() {
  const fs = await import("node:fs/promises");
  return (await fs.readdir(SCREENSHOT_DIR)).sort();
}

async function terminateProcess(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      shell: false,
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
  if (child.exitCode !== null || child.signalCode !== null) {
    return true;
  }

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
