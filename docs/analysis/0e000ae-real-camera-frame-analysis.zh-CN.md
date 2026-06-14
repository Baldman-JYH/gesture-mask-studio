# 0e000ae 真实摄像头逐帧分析

English version: [0e000ae-real-camera-frame-analysis.md](0e000ae-real-camera-frame-analysis.md)

## 输入

- 测试录屏：`测试记录/基于提交 0e000ae09ef1de7178c53d78f01fc6446125129c 测试/屏幕录制 2026-06-14 163150.mp4`
- 参考录屏：`参考视频.mp4`
- 测试录屏元信息：3808x1954，30fps，约 116.33 秒，3487 帧。
- 参考录屏元信息：1226x686，30fps，约 24.58 秒，736 帧。

## 抽帧证据

已使用 FFmpeg 抽取全部帧到：

`测试记录/基于提交 0e000ae09ef1de7178c53d78f01fc6446125129c 测试/ffmpeg逐帧对比_20260614_163150/`

已生成对照图：

- `sheets/test_contact_1fps.jpg`
- `sheets/test_segment_000_040_4fps.jpg`
- `sheets/test_segment_040_080_4fps.jpg`
- `sheets/test_segment_080_117_4fps.jpg`
- `sheets/test_keyframes_labeled.jpg`
- `sheets/reference_contact_1fps.jpg`
- `sheets/reference_segment_000_025_4fps.jpg`
- `sheets/reference_keyframes_labeled.jpg`

代表性关键帧：

- `keyframes/test_t0015_f00450_first_large_offset_box.jpg`
- `keyframes/test_t0024_f00720_right_side_long_tube.jpg`
- `keyframes/test_t0034_f01020_vertical_twisted_body.jpg`
- `keyframes/test_t0048_f01440_low_long_tube.jpg`
- `keyframes/test_t0057_f01710_hourglass_twist.jpg`
- `keyframes/test_t0067_f02010_open_box_near_hands.jpg`
- `keyframes/test_t0085_f02550_long_box_with_offset.jpg`
- `keyframes/test_t0095_f02850_small_residual_triangle.jpg`
- `keyframes/test_t0105_f03150_large_panel_reentry.jpg`

## 0e000ae 带来的改善

上一轮 `918465d` 分析中发现的 raw depth 爆炸已经减轻。当前 mesh 不再明显把 MediaPipe landmark `z` 的极端值直接当作渲染深度。

单手残留也有所减少。上一版大量远离手部的单手细片不再是主要失败模式。

## 仍存在的问题

当前效果仍未足够接近参考视频。

1. **双手几何体经常扭成管状、竖直厚板或沙漏体。** 典型帧包括 `test_t0024_f00720_right_side_long_tube.jpg`、`test_t0034_f01020_vertical_twisted_body.jpg` 和 `test_t0057_f01710_hourglass_twist.jpg`。
2. **渲染体没有稳定依附在可见指尖控制点上。** 多个帧中几何体会从画面右侧或手部下方伸出，而不是被两手指尖稳定夹住。
3. **仍有小型单手残留三角。** `test_t0095_f02850_small_residual_triangle.jpg` 表明 0e000ae 的门控有效，但对局部/低质量手部检测还不够完整。
4. **模板状态仍过于“字面化”。** 当前模型过于频繁地尝试显示完整 `A/B/C/D/E` 闭合体。参考视频会在长条、薄边、三角、大折面之间有控制地切换。
5. **面材质仍不够成熟。** 参考视频有强分面身份和白色边缘。当前效果仍主要像实时视频 tint 后的半透明面。

## 根因假设

当前技术栈仍然适合目标效果：MediaPipe Hands 加 Three.js 可以实现参考视频。问题现在位于数学模型层，而不是部署或浏览器渲染层。

当前代码路径暴露出三个模型层缺口：

- `extractHandTopologyFrame` 只按 display-space `palmCenter.x` 对可用手排序，并取最左/最右两只手，没有跨帧维护稳定的物理手身份。
- `buildTwoHandClosedBody` 假设两只手都可以直接使用同一套 `A/B/C/D/E` 顺序建体，没有做 loop winding 归一化，也没有拒绝不可能的交叉 rail 布局。
- renderer 会直接渲染当前帧生成的 lattice。当前没有时间状态机来平滑手身份、稳定模板状态或让无效几何渐隐。

这解释了为什么 `0e000ae` 能降低深度爆炸，但仍会出现扭转长管：深度被限制了，但成对指尖闭环在部分帧中仍不一致。

## 建议下一步

下一步应优先修拓扑身份和 lattice 有效性，再做视觉材质优化。

1. 增加双手 winding 和 rail 交叉测试：
   - 镜像左右手 loop 可见 winding 相反时，不能生成扭转长管；
   - 交叉或不可信的 `A-A/B-B/...` rail 应隐藏或回退到更简单的稳定模板；
   - 相邻帧手顺序变化时，不应让几何体翻转。
2. 增加手对稳定层：
   - 结合上一帧 palm 位置、handedness 和距离维护稳定物理手身份；
   - hand role 切换前增加 hysteresis；
   - pair quality score 低于阈值时拒绝双手模式。
3. 归一化 mesh loop winding：
   - 保留语义指尖 id 供诊断；
   - 建面时使用 winding-normalized loop order，避免条带自交。
4. 增加 lattice 质量门控：
   - rail 交叉数量；
   - strip 长宽比；
   - body centroid 是否位于合理的双手控制区域内；
   - 端面面积和朝向一致性。
5. 几何稳定后再升级材质渲染：
   - 显式白色边缘几何；
   - 逐面模板纹理；
   - 只让选定面采样实时视频。

## 验证状态

本轮只修改文档，没有修改业务代码。
