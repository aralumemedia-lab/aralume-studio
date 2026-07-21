import fs from "node:fs";
import path from "node:path";

const nodeModulesDir = path.join(process.cwd(), "node_modules");
const patchMarker = "module.exports = expand;";

function findBraceExpansionDirs(startDir) {
  const matches = [];
  if (!fs.existsSync(startDir)) return matches;

  const stack = [startDir];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.name === "brace-expansion") {
        matches.push(fullPath);
      }
      if (entry.name !== ".bin") {
        stack.push(fullPath);
      }
    }
  }

  return matches;
}

function patchCommonJsEntry(packageDir) {
  const entryFile = path.join(packageDir, "dist", "commonjs", "index.js");
  if (!fs.existsSync(entryFile)) return false;

  const current = fs.readFileSync(entryFile, "utf8");
  if (current.includes(patchMarker)) return false;

  const patch = [
    "",
    "// postinstall shim: keep CommonJS require() compatible for minimatch and ESLint.",
    "module.exports = expand;",
    "module.exports.expand = expand;",
    "module.exports.EXPANSION_MAX = exports.EXPANSION_MAX;",
    "",
  ].join("\n");

  fs.writeFileSync(entryFile, `${current}${patch}`);
  return true;
}

if (!fs.existsSync(nodeModulesDir)) {
  process.exit(0);
}

const targets = findBraceExpansionDirs(nodeModulesDir);
let patched = 0;
for (const target of targets) {
  if (patchCommonJsEntry(target)) {
    patched += 1;
  }
}

if (patched > 0) {
  console.log(`[patch-brace-expansion] patched ${patched} CommonJS entrypoint(s)`);
}
