# 本地接入说明

这份文档说明如何在本地开发流程里使用 `zzh-mobile-ai-guard`。

当前版本暂时不做 CI。重点先放在本地 AI 改代码流程和本地提交前检查。

## 本地 Git Hook

`zmg check --strict` 在发现中高风险时会返回失败状态，所以可以放进本地 Git Hook。

pre-commit 示例：

```bash
#!/usr/bin/env bash
set -e

if ! command -v zmg >/dev/null 2>&1; then
  echo "zmg is not installed. Run: npm install -g zzh-mobile-ai-guard"
  exit 1
fi

zmg check --strict
```

手动安装：

```bash
mkdir -p .git/hooks
cp examples/git-hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

每轮让 AI 改代码前，仍然需要先运行：

```bash
zmg start
```

这个 Hook 只做提交前风险检查，不替代编译、测试和真机验证。

