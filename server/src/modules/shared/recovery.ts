import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

export const RECOVERY_SCHEMA = "aralume.recovery.v1" as const;

export type RecoveryFileEntry = {
  path: string;
  sizeBytes: number;
  sha256: string;
};

export type RecoveryManifest = {
  schema: typeof RECOVERY_SCHEMA;
  createdAt: string;
  sourceRoot: string;
  fileCount: number;
  totalBytes: number;
  checksum: string;
  files: RecoveryFileEntry[];
};

export type RecoveryBackupResult = {
  backupRoot: string;
  snapshotRoot: string;
  manifest: RecoveryManifest;
};

export type RecoveryRestoreOptions = {
  replaceExisting?: boolean;
};

export function createRecoveryBackup(input: {
  sourceRoot: string;
  backupRoot: string;
  label?: string;
  createdAt?: Date;
}): RecoveryBackupResult {
  const sourceRoot = path.resolve(input.sourceRoot);
  const backupRoot = path.resolve(input.backupRoot);

  if (!existsSync(sourceRoot)) {
    throw new Error(`Recovery source root does not exist: ${sourceRoot}`);
  }
  if (isSameOrNestedRoot(backupRoot, sourceRoot)) {
    throw new Error(`Recovery backup root must not be inside the source root: ${backupRoot}`);
  }

  mkdirSync(backupRoot, { recursive: true });

  const createdAt = (input.createdAt ?? new Date()).toISOString();
  const stamp = createdAt.replace(/[:.]/g, "-");
  const label = input.label
    ?.trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = label ? `-${label}` : "";
  let snapshotRoot = path.join(backupRoot, `${stamp}-${process.pid}${suffix}`);
  let collision = 0;
  while (existsSync(snapshotRoot)) {
    collision += 1;
    snapshotRoot = path.join(backupRoot, `${stamp}-${process.pid}${suffix}-${collision}`);
  }

  const snapshotStorageRoot = path.join(snapshotRoot, "storage");
  mkdirSync(snapshotStorageRoot, { recursive: true });
  copyDirectoryTree(sourceRoot, snapshotStorageRoot);

  const manifest = buildRecoveryManifest(sourceRoot, snapshotStorageRoot, createdAt);
  writeManifest(snapshotRoot, manifest);

  return {
    backupRoot,
    snapshotRoot,
    manifest,
  };
}

export function verifyRecoveryBackup(snapshotRoot: string): RecoveryManifest {
  const resolvedSnapshotRoot = path.resolve(snapshotRoot);
  const manifest = readManifest(resolvedSnapshotRoot);
  const snapshotStorageRoot = path.join(resolvedSnapshotRoot, "storage");

  if (manifest.schema !== RECOVERY_SCHEMA) {
    throw new Error(`Unsupported recovery schema: ${manifest.schema}`);
  }

  if (!existsSync(snapshotStorageRoot)) {
    throw new Error(`Recovery snapshot storage is missing: ${snapshotStorageRoot}`);
  }

  const computed = buildRecoveryManifest(
    manifest.sourceRoot,
    snapshotStorageRoot,
    new Date(manifest.createdAt),
  );

  if (computed.checksum !== manifest.checksum) {
    throw new Error("Recovery snapshot checksum mismatch");
  }

  if (computed.fileCount !== manifest.fileCount || computed.totalBytes !== manifest.totalBytes) {
    throw new Error("Recovery snapshot manifest is inconsistent");
  }

  return manifest;
}

export function restoreRecoveryBackup(
  input: {
    snapshotRoot: string;
    targetRoot: string;
  } & RecoveryRestoreOptions,
): RecoveryBackupResult {
  const resolvedSnapshotRoot = path.resolve(input.snapshotRoot);
  const resolvedTargetRoot = path.resolve(input.targetRoot);
  if (isSameOrNestedRoot(resolvedTargetRoot, resolvedSnapshotRoot)) {
    throw new Error(
      `Recovery target root must not be inside the snapshot root: ${resolvedTargetRoot}`,
    );
  }
  const manifest = verifyRecoveryBackup(resolvedSnapshotRoot);
  const snapshotStorageRoot = path.join(resolvedSnapshotRoot, "storage");

  if (existsSync(resolvedTargetRoot)) {
    const currentEntries = readdirSync(resolvedTargetRoot);
    if (currentEntries.length > 0 && !input.replaceExisting) {
      throw new Error(`Recovery target root is not clean: ${resolvedTargetRoot}`);
    }

    rmSync(resolvedTargetRoot, { recursive: true, force: true });
  }

  mkdirSync(path.dirname(resolvedTargetRoot), { recursive: true });
  const stagingRoot = `${resolvedTargetRoot}.restoring-${process.pid}-${Date.now()}`;
  copyDirectoryTree(snapshotStorageRoot, stagingRoot);
  renameSync(stagingRoot, resolvedTargetRoot);

  return {
    backupRoot: path.dirname(resolvedSnapshotRoot),
    snapshotRoot: resolvedSnapshotRoot,
    manifest,
  };
}

