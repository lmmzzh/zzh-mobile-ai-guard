import fs from "node:fs";
import path from "node:path";
import { timestampForFile } from "./baseline.js";
import { loadRules } from "./config.js";
import { readJson, writeJson, exists, ensureDir } from "./fs-utils.js";
import { guardPath, BASELINES_DIR, LATEST_BASELINE, LATEST_CHECK, REPORTS_DIR } from "./paths.js";
import { changedFilesFromGit, diffNumstat, gitInfo } from "./git.js";
import { scanFiles, readTextIfAvailable } from "./files.js";
import { matchesAny } from "./glob.js";
import { renderMarkdownReport } from "./report.js";
import { enrichRisk } from "./risk-explanations.js";
import { VERSION } from "./version.js";

export function runCheck(root, options = {}) {
  const baselinePath = guardPath(root, BASELINES_DIR, LATEST_BASELINE);
  if (!exists(baselinePath)) {
    throw new Error("还没有记录改代码前状态，请先运行：zmg start");
  }

  const rules = loadRules(root);
  const baseline = readJson(baselinePath);
  const currentFiles = scanFiles(root);
  const gitChanged = changedFilesFromGit(root);
  const changedFiles = gitChanged && gitChanged.length > 0
    ? gitChanged
    : changedFilesFromBaseline(baseline.files, currentFiles);
  const numstat = diffNumstat(root);
  const stats = summarizeStats(changedFiles, baseline.files, currentFiles, numstat);
  const risks = collectRisks(root, changedFiles, stats, rules, currentFiles);
  const severity = highestSeverity(risks);
  const pass = severity !== "high" && severity !== "medium";
  const manualVerification = verificationSuggestions(changedFiles, rules);
  const timestamp = timestampForFile();
  const reportPath = guardPath(root, REPORTS_DIR, `${timestamp}-check.md`);
  const result = {
    tool: "zzh-mobile-ai-guard",
    version: VERSION,
    checkedAt: new Date().toISOString(),
    pass,
    severity,
    summary: summaryText(pass, risks),
    project: rules.project,
    git: gitInfo(root),
    changed_files: changedFiles,
    stats,
    risks,
    manual_verification: manualVerification,
    report_path: path.relative(root, reportPath).split(path.sep).join("/")
  };

  writeJson(guardPath(root, LATEST_CHECK), result);
  writeJson(guardPath(root, REPORTS_DIR, `${timestamp}-check.json`), result);
  writeMarkdown(reportPath, renderMarkdownReport(result));
  printConsoleSummary(result);

  if (options.strict && !result.pass) {
    process.exitCode = 1;
  }
}

function changedFilesFromBaseline(before, after) {
  const names = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return [...names].filter((name) => before?.[name]?.hash !== after?.[name]?.hash).sort();
}

function summarizeStats(changedFiles, before, after, numstat) {
  let addedLines = 0;
  let deletedLines = 0;
  const perFile = {};

  for (const file of changedFiles) {
    const gitStat = numstat.get(file);
    const beforeLines = before?.[file]?.lines ?? 0;
    const afterLines = after?.[file]?.lines ?? 0;
    const fallbackAdded = Math.max(afterLines - beforeLines, beforeLines === 0 ? afterLines : 0);
    const fallbackDeleted = Math.max(beforeLines - afterLines, afterLines === 0 ? beforeLines : 0);
    const added = gitStat?.added ?? fallbackAdded;
    const deleted = gitStat?.deleted ?? fallbackDeleted;

    addedLines += added;
    deletedLines += deleted;
    perFile[file] = {
      before_lines: beforeLines,
      after_lines: afterLines,
      added,
      deleted
    };
  }

  return {
    changed_files: changedFiles.length,
    added_lines: addedLines,
    deleted_lines: deletedLines,
    per_file: perFile
  };
}

