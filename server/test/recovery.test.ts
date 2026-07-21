import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  RECOVERY_SCHEMA,
  createRecoveryBackup,
  rollbackRecoveryBackup,
  restoreRecoveryBackup,
  verifyRecoveryBackup,
} from "../src/modules/shared/recovery.js";

function createRecoveryFixture(root: string): void {
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

function createTempRoot(prefix: string): string {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

test("creates a consistent backup, restores it into a clean target, and rolls it back", () => {
  const sourceRoot = createTempRoot("aralume-recovery-source-");
  const backupRoot = createTempRoot("aralume-recovery-backup-");
  const dirtyTarget = createTempRoot("aralume-recovery-target-");

  try {
    createRecoveryFixture(sourceRoot);
    writeFileSync(path.join(dirtyTarget, "keep.txt"), "preexisting-content\n", "utf8");

    const backup = createRecoveryBackup({
      sourceRoot,
      backupRoot,
      label: "sprint-27",
      createdAt: new Date("2026-07-21T12:00:00.000Z"),
    });

    assert.equal(backup.manifest.schema, RECOVERY_SCHEMA);
    assert.equal(backup.manifest.sourceRoot, sourceRoot);
    assert.equal(backup.manifest.fileCount, 3);
    assert.equal(backup.manifest.files.length, 3);
    assert.equal(backup.manifest.totalBytes > 0, true);
    assert.match(backup.manifest.checksum, /^[0-9a-f]{64}$/);
    assert.deepEqual(
      backup.manifest.files.map((file) => file.path),
      [
        ".aralume-state/audit-logs.json",
        ".aralume-state/media-assets.json",
        "media/channel-1/clip.txt",
      ],
    );

    const verified = verifyRecoveryBackup(backup.snapshotRoot);
    assert.equal(verified.checksum, backup.manifest.checksum);

    assert.throws(
      () =>
        restoreRecoveryBackup({
          snapshotRoot: backup.snapshotRoot,
          targetRoot: dirtyTarget,
        }),
      /not clean/,
    );

    rmSync(dirtyTarget, { recursive: true, force: true });
    const restored = restoreRecoveryBackup({
      snapshotRoot: backup.snapshotRoot,
      targetRoot: dirtyTarget,
    });

    assert.equal(restored.manifest.checksum, backup.manifest.checksum);
    assert.equal(
      readFileSync(path.join(dirtyTarget, ".aralume-state", "audit-logs.json"), "utf8").includes(
        "audit-1",
      ),
      true,
    );
    assert.equal(
      readFileSync(path.join(dirtyTarget, "media", "channel-1", "clip.txt"), "utf8"),
      "clip-one\n",
    );

    writeFileSync(
      path.join(dirtyTarget, "media", "channel-1", "clip.txt"),
      "rolled-forward\n",
      "utf8",
    );
    const rolledBack = rollbackRecoveryBackup({
      snapshotRoot: backup.snapshotRoot,
      targetRoot: dirtyTarget,
    });
    assert.equal(rolledBack.manifest.checksum, backup.manifest.checksum);
    assert.equal(
      readFileSync(path.join(dirtyTarget, "media", "channel-1", "clip.txt"), "utf8"),
      "clip-one\n",
    );
  } finally {
    rmSync(sourceRoot, { recursive: true, force: true });
    rmSync(backupRoot, { recursive: true, force: true });
    rmSync(dirtyTarget, { recursive: true, force: true });
  }
});

test("rejects nested backup roots and tampered snapshots", () => {
  const sourceRoot = createTempRoot("aralume-recovery-source-");
  const backupRoot = createTempRoot("aralume-recovery-backup-");
  const restoreRoot = createTempRoot("aralume-recovery-restore-");

  try {
    createRecoveryFixture(sourceRoot);
    const backup = createRecoveryBackup({
      sourceRoot,
      backupRoot,
      createdAt: new Date("2026-07-21T12:30:00.000Z"),
    });

    writeFileSync(
      path.join(backup.snapshotRoot, "storage", "media", "channel-1", "clip.txt"),
      "tampered\n",
      "utf8",
    );

    assert.throws(() => verifyRecoveryBackup(backup.snapshotRoot), /checksum mismatch/);
    assert.throws(
      () =>
        restoreRecoveryBackup({
          snapshotRoot: backup.snapshotRoot,
          targetRoot: restoreRoot,
        }),
      /checksum mismatch/,
    );
    assert.throws(
      () =>
        createRecoveryBackup({
          sourceRoot,
          backupRoot: path.join(sourceRoot, "snapshots"),
        }),
      /must not be inside the source root/,
    );
  } finally {
    rmSync(sourceRoot, { recursive: true, force: true });
    rmSync(backupRoot, { recursive: true, force: true });
    rmSync(restoreRoot, { recursive: true, force: true });
  }
});
