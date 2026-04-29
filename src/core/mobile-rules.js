export function defaultMobileRules(project) {
  const isIos = project.type === "ios" || project.type === "mixed";
  const isFlutter = project.type === "flutter" || project.type === "mixed";

  return {
    protected_paths: [
      ...(isIos ? iosProtectedPaths() : []),
      ...(isFlutter ? flutterProtectedPaths() : [])
    ],
    risk_files: [
      ...(isIos ? iosRiskFiles() : []),
      ...(isFlutter ? flutterRiskFiles() : [])
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
        "已验证核心功能流程是否仍然正常"
      ]
    }
  };
}

function iosProtectedPaths() {
  return [
    "**/FaceScan/**",
    "**/Payment/**",
    "**/Subscription/**",
    "**/Login/**",
    "**/Auth/**",
    "**/*Bridging-Header.h"
  ];
}

function flutterProtectedPaths() {
  return [
    "lib/features/auth/**",
    "lib/features/payment/**",
    "lib/features/subscription/**",
    "ios/Runner/**",
    "android/app/**"
  ];
}

function iosRiskFiles() {
  return [
    "Podfile",
    "Podfile.lock",
    "**/*.entitlements",
    "**/Info.plist",
    "**/GoogleService-Info.plist",
    "**/*Bridging-Header.h",
    "**/*.xcodeproj/**",
    "**/*.xcworkspace/**",
    "**/project.pbxproj"
  ];
}

function flutterRiskFiles() {
  return [
    "pubspec.yaml",
    "pubspec.lock",
    "ios/Runner/Info.plist",
    "ios/Runner/*.entitlements",
    "android/app/build.gradle",
    "android/app/src/main/AndroidManifest.xml"
  ];
}