function collectRisks(root, changedFiles, stats, rules, currentFiles) {
  const risks = [];
  const limits = rules.change_limits;

  if (stats.changed_files > limits.max_changed_files) {
    risks.push(risk("change_size", "medium", "", `本轮改动 ${stats.changed_files} 个文件，超过上限 ${limits.max_changed_files}。`));
  }

  if (stats.added_lines > limits.max_added_lines) {
    risks.push(risk("change_size", "medium", "", `本轮新增 ${stats.added_lines} 行，超过上限 ${limits.max_added_lines}。`));
  }

  if (stats.deleted_lines > limits.max_deleted_lines) {
    risks.push(risk("change_size", "medium", "", `本轮删除 ${stats.deleted_lines} 行，超过上限 ${limits.max_deleted_lines}。`));
  }

  for (const file of changedFiles) {
    if (matchesAny(file, rules.protected_paths)) {
      risks.push(risk("protected_path", "high", file, "本轮改动触碰了受保护路径，需要确认是否属于当前目标。"));
    }

    if (matchesAny(file, rules.risk_files)) {
      risks.push(risk("risk_file", "high", file, "本轮改动触碰了高风险配置文件，需要重点验证。"));
    }

    const fileStats = stats.per_file[file];
    if (fileStats?.added > limits.max_single_file_added_lines) {
      risks.push(risk("file_growth", "medium", file, `单文件新增 ${fileStats.added} 行，超过上限 ${limits.max_single_file_added_lines}。`));
    }

    const current = currentFiles[file];
    if (current?.lines > rules.function_limits.max_file_lines) {
      risks.push(risk("file_growth", "medium", file, `文件当前 ${current.lines} 行，超过上限 ${rules.function_limits.max_file_lines}。`));
    }

    for (const match of findTemporaryCode(root, file, rules.temporary_code_patterns)) {
      risks.push(risk("temporary_code", "medium", file, `发现疑似临时代码：${match}`));
    }
  }

  return risks;
}

function findTemporaryCode(root, file, patterns) {
  if (!shouldScanTemporaryCode(file)) return [];
  const content = readTextIfAvailable(root, file);
  if (!content) return [];
  return patterns.filter((pattern) => hasTemporaryPattern(content, pattern));
}

function shouldScanTemporaryCode(file) {
  const ext = path.extname(file).toLowerCase();
  const skipped = new Set([
    ".md",
    ".markdown",
    ".txt",
    ".json",
    ".yml",
    ".yaml"
  ]);

  return !skipped.has(ext);
}

function hasTemporaryPattern(content, pattern) {
  if (!pattern) return false;

  return content
    .split(/\r?\n/)
    .some((line) => line.includes(pattern) && !isPatternDefinitionLine(line, pattern));
}

function isPatternDefinitionLine(line, pattern) {
  const trimmed = line.trim();
  return trimmed === JSON.stringify(pattern) || trimmed === `${JSON.stringify(pattern)},`;
}

function verificationSuggestions(changedFiles, rules) {
  const suggestions = new Set(rules.verification.required_manual_checks);

  for (const file of changedFiles) {
    if (file === "Podfile" || file === "Podfile.lock") {
      suggestions.add("如果依赖有变化，需要重新 pod install 并编译 iOS 项目");
    }
    if (file === "pubspec.yaml" || file === "pubspec.lock") {
      suggestions.add("如果 Flutter 依赖有变化，需要运行 flutter pub get");
    }
    if (file.includes("Info.plist") || file.endsWith(".entitlements")) {
      suggestions.add("如果权限或签名配置有变化，需要真机验证相关入口");
    }
    if (file.includes("FaceScan")) {
      suggestions.add("如果扫脸相关代码有变化，需要验证扫脸核心功能和结果页");
    }
    if (file.includes("Payment") || file.includes("Subscription") || file.includes("payment") || file.includes("subscription")) {
      suggestions.add("如果支付或订阅相关代码有变化，需要验证订阅/支付流程");
    }
  }

  return [...suggestions];
}

function risk(type, severity, file, message) {
  return enrichRisk({ type, severity, file, message });
}

function highestSeverity(risks) {
  if (risks.some((item) => item.severity === "high")) return "high";
  if (risks.some((item) => item.severity === "medium")) return "medium";
  if (risks.length > 0) return "low";
  return "none";
}

function summaryText(pass, risks) {
  if (pass && risks.length === 0) return "未发现明显风险，可以继续按正常流程验证。";
  if (pass) return `发现 ${risks.length} 个低风险提醒。`;
  return `需要确认 ${risks.length} 个风险。`;
}

function printConsoleSummary(result) {
  console.log(`检查完成：${result.summary}`);
  console.log("");
  console.log(`改动文件：${result.stats.changed_files} 个`);
  console.log(`新增/删除：+${result.stats.added_lines} / -${result.stats.deleted_lines}`);
  console.log("");

  if (result.risks.length > 0) {
    console.log("风险项：");
    for (const item of result.risks.slice(0, 8)) {
      const file = item.file ? ` ${item.file}` : "";
      console.log(`- [${item.severity}]${file} ${item.message}`);
    }
    if (result.risks.length > 8) {
      console.log(`- 还有 ${result.risks.length - 8} 个风险项，请看完整报告。`);
    }
    console.log("");
    console.log("建议：先确认这些风险，再提交代码。");
  } else {
    console.log("未发现明显结构风险。");
    console.log("注意：这不代表业务功能已经验证通过。");
  }

  console.log("");
  console.log(`完整报告：${result.report_path}`);
}

function writeMarkdown(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}
