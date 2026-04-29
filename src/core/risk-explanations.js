export function enrichRisk(baseRisk) {
  const explanation = explanationFor(baseRisk);
  return {
    ...baseRisk,
    explanation: explanation.why,
    acceptable_when: explanation.acceptableWhen,
    action_if_unexpected: explanation.actionIfUnexpected,
    verification: explanation.verification
  };
}

function explanationFor(risk) {
  if (risk.type === "risk_file") return riskFileExplanation(risk.file);
  if (risk.type === "protected_path") return protectedPathExplanation(risk.file);
  if (risk.type === "temporary_code") return temporaryCodeExplanation();
  if (risk.type === "file_growth") return fileGrowthExplanation();
  if (risk.type === "change_size") return changeSizeExplanation();

  return {
    why: "这类风险说明本轮改动需要人工确认。",
    acceptableWhen: "如果它确实属于本轮目标，可以继续验证。",
    actionIfUnexpected: "如果它不属于本轮目标，先确认是否需要拆分或回退。",
    verification: "按本轮改动影响的页面和功能做人工验证。"
  };
}

function riskFileExplanation(file) {
  if (file === "Podfile" || file === "Podfile.lock") {
    return {
      why: "这个文件会影响 iOS 依赖安装和编译结果。",
      acceptableWhen: "如果本轮目标就是调整 iOS 依赖，可以接受。",
      actionIfUnexpected: "如果本轮没有要求改依赖，先确认是不是 AI 顺手改动，必要时拆出去或回退。",
      verification: "重新执行 pod install，并编译 iOS 项目。"
    };
  }

  if (file === "pubspec.yaml" || file === "pubspec.lock") {
    return {
      why: "这个文件会影响 Flutter 依赖版本和平台插件。",
      acceptableWhen: "如果本轮目标就是调整 Flutter 依赖，可以接受。",
      actionIfUnexpected: "如果本轮没有要求改依赖，先确认是不是 AI 顺手改动，必要时拆出去或回退。",
      verification: "执行 flutter pub get，并验证相关平台构建。"
    };
  }

  if (file.includes("Info.plist")) {
    return {
      why: "这个文件可能影响权限提示、URL Scheme、后台能力和系统入口。",
      acceptableWhen: "如果本轮目标就是调整权限、系统入口或平台配置，可以接受。",
      actionIfUnexpected: "如果本轮没有要求改权限或平台配置，先确认改动内容是否必要。",
      verification: "真机验证相关权限弹窗、启动入口和受影响页面。"
    };
  }

  if (file.endsWith(".entitlements")) {
    return {
      why: "这个文件可能影响推送、IAP、Keychain、Associated Domains 等签名能力。",
      acceptableWhen: "如果本轮目标就是调整签名能力或系统能力，可以接受。",
      actionIfUnexpected: "如果本轮没有要求改签名能力，先确认是否误改。",
      verification: "使用正确签名配置编译，并真机验证相关系统能力。"
    };
  }

  if (file.includes("AndroidManifest.xml")) {
    return {
      why: "这个文件可能影响 Android 权限、Activity、Service 和 Deep Link。",
      acceptableWhen: "如果本轮目标就是调整 Android 平台配置，可以接受。",
      actionIfUnexpected: "如果本轮没有要求改 Android 配置，先确认是否误改。",
      verification: "验证 Android 启动、权限申请和相关入口。"
    };
  }

  if (file.includes("project.pbxproj") || file.includes(".xcodeproj") || file.includes(".xcworkspace")) {
    return {
      why: "Xcode 工程文件变化可能影响编译目标、资源、Build Settings 或文件引用。",
      acceptableWhen: "如果本轮目标就是新增文件、资源或调整工程配置，可以接受。",
      actionIfUnexpected: "如果只是普通代码修改，先确认是否误动工程文件。",
      verification: "打开 Xcode 或执行命令行编译，确认目标和资源引用正常。"
    };
  }

  return {
    why: "这个文件通常会影响依赖、权限、签名或平台配置。",
    acceptableWhen: "如果本轮目标就是调整这类配置，可以接受。",
    actionIfUnexpected: "如果它不属于本轮目标，先确认是不是 AI 顺手改动，必要时拆出去或回退。",
    verification: "重新执行相关依赖安装或平台编译，并验证受影响入口。"
  };
}

function protectedPathExplanation(file) {
  return {
    why: `${file || "这个路径"} 通常属于登录、支付、订阅、扫脸或平台目录这类核心功能区域。`,
    acceptableWhen: "如果本轮目标明确要求修改这个功能，可以接受。",
    actionIfUnexpected: "如果它不属于本轮目标，先确认是否越界修改，必要时拆分提交或回退。",
    verification: "重点验证这个功能入口、主要流程和结果页是否仍然正常。"
  };
}

function temporaryCodeExplanation() {
  return {
    why: "临时代码可能让功能绕过真实校验，或者把测试行为带进正式代码。",
    acceptableWhen: "如果它只是本地临时验证，并且不会提交，可以接受。",
    actionIfUnexpected: "如果准备提交代码，先删除或改成正式实现。",
    verification: "确认没有测试数据、跳过校验、调试开关或强制解锁残留。"
  };
}

function fileGrowthExplanation() {
  return {
    why: "文件增长过多会让后续维护和 review 变难，也可能说明本轮改动范围过大。",
    acceptableWhen: "如果本轮目标就是新增完整模块，并且职责清楚，可以接受。",
    actionIfUnexpected: "如果只是小改动，先考虑拆分文件或缩小改动范围。",
    verification: "重点 review 新增代码是否只服务本轮目标。"
  };
}

function changeSizeExplanation() {
  return {
    why: "改动范围过大时，更容易混入无关修改，也更难确认每个变化都属于本轮目标。",
    acceptableWhen: "如果本轮本身就是较大的结构调整，可以接受。",
    actionIfUnexpected: "如果本轮目标很小，先拆分改动，避免一次提交包含太多事情。",
    verification: "逐项核对改动文件，确认没有顺手修改不相关模块。"
  };
}

