# 实时光片 MVP 实施计划

> **给执行代理的要求：** 如需继续按本计划实施，必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 逐任务执行。任务使用 checkbox（`- [ ]`）语法跟踪。

**目标：** 构建第一个可运行的浏览器 MVP，实现手势驱动的实时采样光片效果。

**架构：** 应用是位于 `app/` 下的 React + Vite + TypeScript 静态前端。运行时边界遵循 `docs/architecture/runtime-contracts.md`：摄像头、手部追踪、手势引擎、场景采样、光片渲染器、光片样式彼此隔离，并通过显式类型通信。

**技术栈：** React 19、Vite、TypeScript、Vitest、Testing Library、Three.js、MediaPipe Tasks Vision、lucide-react。

---

## 文件结构

- 创建：`app/package.json` - 应用脚本和依赖。
- 创建：`app/index.html` - Vite 入口 HTML。
- 创建：`app/tsconfig.json`、`app/tsconfig.node.json`、`app/vite.config.ts`、`app/vitest.setup.ts` - TypeScript/Vite/Vitest 配置。
- 创建：`app/src/main.tsx`、`app/src/App.tsx`、`app/src/App.css`、`app/src/styles/tokens.css` - React 外壳与视觉系统。
- 创建：`app/src/shared/runtime/types.ts` - 规范化运行时 TypeScript 契约。
- 创建：`app/src/features/light-sheet-styles/presets.ts` 及测试。
- 创建：`app/src/features/gesture-engine/geometry.ts`、`gestureState.ts` 及测试。
- 创建：`app/src/features/camera/cameraController.ts` 及测试。
- 创建：`app/src/features/hand-tracking/handTracker.ts` - MediaPipe 适配器。
- 创建：`app/src/features/scene-sampling/videoTexture.ts`、`screenSpaceSampling.ts` 及测试。
- 创建：`app/src/features/light-sheet-renderer/LightSheetCanvas.tsx`、`shaderSource.ts`、`rendererCore.ts` 及纯辅助函数测试。
- 创建：`app/src/components/CameraStage.tsx`、`TopStatusBar.tsx`、`ControlDock.tsx`、`PermissionOverlay.tsx`。
- 创建：`app/src/assets/textures/*.svg` 和 `app/src/assets/textures/*.png`，或用于样式预览的 CSS/canvas 纹理辅助函数。
- 创建：`.github/workflows/pages.yml` - GitHub Pages 部署工作流。

---

## 任务 1：应用脚手架与工具链

**文件：**
- 创建：`app/package.json`
- 创建：`app/index.html`
- 创建：`app/tsconfig.json`
- 创建：`app/tsconfig.node.json`
- 创建：`app/vite.config.ts`
- 创建：`app/vitest.setup.ts`
- 创建：`app/src/main.tsx`
- 创建：`app/src/App.tsx`
- 创建：`app/src/App.css`
- 创建：`app/src/styles/tokens.css`

- [ ] **步骤 1：创建 package 和配置文件**

`app/package.json` 必须包含应用脚本、React/Vite/TypeScript/Three.js/MediaPipe/lucide-react 依赖，以及 `dev`、`build`、`preview`、`test`、`test:watch`、`lint` 脚本。

- [ ] **步骤 2：安装依赖**

运行：`npm install`

预期结果：生成 `package-lock.json`，安装命令退出码为 0。

- [ ] **步骤 3：添加最小 React 外壳**

`App.tsx` 初始渲染全屏深色舞台、产品名称，以及禁用状态的 Start Camera 按钮。此阶段只做脚手架；生产运行时行为在后续任务中实现。

- [ ] **步骤 4：验证脚手架**

运行：`npm test`

预期结果：Vitest 退出码为 0；此时尚无复杂行为测试。

运行：`npm run build`

预期结果：TypeScript 和 Vite 构建退出码为 0。

- [ ] **步骤 5：提交**

```bash
git add app package-lock.json
git commit -m "feat: scaffold realtime light sheet app"
```

---

## 任务 2：运行时契约与样式预设

**文件：**
- 创建：`app/src/shared/runtime/types.ts`
- 创建：`app/src/features/light-sheet-styles/presets.ts`
- 创建：`app/src/features/light-sheet-styles/presets.test.ts`

- [ ] **步骤 1：编写失败的预设测试**

测试必须断言：

