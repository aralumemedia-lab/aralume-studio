#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const scripts = [
  "scripts/sprint15-browser-e2e.mjs",
  "scripts/sprint16-browser-e2e.mjs",
  "scripts/sprint17-browser-e2e.mjs",
  "scripts/sprint18-browser-e2e.mjs",
  "scripts/sprint19-browser-e2e.mjs",
  "scripts/sprint20-browser-e2e.mjs",
  "scripts/sprint21-browser-e2e.mjs",
  "scripts/sprint24-security-hmac-e2e.mjs",
];

const results = [];

for (const script of scripts) {
  const completed = spawnSync(process.execPath, [script], {
    stdio: "inherit",
    env: process.env,
  });

  results.push({ script, status: completed.status ?? 1, signal: completed.signal ?? null });
  if ((completed.status ?? 1) !== 0) {
    console.error(JSON.stringify({ status: "fail", results }, null, 2));
    process.exitCode = completed.status ?? 1;
    break;
  }
}

if (process.exitCode == null || process.exitCode === 0) {
  console.log(JSON.stringify({ status: "pass", results }, null, 2));
}
