# AI usage prompts

Use this page when you want Codex, Claude Code, Cursor, or another AI coding tool to run `zmg` as part of its normal code-change workflow.

## Copy this prompt

```text
Before changing code, run zmg start in the project root.

After changing code, run zmg check.

If zmg check reports risks, explain:
1. Which risks belong to the current task.
2. Which risks may be accidental changes.
3. Which files need manual verification.
4. Where the full report is located.

Do not treat a passing zmg check as proof that the project builds or the business behavior is correct.
After zmg check, still explain what should be compiled, tested, or manually verified.
```

## Recommended local flow

```bash
zmg start
# let the AI change code
zmg check
```

Use strict mode only when you want the command to fail on medium or high risk:

```bash
zmg check --strict
```

`zmg` checks change risk. It does not replace builds, tests, or real-device verification.

