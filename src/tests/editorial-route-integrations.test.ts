import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ideasSource = readFileSync("src/routes/ideas.tsx", "utf8");
const researchSource = readFileSync("src/routes/research.tsx", "utf8");
const scriptsSource = readFileSync("src/routes/scripts.tsx", "utf8");
const productionSource = readFileSync("src/routes/production.tsx", "utf8");

test("editorial routes use the real API client and surface loading/error/empty states", () => {
  for (const source of [ideasSource, researchSource, scriptsSource, productionSource]) {
    assert.equal(source.includes("@/mocks"), false);
    assert.ok(source.includes('from "@/services/api-client"'));
    assert.ok(source.includes("LoadingState"));
    assert.ok(source.includes("ErrorState"));
    assert.ok(source.includes("EmptyState"));
  }
});
