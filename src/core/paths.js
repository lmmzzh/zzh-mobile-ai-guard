import path from "node:path";

export const GUARD_DIR = ".zzh-mobile-ai-guard";
export const RULES_FILE = "rules.yml";
export const BASELINES_DIR = "baselines";
export const REPORTS_DIR = "reports";
export const LATEST_BASELINE = "latest.json";
export const LATEST_CHECK = "latest-check.json";

export function guardPath(root, ...parts) {
  return path.join(root, GUARD_DIR, ...parts);
}

export function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

export function relativePosix(root, filePath) {
  return toPosixPath(path.relative(root, filePath));
}
