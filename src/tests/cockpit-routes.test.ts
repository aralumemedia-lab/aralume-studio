import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("cockpit routes use real API clients and channel-aware states", () => {
  const dashboard = readFileSync("src/routes/dashboard.tsx", "utf8");
  const office = readFileSync("src/routes/agent-office.tsx", "utf8");
  assert.ok(dashboard.includes("describeCockpitsApiError"));
  assert.ok(dashboard.includes("LoadingState"));
  assert.ok(dashboard.includes("ErrorState"));
  assert.ok(office.includes("describeCockpitsApiError"));
  assert.ok(office.includes('queryKey: ["agents", activeChannelId]'));
  assert.ok(office.includes("LoadingState"));
  assert.ok(office.includes("ErrorState"));
  assert.ok(!dashboard.includes("mock-api"));
  assert.ok(!office.includes("mock-api"));
});
