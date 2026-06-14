# fbe333e Loading 与闪烁逐帧分析

English version: [fbe333e-loading-and-flicker-frame-analysis.md](fbe333e-loading-and-flicker-frame-analysis.md)

## 输入

- 测试录屏：`测试记录/基于提交 fbe333e625203f4d610b9a1ce5a0be80651181cc 测试/屏幕录制 2026-06-14 184255.mp4`
- 参考录屏：`参考视频.mp4`
- 测试录屏元信息：3830x2068，30fps，约 99.90 秒，2994 帧。
- 参考录屏元信息：1226x686，30fps，约 24.58 秒，736 帧。

## 抽帧证据

已用 FFmpeg 抽取全部帧到：

`测试记录/基于提交 fbe333e625203f4d610b9a1ce5a0be80651181cc 测试/ffmpeg逐帧对比_20260614_184255/`

已生成对照图：

- `sheets/test_contact_1fps.jpg`
- `sheets/test_segment_000_025_4fps.jpg`
- `sheets/test_segment_025_050_4fps.jpg`
- `sheets/test_segment_050_075_4fps.jpg`
- `sheets/test_segment_075_100_4fps.jpg`
- `sheets/test_keyframes_labeled.jpg`
- `sheets/reference_contact_1fps.jpg`
- `sheets/reference_segment_000_025_4fps.jpg`
- `sheets/reference_keyframes_labeled.jpg`

代表性关键帧：

- 测试视频：`test_t004.jpg`、`test_t008.jpg`、`test_t012.jpg`、`test_t018.jpg`、`test_t024.jpg`、`test_t030.jpg`、`test_t036.jpg`、`test_t042.jpg`、`test_t048.jpg`、`test_t056.jpg`、`test_t064.jpg`、`test_t072.jpg`、`test_t080.jpg`、`test_t088.jpg`、`test_t096.jpg`
- 参考视频：`reference_t000.jpg`、`reference_t004.jpg`、`reference_t006.jpg`、`reference_t008.jpg`、`reference_t010.jpg`、`reference_t012.jpg`、`reference_t016.jpg`、`reference_t020.jpg`、`reference_t024.jpg`

## 发现

1. **启动流程缺少明确的模型加载状态。** 用户点击 `Start camera` 后，摄像头流 ready 时现有 overlay 会消失，但此时手部追踪模型可能仍在加载。UI 应该持续显示 loading 提示，直到追踪器 ready 或 unavailable。
2. **最新构建在双手运动时仍会闪烁。** 4fps 分段图中能看到双手仍处于相近控制姿态时，几何体整块出现/消失。这个症状是状态层级的 blink，不只是 shader 或材质问题。
3. **当前稳定器只短暂保留 `hidden` gap。** 它没有保护最近的双手 lattice 免受短暂一手降级影响。真实运行时，一手降级会直接替换最近的双手几何体，并重置后续 hold 目标。
4. **颜色区分已有改善。** 最新录屏里各面颜色已经能明显区分，所以本轮首要问题是稳定性，而不是面颜色身份。
5. **和参考视频的架构差距仍存在。** 参考视频更像一个受控 3D 模板状态机，具有稳定白边、状态迟滞和手部/深度层级。当前实现仍是直接 fingertip lattice renderer，后续应引入 `TemplateState` 层，而不是只调单个面。

## 实现方向

本轮应做两个聚焦修复：

- 新增摄像头/追踪器 loading overlay：摄像头权限通过后仍保持可见，直到追踪器 ready 或 unavailable 后消失。
- 增强 spatial-template 稳定器：让最近的双手 lattice 在短暂 hidden 或一手降级 gap 中继续保留并淡出；如果追踪长时间无效，再真正清空。

更大的 `TemplateState` 模型仍作为本轮稳定性修复后的下一阶段架构目标。

## 验证方案

1. 在有摄像头设备上打开部署版本并点击 `Start camera`。预期：点击后立即看到 loading 提示。
2. 等待 MediaPipe 加载完成。预期：追踪 ready 后 loading 提示消失；如果追踪初始化失败，界面不应永远卡在 loading。
3. 双手一起运动至少 20 秒。预期：短暂检测 gap 应保持/淡出上一帧双手体，而不是整块几何体瞬间闪没。
4. 只展示单手超过 1 秒。预期：上一帧双手几何体不会永久残留；宽限期后应切换为有效单手面或 hidden。
5. 重新录屏，并继续用 FFmpeg 全量抽帧，与同一参考视频对照图复核。
