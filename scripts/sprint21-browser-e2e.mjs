import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { chromium } from "playwright";

const BACKEND = "http://127.0.0.1:3001";
const FRONTEND = "http://127.0.0.1:4173";
const SCREENSHOTS = path.join(process.cwd(), "screenshots", "sprint-21");

async function main() {
  await rm(SCREENSHOTS, { recursive: true, force: true });
  await mkdir(SCREENSHOTS, { recursive: true });
  const storageRoot = path.join(os.tmpdir(), `aralume-sprint21-${Date.now()}`);
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
  const pageErrors = [];
  const externalRequests = [];
  const mutationRequests = [];

  try {
    await waitForHttp(`${BACKEND}/api/channels`);
    await waitForHttp(FRONTEND);
    const channels = await apiGet("/channels");
    const channelA = channels.data.find((channel) => channel.id === "ch_historia");
    const channelB = channels.data.find((channel) => channel.id === "ch_negocios");
    assert.ok(channelA, "expected ch_historia");
    assert.ok(channelB, "expected ch_negocios");

    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      const page = await context.newPage();
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
        if (request.method() !== "GET" && request.url().includes("/api/")) {
          mutationRequests.push(`${request.method()} ${url.pathname}`);
        }
      });

      await page.goto(`${FRONTEND}/dashboard`);
      await page.waitForLoadState("networkidle");
      await selectChannel(page, channelA.name, channelB.name, false);
      await selectChannel(page, channelB.name, channelA.name, false);
      await expectText(page, "Dashboard");
      await expectText(page, "Workflows recentes");
      await capture(page, "dashboard-1366-expanded.png");
      await toggleSidebar(page, false);
      await capture(page, "dashboard-1366-collapsed.png");
      await toggleSidebar(page, true);
      await setViewport(page, 1600, 900);
      await capture(page, "dashboard-1600-success.png");
      await assertNoHorizontalOverflow(page);

      await page.reload();
      await page.waitForLoadState("networkidle");
      await expectText(page, "Workflows recentes");
      await setViewport(page, 1792, 1024);
      await capture(page, "dashboard-1792-reload.png");

      await selectChannel(page, channelA.name, channelB.name, false);
      await page.waitForLoadState("networkidle");
      await expectText(page, "Sem itens na fila");
      await setViewport(page, 1600, 900);
      await capture(page, "dashboard-1600-empty-channel-b.png");
      await assertNoHorizontalOverflow(page);

      await page.route("**/api/dashboard/summary*", (route) => route.abort("failed"));
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expectText(page, "Backend indisponivel");
      await capture(page, "dashboard-1600-error.png");
      await page.unroute("**/api/dashboard/summary*");
      await selectChannel(page, channelB.name, channelA.name, false);
      await page.waitForLoadState("networkidle");
      await setViewport(page, 1920, 1080);
      await capture(page, "dashboard-1920-isolation.png");
      await assertNoHorizontalOverflow(page);

      await page.goto(`${FRONTEND}/agent-office`);
      await page.waitForLoadState("networkidle");
      await expectText(page, "Escrit");
      await expectText(page, "Handoffs recentes");
      await capture(page, "agent-office-1366-expanded.png");
      await toggleSidebar(page, false);
      await capture(page, "agent-office-1366-collapsed.png");
      await toggleSidebar(page, true);
      await setViewport(page, 1600, 900);
      await capture(page, "agent-office-1600-success.png");
      await assertNoHorizontalOverflow(page);

      await selectChannel(page, channelA.name, channelB.name, false);
      await page.waitForLoadState("networkidle");
      await expectText(page, "Sem handoffs no canal ativo");
      await capture(page, "agent-office-1600-empty-channel-b.png");
      await page.reload();
      await page.waitForLoadState("networkidle");
      await selectChannel(page, channelA.name, channelB.name, false);
      await page.waitForLoadState("networkidle");
      await expectText(page, "Sem handoffs no canal ativo");
      await setViewport(page, 1792, 1024);
      await capture(page, "agent-office-1792-reload.png");

      await page.route("**/api/agent-office/snapshot*", (route) => route.abort("failed"));
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expectText(page, "Backend indisponivel");
      await capture(page, "agent-office-1600-error.png");
      await page.unroute("**/api/agent-office/snapshot*");
      await page.reload();
      await page.waitForLoadState("networkidle");
      await selectChannel(page, channelB.name, channelA.name, false);
      await page.waitForLoadState("networkidle");
      await expectText(page, "Handoffs recentes");
      await setViewport(page, 1920, 1080);
      await capture(page, "agent-office-1920-isolation.png");
      await assertNoHorizontalOverflow(page);

      const dashboardA = await apiGet(`/dashboard/summary?channelId=${channelA.id}`);
      const dashboardB = await apiGet(`/dashboard/summary?channelId=${channelB.id}`);
      assert.equal(
        dashboardA.data.costByChannel.every((row) => row.channelId === channelA.id),
        true,
      );
      assert.equal(
        dashboardB.data.costByChannel.every((row) => row.channelId === channelB.id),
        true,
      );
      const officeB = await apiGet(`/agent-office/snapshot?channelId=${channelB.id}`);
      assert.equal(
        officeB.data.workflows.some((workflow) => workflow.channelId === channelA.id),
        false,
      );
      assert.equal(mutationRequests.length, 0, "cockpit E2E must remain read-only");
      assert.deepEqual(pageErrors, []);
      assert.deepEqual(externalRequests, []);
      console.log(
        JSON.stringify(
          {
            channelA: channelA.id,
            channelB: channelB.id,
            mutationRequests,
            externalRequests,
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
    env: { ...process.env, ARALUME_ENV: "test", ARALUME_LOG_LEVEL: "error", ...extraEnv },
  });
}

async function waitForHttp(url) {
  const started = Date.now();
  while (Date.now() - started < 120_000) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Processes may still be booting.
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function apiGet(pathname) {
  const response = await fetch(`${BACKEND}/api${pathname}`);
  if (!response.ok) throw new Error(`GET ${pathname} failed with ${response.status}`);
  return response.json();
}

async function selectChannel(page, currentName, nextName, waitForChange = true) {
  const current = page.getByRole("button", { name: currentName, exact: true }).first();
  if (!(await current.isVisible())) return;
  await current.click();
  const dropdown = page.locator("div.absolute.left-0.top-9.z-20");
  await dropdown.waitFor({ state: "visible" });
  await dropdown.getByRole("button").filter({ hasText: nextName }).last().click();
  if (waitForChange) await page.waitForLoadState("networkidle");
}

async function toggleSidebar(page, expanded) {
  const sidebar = page.locator("aside");
  const box = await sidebar.boundingBox();
  const isCollapsed = box ? box.width < 100 : false;
  if ((expanded && !isCollapsed) || (!expanded && isCollapsed)) return;
  await page.getByRole("button", { name: "Alternar sidebar" }).click();
  await page.waitForTimeout(150);
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
  );
}

async function capture(page, filename) {
  await page.screenshot({ path: path.join(SCREENSHOTS, filename), fullPage: false });
}

async function listScreenshots() {
  return (await readdir(SCREENSHOTS)).sort();
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
