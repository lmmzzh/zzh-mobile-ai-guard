import fs from "node:fs";
import path from "node:path";
import { BASELINES_DIR, guardPath, REPORTS_DIR, RULES_FILE } from "./paths.js";
import { ensureDir, exists } from "./fs-utils.js";
import { defaultRules, detectProject, renderRulesYaml } from "./project.js";

export function runInit(root) {
  const project = detectProject(root);
  const rules = defaultRules(project);
  const dir = guardPath(root);
  const rulesPath = guardPath(root, RULES_FILE);

  ensureDir(dir);
  ensureDir(guardPath(root, BASELINES_DIR));
  ensureDir(guardPath(root, REPORTS_DIR));

  const localGitIgnore = guardPath(root, ".gitignore");
  if (!exists(localGitIgnore)) {
    fs.writeFileSync(localGitIgnore, "baselines/\nreports/\nlatest-check.json\n", "utf8");
  }

  if (!exists(rulesPath)) {
    fs.writeFileSync(rulesPath, renderRulesYaml(rules), "utf8");
  }

  console.log("zzh-mobile-ai-guard 已接入当前项目。");
  console.log("");
  console.log(`项目类型：${project.type}`);
  console.log("");
  console.log("下一步：");
  console.log("AI 改代码前运行：zmg start");
  console.log("AI 改代码后运行：zmg check");
}

export function loadRules(root) {
  const rulesPath = guardPath(root, RULES_FILE);
  if (!exists(rulesPath)) {
    throw new Error("还没有接入当前项目，请先在项目根目录运行：zmg init");
  }

  const parsed = parseSimpleYaml(fs.readFileSync(rulesPath, "utf8"));
  const project = {
    name: parsed.project?.name || path.basename(root),
    type: parsed.project?.type || "unknown"
  };

  return {
    project,
    protected_paths: parsed.protected_paths ?? [],
    risk_files: parsed.risk_files ?? [],
    change_limits: {
      max_changed_files: numberValue(parsed.change_limits?.max_changed_files, 20),
      max_added_lines: numberValue(parsed.change_limits?.max_added_lines, 800),
      max_deleted_lines: numberValue(parsed.change_limits?.max_deleted_lines, 800),
      max_single_file_added_lines: numberValue(parsed.change_limits?.max_single_file_added_lines, 250)
    },
    function_limits: {
      max_file_lines: numberValue(parsed.function_limits?.max_file_lines, 1200),
      max_function_lines: numberValue(parsed.function_limits?.max_function_lines, 120)
    },
    temporary_code_patterns: parsed.temporary_code_patterns ?? [],
    verification: {
      required_manual_checks: parsed.verification?.required_manual_checks ?? []
    }
  };
}

function numberValue(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseSimpleYaml(content) {
  const result = {};
  let current = null;
  let nested = null;

  for (const rawLine of content.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) continue;

    const indent = rawLine.match(/^ */)?.[0].length ?? 0;
    const line = rawLine.trim();

    if (indent === 0) {
      nested = null;
      const section = line.match(/^([A-Za-z0-9_]+):\s*$/);
      const pair = line.match(/^([A-Za-z0-9_]+):\s*(.+)$/);

      if (section) {
        current = section[1];
        result[current] ??= [];
      } else if (pair) {
        result[pair[1]] = scalar(pair[2]);
      }
      continue;
    }

    if (!current) continue;

    if (indent === 2) {
      if (line.startsWith("- ")) {
        if (!Array.isArray(result[current])) result[current] = [];
        result[current].push(scalar(line.slice(2)));
        continue;
      }

      const section = line.match(/^([A-Za-z0-9_]+):\s*$/);
      const pair = line.match(/^([A-Za-z0-9_]+):\s*(.+)$/);

      if (section) {
        if (Array.isArray(result[current])) result[current] = {};
        nested = section[1];
        result[current][nested] = [];
      } else if (pair) {
        if (Array.isArray(result[current])) result[current] = {};
        result[current][pair[1]] = scalar(pair[2]);
      }
      continue;
    }

    if (indent === 4 && nested && line.startsWith("- ")) {
      result[current][nested].push(scalar(line.slice(2)));
    }
  }

  return result;
}

function scalar(value) {
  const trimmed = value.trim();
  if (/^["'].*["']$/.test(trimmed)) return trimmed.slice(1, -1);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}
