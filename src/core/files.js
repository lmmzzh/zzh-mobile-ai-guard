import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { relativePosix } from "./paths.js";

const IGNORED_DIRS = new Set([
  ".git",
  ".zzh-mobile-ai-guard",
  "node_modules",
  "Pods",
  "build",
  "DerivedData",
  ".dart_tool",
  ".idea",
  ".vscode"
]);

const IGNORED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".pdf",
  ".zip",
  ".gz",
  ".tar",
  ".lock",
  ".xcuserstate",
  ".mp4",
  ".mp3",
  ".wav"
]);

export function scanFiles(root) {
  const files = {};
  walk(root, root, files);
  return files;
}

export function readTextIfAvailable(root, relativePath) {
  const filePath = path.join(root, relativePath);
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 1024 * 1024) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function walk(root, dir, files) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      walk(root, path.join(dir, entry.name), files);
      continue;
    }

    if (!entry.isFile()) continue;

    const filePath = path.join(dir, entry.name);
    const ext = path.extname(entry.name);
    if (IGNORED_EXTENSIONS.has(ext)) continue;

    let stat;
    try {
      stat = fs.statSync(filePath);
      if (stat.size > 1024 * 1024) continue;
    } catch {
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    const relativePath = relativePosix(root, filePath);
    files[relativePath] = {
      lines: countLines(content),
      hash: hashContent(content),
      size: stat.size
    };
  }
}

function countLines(content) {
  if (!content) return 0;
  return content.split(/\r?\n/).length;
}

function hashContent(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}
