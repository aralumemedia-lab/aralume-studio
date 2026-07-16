import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync("src/routes/channels.tsx", "utf8");

test("Channels route uses the real channels API and keeps mock imports out of the main flow", () => {
  assert.equal(routeSource.includes("mockChannels"), false);
  assert.ok(routeSource.includes('from "@/services/api-client"'));
  assert.ok(routeSource.includes("getChannelProfile"));
  assert.ok(routeSource.includes("updateChannelProfile"));
  assert.ok(routeSource.includes("getAuditLogs"));
  assert.ok(routeSource.includes("LoadingState"));
  assert.ok(routeSource.includes("ErrorState"));
});
