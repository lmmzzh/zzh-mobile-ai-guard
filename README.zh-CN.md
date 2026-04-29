# zzh-mobile-ai-guard

`zzh-mobile-ai-guard` 是一个面向 iOS / Flutter 项目的 AI 改代码守卫工具。

先安装一次，再用短命令接入。AI 改代码前运行 `start`，改完后运行 `check`。它会直接告诉你这轮改动能不能继续、哪里有风险、需要人工验证什么。

```bash
npm install -g zzh-mobile-ai-guard
zmg init
zmg start
zmg check
```

## 它解决什么问题

AI 改移动端项目时，真正危险的不是“代码写不出来”，而是：

- 改动范围超过本轮目标
- 顺手动了支付、订阅、登录、扫脸等主链路
- 修改了 `Podfile`、`Info.plist`、`pubspec.yaml` 等高风险文件
- 留下 mock、bypass、debug、force unlock 这类临时代码
- 改完以后没有清楚的人工验证建议

这个工具不替代编译、测试和真机验证。它只帮你检查 AI 这轮实际改动有没有明显风险。

## 常用命令

```bash
zmg init
zmg start
zmg check
```

高级命令：

```bash
zmg status
zmg report
```

## 接入后会生成什么

```text
.zzh-mobile-ai-guard/
  rules.yml
  baselines/
  reports/
```

第一次使用不需要先改 `rules.yml`。

## License

MIT
