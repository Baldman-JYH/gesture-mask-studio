# Spatial Template MVP 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 将当前主视觉效果替换为经过测试的手势锚定三维空间模板 MVP，支持单手楔形模板和双手带状模板。

**架构：** 新增 ADR-0002 运行路径，不继续扩展扁平 `light-sheet-renderer` 的领域模型。`gesture-anchor-frame` 将 display-space landmarks 转换为稳定锚点，`spatial-template-model` 构造多面 mesh，`spatial-template-renderer` 使用 Three.js 和实时视频纹理渲染这些 mesh。

**技术栈：** React 19、TypeScript、Vitest、Three.js、MediaPipe hand landmarks、Vite 静态部署。

---

## 文件结构

- 新增 `app/src/features/gesture-anchor-frame/anchorFrame.ts`：从 display-space landmarks 推导单手/双手锚点帧。
- 新增 `app/src/features/gesture-anchor-frame/anchorFrame.test.ts`：验证置信度过滤、单手锚点、双手排序、开合度、旋转和深度保留。
- 新增 `app/src/features/spatial-template-model/types.ts`：定义空间模板 mesh、顶点、面、材质 id 和渲染模式。
- 新增 `app/src/features/spatial-template-model/templateMesh.ts`：构建单手三角棱柱和双手带状棱柱 mesh。
- 新增 `app/src/features/spatial-template-model/templateMesh.test.ts`：验证 hidden mesh、单手楔形、双手带状模板、面/材质顺序和归一化边界。
- 新增 `app/src/features/spatial-template-renderer/rendererCore.ts`：将空间 mesh 转换为 Three.js buffer positions、uvs、indices 和 material groups。
- 新增 `app/src/features/spatial-template-renderer/rendererCore.test.ts`：验证 buffer 长度、世界坐标转换、视频 UV 映射和 group 分配。
- 新增 `app/src/features/spatial-template-renderer/SpatialTemplateCanvas.tsx`：空间模板 mesh 的 Three.js renderer。
- 修改 `app/src/components/CameraStage.tsx`：推导 anchor frame，构建 spatial mesh，并渲染 `SpatialTemplateCanvas`。
- 需要时修改 `app/src/shared/runtime/types.ts`：只有当 renderer input 需要跨 feature 共享时才新增 `SpatialTemplateRenderInput`。
- 修改 `CODEX_DOC/progress.md` 和 `CODEX_DOC/progress.zh-CN.md`：记录每个阶段进展。

---

### 任务 1：手势锚点帧

**文件：**
- 新增：`app/src/features/gesture-anchor-frame/anchorFrame.ts`
- 测试：`app/src/features/gesture-anchor-frame/anchorFrame.test.ts`

- [x] **步骤 1：编写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import type { TrackedHand } from '../../shared/runtime/types';
import { deriveGestureAnchorFrame } from './anchorFrame';

function hand(id: string, x: number, y: number, confidence = 0.9): TrackedHand {
  return {
    id,
    handedness: 'unknown',
    confidence,
    landmarks: [
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x: x - 0.04, y, z: -0.03 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x: x + 0.04, y: y + 0.02, z: -0.01 },
    ],
  };
}

