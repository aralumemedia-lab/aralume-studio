import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync("src/routes/administration.tsx", "utf8");

test("Administration route uses the real operational modes API and keeps decision states", () => {
  assert.equal(routeSource.includes("mock"), false);
  assert.ok(routeSource.includes('from "@/services/costs-api"'));
  assert.ok(routeSource.includes("LoadingState"));
  assert.ok(routeSource.includes("ErrorState"));
  assert.ok(routeSource.includes("PolicyCard"));
  assert.ok(routeSource.includes("CapabilityList"));
});
