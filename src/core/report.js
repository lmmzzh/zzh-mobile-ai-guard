import fs from "node:fs";
import { guardPath, LATEST_CHECK } from "./paths.js";
import { exists, readJson } from "./fs-utils.js";

export function renderMarkdownReport(result) {
  const lines = [];
  lines.push("# ZZH Mobile AI Guard 检查报告");
  lines.push("");
  lines.push("## 1. 结论");
  lines.push("");
  lines.push(result.summary);
  lines.push("");
  lines.push("> 说明：本工具只检查改动范围和结构风险，不证明业务功能正确。");
  lines.push("");
  lines.push("## 2. 改动范围");
  lines.push("");
  lines.push(`- 改动文件：${result.stats.changed_files} 个`);
  lines.push(`- 新增行数：${result.stats.added_lines} 行`);
  lines.push(`- 删除行数：${result.stats.deleted_lines} 行`);
  lines.push("");
  lines.push("## 3. 风险项");
  lines.push("");

  if (result.risks.length === 0) {
    lines.push("未发现明显风险。");
  } else {
    for (const item of result.risks) {
      lines.push(`- [${item.severity}] ${item.file || "全局"}：${item.message}`);
    }
  }

  lines.push("");
  lines.push("## 4. 建议人工验证");
  lines.push("");
  for (const item of result.manual_verification) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("## 5. 建议下一步");
  lines.push("");

  if (result.risks.some((item) => item.severity === "high")) {
    lines.push("先确认 high 风险是否属于本轮目标。如果不是，回退或拆分这部分改动。");
  } else if (result.risks.length > 0) {
    lines.push("先确认风险项，再按正常流程编译和验证。");
  } else {
    lines.push("可以继续按正常流程编译、真机验证和提交前 review。");
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function showReport(root) {
  const latest = guardPath(root, LATEST_CHECK);
  if (!exists(latest)) {
    throw new Error("还没有检查报告，请先运行：zmg check");
  }

  const result = readJson(latest);
  console.log(`最近一次报告：${result.report_path}`);
}
