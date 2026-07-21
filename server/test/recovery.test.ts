import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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

function createDirectoryAlias(target: string, aliasPath: string): void {
  const linkType = process.platform === "win32" ? "junction" : "dir";
  symlinkSync(target, aliasPath, linkType);
}

function readManifest(snapshotRoot: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(snapshotRoot, "manifest.json"), "utf8")) as Record<
    string,
    unknown
  >;
}

function writeManifest(snapshotRoot: string, manifest: Record<string, unknown>): void {
  writeFileSync(
    path.join(snapshotRoot, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
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

test("validates manifest files canonically and rejects tampering", () => {
  const sourceRoot = createTempRoot("aralume-recovery-source-");
  const backupRoot = createTempRoot("aralume-recovery-backup-");

  try {
    createRecoveryFixture(sourceRoot);
    const backup = createRecoveryBackup({
      sourceRoot,
      backupRoot,
      createdAt: new Date("2026-07-21T13:00:00.000Z"),
    });

    assert.doesNotThrow(() => verifyRecoveryBackup(backup.snapshotRoot));

    const cases: Array<{
      name: string;
      mutate: (manifest: Record<string, unknown>) => void;
    }> = [
      {
        name: "manifest.files altered only",
        mutate: (manifest) => {
          const files = manifest.files as Array<Record<string, unknown>>;
          files[0] = { ...files[0], path: "media/channel-1/clip-tampered.txt" };
        },
      },
      {
        name: "file omitted",
        mutate: (manifest) => {
          manifest.files = (manifest.files as Array<unknown>).slice(0, 2);
        },
      },
      {
        name: "file added",
        mutate: (manifest) => {
          manifest.files = [
            ...(manifest.files as Array<unknown>),
            {
              path: "media/extra.txt",
              sizeBytes: 1,
              sha256: "0".repeat(64),
            },
          ];
        },
      },
      {
        name: "duplicate path",
        mutate: (manifest) => {
          const files = manifest.files as Array<Record<string, unknown>>;
          files[1] = { ...files[0] };
        },
      },
      {
        name: "path equivalent after normalization",
        mutate: (manifest) => {
          const files = manifest.files as Array<Record<string, unknown>>;
          files[0] = { ...files[0], path: "media/./channel-1/clip.txt" };
        },
      },
      {
        name: "different order",
        mutate: (manifest) => {
          const files = manifest.files as Array<Record<string, unknown>>;
          manifest.files = [files[1], files[0], files[2]];
        },
      },
      {
        name: "size mismatch",
        mutate: (manifest) => {
          const files = manifest.files as Array<Record<string, unknown>>;
          files[0] = { ...files[0], sizeBytes: Number(files[0].sizeBytes) + 1 };
        },
      },
      {
        name: "checksum mismatch",
        mutate: (manifest) => {
          const files = manifest.files as Array<Record<string, unknown>>;
          files[0] = { ...files[0], sha256: "f".repeat(64) };
        },
      },
      {
        name: "fileCount mismatch",
        mutate: (manifest) => {
          manifest.fileCount = Number(manifest.fileCount) + 1;
        },
      },
      {
        name: "totalBytes mismatch",
        mutate: (manifest) => {
          manifest.totalBytes = Number(manifest.totalBytes) + 1;
        },
      },
      {
        name: "absolute path",
        mutate: (manifest) => {
          const files = manifest.files as Array<Record<string, unknown>>;
          files[0] = { ...files[0], path: path.resolve(sourceRoot, "media/channel-1/clip.txt") };
        },
      },
      {
        name: "path traversal",
        mutate: (manifest) => {
          const files = manifest.files as Array<Record<string, unknown>>;
          files[0] = { ...files[0], path: "../clip.txt" };
        },
      },
    ];

    for (const testCase of cases) {
      const manifest = readManifest(backup.snapshotRoot);
      testCase.mutate(manifest);
      writeManifest(backup.snapshotRoot, manifest);
      assert.throws(() => verifyRecoveryBackup(backup.snapshotRoot), testCase.name);
    }
  } finally {
    rmSync(sourceRoot, { recursive: true, force: true });
    rmSync(backupRoot, { recursive: true, force: true });
  }
});

test("rejects aliases, junctions, and linked directories during backup and restore", () => {
  const validSourceRoot = createTempRoot("aralume-recovery-source-valid-");
  const validBackupRoot = createTempRoot("aralume-recovery-backup-valid-");
  const restoreRoot = createTempRoot("aralume-recovery-restore-");
  const restoreAlias = path.join(path.dirname(restoreRoot), `${path.basename(restoreRoot)}-alias`);
  const sourceAlias = path.join(
    path.dirname(validSourceRoot),
    `${path.basename(validSourceRoot)}-alias`,
  );

  const aliasSourceRoot = createTempRoot("aralume-recovery-source-alias-");
  const aliasBackupRoot = createTempRoot("aralume-recovery-backup-alias-");
  const outsideBackupRoot = createTempRoot("aralume-recovery-backup-outside-");
  const loopBackupRoot = createTempRoot("aralume-recovery-backup-loop-");
  const insideAlias = path.join(aliasSourceRoot, "inside-alias");
  const outsideAlias = path.join(aliasSourceRoot, "outside-alias");
  const loopAlias = path.join(aliasSourceRoot, "loop-alias");
  const outsideRoot = createTempRoot("aralume-recovery-outside-");

  try {
    createRecoveryFixture(validSourceRoot);
    createRecoveryFixture(aliasSourceRoot);
    mkdirSync(outsideRoot, { recursive: true });

    createDirectoryAlias(validSourceRoot, sourceAlias);
    createDirectoryAlias(restoreRoot, restoreAlias);
    createDirectoryAlias(path.join(aliasSourceRoot, ".aralume-state"), insideAlias);
    createDirectoryAlias(outsideRoot, outsideAlias);
    createDirectoryAlias(aliasSourceRoot, loopAlias);

    assert.throws(
      () =>
        createRecoveryBackup({
          sourceRoot: sourceAlias,
          backupRoot: validBackupRoot,
        }),
      /symbolic link or junction/,
    );

    assert.throws(
      () =>
        createRecoveryBackup({
          sourceRoot: validSourceRoot,
          backupRoot: path.join(sourceAlias, "snapshots"),
        }),
      /symbolic link or junction/,
    );

    assert.throws(
      () =>
        createRecoveryBackup({
          sourceRoot: validSourceRoot,
          backupRoot: path.join(validSourceRoot, "snapshots"),
        }),
      /must not be inside the source root/,
    );

    assert.throws(
      () =>
        createRecoveryBackup({
          sourceRoot: aliasSourceRoot,
          backupRoot: aliasBackupRoot,
        }),
      /unsupported symbolic link/,
    );

    assert.throws(
      () =>
        createRecoveryBackup({
          sourceRoot: aliasSourceRoot,
          backupRoot: outsideBackupRoot,
        }),
      /unsupported symbolic link/,
    );

    assert.throws(
      () =>
        createRecoveryBackup({
          sourceRoot: aliasSourceRoot,
          backupRoot: loopBackupRoot,
        }),
      /unsupported symbolic link/,
    );

    const validBackup = createRecoveryBackup({
      sourceRoot: validSourceRoot,
      backupRoot: validBackupRoot,
      createdAt: new Date("2026-07-21T13:30:00.000Z"),
    });

    assert.throws(
      () =>
        restoreRecoveryBackup({
          snapshotRoot: validBackup.snapshotRoot,
          targetRoot: restoreAlias,
        }),
      /symbolic link or junction/,
    );

    assert.throws(
      () =>
        restoreRecoveryBackup({
          snapshotRoot: validBackup.snapshotRoot,
          targetRoot: path.join(validBackup.snapshotRoot, "restore-nested"),
        }),
      /must not be inside the snapshot root/,
    );

    assert.doesNotThrow(() =>
      restoreRecoveryBackup({
        snapshotRoot: validBackup.snapshotRoot,
        targetRoot: restoreRoot,
      }),
    );

    // Ensure linked entries inside the source tree are rejected even if the root itself is clean.
    const linkedBackupRoot = createTempRoot("aralume-recovery-backup-linked-");
    assert.throws(
      () =>
        createRecoveryBackup({
          sourceRoot: aliasSourceRoot,
          backupRoot: linkedBackupRoot,
        }),
      /symbolic link/,
    );
  } finally {
    rmSync(validSourceRoot, { recursive: true, force: true });
    rmSync(validBackupRoot, { recursive: true, force: true });
    rmSync(restoreRoot, { recursive: true, force: true });
    rmSync(restoreAlias, { recursive: true, force: true });
    rmSync(sourceAlias, { recursive: true, force: true });
    rmSync(aliasSourceRoot, { recursive: true, force: true });
    rmSync(aliasBackupRoot, { recursive: true, force: true });
    rmSync(outsideBackupRoot, { recursive: true, force: true });
    rmSync(loopBackupRoot, { recursive: true, force: true });
    rmSync(insideAlias, { recursive: true, force: true });
    rmSync(outsideAlias, { recursive: true, force: true });
    rmSync(loopAlias, { recursive: true, force: true });
    rmSync(outsideRoot, { recursive: true, force: true });
  }
});
