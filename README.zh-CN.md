# Gesture Mask Studio

Gesture Mask Studio 是一个一页式浏览器原型，用于实现“手势驱动实时采样光片”效果。用户打开页面、授权摄像头后，可以通过手部关键点控制一张半透明 WebGL 光片；光片会实时采样其背后的摄像头画面，并按当前样式重新渲染。

该实现基于参考视频分析文档：[video-effect-analysis.zh-CN.md](docs/analysis/video-effect-analysis.zh-CN.md)。核心效果不是静态图片覆盖，也不是只处理人脸；光片内部必须实时采样摄像头画面，人物、手、衣服和背景都应能被重新渲染。

English version: [README.md](README.md)

## 本地运行

```bash
cd app
npm install
npm run dev
```

Vite 本地地址：

```text
http://127.0.0.1:5173/gesture-mask-studio/
```

摄像头权限需要安全上下文。本地开发时 `localhost` 和 `127.0.0.1` 可用；GitHub Pages 通过 HTTPS 部署，因此也满足摄像头权限要求。

## 验证

```bash
cd app
npm test
npm run build
```

当前验证覆盖：

- 运行时契约和样式预设；
- 手势状态几何计算；
- 摄像头权限状态映射；
- 镜像和非镜像的视频采样映射；
- 渲染器几何转换；
- 自动手势样式状态和镜像开关；
- 带本地 MediaPipe wasm 资源的生产构建。

完整验证方案见：[verification-plan.zh-CN.md](docs/verification/verification-plan.zh-CN.md)

## 架构

应用按运行时边界拆分：

- `camera`：摄像头权限和媒体流生命周期。
- `hand-tracking`：MediaPipe 适配层，只输出标准 `TrackedHand` 对象。
- `gesture-engine`：纯手势状态到光片几何的推导。
- `scene-sampling`：屏幕坐标和视频 UV 采样映射。
- `light-sheet-renderer`：Three.js/WebGL 视频纹理渲染。
- `light-sheet-styles`：可扩展的样式预设。

新增视觉样式时，应优先新增 `LightSheetStylePreset`；普通样式变更不应重写跟踪、几何和渲染核心。
默认用户流程由手势驱动：应用只显示当前 `Auto` 样式状态，不要求用户手动点选 Blueprint/Cards/Organic 页签。

## 部署

GitHub Pages 部署配置位于：[pages.yml](.github/workflows/pages.yml)

workflow 会：

1. 在 `app/` 中安装依赖；
2. 执行 `npm test`；
3. 执行 `npm run build`；
4. 部署 `app/dist`。

MediaPipe wasm 文件会在 Vite 构建时从 `node_modules/@mediapipe/tasks-vision/wasm` 复制到 `dist/mediapipe/wasm`，因此线上页面不依赖第三方 wasm CDN。

线上地址：

```text
https://baldman-jyh.github.io/gesture-mask-studio/
```

## 关键文档

- [视频效果分析](docs/analysis/video-effect-analysis.zh-CN.md)
- [需求与业务逻辑](docs/product/requirements-and-business-logic.zh-CN.md)
- [原型方向](docs/product/prototype-directions.zh-CN.md)
- [技术架构](docs/architecture/technical-architecture.zh-CN.md)
- [ADR-0001 实时采样光片](docs/architecture/adr-0001-realtime-scene-sampling-light-sheet.zh-CN.md)
- [运行时契约](docs/architecture/runtime-contracts.zh-CN.md)
- [架构质量门禁](docs/architecture/architecture-quality-gate.zh-CN.md)
- [技术债架构评审](docs/architecture/brooks-debt-architecture-review.zh-CN.md)
- [GitHub Pages 部署评估](docs/deployment/github-pages-evaluation.zh-CN.md)
- [MVP 实施计划](docs/superpowers/plans/2026-06-13-realtime-light-sheet-mvp.zh-CN.md)
- [验证方案](docs/verification/verification-plan.zh-CN.md)
- [双语文档规范](docs/documentation-bilingual-policy.zh-CN.md)
- [进展记录](CODEX_DOC/progress.zh-CN.md)
