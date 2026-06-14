# 454c4a4 真实摄像头逐帧分析

English version: [454c4a4-real-camera-frame-analysis.md](454c4a4-real-camera-frame-analysis.md)

## 输入

- 测试录屏：`测试记录/基于提交 454c4a43503c95dcdfc68a3fe7f6b9b767015c83测试/屏幕录制 2026-06-14 170311.mp4`
- 参考录屏：`参考视频.mp4`
- 测试录屏元数据：3834x1958，30fps，约 117.78 秒，3530 帧。
- 参考录屏元数据：1226x686，30fps，约 24.58 秒，736 帧。

## 抽帧证据

已用 FFmpeg 全量抽取：

`测试记录/基于提交 454c4a43503c95dcdfc68a3fe7f6b9b767015c83测试/ffmpeg逐帧对比_20260614_170311/`

生成的对照图：

- `sheets/test_contact_1fps.jpg`
- `sheets/test_segment_000_040_4fps.jpg`
- `sheets/test_segment_040_080_4fps.jpg`
- `sheets/test_segment_080_118_4fps.jpg`
- `sheets/test_keyframes_labeled.jpg`
- `sheets/reference_contact_1fps.jpg`
- `sheets/reference_segment_000_025_4fps.jpg`
- `sheets/reference_keyframes_labeled.jpg`

代表性关键帧：

- `keyframes/test_t018.jpg`
- `keyframes/test_t030.jpg`
- `keyframes/test_t056.jpg`
- `keyframes/test_t088.jpg`
- `keyframes/test_t096.jpg`
- `keyframes/reference_t000.jpg`
- `keyframes/reference_t008.jpg`
- `keyframes/reference_t012.jpg`
- `keyframes/reference_t024.jpg`

## 与参考视频的差异

`454c4a4` 相比上一轮减少了部分 rail 交叉导致的长管和沙漏状错误，但仍未达到参考视频效果。

1. **单手状态仍会渲染体。** `test_t018.jpg` 和 `test_t030.jpg` 顶部状态栏显示 `1 hand`，但画面仍出现有厚度的多面体或三角残片。按当前业务模型，单手只能构成 `A-B-C-D-E-A` 一个面，不能生成体。
2. **无效 lattice 会被旧 anchor template 补画。** 当指尖拓扑无效或 rail 被门控隐藏时，渲染输入层会回退到旧的 anchor template，因此状态栏和画面出现不一致。
3. **两手几何仍有偏移。** `test_t088.jpg` 等双手帧中几何体不是严格贴在十个指尖控制点上。根因之一是渲染器使用透视相机，而 fingertip 顶点本质是屏幕空间归一化坐标；只要 z 不为 0，透视投影会让 x/y 向相机中心收缩。
4. **每个面缺少稳定的独立视觉身份。** 当前五个侧面复用少量材质组，视觉上仍接近整体染色；参考视频的每个模板面有更明确的颜色或贴图区分。
5. **参考视频是受控模板态，不是任意自由形变。** 参考视频会在长条、窄边、三角面和大折面之间切换，但端点仍由手指夹持；当前模型更像直接把当帧十个指尖连成几何体，缺少模板态约束和状态机。

## 根因判断

当前技术选型仍然可行：MediaPipe Hands 提供指尖点，Three.js 负责实时渲染，浏览器部署也满足实时摄像头需求。问题集中在模型约束和渲染投影：

- `buildOneHandClosedFace` 实际生成了 front/back/edge，因此单手被挤出为体。
- `createSpatialTemplateRenderInput` 在 lattice hidden 时回退旧模板，导致无效拓扑仍显示模型。
- `SpatialTemplateCanvas` 使用透视相机显示屏幕空间顶点，深度会改变屏幕位置。
- 材质枚举没有为 `AB/BC/CD/DE/EA` 五个侧面提供独立槽位，后续贴图扩展成本较高。

## 本次修正

- 单手 lattice 改为 5 个指尖顶点加 3 个三角面，只表示 `A-B-C-D-E-A` 平面。
- 无效 fingertip lattice 改为保持隐藏，不再回退到旧 anchor template。
- 删除旧 anchor template 的生产构建入口，spatial-template mesh 现在只有 fingertip topology 一个入口。
- spatial-template 渲染相机改为正交相机，使屏幕空间指尖顶点不会因 z 深度产生投影偏移。
- 为 `AB/BC/CD/DE/EA` 五个侧面新增独立材质槽位：`strip-ab`、`strip-bc`、`strip-cd`、`strip-de`、`strip-ea`。

## 下一步验证方案

1. 部署后在有摄像头设备打开 GitHub Pages。
2. 单手测试：只伸出一只手，张开五指并移动，预期只出现一个贴近五个指尖的平面；不得出现有厚度的体、远端三角残片或旧 wedge 模板。
3. 无效双手测试：两手交叉、遮挡或快速错位，预期错误拓扑隐藏；不得用旧模板补画一块漂浮的体。
4. 双手测试：两手张开并缓慢平移、上下移动、前后靠近，预期闭合体边界与左右五个指尖保持贴合，偏移应明显降低。
5. 材质测试：双手闭合体出现时，五个侧面应有可见的色相差异，不应全部同步成同一种颜色。
6. 录屏后继续用 FFmpeg 全量拆帧，与 `参考视频.mp4` 的关键状态逐帧对比。
