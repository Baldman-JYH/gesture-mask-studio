# 架构质量准入门槛

本文定义开发前必须满足的“零已知架构债务”门槛。这里的“零技术债务”指：进入开发前没有已知、未归属、未记录的架构债务；并不承诺未来永远不会出现新债务。

## 1. 开发前准入

开始实现前必须全部满足：

- 核心术语统一：实现层使用 `LightSheet`、`SceneSampling`、`GestureEngine`。
- 运行时路线固定：实时摄像头 + 手部追踪 + WebGL 场景采样光片。
- 已拒绝路线明确：AI 图片生成运行时、静态贴图覆盖、只做人脸覆盖。
- 模块依赖方向明确，且没有循环依赖设计。
- 样式扩展通过 `LightSheetStylePreset`，不是改 renderer 主流程。
- 新增模型、录制、上传、后端服务必须先写 ADR。
- 每个核心模块都有测试责任。

## 2. Pull Request 准入

后续每个实现 PR 必须满足：

- 没有跨模块反向依赖。
- 新功能只触碰它应该触碰的模块。
- 新样式不修改 camera、hand-tracking、gesture-engine。
- 新手势不修改 camera、scene-sampling、style presets。
- renderer 每帧更新不创建长期对象。
- camera frame 不上传服务器，除非有新的隐私/部署 ADR。
- 关键路径有测试或明确的手工验证记录。

## 3. 禁止事项

- 禁止在 `App.tsx` 中堆叠摄像头、追踪、手势、渲染全部逻辑。
- 禁止 renderer 直接调用 MediaPipe。
- 禁止 hand-tracking 直接创建 Three.js 对象。
- 禁止 style preset 读取 DOM 或摄像头对象。
- 禁止把截图、录制、分享逻辑写进核心 renderer。
- 禁止用字符串散落判断样式行为；样式能力必须从 preset/schema 派生。
- 禁止把性能降级逻辑散落在多个模块。

## 4. Brooks-Debt 复核规则

以下场景必须先运行架构/债务复核，再开发或合并：

- 新增一个核心模块。
- 新增一个视觉模型或大依赖。
- 新增第三种以上手势模式。
- 新增录制、上传、分享、后端部署。
- 发现某个需求要同时修改 4 个以上无关模块。

复核目标：

- `Critical` findings: 0。
- `Warning` findings: 0，除非有 ADR 记录并设定偿还计划。
- `Suggestion` findings: 可存在，但必须有 owner 或明确接受原因。

## 5. 技术债处理策略

如果发现债务：

1. 先记录 Symptom / Source / Consequence / Remedy。
2. 判断是 intentional 还是 accidental。
3. 没有偿还计划的 intentional debt 按 accidental debt 处理。
4. Critical debt 必须先修再继续开发。
5. Warning debt 必须在同一阶段解决或写入 ADR。
6. Suggestion debt 可以进入观察清单，但不得影响核心边界。
