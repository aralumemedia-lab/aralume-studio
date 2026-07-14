import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync("src/routes/costs.tsx", "utf8");

test("Costs route uses the real costs API and keeps loading and error states", () => {
  assert.equal(routeSource.includes("mockCostEntries"), false);
  assert.ok(routeSource.includes('from "@/services/costs-api"'));
  assert.ok(routeSource.includes("LoadingState"));
  assert.ok(routeSource.includes("ErrorState"));
  assert.ok(routeSource.includes("CostBadge"));
});
