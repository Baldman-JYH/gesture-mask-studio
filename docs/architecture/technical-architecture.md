# Gesture Mask Studio 技术架构方案

## 1. 总体结论

推荐使用纯前端静态应用实现：

- 前端框架：React + Vite + TypeScript。
- 摄像头：浏览器 `navigator.mediaDevices.getUserMedia`。
- 手部识别：MediaPipe Tasks Vision `HandLandmarker`。
- 场景采样：将实时摄像头帧作为 WebGL video texture，在光片内部重新渲染被覆盖区域的实时画面。
- 渲染：Three.js 或自定义 WebGL；首选 Three.js，降低开发复杂度。
- 状态管理：React state + 小型 reducer；首版不引入大型状态库。
- 部署：GitHub Pages，可行。

这个方案不需要后端 GPU，也不需要 NVIDIA 推理服务。NVIDIA 相关能力可在后续做本地/云端高级视觉模型时再评估；当前目标用 MediaPipe WASM 和 WebGL 视频采样更轻、更适合个人开发者部署。

说明：`mask` 是项目名中的通俗叫法。更准确的技术对象是“手势驱动实时采样光片”，不是简单遮挡层。

## 2. 一页式应用结构

```text
gesture-mask-studio/
  CODEX_DOC/
    progress.md
  docs/
    analysis/
      video-effect-analysis.md
    product/
      requirements-and-business-logic.md
    architecture/
      technical-architecture.md
    deployment/
      github-pages-evaluation.md
  assets/
    video-frames/
    design/
  app/                         # 后续实现阶段创建
    package.json
    index.html
    src/
      main.tsx
      App.tsx
      features/camera/
      features/hand-tracking/
      features/scene-sampling/
      features/light-sheet-renderer/
      features/gesture-engine/
      features/light-sheet-styles/
      components/
      styles/
      assets/textures/
```

本阶段只规划，不创建 `app/` 代码目录。待原型图方向确认后再进入实现。

## 3. 运行时数据流

```mermaid
flowchart LR
  A[Camera Stream] --> B[Video Element]
  B --> C[Frame Scheduler]
  C --> D[MediaPipe HandLandmarker]
  C --> I[WebGL Video Texture Sampler]
  D --> E[Gesture State Reducer]
  E --> F[Light Sheet Geometry Builder]
  I --> J[Style Shader Material]
  F --> G[Three.js/WebGL Renderer]
  J --> G
  B --> G
  E --> K[Active Style Preset]
  K --> J
  H[UI Controls] --> G
```

### 关键原则

- 摄像头画面和手势识别都在本地浏览器执行。
- 每一帧先更新视频，再按设定频率运行手部识别。
- 手部关键点经过平滑滤波后再生成光片几何。
- WebGL 负责把实时摄像头采样、样式纹理、边缘线和高光映射到动态三角形/四边形。
- 光片不是简单遮挡层；它覆盖到哪里，就应在内部实时重新渲染那一块后方摄像头画面。
- 样式默认由手势引擎根据手部开合状态自动选择。
- UI 控制只负责摄像头、镜像和状态展示，不要求用户手动切换样式。

## 4. 核心模块设计

### `features/camera`

职责：

- 请求摄像头权限。
- 管理视频流生命周期。
- 提供摄像头可用、加载、拒绝、停止等状态。
- 支持镜像显示。

主要接口：

```ts
type CameraState = 'idle' | 'requesting' | 'ready' | 'denied' | 'unavailable' | 'error';

interface CameraController {
  start(): Promise<void>;
  stop(): void;
  videoElement: HTMLVideoElement | null;
  state: CameraState;
}
```

### `features/hand-tracking`

职责：

- 加载 MediaPipe `HandLandmarker`。
- 以可配置频率识别视频帧。
- 输出最多两只手的标准化关键点。
- 处理模型加载失败和低性能降级。

主要输出：

```ts
interface TrackedHand {
  id: string;
  handedness: 'Left' | 'Right' | 'Unknown';
  confidence: number;
  landmarks: Array<{ x: number; y: number; z: number }>;
}
```

### `features/gesture-engine`

职责：

- 将手部关键点转换为业务手势状态。
- 判断一只手预览、双手面片、丢失淡出、自动切换纹理等状态。
- 在未提供调试/手动覆盖时，根据手势开合度输出当前 `stylePresetId`。
- 对关键点做平滑处理。

核心输出：

```ts
interface LightSheetGestureState {
  mode: 'hidden' | 'one-hand-preview' | 'two-hand-sheet' | 'fade-out';
  confidence: number;
  stylePresetId: 'blueprint' | 'cards' | 'organic';
  anchors: {
    left: { x: number; y: number };
    right?: { x: number; y: number };
  };
  openness: number;
  rotation: number;
}
```

### `features/scene-sampling`

职责：

- 将实时摄像头帧作为 WebGL video texture 输入。
- 在光片 shader 中按屏幕坐标采样后方视频画面。
- 让光片覆盖到脸、手、衣服、窗帘、植物等区域时，这些内容都能在光片内部被重新渲染。
- 提供不同采样模式：原始采样、亮度映射、边缘线稿、色彩分级。

