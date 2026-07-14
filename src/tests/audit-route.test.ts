import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync("src/routes/audit-logs.tsx", "utf8");

test("Audit logs route uses the real audit API and keeps empty/error states", () => {
  assert.equal(routeSource.includes("mockAuditLogs"), false);
  assert.ok(routeSource.includes('from "@/services/audit-api"'));
  assert.ok(routeSource.includes("LoadingState"));
  assert.ok(routeSource.includes("ErrorState"));
  assert.ok(routeSource.includes("EmptyState"));
});
