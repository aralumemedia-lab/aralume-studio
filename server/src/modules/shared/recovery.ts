import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
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
  const sourceRoot = resolveRecoveryFilesystemPath(input.sourceRoot, {
    label: "Recovery source root",
    mustExist: true,
  });
  const backupRoot = resolveRecoveryFilesystemPath(input.backupRoot, {
    label: "Recovery backup root",
  });

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
  const resolvedSnapshotRoot = resolveRecoveryFilesystemPath(snapshotRoot, {
    label: "Recovery snapshot root",
    mustExist: true,
  });
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
    manifest.createdAt,
  );
  const normalizedFiles = normalizeRecoveryManifestFiles(manifest.files);

  if (computed.checksum !== manifest.checksum) {
    throw new Error("Recovery snapshot checksum mismatch");
  }

  if (
    computed.fileCount !== manifest.fileCount ||
    computed.totalBytes !== manifest.totalBytes ||
    normalizedFiles.length !== manifest.fileCount ||
    normalizedFiles.length !== computed.fileCount
  ) {
    throw new Error("Recovery snapshot manifest is inconsistent");
  }

  assertRecoveryManifestFilesMatch(computed.files, normalizedFiles);

  return manifest;
}

export function restoreRecoveryBackup(
  input: {
    snapshotRoot: string;
    targetRoot: string;
  } & RecoveryRestoreOptions,
): RecoveryBackupResult {
  const resolvedSnapshotRoot = resolveRecoveryFilesystemPath(input.snapshotRoot, {
    label: "Recovery snapshot root",
    mustExist: true,
  });
  const resolvedTargetRoot = resolveRecoveryFilesystemPath(input.targetRoot, {
    label: "Recovery target root",
  });
  if (isSameOrNestedRoot(resolvedTargetRoot, resolvedSnapshotRoot)) {
    throw new Error(
      `Recovery target root must not be inside the snapshot root: ${resolvedTargetRoot}`,
    );
  }
  const manifest = verifyRecoveryBackup(resolvedSnapshotRoot);
  const snapshotStorageRoot = path.join(resolvedSnapshotRoot, "storage");

  if (existsSync(resolvedTargetRoot)) {
    const currentStats = lstatSync(resolvedTargetRoot);
    if (!currentStats.isDirectory()) {
      throw new Error(`Recovery target root is not a directory: ${resolvedTargetRoot}`);
    }

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
    const sourceStats = lstatSync(sourcePath);

    if (sourceStats.isSymbolicLink()) {
      throw new Error(`Recovery source contains unsupported symbolic link: ${sourcePath}`);
    }

    if (sourceStats.isDirectory()) {
      copyDirectoryTree(sourcePath, targetPath);
      continue;
    }

    if (!sourceStats.isFile()) {
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

  return normalizeRecoveryManifest(JSON.parse(readFileSync(manifestPath, "utf8")));
}

function writeManifest(snapshotRoot: string, manifest: RecoveryManifest): void {
  const manifestPath = path.join(snapshotRoot, "manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function isSameOrNestedRoot(candidateRoot: string, parentRoot: string): boolean {
  const relative = path.relative(parentRoot, candidateRoot);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveRecoveryFilesystemPath(
  inputPath: string,
  options: {
    label: string;
    mustExist?: boolean;
  },
): string {
  const resolvedInputPath = path.resolve(inputPath);
  const parsedInputPath = path.parse(resolvedInputPath);
  const segments = resolvedInputPath
    .slice(parsedInputPath.root.length)
    .split(path.sep)
    .filter(Boolean);

  if (segments.length === 0) {
    if (options.mustExist && !existsSync(parsedInputPath.root)) {
      throw new Error(`${options.label} does not exist: ${resolvedInputPath}`);
    }

    if (existsSync(parsedInputPath.root)) {
      const rootStats = lstatSync(parsedInputPath.root);
      if (rootStats.isSymbolicLink()) {
        throw new Error(
          `${options.label} must not be a symbolic link or junction: ${parsedInputPath.root}`,
        );
      }
      return realpathSync(parsedInputPath.root);
    }

    return parsedInputPath.root;
  }

  let currentPath = parsedInputPath.root;
  for (let index = 0; index < segments.length; index += 1) {
    const nextPath = path.join(currentPath, segments[index]);
    if (!existsSync(nextPath)) {
      if (options.mustExist) {
        throw new Error(`${options.label} does not exist: ${resolvedInputPath}`);
      }

      return path.join(currentPath, ...segments.slice(index));
    }

    const stats = lstatSync(nextPath);
    if (stats.isSymbolicLink()) {
      throw new Error(`${options.label} must not be a symbolic link or junction: ${nextPath}`);
    }

    currentPath = realpathSync(nextPath);
  }

  return currentPath;
}

function normalizeRecoveryManifest(manifest: unknown): RecoveryManifest {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("Recovery manifest is invalid");
  }

  const value = manifest as Record<string, unknown>;
  const schema = value.schema;
  const createdAt = value.createdAt;
  const sourceRoot = value.sourceRoot;
  const fileCount = value.fileCount;
  const totalBytes = value.totalBytes;
  const checksum = value.checksum;
  const files = value.files;

  if (schema !== RECOVERY_SCHEMA) {
    throw new Error(`Unsupported recovery schema: ${String(schema)}`);
  }

  if (
    typeof createdAt !== "string" ||
    Number.isNaN(Date.parse(createdAt)) ||
    new Date(createdAt).toISOString() !== createdAt
  ) {
    throw new Error("Recovery manifest createdAt is invalid");
  }

  if (typeof sourceRoot !== "string" || sourceRoot.trim().length === 0) {
    throw new Error("Recovery manifest sourceRoot is invalid");
  }

  if (!Number.isInteger(fileCount) || (fileCount as number) < 0) {
    throw new Error("Recovery manifest fileCount is invalid");
  }

  if (!Number.isInteger(totalBytes) || (totalBytes as number) < 0) {
    throw new Error("Recovery manifest totalBytes is invalid");
  }

  if (typeof checksum !== "string" || !/^[0-9a-f]{64}$/i.test(checksum)) {
    throw new Error("Recovery manifest checksum is invalid");
  }

  const normalizedFiles = normalizeRecoveryManifestFiles(files);
  if (normalizedFiles.length !== fileCount) {
    throw new Error("Recovery manifest fileCount does not match files");
  }

  const normalizedTotalBytes = normalizedFiles.reduce((sum, entry) => sum + entry.sizeBytes, 0);
  if (normalizedTotalBytes !== totalBytes) {
    throw new Error("Recovery manifest totalBytes does not match files");
  }

  return {
    schema: RECOVERY_SCHEMA,
    createdAt,
    sourceRoot,
    fileCount,
    totalBytes,
    checksum: checksum.toLowerCase(),
    files: normalizedFiles,
  };
}

function normalizeRecoveryManifestFiles(rawFiles: unknown): RecoveryFileEntry[] {
  if (!Array.isArray(rawFiles)) {
    throw new Error("Recovery manifest files are invalid");
  }

  const normalizedFiles: RecoveryFileEntry[] = [];
  const seenPaths = new Set<string>();

  rawFiles.forEach((entry, index) => {
    const normalizedEntry = normalizeRecoveryManifestFileEntry(entry, index);
    if (seenPaths.has(normalizedEntry.path)) {
      throw new Error(`Recovery manifest files contain a duplicate path: ${normalizedEntry.path}`);
    }

    seenPaths.add(normalizedEntry.path);
    normalizedFiles.push(normalizedEntry);
  });

  return normalizedFiles;
}

function normalizeRecoveryManifestFileEntry(entry: unknown, index: number): RecoveryFileEntry {
  if (!entry || typeof entry !== "object") {
    throw new Error(`Recovery manifest file entry ${index} is invalid`);
  }

  const value = entry as Record<string, unknown>;
  const entryPath = normalizeRecoveryManifestPath(value.path, index);
  const sizeBytes = value.sizeBytes;
  const sha256 = value.sha256;

  if (!Number.isInteger(sizeBytes) || (sizeBytes as number) < 0) {
    throw new Error(`Recovery manifest file entry ${entryPath} sizeBytes is invalid`);
  }

  if (typeof sha256 !== "string" || !/^[0-9a-f]{64}$/i.test(sha256)) {
    throw new Error(`Recovery manifest file entry ${entryPath} sha256 is invalid`);
  }

  return {
    path: entryPath,
    sizeBytes: sizeBytes as number,
    sha256: sha256.toLowerCase(),
  };
}

function normalizeRecoveryManifestPath(value: unknown, index: number): string {
  if (typeof value !== "string") {
    throw new Error(`Recovery manifest file entry ${index} path is invalid`);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`Recovery manifest file entry ${index} path is invalid`);
  }

  const normalizedSeparators = trimmed.replace(/\\/g, "/");
  if (path.posix.isAbsolute(normalizedSeparators) || path.win32.isAbsolute(normalizedSeparators)) {
    throw new Error(`Recovery manifest file entry ${normalizedSeparators} must be relative`);
  }

  const normalizedPath = path.posix.normalize(normalizedSeparators);
  if (normalizedPath !== normalizedSeparators) {
    throw new Error(`Recovery manifest file entry ${normalizedSeparators} is not canonical`);
  }

  if (
    normalizedPath === "." ||
    normalizedPath.startsWith("../") ||
    normalizedPath.includes("/../") ||
    normalizedPath.includes("//")
  ) {
    throw new Error(`Recovery manifest file entry ${normalizedPath} is not allowed`);
  }

  const segments = normalizedPath.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    throw new Error(`Recovery manifest file entry ${normalizedPath} is not allowed`);
  }

  return normalizedPath;
}

function assertRecoveryManifestFilesMatch(
  expectedFiles: RecoveryFileEntry[],
  actualFiles: RecoveryFileEntry[],
): void {
  if (expectedFiles.length !== actualFiles.length) {
    throw new Error("Recovery snapshot manifest files are inconsistent");
  }

  expectedFiles.forEach((expectedFile, index) => {
    const actualFile = actualFiles[index];
    if (
      actualFile.path !== expectedFile.path ||
      actualFile.sizeBytes !== expectedFile.sizeBytes ||
      actualFile.sha256 !== expectedFile.sha256
    ) {
      throw new Error(`Recovery snapshot manifest file mismatch at ${expectedFile.path}`);
    }
  });
}
