import assert from "node:assert/strict";
import test from "node:test";

import { EnvValidationError, loadEnv } from "../src/env.js";

test("loadEnv applies safe defaults", () => {
  const env = loadEnv({} as NodeJS.ProcessEnv);

  assert.equal(env.ARALUME_ENV, "development");
  assert.equal(env.ARALUME_LOG_LEVEL, "info");
  assert.equal(env.ARALUME_BUILD_ID, undefined);
  assert.equal(env.ARALUME_TRUSTED_PROXY_HOPS, undefined);
  assert.equal(env.ARALUME_ALLOWED_HOSTS, undefined);
  assert.equal(env.ARALUME_ALLOWED_ORIGINS, undefined);
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
    () =>
      loadEnv({
        ARALUME_ENV: "production",
        ARALUME_ASSET_STORAGE_ROOT: "/var/lib/aralume/storage",
        ARALUME_TRUSTED_PROXY_HOPS: "1",
        ARALUME_ALLOWED_HOSTS: "api.example.test",
        ARALUME_ALLOWED_ORIGINS: "https://api.example.test",
      } as NodeJS.ProcessEnv),
    (error) =>
      error instanceof EnvValidationError &&
      error.issues.some((issue) => issue.path === "ARALUME_AUTH_SIGNING_SECRET"),
  );

  const production = loadEnv({
    ARALUME_ENV: "production",
    ARALUME_AUTH_SIGNING_SECRET: "production-test-secret-32-chars-long",
    ARALUME_ASSET_STORAGE_ROOT: "/var/lib/aralume/storage",
    ARALUME_TRUSTED_PROXY_HOPS: "1",
    ARALUME_ALLOWED_HOSTS: "api.example.test",
    ARALUME_ALLOWED_ORIGINS: "https://api.example.test",
    DATABASE_URL: "https://database.example.test",
    ARALUME_YOUTUBE_REDIRECT_URI: "https://oauth.example.test/callback",
  } as NodeJS.ProcessEnv);
  assert.equal(production.ARALUME_AUTH_SIGNING_SECRET, "production-test-secret-32-chars-long");
  assert.equal(production.ARALUME_ASSET_STORAGE_ROOT, "/var/lib/aralume/storage");
  assert.equal(production.ARALUME_TRUSTED_PROXY_HOPS, 1);
  assert.equal(production.ARALUME_ALLOWED_HOSTS, "api.example.test");
  assert.equal(production.ARALUME_ALLOWED_ORIGINS, "https://api.example.test");
});

test("loadEnv rejects production-like test-only variables and invalid URLs", () => {
  let caught: EnvValidationError | undefined;

  try {
    loadEnv({
      ARALUME_ENV: "staging",
      ARALUME_AUTH_SIGNING_SECRET: "staging-test-secret-32-chars-long",
      ARALUME_ASSET_STORAGE_ROOT: "relative/storage",
      ARALUME_TRUSTED_PROXY_HOPS: "-1",
      ARALUME_ALLOWED_HOSTS: "",
      ARALUME_ALLOWED_ORIGINS: "",
      ARALUME_AUTH_TEST_BYPASS: "true",
      ARALUME_E2E_RUN_ID: "run-id",
      ARALUME_E2E_STARTUP_NONCE: "startup-nonce",
      ARALUME_E2E_IDENTITY_SECRET: "identity-secret",
      TEST_DATABASE_URL: "postgres://localhost/test",
      DATABASE_URL: "not-a-url",
      ARALUME_YOUTUBE_REDIRECT_URI: "also-not-a-url",
    } as NodeJS.ProcessEnv);
  } catch (error) {
    if (error instanceof EnvValidationError) {
      caught = error;
    } else {
      throw error;
    }
  }

  assert.ok(caught);
  assert.ok(caught?.issues.some((issue) => issue.path === "ARALUME_ASSET_STORAGE_ROOT"));
  assert.ok(caught?.issues.some((issue) => issue.path === "ARALUME_AUTH_TEST_BYPASS"));
  assert.ok(caught?.issues.some((issue) => issue.path === "ARALUME_E2E_RUN_ID"));
  assert.ok(caught?.issues.some((issue) => issue.path === "ARALUME_E2E_STARTUP_NONCE"));
  assert.ok(caught?.issues.some((issue) => issue.path === "ARALUME_E2E_IDENTITY_SECRET"));
  assert.ok(caught?.issues.some((issue) => issue.path === "ARALUME_TRUSTED_PROXY_HOPS"));
  assert.ok(caught?.issues.some((issue) => issue.path === "ARALUME_ALLOWED_HOSTS"));
  assert.ok(caught?.issues.some((issue) => issue.path === "ARALUME_ALLOWED_ORIGINS"));
  assert.ok(caught?.issues.some((issue) => issue.path === "TEST_DATABASE_URL"));
  assert.ok(caught?.issues.some((issue) => issue.path === "DATABASE_URL"));
  assert.ok(caught?.issues.some((issue) => issue.path === "ARALUME_YOUTUBE_REDIRECT_URI"));
});