export function rollbackRecoveryBackup(input: {
  snapshotRoot: string;
  targetRoot: string;
}): RecoveryBackupResult {
  return restoreRecoveryBackup({
    snapshotRoot: input.snapshotRoot,
    targetRoot: input.targetRoot,
    replaceExisting: true,
  });
}

function buildRecoveryManifest(
  sourceRoot: string,
  snapshotStorageRoot: string,
  createdAt: string | Date,
): RecoveryManifest {
  const createdAtValue = createdAt instanceof Date ? createdAt.toISOString() : createdAt;
  const files = listRecoveryFiles(snapshotStorageRoot).sort((left, right) =>
    left.path.localeCompare(right.path),
  );
  const digest = createHash("sha256");
  let totalBytes = 0;

  for (const file of files) {
    digest.update(file.path);
    digest.update("\0");
    digest.update(file.sha256);
    digest.update("\0");
    digest.update(String(file.sizeBytes));
    digest.update("\n");
    totalBytes += file.sizeBytes;
  }

  digest.update(createdAtValue);
  digest.update("\n");
  digest.update(sourceRoot);

  return {
    schema: RECOVERY_SCHEMA,
    createdAt: createdAtValue,
    sourceRoot,
    fileCount: files.length,
    totalBytes,
    checksum: digest.digest("hex"),
    files,
  };
}

function listRecoveryFiles(root: string): RecoveryFileEntry[] {
  const entries: RecoveryFileEntry[] = [];

  visitRecoveryTree(root, root, entries);
  return entries;
}

function visitRecoveryTree(
  baseRoot: string,
  currentRoot: string,
  entries: RecoveryFileEntry[],
): void {
  for (const dirent of readdirSync(currentRoot, { withFileTypes: true })) {
    const fullPath = path.join(currentRoot, dirent.name);
    const relativePath = path.relative(baseRoot, fullPath).split(path.sep).join("/");

    if (dirent.isSymbolicLink()) {
      throw new Error(`Recovery source contains unsupported symbolic link: ${relativePath}`);
    }

    if (dirent.isDirectory()) {
      visitRecoveryTree(baseRoot, fullPath, entries);
      continue;
    }

    if (!dirent.isFile()) {
      throw new Error(`Recovery source contains unsupported entry: ${relativePath}`);
    }

    const stats = statSync(fullPath);
    entries.push({
      path: relativePath,
      sizeBytes: stats.size,
      sha256: createHash("sha256").update(readFileSync(fullPath)).digest("hex"),
    });
  }
}

function copyDirectoryTree(sourceRoot: string, targetRoot: string): void {
  mkdirSync(targetRoot, { recursive: true });

  for (const dirent of readdirSync(sourceRoot, { withFileTypes: true })) {
    const sourcePath = path.join(sourceRoot, dirent.name);
    const targetPath = path.join(targetRoot, dirent.name);

    if (dirent.isSymbolicLink()) {
      throw new Error(`Recovery source contains unsupported symbolic link: ${sourcePath}`);
    }

    if (dirent.isDirectory()) {
      copyDirectoryTree(sourcePath, targetPath);
      continue;
    }

    if (!dirent.isFile()) {
      throw new Error(`Recovery source contains unsupported entry: ${sourcePath}`);
    }

    mkdirSync(path.dirname(targetPath), { recursive: true });
    copyFileSync(sourcePath, targetPath);
  }
}

function readManifest(snapshotRoot: string): RecoveryManifest {
  const manifestPath = path.join(snapshotRoot, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Recovery manifest is missing: ${manifestPath}`);
  }

  return JSON.parse(readFileSync(manifestPath, "utf8")) as RecoveryManifest;
}

function writeManifest(snapshotRoot: string, manifest: RecoveryManifest): void {
  const manifestPath = path.join(snapshotRoot, "manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function isSameOrNestedRoot(candidateRoot: string, parentRoot: string): boolean {
  const relative = path.relative(parentRoot, candidateRoot);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
