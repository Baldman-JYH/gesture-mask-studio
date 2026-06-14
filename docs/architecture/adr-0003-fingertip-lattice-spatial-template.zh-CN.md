# ADR-0003：指尖拓扑网格空间模板

English version: [adr-0003-fingertip-lattice-spatial-template.md](adr-0003-fingertip-lattice-spatial-template.md)

## 状态

已接受为下一阶段架构方向。

本 ADR 在主实时效果上取代 ADR-0002 的固定锚点模板方向。ADR-0002 仍保留为历史背景，以及 fallback/debug 渲染路径参考。

## 背景

对提交 `6f5dc25a3c5721988c33cebf78adabef4abdd326` 的逐帧分析显示，当前部署的空间模板效果仍然与 `参考视频.mp4` 有明显差距。

证据：

- [6f5dc25 指尖拓扑网格模型分析](../analysis/6f5dc25-fingertip-lattice-model.zh-CN.md)
- 抽帧证据位于 `测试记录/基于提交 6f5dc25a3c5721988c33cebf78adabef4abdd326测试/ffmpeg逐帧对比_20260614/`

当前实现把每只手压缩为一个锚点，再基于这些锚点生成固定 mesh。该模型无法表达参考视频中的目标行为：参考对象看起来由多个指尖位置共同控制，并且随着手势变化改变可见拓扑。

## 决策

使用指尖拓扑网格作为主要空间模板模型。

模型使用每只手五个语义指尖点：

- 拇指：`A`
- 食指：`B`
- 中指：`C`
- 无名指：`D`
- 小指：`E`

模型同时使用手腕和掌部 landmarks 作为稳定辅助点，用于手部方向、掌面法线、置信度和时间平滑。

当两只手有效时，拓扑从以下结构开始：

- 同名指尖之间的 5 条横向连线；
- 左右手各自沿手指顺序形成的 2 条侧边连线；
- 相邻手指之间的 5 个经过校验的条带面，包括闭合 `EA` 条带；
- 左右手各自由 `A-B-C-D-E-A` 闭环形成的端面；
- 生成厚度、背面、侧面、边缘材质组和 material id。

当一只手有效时，拓扑从以下结构开始：

- 5 条边界边：`AB`、`BC`、`CD`、`DE` 和 `EA`；
- 一个由 `A-B-C-D-E-A` 闭环形成的 cap/front 面；
- 生成厚度、背面和边缘材质组；
- 不创建虚拟第二只手。

渲染层消费三角化后的面，而不是任意原始多边形。每个生成面在进入 renderer 前，必须通过最小面积、winding 和退化检查。

## 模块边界

新增/调整边界：

```text
features/hand-topology/
  extractHandTopologyFrame
  normalizeHandedness
  derivePalmStabilizers

features/fingertip-lattice/
  buildFingertipRails
  buildValidatedStrips
  triangulateLatticeFaces
  addTemplateThickness
  assignLatticeMaterials

features/spatial-template-model/
  buildSpatialTemplateMeshFromLattice
  fallbackAnchorTemplate

features/spatial-template-renderer/
  renderTriangleMeshByMaterialGroup
```

现有摄像头、MediaPipe 加载、display-space 坐标归一化、video UV 映射和 GitHub Pages 部署仍然有效。

## 影响

正面影响：

- 主领域模型与参考效果更一致。
- 后续模板样式变更可以通过拓扑规则和材质规则扩展，而不是重写摄像头或追踪栈。
- 面级 material 分配更稳定且可扩展。
- 退化手势可以显式处理，而不是生成偶然几何体。
- 单手和双手行为统一在同一套点-线-面-体模型下。

代价：

- 需要更多几何测试。
- model 层在交给 renderer 前必须做更严格校验。
- 单手行为必须是闭合手部轮廓面，而不是虚拟双手条带。

## 验证要求

实现被接受前必须满足：

- 单元测试覆盖指尖提取、左右手/镜像归一化、连线构建、面校验、三角化、厚度、材质分配、重复手过滤和 fallback 行为。
- 测试必须断言 `EA` 闭合和手部端面。
- `npm test` 和 `npm run build` 通过。
- 中英文文档配对检查通过。
- 在真实设备录制验证视频，并用 FFmpeg 拼图与 `参考视频.mp4` 对比。
- 验证报告必须明确说明渲染对象是否仍然是固定模板，还是已经跟随指尖拓扑变化。
