# cad0446 真实设备视频对比分析

English version: [cad0446-real-device-video-comparison.md](cad0446-real-device-video-comparison.md)

## 范围

本文对比基于提交 `cad0446f108e5873c13a44582709af8191474a0a` 的真实设备验证录像与原始参考视频。

输入：

- 测试录像：`测试记录/基于提交 cad0446f108e5873c13a44582709af8191474a0a的测试记录/Video_2026-06-13_161333.mp4`
- 浏览器控制台日志：`测试记录/基于提交 cad0446f108e5873c13a44582709af8191474a0a的测试记录/浏览器控制台输出日志.txt`
- 参考视频：`D:\code\AIProjects\ShowProjects\视频采集蒙版效果.mp4`

已抽取证据：

- 测试视频 1fps 连续帧：`assets/analysis/cad0446-real-device-comparison/test_1fps/test_001.jpg` 至 `test_074.jpg`
- 参考视频 4fps 连续帧：`assets/analysis/cad0446-real-device-comparison/reference_4fps/reference_001.jpg` 至 `reference_038.jpg`
- 测试视频总览：`assets/analysis/cad0446-real-device-comparison/test_contact_1fps.jpg`
- 参考视频总览：`assets/analysis/cad0446-real-device-comparison/reference_contact_4fps.jpg`
- 测试视频动态片段：
  - `assets/analysis/cad0446-real-device-comparison/test_segment_10s_22s_6fps.jpg`
  - `assets/analysis/cad0446-real-device-comparison/test_segment_24s_40s_6fps.jpg`
  - `assets/analysis/cad0446-real-device-comparison/test_segment_44s_60s_6fps.jpg`
- 参考视频高密度总览：`assets/analysis/cad0446-real-device-comparison/reference_contact_8fps.jpg`

## 控制台结论

真实设备控制台日志中已经不再出现之前的 `THREE.WebGLProgram: Shader Error`。

当前可见输出主要是：

- Microsoft Edge 内置 `LanguageDetector` 信息提示。
- MediaPipe WebGL 启动日志。
- MediaPipe 警告：`Using NORM_RECT without IMAGE_DIMENSIONS is only supported for the square ROI`。
- `Graph successfully started running.`

结论：`cad0446` 的 shader 可移植性修复已经生效。当前剩余问题不是致命 WebGL 编译失败，而是行为和架构拟真度问题。

## 视觉对比

### 参考视频行为

参考效果更像一个由手势锚定的三维模板、折叠光带或薄型多面体：

- 物体有明显透视、厚度线索、明亮边缘高光和不同面的分离感。
- 不同面可以同时显示不同视觉模板，例如蓝色技术材质、白色扑克牌材质、绿色有机材质。
- 手部移动时，形体会旋转、翻转、折叠。
- 手指和手部接触关系很重要。物体像是被手指夹住或锚定，而不是单纯漂浮在屏幕前。
- 部分帧中，物体会在宽四边形、细长条、三角棱柱感楔形、折叠三角面之间变化。

仅凭视频不能证明原实现的内部算法，但可见行为强烈指向三维手势锚定表面模型，而不是单一二维屏幕空间蒙版。

### 当前 cad0446 行为

当前测试版本已经能够渲染出效果，但它表现为二维屏幕空间光片：

- 单手模式绘制一个扁平三角形。
- 双手模式绘制一个扁平四边形。
- 所有生成顶点都位于 `z = 0`。
- 效果会采样摄像头纹理并叠加样式处理，但没有深度、面翻转、折叠表面和按面材质。
- 光片经常像叠在画面前方的半透明贴片，而不像被手持的实体模板。
- 当前效果不能复现参考视频中稳定的三维翻转和多面模板行为。

## 架构判断

当前基础方向部分正确，但不完整：

- 正确部分：
  - 浏览器 `getUserMedia`。
  - 本地 MediaPipe 手部追踪。
  - WebGL/Three.js 渲染。
  - 将实时摄像头纹理作为材质输入。
  - GitHub Pages 静态部署可行。
