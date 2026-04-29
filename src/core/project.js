import fs from "node:fs";
import path from "node:path";

const IGNORED_DIRS = new Set([
  ".git",
  ".zzh-mobile-ai-guard",
  "node_modules",
  "Pods",
  "build",
  "DerivedData",
  ".dart_tool"
]);

export function detectProject(root) {
  const flags = scanProjectFlags(root, 0);
  const type = flags.ios && flags.flutter ? "mixed" : flags.ios ? "ios" : flags.flutter ? "flutter" : "unknown";

  return {
    name: path.basename(root),
    type
  };
}

function scanProjectFlags(dir, depth) {
  const flags = {
    ios: false,
    flutter: false
  };

  if (depth > 4) return flags;

  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return flags;
  }

  for (const entry of entries) {
    if (entry.name === "pubspec.yaml") flags.flutter = true;
    if (entry.name.endsWith(".xcodeproj") || entry.name.endsWith(".xcworkspace")) flags.ios = true;

    if (flags.ios && flags.flutter) return flags;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (IGNORED_DIRS.has(entry.name)) continue;

    const child = scanProjectFlags(path.join(dir, entry.name), depth + 1);
    flags.ios ||= child.ios;
    flags.flutter ||= child.flutter;

    if (flags.ios && flags.flutter) return flags;
  }

  return flags;
}

export function defaultRules(project) {
  const iosProtected = [
    "**/FaceScan/**",
    "**/Payment/**",
    "**/Subscription/**",
    "**/*Bridging-Header.h"
  ];

  const flutterProtected = [
    "lib/features/auth/**",
    "lib/features/payment/**",
    "lib/features/subscription/**",
    "ios/Runner/**",
    "android/app/**"
  ];

  const iosRisk = [
    "Podfile",
    "Podfile.lock",
    "**/*.entitlements",
    "**/Info.plist",
    "**/GoogleService-Info.plist",
    "**/*Bridging-Header.h",
    "**/*.xcodeproj/**",
    "**/*.xcworkspace/**"
  ];

  const flutterRisk = [
    "pubspec.yaml",
    "pubspec.lock",
    "ios/Runner/Info.plist",
    "android/app/build.gradle",
    "android/app/src/main/AndroidManifest.xml"
  ];

  const isIos = project.type === "ios" || project.type === "mixed";
  const isFlutter = project.type === "flutter" || project.type === "mixed";

  return {
    project,
    protected_paths: [
      ...(isIos ? iosProtected : []),
      ...(isFlutter ? flutterProtected : [])
    ],
    risk_files: [
      ...(isIos ? iosRisk : []),
      ...(isFlutter ? flutterRisk : [])
    ],
    change_limits: {
      max_changed_files: 20,
      max_added_lines: 800,
      max_deleted_lines: 800,
      max_single_file_added_lines: 250
    },
    function_limits: {
      max_file_lines: 1200,
      max_function_lines: 120
    },
    temporary_code_patterns: [
      "TODO: remove",
      "FIXME: temporary",
      "forceUnlock",
      "bypass",
      "mockUser",
      "debugOnly",
      "return true",
      "fatalError",
      "try!",
      "as!"
    ],
    verification: {
      required_manual_checks: [
        "项目能否编译通过",
        "本轮涉及页面是否能正常打开",
        "已验证主链路是否仍然正常"
      ]
    }
  };
}

export function renderRulesYaml(rules) {
  const quote = (value) => JSON.stringify(value);
  const lines = [];

  lines.push("# zzh-mobile-ai-guard rules");
  lines.push("# You can use zmg init -> zmg start -> zmg check without editing this file.");
  lines.push("");
  lines.push("project:");
  lines.push(`  name: ${quote(rules.project.name)}`);
  lines.push(`  type: ${quote(rules.project.type)}`);
  lines.push("");
  writeArray(lines, "protected_paths", rules.protected_paths);
  writeArray(lines, "risk_files", rules.risk_files);
  lines.push("change_limits:");
  writeObject(lines, rules.change_limits, 2);
  lines.push("");
  lines.push("function_limits:");
  writeObject(lines, rules.function_limits, 2);
  lines.push("");
  writeArray(lines, "temporary_code_patterns", rules.temporary_code_patterns);
  lines.push("verification:");
  lines.push("  required_manual_checks:");
  for (const item of rules.verification.required_manual_checks) {
    lines.push(`    - ${quote(item)}`);
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function writeArray(lines, key, values) {
  lines.push(`${key}:`);
  for (const value of values) {
    lines.push(`  - ${JSON.stringify(value)}`);
  }
  lines.push("");
}

function writeObject(lines, object, indent) {
  const prefix = " ".repeat(indent);
  for (const [key, value] of Object.entries(object)) {
    lines.push(`${prefix}${key}: ${JSON.stringify(value)}`);
  }
}
