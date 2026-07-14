import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync("src/routes/videos.tsx", "utf8");

test("videos route uses the real render and media API clients and exposes operational states", () => {
  assert.equal(routeSource.includes("@/mocks"), false);
  assert.ok(routeSource.includes('from "@/services/api-client"'));
  assert.ok(routeSource.includes("getRenderJobs"));
  assert.ok(routeSource.includes("createRenderJob"));
  assert.ok(routeSource.includes("getVideoAssets"));
  assert.ok(routeSource.includes("getMediaAssets"));
  assert.ok(routeSource.includes("LoadingState"));
  assert.ok(routeSource.includes("ErrorState"));
  assert.ok(routeSource.includes("EmptyState"));
  assert.ok(routeSource.includes("WorkflowStatusBadge"));
  assert.ok(routeSource.includes("Iniciar render controlado"));
});
