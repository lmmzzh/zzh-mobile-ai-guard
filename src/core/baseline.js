import path from "node:path";
import { BASELINES_DIR, guardPath, LATEST_BASELINE } from "./paths.js";
import { ensureDir, writeJson } from "./fs-utils.js";
import { gitInfo } from "./git.js";
import { loadRules } from "./config.js";
import { scanFiles } from "./files.js";
import { VERSION } from "./version.js";

export function runStart(root) {
  const rules = loadRules(root);
  const baseline = {
    tool: "zzh-mobile-ai-guard",
    version: VERSION,
    createdAt: new Date().toISOString(),
    rootName: path.basename(root),
    project: rules.project,
    git: gitInfo(root),
    files: scanFiles(root)
  };

  const baselinesDir = guardPath(root, BASELINES_DIR);
  ensureDir(baselinesDir);

  const timestamp = timestampForFile();
  writeJson(guardPath(root, BASELINES_DIR, `${timestamp}.json`), baseline);
  writeJson(guardPath(root, BASELINES_DIR, LATEST_BASELINE), baseline);

  console.log("已记录当前项目状态。");
  console.log("");
  console.log("现在可以让 AI 开始改代码。");
  console.log("");
  console.log("改完后运行：");
  console.log("zmg check");
}

export function timestampForFile() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