- 不正确或不足部分：
  - 将目标抽象为单个二维光片不足以复现参考视频。
  - 仅依据手部张开程度切换样式，不能复现多面三维模板。
  - `LightSheetGeometry` 只表示 3 或 4 个归一化屏幕顶点，无法表达折叠棱柱或折面光带。
  - 渲染器没有模型空间、面材质、深度、遮挡、手势锚定坐标框架等概念。

建议术语：后续架构应使用“手势锚定三维光片模板”或“手部锚定纹理表面模型”。`Mask` 可以保留为产品名的一部分，但不应继续作为核心技术概念。

## 左右反转问题

左右反转是一个真实的坐标空间 bug。

当前坐标流：

- `CameraStage` 在 `mirrored` 为 true 时用 CSS `scaleX(-1)` 显示镜像摄像头预览。
- MediaPipe landmark 直接传入 `deriveLightSheetGestureState`。
- 几何由未镜像的 landmark `x` 坐标生成。
- 视频 UV 采样路径才使用 `mirrored ? 1 - x : x`。

这意味着用户看到的是镜像后的摄像头画面，但叠加物几何仍跟随未镜像的追踪坐标。因此用户视觉上把手往左移动时，渲染光片可能往右移动。

必须修正：

- 定义唯一的可视 `display space`，所有可见几何都基于这个坐标空间。
- 如果预览开启镜像，应在进入手势状态和几何生成前，把 landmark `x` 转换为 `1 - x`。
- 视频采样要与可见几何分离，保证采样纹理仍匹配镜像后的预览。
- 为几何镜像和 UV 采样分别补测试，防止回归。

## 推荐下一步架构

下一步不应继续把当前扁平光片渲染器作为主线调参，而应把运行时拆成明确的坐标层和模型层：

1. `camera-space`
   - MediaPipe 原始视频坐标 landmark。
   - 未镜像的源视频纹理坐标。

2. `display-space`
   - 与用户实际看到的画面一致的镜像或未镜像坐标。
   - 所有可见物体放置都使用该空间中的手部锚点。

3. `gesture-anchor-frame`
   - 拇指/食指锚点。
   - 手部跨度、捏合距离、掌心方向和可选 landmark `z`。
   - 跨帧平滑状态。

4. `spatial-template-model`
   - 三维顶点、面、面法线、面材质 id、折叠/旋转状态。
   - 支持四边形长条、三角楔形和棱柱感折叠模板。

5. `spatial-template-renderer`
   - Three.js 透视相机或校准后的正交相机。
   - 动态 `BufferGeometry`。
   - 每个面可组合：
     - 实时视频纹理采样；
     - 模板纹理图集；
     - 边缘/高光线；
     - 透明度与色彩处理。

6. `occlusion-layer`
   - 初期可用 landmark 近似指尖遮挡。
   - 后续可扩展为手部/人体分割。

## 下一次修复的验证要求

针对立即修复的镜像问题：

- 单元测试：镜像开启时，landmark 在几何生成前将 `x` 转换为 `1 - x`。
- 单元测试：镜像开启时，视频 UV 采样仍使用正确的源视频坐标。
- 浏览器 smoke：fake camera 下切换镜像时，叠加物和显示坐标一致，且无 shader error。
- 真实设备检查：左右移动手部，确认可见效果跟随同一视觉方向移动。

针对后续三维渲染器改造：

- 实现后重新抽取参考/测试帧。
- 至少对比：
  - 单手三角/楔形状态；
  - 双手宽条状态；
  - 细长扑克牌条状态；
  - 大面积蓝色模板状态；
  - 手左右移动；
  - 手靠近/远离摄像头。
- 确认可见深度线索：
  - 面分离；
  - 边缘高光；
  - 透视旋转；
  - 不再像扁平贴片。

## 结论

你的判断基本正确。当前实现已经不是 shader 层面失败，但基础渲染概念与参考视频仍有明显偏差。项目应保留现有摄像头、追踪和 WebGL 基础，先修复镜像坐标 bug，然后用手势锚定的三维纹理模板模型替换当前扁平 `LightSheetGeometry` 渲染主线。
