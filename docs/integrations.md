# Local integrations

This page shows how to use `zzh-mobile-ai-guard` in local development.

CI is intentionally not covered in this version. The current focus is local AI coding sessions and local commit-time checks.

## Local Git Hook

`zmg check --strict` exits with a non-zero status when medium or high risk is found. That makes it suitable for a local Git Hook.

Example pre-commit hook:

```bash
#!/usr/bin/env bash
set -e

if ! command -v zmg >/dev/null 2>&1; then
  echo "zmg is not installed. Run: npm install -g zzh-mobile-ai-guard"
  exit 1
fi

zmg check --strict
```

Install it manually:

```bash
mkdir -p .git/hooks
cp examples/git-hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Before each AI coding session, still run:

```bash
zmg start
```

The hook only checks before commit. It does not replace builds, tests, or real-device verification.

