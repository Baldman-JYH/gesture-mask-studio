# 架构质量门禁

English version: [architecture-quality-gate.md](architecture-quality-gate.md)

## 目标

本门禁用于确认项目架构是否足够稳定，避免后续新增样式、手势、截图、录制或部署能力时出现大范围重构。

## 必须满足

- 效果模型明确：核心是“手势驱动实时采样光片”，不是静态蒙版。
- 运行时边界清晰：
  - camera；
  - hand-tracking；
  - gesture-engine；
  - scene-sampling；
  - light-sheet-renderer；
  - light-sheet-styles。
- 每个模块有明确职责。
- 关键类型集中在 `shared/runtime/types.ts`。
- 样式扩展通过 `LightSheetStylePreset`。
- 部署方式支持 GitHub Pages 静态托管。
- 验证方案覆盖自动化、浏览器、真实摄像头和部署。

## 不允许

- 在手势引擎中直接导入 MediaPipe。
- 在手势引擎中直接导入 Three.js。
- 为新增样式重写渲染主流程。
- 把摄像头帧上传到服务端作为 MVP 必需路径。
- 只用静态图片覆盖来伪装实时采样。
- 只做人脸特例处理。

## 检查清单

### 架构边界

- [x] 摄像头生命周期独立。
- [x] 手部识别适配层独立。
- [x] 手势几何为纯逻辑。
- [x] 采样逻辑独立于样式。
- [x] 渲染器只消费标准 `LightSheetRenderInput`。

### 可扩展性

- [x] 可新增样式 preset。
- [x] 可替换手部追踪后端。
- [x] 可增加调试层。
- [x] 可增加截图/录制模块。
- [x] 可加入低性能模式。

### 部署

- [x] Vite base 适配 GitHub Pages 子路径。
- [x] MediaPipe wasm 本地静态托管。
- [x] GitHub Actions 自动构建部署。

### 验证

- [x] 单元测试覆盖核心纯逻辑。
- [x] 构建验证通过。
- [x] 浏览器自动化烟测通过。
- [x] GitHub Pages 部署成功。

## 当前结论

架构质量可以进入 MVP 开发和后续迭代。当前设计满足实时动态、长期扩展和低维护部署要求。

后续新增功能仍需遵守模块边界和双语文档规范。
