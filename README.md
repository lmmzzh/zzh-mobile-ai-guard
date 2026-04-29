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

## What it creates

```text
.zzh-mobile-ai-guard/
  rules.yml
  baselines/
  reports/
```

You can finish the first run without editing `rules.yml`.

## License

MIT
