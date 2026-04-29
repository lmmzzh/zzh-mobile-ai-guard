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

AI 改移动端项目时，最容易出问题的通常不是“代码写不出来”，而是：

- 改动范围超过本轮目标
- 顺手动了支付、订阅、登录、扫脸等核心功能流程
- 修改了 `Podfile`、`Info.plist`、`pubspec.yaml` 等高风险文件
- 留下测试数据、跳过校验、调试开关、强制解锁这类临时代码
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

## 示例输出

```text
检查完成：未发现明显风险，可以继续按正常流程验证。

改动文件：0 个
新增/删除：+0 / -0

未发现明显结构风险。
注意：这不代表业务功能已经验证通过。

完整报告：.zzh-mobile-ai-guard/reports/2026-04-29T04-51-09-253Z-check.md
```

报告会先给结论，再列出改动范围、风险项、建议人工验证项和下一步建议。

## License

MIT
