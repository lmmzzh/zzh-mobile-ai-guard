import { guardPath, LATEST_CHECK, BASELINES_DIR, LATEST_BASELINE, RULES_FILE } from "./paths.js";
import { exists, readJson } from "./fs-utils.js";

export function showStatus(root) {
  const hasRules = exists(guardPath(root, RULES_FILE));
  const hasBaseline = exists(guardPath(root, BASELINES_DIR, LATEST_BASELINE));
  const hasCheck = exists(guardPath(root, LATEST_CHECK));

  console.log("zzh-mobile-ai-guard 状态");
  console.log("");
  console.log(`已接入项目：${hasRules ? "是" : "否"}`);
  console.log(`已运行 start：${hasBaseline ? "是" : "否"}`);
  console.log(`已有检查结果：${hasCheck ? "是" : "否"}`);

  if (hasCheck) {
    const result = readJson(guardPath(root, LATEST_CHECK));
    console.log("");
    console.log(`最近一次检查：${result.summary}`);
    console.log(`完整报告：${result.report_path}`);
  }
}
