#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const trackedFiles = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean)
  .filter((file) => !file.startsWith("server/dist/"));

const patterns = [
  {
    name: "AWS access key",
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    name: "GitHub token",
    regex: /\bghp_[A-Za-z0-9]{36}\b/g,
  },
  {
    name: "GitHub fine-grained token",
    regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  },
  {
    name: "OpenAI-style secret",
    regex: /\bsk-[A-Za-z0-9]{20,}\b/g,
  },
  {
    name: "Slack token",
    regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    name: "Private key",
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
  },
  {
    name: "Basic auth URL",
    regex: /:\/\/[^/\s:@]+:[^/\s@]+@/g,
  },
];

const allowedPlaceholders = [
  "http-test-secret",
  "fixture-secret",
  "placeholder",
  "example",
  "demo",
  "changeme",
  "test-only",
  "not real",
];

const hits = [];

for (const file of trackedFiles) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const lowerContent = content.toLowerCase();
  if (allowedPlaceholders.some((value) => lowerContent.includes(value))) {
    continue;
  }

  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    const matches = content.match(pattern.regex);
    if (matches && matches.length > 0) {
      hits.push({ file, rule: pattern.name, matches });
    }
  }
}

if (hits.length > 0) {
  console.error(JSON.stringify({ status: "fail", hits }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: "pass", scannedFiles: trackedFiles.length }));
}
