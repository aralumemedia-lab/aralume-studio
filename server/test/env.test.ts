import assert from "node:assert/strict";
import test from "node:test";

import { EnvValidationError, loadEnv } from "../src/env.js";

test("loadEnv applies safe defaults", () => {
  const env = loadEnv({} as NodeJS.ProcessEnv);

  assert.equal(env.ARALUME_ENV, "development");
  assert.equal(env.ARALUME_LOG_LEVEL, "info");
  assert.equal(env.ARALUME_ASSET_STORAGE_ROOT, undefined);
  assert.equal(env.DATABASE_URL, undefined);
  assert.equal(env.TEST_DATABASE_URL, undefined);
});

test("loadEnv rejects invalid enum values without leaking input", () => {
  let caught: EnvValidationError | undefined;

  try {
    loadEnv({
      ARALUME_ENV: "invalid-environment",
      ARALUME_LOG_LEVEL: "invalid-level",
    } as NodeJS.ProcessEnv);
  } catch (error) {
    if (error instanceof EnvValidationError) {
      caught = error;
    } else {
      throw error;
    }
  }

  assert.ok(caught);
  assert.equal(caught?.issues.length, 2);
  assert.deepEqual(
    caught?.issues.map((issue) => issue.path),
    ["ARALUME_ENV", "ARALUME_LOG_LEVEL"],
  );
  assert.equal(JSON.stringify(caught?.issues).includes("invalid-environment"), false);
  assert.equal(JSON.stringify(caught?.issues).includes("invalid-level"), false);
});

test("loadEnv requires the authentication signing secret in production", () => {
  assert.throws(
    () => loadEnv({ ARALUME_ENV: "production" } as NodeJS.ProcessEnv),
    (error) =>
      error instanceof EnvValidationError &&
      error.issues.some((issue) => issue.path === "ARALUME_AUTH_SIGNING_SECRET"),
  );

  const production = loadEnv({
    ARALUME_ENV: "production",
    ARALUME_AUTH_SIGNING_SECRET: "production-test-secret",
  } as NodeJS.ProcessEnv);
  assert.equal(production.ARALUME_AUTH_SIGNING_SECRET, "production-test-secret");
});
