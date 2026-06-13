# ADR-0002：转向手势锚定三维模板模型

English version: [adr-0002-hand-anchored-3d-template-model.md](adr-0002-hand-anchored-3d-template-model.md)

## 状态

已接受为下一阶段渲染架构方向。

## 背景

基于提交 `cad0446f108e5873c13a44582709af8191474a0a` 的真实设备验证证明 shader 已经可以渲染，但可见行为与参考视频仍有明显差距。

证据记录在：

- [cad0446 真实设备视频对比分析](../analysis/cad0446-real-device-video-comparison.zh-CN.md)
- [原始参考视频分析](../analysis/video-effect-analysis.zh-CN.md)

参考效果更像手势锚定的三维模板、折叠光带或薄型多面体：

- 有明显的面分离；
- 有透视和厚度线索；
- 有明亮边缘高光；
- 不同面可以切换不同纹理/材质；
- 手移动时会翻转和折叠；
- 手指接触关系像空间锚定，而不是屏幕贴片。

当前实现是扁平屏幕空间三角形或四边形。它能采样实时摄像头纹理，这一点仍然是有效基础，但无法表达多面、折叠状态、深度或按面模板材质。

## 决策

保留现有浏览器本地基础：

- `getUserMedia` 摄像头输入；
- MediaPipe 手部关键点；
- WebGL/Three.js 渲染；
- 实时视频纹理采样；
- GitHub Pages 静态部署。

将后续渲染目标从扁平 `LightSheetGeometry` 表面改为手势锚定的三维纹理模板模型。

这要求明确坐标边界：

- `camera-space`：MediaPipe/视频原始坐标；
- `display-space`：与用户看到的镜像或非镜像预览一致的坐标；
- `model-space`：三维模板、光带或棱柱的本地坐标；
- `video-uv-space`：源视频采样坐标。

当前扁平渲染器仍可用于立即修复问题，但所有新增渲染工作都应对齐三维模型方向。

## 运行时形态

推荐的未来模块边界：

```text
features/coordinate-space/
  cameraSpaceToDisplaySpace
  displaySpaceToVideoUv

features/gesture-anchor-frame/
  deriveAnchorFrame
  smoothAnchorFrame

features/spatial-template-model/
  buildTemplateMesh
  assignTemplateFaces
  deriveFoldState

features/spatial-template-renderer/
  renderTemplateMesh
  templateMaterials
  edgeHighlights

features/occlusion-layer/
  fingertipOcclusion
  optionalSegmentationOcclusion
```

现有 `features/light-sheet-renderer` 可以作为过渡渲染器保留，直到空间模板渲染器替换它。

## 影响

正面影响：

- 渲染器可以复现折叠、翻转、多面的参考状态。
- 新增样式可以变成按面材质/模板变化，而不是只堆平面 shader 分支。
- 镜像坐标变成显式且可测试的边界。
- 后续可以加入遮挡层，而不需要重写摄像头或手部追踪。

代价：

- 需要更多几何和渲染器测试。
- 渲染输入契约需要新增 mesh/template model。
- 第一版三维实现必须分阶段完成，避免同时替换追踪、采样和 UI。

## 分阶段实施

1. 修复当前管线中的显示坐标镜像问题。
2. 增加有测试覆盖的空间模板模型类型：顶点、面、面材质 id、折叠状态、锚定框架。
3. 构建最小三维光带/棱柱渲染器，支持按面材质。
4. 复现参考状态：
   - 单手三角楔形；
   - 双手宽条；
   - 细长扑克牌条；
   - 大面积蓝色技术模板；
   - 手左右移动；
   - 手靠近/远离摄像头。
5. 增加指尖遮挡，再按需要评估完整手部/人体分割。

## 非目标

- 不新增服务端渲染。
- MVP 路径不引入 NVIDIA 或云端推理。
- 不试图仅凭视频证明原始算法内部实现。
- 不为了新渲染器而重写摄像头权限、MediaPipe 加载或部署流程。

## 验证要求

每一步实现都必须包含：

- 坐标空间转换单元测试；
- mesh/fold 构建单元测试；
- 面顺序、UV 和材质分配的渲染器测试；
- 无 shader error 的 WebGL canvas 浏览器 smoke；
- 与参考拼图对比的真实设备视频验证。
