import { execFileSync } from "node:child_process";

export function gitInfo(root) {
  return {
    isGit: isGitRepo(root),
    branch: safeGit(root, ["rev-parse", "--abbrev-ref", "HEAD"]) || "unknown",
    commit: safeGit(root, ["rev-parse", "HEAD"]) || "no-commit"
  };
}

export function changedFilesFromGit(root) {
  const trackedOutput = safeGit(root, ["diff", "--name-only", "HEAD", "--"]);
  const untrackedOutput = safeGit(root, ["ls-files", "--others", "--exclude-standard"]);
  const files = new Set([
    ...lines(trackedOutput),
    ...lines(untrackedOutput)
  ].filter(shouldReportChangedFile));

  return files.size > 0 ? [...files].sort() : null;
}

export function diffNumstat(root) {
  const output = safeGit(root, ["diff", "--numstat", "HEAD", "--"]);
  if (!output) return new Map();

  const stats = new Map();
  for (const line of output.split(/\r?\n/)) {
    const parts = line.split(/\t/);
    if (parts.length < 3) continue;

    const added = Number(parts[0]);
    const deleted = Number(parts[1]);
    const file = parts.slice(2).join("\t");
    stats.set(file, {
      added: Number.isFinite(added) ? added : 0,
      deleted: Number.isFinite(deleted) ? deleted : 0
    });
  }
  return stats;
}

function isGitRepo(root) {
  return Boolean(safeGit(root, ["rev-parse", "--is-inside-work-tree"]));
}

function safeGit(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return "";
  }
}

function lines(output) {
  if (!output) return [];
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function shouldReportChangedFile(file) {
  return !file.startsWith(".zzh-mobile-ai-guard/");
}
