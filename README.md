# zzh-mobile-ai-guard

`zzh-mobile-ai-guard` helps AI coding agents avoid unsafe changes in iOS and Flutter projects.

Install once, run `start` before AI changes code, then run `check` after. It tells you whether the change is safe to continue, what needs attention, and what to verify manually.

```bash
npm install -g zzh-mobile-ai-guard
zmg init
zmg start
zmg check
```

## Why

AI coding agents can move fast, but mobile projects have risky files and flows:

- iOS signing, permissions, Podfile, `Info.plist`, bridging headers
- Flutter `pubspec.yaml`, iOS/Android platform folders
- payment, subscription, login, FaceScan, history, result pages
- temporary mock, bypass, debug, or force-unlock code

This tool does not prove business behavior is correct. It checks whether an AI coding session changed risky areas and generates a human-readable report.

## Commands

```bash
zmg init
zmg start
zmg check
```

Advanced:

```bash
zmg status
zmg report
```

## Use with Codex CLI or other AI CLIs

There are two simple ways to use `zmg` while working with an AI coding agent.

Option 1: ask the AI agent to run it:

```text
Before changing code, run zmg start in the project root.
After changing code, run zmg check and summarize the risks and report path.
```

Option 2: run it yourself in another terminal:

```bash
cd /path/to/your/project
zmg start
# let the AI change code
zmg check
```

`zmg start` and `zmg check` are terminal commands. They are not slash commands like `/start` or `/check`.

## What it creates

```text
.zzh-mobile-ai-guard/
  rules.yml
  baselines/
  reports/
```

You can finish the first run without editing `rules.yml`.

## Example output

```text
检查完成：未发现明显风险，可以继续按正常流程验证。

改动文件：0 个
新增/删除：+0 / -0

未发现明显结构风险。
注意：这不代表业务功能已经验证通过。

完整报告：.zzh-mobile-ai-guard/reports/2026-04-29T04-51-09-253Z-check.md
```

The report always starts with a conclusion, then lists changed files, risks, manual verification items, and suggested next steps.

## License

MIT
