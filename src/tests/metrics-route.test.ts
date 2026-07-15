import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync("src/routes/metrics.tsx", "utf8");

test("metrics route uses the real API and exposes recommendation evidence", () => {
  assert.equal(routeSource.includes("mockMetrics"), false);
  assert.equal(routeSource.includes("mock-api"), false);
  assert.ok(routeSource.includes('from "@/services/metrics-api"'));
  assert.ok(routeSource.includes("LoadingState"));
  assert.ok(routeSource.includes("ErrorState"));
  assert.ok(routeSource.includes("Recomendacao disponivel"));
  assert.ok(routeSource.includes("Evidencias"));
  assert.ok(routeSource.includes("Tendencias"));
  assert.ok(routeSource.includes("formatOptionalPercent"));
  assert.equal(routeSource.includes("m.completionRate * 100).toFixed"), false);
});