- 初始预设 id 为 `blueprint`、`cards`、`organic`。
- 每个预设都保持实时场景采样启用。
- 未知预设 id 回退到 `blueprint`。

- [ ] **步骤 2：运行测试并确认 RED**

运行：`npm test -- src/features/light-sheet-styles/presets.test.ts`

预期结果：失败，因为 `presets.ts` 尚不存在。

- [ ] **步骤 3：实现运行时契约和预设**

在 `types.ts` 中创建 `NormalizedPoint`、`TrackedHand`、`LightSheetGeometry`、`LightSheetGestureState`、`SceneSamplingInput`、`LightSheetRenderInput`、`LightSheetStylePreset`，定义必须与 `docs/architecture/runtime-contracts.md` 保持一致。

在 `presets.ts` 中创建三个初始预设：`blueprint`、`cards`、`organic`。

- [ ] **步骤 4：验证 GREEN**

运行：`npm test -- src/features/light-sheet-styles/presets.test.ts`

预期结果：通过。

- [ ] **步骤 5：提交**

```bash
git add app/src/shared/runtime/types.ts app/src/features/light-sheet-styles
git commit -m "feat: add light sheet runtime contracts"
```

---

## 任务 3：手势引擎几何与状态

**文件：**
- 创建：`app/src/features/gesture-engine/geometry.ts`
- 创建：`app/src/features/gesture-engine/geometry.test.ts`
- 创建：`app/src/features/gesture-engine/gestureState.ts`
- 创建：`app/src/features/gesture-engine/gestureState.test.ts`

- [ ] **步骤 1：编写失败的几何测试**

测试必须覆盖：

- 两个锚点之间生成四顶点光片。
- 顶点始终保持在归一化屏幕范围内。

- [ ] **步骤 2：运行几何 RED**

运行：`npm test -- src/features/gesture-engine/geometry.test.ts`

预期结果：失败，因为几何模块尚不存在。

- [ ] **步骤 3：实现几何函数**

实现纯函数：

```ts
buildTwoHandLightSheetGeometry(input): LightSheetGeometry
buildOneHandPreviewGeometry(input): LightSheetGeometry
clampNormalizedPoint(point): NormalizedPoint
```

- [ ] **步骤 4：验证几何 GREEN**

运行：`npm test -- src/features/gesture-engine/geometry.test.ts`

预期结果：通过。

- [ ] **步骤 5：编写并运行手势状态测试**

测试必须覆盖：

- 两只手 -> `two-hand-sheet`
- 一只手 -> `one-hand-preview`
- 无手且无历史状态 -> `hidden`
- 未知样式 id -> 回退到 `blueprint`

运行：`npm test -- src/features/gesture-engine/gestureState.test.ts`

预期流程：先 RED，再实现 `deriveLightSheetGestureState`，最后 GREEN。

- [ ] **步骤 6：提交**

```bash
git add app/src/features/gesture-engine
git commit -m "feat: add gesture engine geometry"
```

---

## 任务 4：摄像头、追踪适配器、场景采样与渲染核心

**文件：**
- 创建：`app/src/features/camera/cameraController.ts`
- 创建：`app/src/features/camera/cameraController.test.ts`
- 创建：`app/src/features/hand-tracking/handTracker.ts`
- 创建：`app/src/features/scene-sampling/screenSpaceSampling.ts`
- 创建：`app/src/features/scene-sampling/screenSpaceSampling.test.ts`
- 创建：`app/src/features/scene-sampling/videoTexture.ts`
- 创建：`app/src/features/light-sheet-renderer/shaderSource.ts`
- 创建：`app/src/features/light-sheet-renderer/rendererCore.ts`
- 创建：`app/src/features/light-sheet-renderer/rendererCore.test.ts`
- 创建：`app/src/features/light-sheet-renderer/LightSheetCanvas.tsx`

- [ ] **步骤 1：编写失败的摄像头测试**

使用注入的 `getUserMedia` 测试权限状态映射，至少覆盖摄像头权限拒绝时返回 `denied`。

- [ ] **步骤 2：RED/GREEN 摄像头控制器**

运行失败测试，实现 `createCameraController`，再运行通过测试。

- [ ] **步骤 3：编写失败的场景采样测试**

测试必须断言镜像和非镜像 UV 映射：