首版策略：

- 不先引入重型分割模型。
- 使用屏幕空间视频采样，让光片区域天然显示后方实时画面。
- 在 shader 中叠加边缘检测、色彩映射、图案纹理和高光。

### `features/light-sheet-renderer`

职责：

- 初始化 Three.js renderer、scene、orthographic camera。
- 生成动态 BufferGeometry。
- 加载样式纹理和实时视频纹理。
- 绘制半透明实时采样光片、边缘高光、扫描光或反光线。
- 可选绘制调试关键点。

渲染策略：

- 背景层：实时视频。
- 效果层：WebGL canvas 透明叠加；光片 shader 同时采样实时视频和样式纹理。
- UI 层：React DOM 控制条，展示当前自动样式状态并提供摄像头/镜像控制。

## 5. 几何和视觉实现

### 面片顶点

双手状态下使用四边形：

```text
topLeft ---- topRight
  |            |
bottomLeft - bottomRight
```

当手势让一侧厚度接近 0 时，退化为三角形或窄梯形，以模拟参考视频中的尖角效果。

### 视觉材质

- `opacity`: 0.72-0.9，按纹理不同调整。
- `edge`: 白色外边线，1-3px 等效宽度。
- `highlight`: 沿长轴或对角线移动的半透明白色光带。
- `sceneSample`: 在光片内部采样实时摄像头画面，使被覆盖区域的后方内容被重新渲染出来。
- `styleFilter`: 对采样画面做蓝图线稿、卡牌纸面或绿色有机纹理混合。
- `blend`: 默认 `normal` 或轻微 `screen` 风格；WebGL 中通过 shader 控制。

### 样式扩展契约

光片样式应作为 preset 扩展，而不是写死在渲染逻辑里。规范接口以 [运行时架构契约](runtime-contracts.md) 中的 `LightSheetStylePreset` 为唯一来源。

后期新增光片样式时，优先只新增纹理、缩略图和 preset 配置；只有样式确实需要特殊合成时才新增 shader variant。

## 6. 架构护栏

实现阶段必须遵守：

- [运行时架构契约](runtime-contracts.md)
- [架构质量准入门槛](architecture-quality-gate.md)
- [ADR-0001: 实时场景采样光片运行时](adr-0001-realtime-scene-sampling-light-sheet.md)

任何新增运行时大依赖、跨模块依赖方向变化、后端能力、录制/上传能力，都必须先新增 ADR。

## 7. 性能策略

- 摄像头输入建议 640x480 起步。
- 手部识别建议 20-30fps，低性能下降到 12-15fps。
- 渲染保持 `requestAnimationFrame`。
- 使用上一帧识别结果插值，避免识别帧率下降时画面卡顿。
- 模型和纹理延迟加载；首屏先显示启动状态。

## 8. 测试策略

### 单元测试

- 手势状态机。
- 顶点几何计算。
- 手势驱动样式选择规则。
- 光片材质是否启用实时场景采样。
- 样式 preset 解析和默认值。
- 摄像头错误状态映射。

工具：Vitest。

### 浏览器验证

- Chrome/Edge 桌面摄像头授权流程。
- 摄像头拒绝流程。
- 两只手识别后面片出现。
- 光片经过人物和背景区域时，内部能显示被风格化处理的实时摄像头内容。
- 镜像开关。
- 自动样式状态展示。
- 镜像切换。
- 移动端布局。

工具：手工测试 + Playwright 截图检查。真实摄像头交互需要人工验证或 mock video stream。

## 9. 技术风险

- GitHub Pages 是静态托管，不能处理服务端模型推理；本方案不依赖后端，因此可行。
- GitHub Pages 的 HTTPS 支持满足摄像头权限要求。
- MediaPipe 模型文件需要正确配置静态路径或 CDN 路径。
- iOS Safari 对摄像头、WebGL、WASM 性能更敏感，首版优先保证桌面 Chrome/Edge。
- 精确前后遮挡需要额外分割模型，会增加性能成本。首版重点不是简单遮挡，而是先保证光片内部能实时采样并风格化显示后方场景。

## 10. 推荐实施阶段

1. 原型确认：完成一张主体验界面原型图和关键交互说明。
2. 工程初始化：创建 React + Vite + TypeScript 项目。
3. 摄像头层：完成授权、预览、错误状态。
4. 手部识别层：接入 MediaPipe，显示调试关键点。
5. 场景采样层：实现 WebGL 视频采样，让光片内部能重新渲染后方实时画面。
6. 光片渲染层：实现 WebGL 动态几何、样式纹理和 shader 合成。
7. 手势业务层：实现双手拉伸、单手预览、丢失淡出。
8. 视觉打磨：边缘高光、透明度、三种纹理、蓝图线稿化。
9. 部署验证：GitHub Pages HTTPS 摄像头访问测试。
