# 运行时契约

English version: [runtime-contracts.md](runtime-contracts.md)

本文档说明各运行时模块之间的标准数据契约。契约的目标是让摄像头、手势识别、几何计算、采样、渲染和样式可以独立演进。

## 归一化点

```ts
export type NormalizedPoint = {
  x: number;
  y: number;
  z?: number;
};
```

说明：

- `x` 和 `y` 使用 0 到 1 的屏幕归一化坐标。
- `z` 可选，用于模型深度信息。
- 调用方应在模块边界前进行 clamp 或容错。

## 手部追踪结果

```ts
export type TrackedHand = {
  id: string;
  handedness: 'left' | 'right' | 'unknown';
  confidence: number;
  landmarks: NormalizedPoint[];
};
```

说明：

- 这是手势引擎唯一接受的手部输入。
- 不允许在手势引擎中直接使用 MediaPipe 类型。
- `landmarks` 通常为 21 个关键点。

## 光片模式

```ts
export type LightSheetMode =
  | 'hidden'
  | 'one-hand-preview'
  | 'two-hand-sheet'
  | 'fade-out';
```

说明：

- `hidden`：不显示光片。
- `one-hand-preview`：只有一只手时的预览状态。
- `two-hand-sheet`：双手之间的完整光片。
- `fade-out`：手势丢失后的淡出状态。

## 光片几何

```ts
export type LightSheetGeometry = {
  mode: LightSheetMode;
  vertices: [NormalizedPoint, NormalizedPoint, NormalizedPoint, NormalizedPoint?];
  opacity: number;
  confidence: number;
};
```

说明：

- 三个顶点表示三角形。
- 四个顶点表示四边形。
- 顶点顺序必须稳定，渲染器依赖该顺序生成三角索引。

## 手势状态

```ts
export type LightSheetGestureState = {
  mode: LightSheetMode;
  confidence: number;
  stylePresetId: string;
  anchors: {
    left: NormalizedPoint;
    right?: NormalizedPoint;
  };
  openness: number;
  rotation: number;
};
```

说明：

- `anchors` 是光片生成的业务锚点。
- `openness` 表示手部张开程度。
- `rotation` 表示双手连线角度。

## 场景采样输入

```ts
export type SceneSamplingInput = {
  video: HTMLVideoElement;
  mirrored: boolean;
  viewport: { width: number; height: number };
};
```

说明：

- `video` 是当前摄像头画面。
- `mirrored` 决定 UV 映射是否水平翻转。
- `viewport` 用于后续分辨率和布局适配。

## 样式预设

```ts
export type LightSheetStylePreset = {
  id: string;
  label: string;
  thumbnailUrl: string;
  textureUrl?: string;
  shader: 'blueprint' | 'cards' | 'organic' | 'custom';
  opacity: number;
  edgeColor: string;
  edgeWidth: number;
  sceneSample: {
    enabled: boolean;
    mode: 'raw' | 'edge-lines' | 'luma-map' | 'posterized';
    intensity: number;
    tint: string;
  };
  highlight: {
    enabled: boolean;
    intensity: number;
    speed: number;
  };
  blendMode: 'normal' | 'screen' | 'additive';
};
```

约束：

- 所有首版样式都必须保持 `sceneSample.enabled = true`。
- 新增样式优先新增 preset。
- 不应为了新增普通样式修改手势引擎。

## 渲染输入

```ts
export type LightSheetRenderInput = {
  geometry: LightSheetGeometry;
  style: LightSheetStylePreset;
  scene: SceneSamplingInput;
  timestampMs: number;
  debug?: boolean;
};
```

说明：

- 这是渲染器的统一输入。
- 渲染器不需要知道手势识别细节。
- `timestampMs` 用于 shader 动效。

## 维护规则

- 修改契约时必须同步更新中英文文档。
- 修改契约时必须更新对应测试。
- 禁止在纯领域模块中引入基础设施类型。