describe('deriveGestureAnchorFrame', () => {
  it('returns hidden when no confident hand is available', () => {
    expect(deriveGestureAnchorFrame([hand('low', 0.5, 0.5, 0.1)]).mode).toBe('hidden');
  });

  it('derives an explicit one-hand anchor frame from thumb and index tips', () => {
    const frame = deriveGestureAnchorFrame([hand('single', 0.4, 0.5)]);

    expect(frame.mode).toBe('one-hand');
    expect(frame.primary?.point.x).toBeCloseTo(0.4, 3);
    expect(frame.primary?.point.y).toBeCloseTo(0.51, 3);
    expect(frame.span).toBeGreaterThan(0.07);
    expect(frame.openness).toBeGreaterThan(0);
  });

  it('sorts two-hand anchors left-to-right in display space', () => {
    const frame = deriveGestureAnchorFrame([hand('right', 0.8, 0.5), hand('left', 0.2, 0.45)]);

    expect(frame.mode).toBe('two-hand');
    expect(frame.left?.point.x).toBeLessThan(frame.right?.point.x ?? 0);
    expect(frame.rotation).toBeCloseTo(Math.atan2(0.05, 0.6), 2);
  });
});
```

- [x] **步骤 2：运行测试确认失败**

运行：`npm test -- src/features/gesture-anchor-frame/anchorFrame.test.ts`

预期：失败，因为 `./anchorFrame` 尚不存在。

- [x] **步骤 3：实现最小锚点帧代码**

实现 `deriveGestureAnchorFrame(hands)`：过滤 `confidence > 0.2`，使用 landmark 4 和 8 作为 thumb/index tips，x/y 限制在 `0..1`，返回 `hidden`、`one-hand` 或 `two-hand`，并计算 `span`、`openness`、`rotation` 和可选 z。

- [x] **步骤 4：运行测试确认通过**

运行：`npm test -- src/features/gesture-anchor-frame/anchorFrame.test.ts`

预期：通过。

---

### 任务 2：空间模板 Mesh 模型

**文件：**
- 新增：`app/src/features/spatial-template-model/types.ts`
- 新增：`app/src/features/spatial-template-model/templateMesh.ts`
- 测试：`app/src/features/spatial-template-model/templateMesh.test.ts`

- [x] **步骤 1：编写失败测试**

测试内容与英文计划中的 `buildSpatialTemplateMesh` 测试保持一致，覆盖 hidden、one-hand wedge、two-hand ribbon。

- [x] **步骤 2：运行测试确认失败**

运行：`npm test -- src/features/spatial-template-model/templateMesh.test.ts`

预期：失败，因为 `templateMesh` 尚不存在。

- [x] **步骤 3：实现最小 mesh 模型**

实现 `buildSpatialTemplateMesh(frame)`：
- `hidden` 输出空顶点和空面；
- `one-hand` 输出三角棱柱：6 个顶点、front/back 三角形、3 个边面；
- `two-hand` 输出带状棱柱：8 个顶点、front/back 四边形、4 个边面；
- 每个顶点都保存 display-space position 和用于视频 UV 投影的 `samplePoint`。

- [x] **步骤 4：运行测试确认通过**

运行：`npm test -- src/features/spatial-template-model/templateMesh.test.ts`

预期：通过。

---

### 任务 3：空间 Renderer Core

**文件：**
- 新增：`app/src/features/spatial-template-renderer/rendererCore.ts`
- 测试：`app/src/features/spatial-template-renderer/rendererCore.test.ts`

- [x] **步骤 1：编写失败测试**

测试内容与英文计划中的 `spatialTemplateToBufferData` 测试保持一致，覆盖 world positions、video uvs、indices 和 groups。

- [x] **步骤 2：运行测试确认失败**

运行：`npm test -- src/features/spatial-template-renderer/rendererCore.test.ts`

预期：失败，因为 `rendererCore` 尚不存在。

- [x] **步骤 3：实现最小 renderer core**

实现 `spatialTemplateToBufferData(mesh, options)`，输出 `positions`、`uvs`、`indices` 和 `groups`。display-space 到 world 坐标转换规则为 `x = (displayX - 0.5) * 2 * aspect`、`y = (0.5 - displayY) * 2`，并将 `samplePoint` 传入 `toVideoUv`。

- [x] **步骤 4：运行测试确认通过**

运行：`npm test -- src/features/spatial-template-renderer/rendererCore.test.ts`

预期：通过。

---

### 任务 4：React Three.js 接入

**文件：**
- 新增：`app/src/features/spatial-template-renderer/SpatialTemplateCanvas.tsx`
- 修改：`app/src/components/CameraStage.tsx`

- [x] **步骤 1：新增 renderer 组件**

创建 `SpatialTemplateCanvas`，生命周期参考当前 renderer：创建 `WebGLRenderer`、`Scene`、`PerspectiveCamera`、`BufferGeometry`、material array 和 mesh。input 更新时调用 `spatialTemplateToBufferData`。

- [x] **步骤 2：接入 CameraStage**

在 `CameraStage` 中推导 `anchorFrame = deriveGestureAnchorFrame(displayHands)`，构建 `mesh = buildSpatialTemplateMesh(anchorFrame)`，并把当前 video、mirror state、viewport、style preset 和 timestamp 传入 `SpatialTemplateCanvas`。

- [x] **步骤 3：运行 app 层测试**

运行：`npm test -- src/App.test.tsx src/components/TopStatusBar.test.tsx`

预期：通过。

---

### 任务 5：验证与文档

**文件：**
- 修改：`CODEX_DOC/progress.md`
- 修改：`CODEX_DOC/progress.zh-CN.md`
- 可选修改：`docs/architecture/adr-0002-hand-anchored-3d-template-model.md`
- 可选修改：`docs/architecture/adr-0002-hand-anchored-3d-template-model.zh-CN.md`

- [x] **步骤 1：运行目标测试**

运行：

```bash
npm test -- src/features/gesture-anchor-frame/anchorFrame.test.ts src/features/spatial-template-model/templateMesh.test.ts src/features/spatial-template-renderer/rendererCore.test.ts
```

预期：通过。

- [x] **步骤 2：运行完整验证**

运行：

```bash
npm test
npm run build
git diff --check
```

预期：测试和构建通过；`git diff --check` 无空白错误，最多只有可接受的 Windows 换行提示。

- [x] **步骤 3：更新进展文档**

在 `CODEX_DOC/progress.md` 和 `CODEX_DOC/progress.zh-CN.md` 中记录实现结果、红绿证据和真实设备验证方案。

---

## 自检

- 需求覆盖：计划实现 ADR-0002 的下一里程碑：anchor frame、spatial mesh、多面 renderer core 和 React 接入。
- 占位符扫描：没有 TBD/TODO/fill-in；每个代码任务都包含明确测试代码和命令。
- 类型一致性：`GestureAnchorFrame`、`SpatialTemplateMesh`、`SpatialTemplateFace`、`spatialTemplateToBufferData` 都先定义后使用。
