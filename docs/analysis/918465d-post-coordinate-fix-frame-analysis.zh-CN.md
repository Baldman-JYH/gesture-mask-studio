# 918465d 坐标修复后逐帧分析

English version: [918465d-post-coordinate-fix-frame-analysis.md](918465d-post-coordinate-fix-frame-analysis.md)

## 输入

- 测试录屏：`测试记录/基于提交 918465d6bc73a750691917c262f9b9c7c438a0df测试/屏幕录制 2026-06-14 134907.mp4`
- 参考录屏：`参考视频.mp4`
- 测试录屏元信息：1894x884，30fps，约 152.04 秒，4557 帧。
- 参考录屏元信息：1226x686，30fps，约 24.58 秒，736 帧。

## 抽帧证据

已使用 FFmpeg 抽取全部帧到：

`测试记录/基于提交 918465d6bc73a750691917c262f9b9c7c438a0df测试/ffmpeg逐帧对比_20260614_134907/`

已生成对照图：

- `sheets/test_contact_1fps.jpg`
- `sheets/test_segment_000_060_4fps.jpg`
- `sheets/test_segment_060_120_4fps.jpg`
- `sheets/test_segment_120_152_4fps.jpg`
- `sheets/test_keyframes_labeled.jpg`
- `sheets/reference_contact_1fps.jpg`
- `sheets/reference_segment_000_025_4fps.jpg`
- `sheets/reference_keyframes_labeled.jpg`

代表性关键帧：

- `keyframes/test_t0010_f00300_two_hand_long_box.jpg`
- `keyframes/test_t0046_f01380_large_closed_box.jpg`
- `keyframes/test_t0065_f01950_single_hand_residual.jpg`
- `keyframes/test_t0102_f03060_large_closed_box.jpg`
- `keyframes/test_t0124_f03720_crossed_hands_wedge.jpg`
- `keyframes/test_t0132_f03960_orphan_triangle.jpg`
- `keyframes/ref_t0001_f00030_long_multi_material_bar.jpg`
- `keyframes/ref_t0007_f00210_triangle_fold_front.jpg`
- `keyframes/ref_t0010_f00300_thin_edge_collapse.jpg`
- `keyframes/ref_t0013_f00390_large_triangle_template.jpg`

## 发现

之前的左右、上下坐标空间错误没有复现。在稳定双手帧里，空间体已经明显跟随可见手部区域，和上一版相比偏移问题已经大幅改善。当前剩余可见差异不再主要是“源视频坐标”和“显示坐标”映射错误。

当前实现与参考视频仍有四类关键差异：

1. **退化单手几何仍会被渲染。** `test_t0065_f01950_single_hand_residual.jpg` 和 `test_t0132_f03960_orphan_triangle.jpg` 的状态栏显示 `1 hand`，但单手 `A-B-C-D-E-A` 面会塌缩成细长片或孤立三角。这里应隐藏无效结果，或者折叠成贴近手部的稳定薄面。
2. **双手几何体已闭合，但还不像参考模板。** 当前 mesh 已包含用户要求的指尖拓扑和端面，但视觉上经常是厚盒子或胶囊体，不是参考视频中的折叠模板面。
3. **深度仍过度依赖 MediaPipe landmark `z`。** 手交叉或斜向姿态下会出现过厚透视或楔形。参考视频更像使用了受控的模板深度模型，而不是直接把原始 `z` 当作几何深度。
4. **面材质仍不够分明。** renderer 已有不同材质槽，但画面仍主要由相近的实时视频 tint 主导。参考视频有更强的分面身份：白色边框、蓝白纹理面、绿色采样面和清晰折线边。

## 与参考视频对比

参考视频更准确的描述是“手部驱动的折叠空间模板”，不是平面蒙版。它具备这些行为：

- 长条、三角、薄边状态都稳定；
- 折叠边界持续清晰；
- 每个主要面有不同材质表现；
- 单手或局部遮挡时会稳定收缩，不会留下远离手部的孤立三角；
- 部分面采样实时画面，部分面是设计好的模板材质。

当前项目架构仍然可行。MediaPipe Hands 加 Three.js 可以实现目标效果。下一步应修正几何有效性/状态模型和 renderer 材质系统，不需要整体推翻技术选型。

## 建议下一步

1. 增加渲染前拓扑有效性判断：
   - 单手闭环最小面积；
   - 闭环长宽比限制；
   - 指尖展开阈值；
   - 重复手或过期手抑制；
   - hysteresis，使无效帧渐隐，而不是直接出现孤立三角。
2. 用派生模板深度替代原始 landmark `z`：
   - 从双手间距和局部指尖闭环方向估计折叠方向；
   - 限制深度范围；
   - 对深度进行帧间平滑；
   - 即使某个条带退化，也保持拓扑闭合。
3. 升级材质渲染：
   - 增加显式线框/边缘几何，形成参考视频中的白色边界；
   - 为 `AB/BC/CD/DE/EA`、端面、背面、边缘分配稳定材质 id；
   - 支持每个面的非视频模板纹理；
   - 保留选定面采样实时视频。
4. 实现前先补充无效单手闭环和双手深度限制测试。

## 验证状态

本轮只修改文档，没有修改业务代码。