```ts
expect(toVideoUv({ x: 0.25, y: 0.75 }, false)).toEqual({ u: 0.25, v: 0.75 });
expect(toVideoUv({ x: 0.25, y: 0.75 }, true)).toEqual({ u: 0.75, v: 0.75 });
```

- [ ] **步骤 4：RED/GREEN 场景采样**

运行失败测试，实现 `toVideoUv`，再运行通过测试。

- [ ] **步骤 5：编写渲染核心测试**

测试必须断言 `geometryToPositions` 将归一化顶点转换为 clip-space 坐标，并保持顶点顺序。

- [ ] **步骤 6：RED/GREEN 渲染核心**

运行失败测试，实现 `geometryToPositions`，再运行通过测试。

- [ ] **步骤 7：实现 MediaPipe 适配器和 React canvas**

`handTracker.ts` 封装 MediaPipe，并且不向模块外泄露 MediaPipe 类型。

`LightSheetCanvas.tsx` 拥有 Three.js 初始化，并接收 `LightSheetRenderInput`。

- [ ] **步骤 8：验证**

运行：`npm test`

预期结果：全部测试通过。

运行：`npm run build`

预期结果：构建通过。

- [ ] **步骤 9：提交**

```bash
git add app/src/features/camera app/src/features/hand-tracking app/src/features/scene-sampling app/src/features/light-sheet-renderer
git commit -m "feat: add realtime sampling renderer core"
```

---

## 任务 5：摄像头舞台 UI、GitHub Pages 与验证

**文件：**
- 修改：`app/src/App.tsx`
- 修改：`app/src/App.css`
- 创建：`app/src/components/CameraStage.tsx`
- 创建：`app/src/components/TopStatusBar.tsx`
- 创建：`app/src/components/ControlDock.tsx`
- 创建：`app/src/components/PermissionOverlay.tsx`
- 创建：`app/src/assets/textures/blueprint.svg`
- 创建：`app/src/assets/textures/cards.svg`
- 创建：`app/src/assets/textures/organic.svg`
- 创建：`.github/workflows/pages.yml`
- 修改：`README.md`
- 修改：`CODEX_DOC/progress.md`

- [ ] **步骤 1：编写 UI 行为测试**

测试必须断言：

- 产品名称可渲染。
- 预设按钮可渲染。
- 点击 Cards 后选中样式会变为 Cards。
- Mirror 按钮会切换 pressed 状态。

- [ ] **步骤 2：RED/GREEN UI 测试**

先运行失败的 UI 测试，再实现组件，最后运行通过测试。

- [ ] **步骤 3：实现视觉系统**

实现 `prototype-01-immersive-stage.png` 方向：

- 全屏摄像头舞台。
- 深色顶部状态栏。
- 紧凑底部控制 Dock。
- Blueprint/Cards/Organic 纹理选择器。
- 使用 lucide-react 的图标按钮。
- 不做营销式 hero，不做说明卡片。

- [ ] **步骤 4：添加 GitHub Pages 工作流**

创建 `.github/workflows/pages.yml`，构建 `app` 并部署 `app/dist`。

- [ ] **步骤 5：验证所有检查**

运行：

```bash
cd app
npm test
npm run build
```

预期结果：两者都通过。

- [ ] **步骤 6：浏览器验证**

启动：`npm run dev -- --port 5173`

用 Browser/IAB 打开 `http://127.0.0.1:5173/`。

验证：

- 首屏结构匹配已接受的概念方向。
- 控件可见且不重叠。
- 预设按钮能改变样式状态。
- 摄像头权限流程可触达。
- 摄像头不可用时应用不会崩溃。

- [ ] **步骤 7：视觉证据**

截图并与 `assets/design/prototype-01-immersive-stage.png` 通过 `view_image` 对比。

- [ ] **步骤 8：提交**

```bash
git add app .github README.md CODEX_DOC/progress.md
git commit -m "feat: implement realtime light sheet mvp"
```

---

## 自审

- 规格覆盖：任务覆盖静态部署、摄像头、手部追踪适配器、实时场景采样、光片渲染器、样式预设、UI 控件、测试和 GitHub Pages。
- 风险扫描：所有实施步骤都包含具体文件路径、命令和预期结果。
- 类型一致性：`LightSheet`、`SceneSampling`、`GestureEngine`、`LightSheetStylePreset` 必须与 `runtime-contracts.md` 保持一致。
