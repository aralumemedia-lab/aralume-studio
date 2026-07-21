import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  createRecoveryBackup,
  rollbackRecoveryBackup,
  restoreRecoveryBackup,
  verifyRecoveryBackup,
} from "../server/src/modules/shared/recovery.js";

function createFixture(root) {
  mkdirSync(path.join(root, ".aralume-state"), { recursive: true });
  writeFileSync(
    path.join(root, ".aralume-state", "audit-logs.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        entries: [{ id: "audit-1", action: "seeded" }],
      },
      null,
      2,
    ),
    "utf8",
  );
  writeFileSync(
    path.join(root, ".aralume-state", "media-assets.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        assets: [{ id: "asset-1", channelId: "channel-1" }],
      },
      null,
      2,
    ),
    "utf8",
  );
  mkdirSync(path.join(root, "media", "channel-1"), { recursive: true });
  writeFileSync(path.join(root, "media", "channel-1", "clip.txt"), "clip-one\n", "utf8");
}

const startedAt = Date.now();
const sourceRoot = mkdtempSync(path.join(os.tmpdir(), "aralume-sprint27-source-"));
const backupRoot = mkdtempSync(path.join(os.tmpdir(), "aralume-sprint27-backup-"));
const restoreRoot = mkdtempSync(path.join(os.tmpdir(), "aralume-sprint27-restore-"));

try {
  createFixture(sourceRoot);
  writeFileSync(path.join(restoreRoot, "stale.txt"), "stale\n", "utf8");

  const backup = createRecoveryBackup({
    sourceRoot,
    backupRoot,
    label: "evidence",
    createdAt: new Date("2026-07-21T12:45:00.000Z"),
  });
  const verified = verifyRecoveryBackup(backup.snapshotRoot);

  assert.throws(
    () =>
      restoreRecoveryBackup({
        snapshotRoot: backup.snapshotRoot,
        targetRoot: restoreRoot,
      }),
    /not clean/,
  );

  rmSync(restoreRoot, { recursive: true, force: true });
  const restored = restoreRecoveryBackup({
    snapshotRoot: backup.snapshotRoot,
    targetRoot: restoreRoot,
  });
  writeFileSync(
    path.join(restoreRoot, "media", "channel-1", "clip.txt"),
    "rolled-forward\n",
    "utf8",
  );
  const rolledBack = rollbackRecoveryBackup({
    snapshotRoot: backup.snapshotRoot,
    targetRoot: restoreRoot,
  });

  const summary = {
    schema: verified.schema,
    createdAt: verified.createdAt,
    fileCount: verified.fileCount,
    checksum: verified.checksum,
    totalBytes: verified.totalBytes,
    backupSnapshot: backup.snapshotRoot,
    restoredSnapshot: restored.snapshotRoot,
    rolledBackSnapshot: rolledBack.snapshotRoot,
    restoreCheck: readFileSync(path.join(restoreRoot, "media", "channel-1", "clip.txt"), "utf8"),
    durationMs: Date.now() - startedAt,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} finally {
  rmSync(sourceRoot, { recursive: true, force: true });
  rmSync(backupRoot, { recursive: true, force: true });
  rmSync(restoreRoot, { recursive: true, force: true });
}
