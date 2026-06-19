# 2026-06-19 Face Tracking 复刻进展

## 阶段 21：真实人脸 ROI 纯函数补齐

- 背景：
  - 18:36 最新测试视频显示，结构稳定性已有改善，但面片纹理仍不够像参考视频中的低像素人脸肖像。
  - 根因定位为运行时缺少真实 face tracker，当前 `faceRoi` 主要由模板/手势位置推导。
- TDD：
  - 先新增失败用例，要求从真实 face landmarks 推导带 padding 的头像裁剪框。
  - 新增失败用例，要求多张脸时选择面积最大的有效 ROI，并忽略空检测。
- 实现：
  - 在 `faceTextureSource` 中新增 `deriveTrackedFaceRoi`。
  - 在 `faceTextureSource` 中新增 `selectTrackedFaceRoi`。
  - ROI 会过滤无效点、按 landmarks 边界扩大为头像裁剪框，并 clamp 到视频范围内。
- 验证：
  - `npm.cmd test -- faceTextureSource` 通过：1 个测试文件，8 个测试。
- 下一步：
  - 封装 MediaPipe `FaceLandmarker`，把 `faceLandmarks` 转成上述 ROI。
  - 接入 `CameraStage` 的实时帧循环，并通过 smoothing/last-known ROI 避免脸部采样闪烁。

## 阶段 22：MediaPipe FaceLandmarker 接入

- TDD：
  - 新增 `faceTracker.test.ts`，先验证缺少 `faceTracker` 模块时失败。
  - 测试要求 `FaceLandmarkerResult.faceLandmarks` 能转换为 shader 使用的 `FaceRoi`。
  - 测试要求无脸检测时返回 `null`，由上层保持旧 ROI 或 fallback。
- 实现：
  - 新增 `features/face-tracking/faceTracker.ts`。
  - 沿用现有 hand tracker 的 MediaPipe Tasks Vision 初始化方式。
  - 使用官方 `face_landmarker.task` 模型 URL，WASM 仍走项目已有的本地 `/mediapipe/wasm` 管线。
  - 新增 `stabilizeTrackedFaceRoi`，检测到脸时平滑更新，丢帧时保留上一帧 ROI。
  - `CameraStage` 中新增 `faceTrackerRef` 与 `faceRoiRef`，每帧将真实 face ROI 传给 `createSpatialTemplateRenderInput`。
- 容错：
  - face tracker 创建失败不会把手部 tracking 标记为 unavailable。
  - 单帧 face detect 抛错时返回 `null`，继续使用上一帧 ROI 或原有手势 fallback。
- 目标验证：
  - `npm.cmd test -- faceTextureSource faceTracker renderInput App` 通过：4 个测试文件，21 个测试。
- 下一步：
  - 运行全量测试和 production build。
  - 进行本地 production preview 检查，确认页面仍能加载。

## 阶段 23：全量验证与本地预览检查

- 自动化验证：
  - `npm.cmd test` 通过：26 个测试文件，116 个测试。
  - `npm.cmd run build` 通过：TypeScript build 与 Vite production build 均完成。
- 本地 production preview：
  - 检查地址：`http://127.0.0.1:4176/gesture-mask-studio/`
  - HTTP 返回：`200`
- 本轮预期效果：
  - 参考结构的贴图不再只依赖手势中心估算，而是优先使用真实人脸 landmarks 计算出的头像 ROI。
  - FaceLandmarker 暂时丢帧时保留上一帧 ROI，避免贴图采样在真实脸和 fallback 之间快速跳变。
  - 手部 tracking 失败/加载状态不受 face tracker 失败影响，主 AR 结构仍保持上一轮“不因丢手消失”的策略。
- 剩余验证：
  - 需要基于本轮构建重新录制摄像头测试视频。
  - 下一次逐帧对比应重点看面片上是否出现更明确的人脸低像素轮廓，以及黄/绿/青色故障贴图是否接近参考视频。

## 阶段 24：三角折面几何超跨度修复

- 证据：
  - 18:36 测试视频抽样图中，结构仍偏右、偏小，更像短三角贴片。
  - 参考视频中的三角/飞机形态经常明显超出双手锚点跨度，并带更长的鼻尖投影。
- TDD：
  - 新增 `projects triangle folds as an oversized paper-plane body beyond the hand span`。
  - 红灯结果：当前 `triangle-fold` 宽度为 `0.708`，未达到 `span * 1.38` 的参考比例要求。
- 实现：
  - 将 `triangleFold` 宽度从 `span * 1.18` 提升到 `span * 1.52`。
  - 将高度从 `span * 0.72` 提升到 `span * 0.78`。
  - 同步增加折深与白色边缘厚度，让折面更接近参考视频中的纸飞机体块。
- 验证：
  - `npm.cmd test -- referenceTemplateMesh` 通过：1 个测试文件，11 个测试。
- 下一步：
  - 继续处理白色折面材质：参考视频有明显红色像素点阵，当前 shader 更像条带/色块。

## 阶段 25：白色折面红色像素点阵材质修复

- 证据：
  - 参考视频多处出现白色折面，上面是红色离散像素点阵。
  - 当前 `CARD_FACE` shader 分支使用斜向条带，视觉上更像色块，不像参考视频。
- TDD：
  - 新增 shader 源码测试，要求存在 `redPixelDotGrid`。
  - 测试要求 `CARD_FACE` 分支使用 `redDotGrid`、`redDotInk` 和白纸底混合。
  - 红灯结果：当前 shader 不包含点阵函数。
- 实现：
  - 新增 GLSL `redPixelDotGrid(vec2 uv)`。
  - 将卡片材质改为 `cardPaper` 白纸底 + `redDotInk` 红色像素点阵。
  - 保留一部分 `paletteColor`，让白卡仍带人脸低像素/故障纹理底色。
- 验证：
  - `npm.cmd test -- referenceShaderSource referenceTemplateMesh` 通过：2 个测试文件，19 个测试。
- 下一步：
  - 运行全量测试和 production build。
  - 提交并推送本轮几何与 shader 修复。

## 阶段 26：MediaPipe Vision Fileset 共享初始化

- 证据：
  - 当前 hand tracker 和 face tracker 都会调用 `FilesetResolver.forVisionTasks`。
  - 参考效果要求实时稳定，重复初始化 MediaPipe WASM 会增加启动成本，也会让双任务追踪更容易在低性能环境下出现延迟。
- TDD：
  - 新增 `visionFileset.test.ts`。
  - 红灯验证缺少 `visionFileset` 模块。
  - 测试同一个 WASM base URL 只调用一次 resolver，不同 URL 独立缓存。
- 实现：
  - 新增 `features/mediapipe/visionFileset.ts`。
  - `createMediaPipeHandTracker` 和 `createMediaPipeFaceTracker` 共享 `resolveVisionFileset`。
  - 保持模型创建仍各自独立，只复用底层 WASM fileset 初始化。
- 验证：
  - `npm.cmd test -- visionFileset faceTracker` 通过：2 个测试文件，4 个测试。
- 下一步：
  - 跑全量测试和 production build。
  - 若通过，提交并推送本轮稳定性改动。

## 阶段 27：共享初始化全量验证

- 目标测试：
  - `npm.cmd test -- visionFileset faceTracker` 通过：2 个测试文件，4 个测试。
- 全量测试：
  - `npm.cmd test` 通过：27 个测试文件，120 个测试。
- Build 修正：
  - 首次 `npm.cmd run build` 暴露 `WasmFileset` 不是 `@mediapipe/tasks-vision` 公开导出类型。
  - 将 `resolveVisionFileset` 改为泛型 Promise cache，不再依赖 MediaPipe 内部类型。
- 最终验证：
  - `npm.cmd run build` 通过：TypeScript build 与 Vite production build 均完成。
  - 修正后重新执行 `npm.cmd test`，仍通过：27 个测试文件，120 个测试。
  - 本地 production preview：`http://127.0.0.1:4176/gesture-mask-studio/` 返回 `HTTP 200`。
- 下一步：
  - 提交并推送本轮共享初始化改动。
  - 等下一段实拍视频后继续逐帧对比真实效果。

## 阶段 28：人脸 ROI 到 VideoTexture UV 的 y 方向修复

- 证据：
  - Three.js `Texture` 默认 `flipY = true`，`VideoTexture` 继承该行为。
  - 项目已有场景采样 `toVideoUv` 会把 top-down 屏幕 y 转成 `1 - y`。
  - 人脸 ROI 来自 MediaPipe landmarks，是 top-left 归一化坐标；此前 shader 直接使用 `uFaceRoi.y` 采样 `uFaceTexture`。
- 根因：
  - `uFaceRoi` 的 y 坐标没有转换到 VideoTexture UV 空间，导致低像素人脸贴图垂直采样区域错误。
  - 这会削弱参考视频里最关键的“折面上有清晰人脸轮廓”的效果。
- TDD：
  - 新增 shader 源码测试，要求使用 `sourceFaceUv` 先计算 top-left ROI 坐标。
  - 测试要求 `faceUv` 使用 `vec2(sourceFaceUv.x, 1.0 - sourceFaceUv.y)`。
  - 红灯结果：当前 shader 不包含 `sourceFaceUv`。
- 实现：
  - `REFERENCE_FRAGMENT_SHADER` 中将 `faceUv` 改为先计算 `sourceFaceUv`，再把 y 转换为 `1.0 - sourceFaceUv.y`。
  - `rgbGlitch`、`faceEdgeMagnitude`、`faceSample` 现在都基于修正后的 `faceUv`。
- 验证：
  - `npm.cmd test -- referenceShaderSource` 通过：1 个测试文件，9 个测试。
  - `npm.cmd test` 通过：27 个测试文件，121 个测试。
  - `npm.cmd run build` 通过：TypeScript build 与 Vite production build 均完成。
  - 本地 production preview：`http://127.0.0.1:4176/gesture-mask-studio/` 返回 `HTTP 200`。
- 下一步：
  - 提交并同步远端。

## 阶段 29：折面 z 深度屏幕投影修复

- 证据：
  - 参考视频中的折纸飞机结构有明显折面错位和透视感。
  - 当前 mesh 虽然为折面顶点写入了 `z`，但 `rotateIntoDisplaySpace` 只把 local x/y 映射到屏幕坐标，local z 不会改变屏幕位置。
  - 在正交相机和当前 shader 下，仅有 z 值不足以产生参考视频中的可见折面形变。
- 根因：
  - 折面深度只存在于 vertex z，缺少屏幕空间投影，导致折叠状态视觉上仍像平面贴片。
- TDD：
  - 新增 `projects fold depth into screen space instead of keeping folds visually flat`。
  - 红灯结果：高 `foldAmount` 的三角折面顶点 z 增加，但 y 位置与 flat 状态完全一致。
- 实现：
  - 新增 `DEPTH_SCREEN_PROJECTION`。
  - `rotateIntoDisplaySpace` 先把 local z 投影到 local y，再一起按模板 rotation 旋转到屏幕坐标。
  - 折面顶点现在会随深度产生可见屏幕位移，增强纸飞机的 3D 透视感。
- 验证：
  - `npm.cmd test -- referenceTemplateMesh` 通过：1 个测试文件，12 个测试。
  - `npm.cmd test` 通过：27 个测试文件，122 个测试。
  - `npm.cmd run build` 通过：TypeScript build 与 Vite production build 均完成。
  - 本地 production preview：`http://127.0.0.1:4176/gesture-mask-studio/` 返回 `HTTP 200`。
- 下一步：
  - 提交并同步远端。

## 阶段 30：远端引用对齐与当前树复验

- 背景：
  - 上一阶段代码已通过 GitHub API 推送到远端，但本地分支仍指向普通 `git commit` 生成的等价提交 SHA。
  - 远端真实提交为 `f68b1b9bd130fd604dd0acd34fe11ea3630109ce`，本地原提交 `52e21041fdc5d919f9f35c8396ef9d65a137f2b1` 与其 tree 相同，但 SHA 不同。
- 处理：
  - 确认 `origin` 指向 `Baldman-JYH/gesture-mask-studio`。
  - 确认远端 `codex/reference-effect-stability` 已位于 `f68b1b9bd130fd604dd0acd34fe11ea3630109ce`。
  - 更新本地 `refs/heads/codex/reference-effect-stability` 与 `refs/remotes/origin/codex/reference-effect-stability`，使本地和远端完全一致。
- 验证：
  - `git status --short --branch` 显示本地分支与 `origin/codex/reference-effect-stability` 无 ahead/behind。
  - `git rev-list --left-right --count origin/codex/reference-effect-stability...HEAD` 返回 `0 0`。
  - 首次在仓库根目录执行 `npm.cmd test` 失败，原因是根目录没有 `package.json`；有效项目目录为 `app`。
  - 在 `app` 目录执行 `npm.cmd test` 通过：27 个测试文件，122 个测试。
  - 在 `app` 目录执行 `npm.cmd run build` 通过：TypeScript build 与 Vite production build 均完成。
- 下一步：
  - 基于当前构建重新录制摄像头测试视频。
  - 用新视频继续与 `参考视频.mp4` 做逐帧对比，重点检查折面透视、头像 ROI 贴图位置、红点白卡材质、结构是否仍有消失或跳变。

## 阶段 31：视频短暂不可渲染时不清空已生成效果

- 证据：
  - 用户反馈效果会出现消失，但目标效果生成后不应因短暂跟踪/视频波动而消失。
  - `renderStabilizer` 已默认无限期保留上一个可见 mesh。
  - `CameraStage` 仍在 `!isRenderableVideo(video)` 时直接清空 `stabilizerStateRef`、`templateStateRef`、`faceRoiRef` 和 `renderInput`，绕过了稳定器。
- 根因：
  - 当 video 元素存在但某一帧 `readyState` 或尺寸暂时不满足采样条件时，运行时把它当成彻底不可用并清空 AR 状态。
  - 这会造成一次短暂的视频可渲染性波动就让已经生成的结构消失。
- TDD：
  - 新增 `reuses the stabilized render input through a transient unrenderable video frame`。
  - 红灯结果：`resolveRenderInputForUnavailableVideoFrame` 不存在，当前运行时没有明确的不可渲染帧保留策略。
- 实现：
  - 在 `renderStabilizer` 中新增 `resolveRenderInputForUnavailableVideoFrame`，返回当前稳定后的 `renderInput`。
  - `CameraStage` 将 `!video` 和 `!isRenderableVideo(video)` 拆开处理。
  - 没有 video 元素时仍重置；video 存在但短暂不可渲染时不清空 stabilizer，只复用上一帧稳定输出。
- 验证：
  - `npm.cmd test -- renderStabilizer` 通过：1 个测试文件，7 个测试。
  - `npm.cmd test` 通过：27 个测试文件，123 个测试。
  - `npm.cmd run build` 通过：TypeScript build 与 Vite production build 均完成。
  - 本地 production preview：`http://127.0.0.1:4176/gesture-mask-studio/` 返回 `HTTP 200`。
- 下一步：
  - 提交并同步本轮稳定性修复。
  - 基于最新构建重新录制测试视频，确认效果不再因短暂视频帧不可渲染而消失。

## 阶段 32：逐帧对比定位结构出界并加入视口内约束

- 视频证据：
  - 最新可用测试视频仍为 `测试记录/测试视频/屏幕录制 2026-06-19 183611.mp4`，未覆盖阶段 29-31 的最新代码。
  - 使用 ffmpeg 全帧抽取：
    - `参考视频.mp4`：736 帧，30fps，1226x686。
    - `屏幕录制 2026-06-19 183611.mp4`：820 帧，30fps，3814x1946。
  - 本轮分析输出位于 `output/reference-validation-20260620-continue/`。
- 逐帧统计：
  - 先裁掉测试视频右侧控制台区域，仅保留 camera stage。
  - 生成 `normalized_contact_sheet.jpg`、`component_mask_contact_sheet.jpg`、`component_metrics.csv`、`component_metrics_summary.json`。
  - 基于最大连通 AR 结构统计：
    - 参考结构中心中位数约为 `x=0.479, y=0.343`。
    - 测试结构中心中位数约为 `x=0.746, y=0.806`。
    - 测试结构显著偏右、偏下，且多帧贴近底边或部分出界。
- 根因：
  - `referenceTemplateMesh` 会按手势 span 生成超尺度折面，但没有任何视口安全约束。
  - 当双手跨度较大且锚点靠近右下区域时，折纸结构会投出归一化视口，表现为参考视频没有的贴底、裁切和位置漂移。
- TDD：
  - 新增 `keeps oversized reference folds inside the visible viewport near screen edges`。
  - 红灯结果：靠右下的大跨度 `triangle-fold` 右边界投到 `1.4198`，明显超出可见范围。
- 实现：
  - 在 `referenceTemplateMesh` 中新增 `VIEWPORT_SAFE_MARGIN`。
  - mesh 顶点生成后执行 `fitVerticesIntoViewport`：
    - 先计算整体 bbox。
    - 超过安全范围时等比缩小。
    - 再按 x/y 方向平移回 `0.035..0.965` 的可见区域。
    - 同步变换 `position` 和 `samplePoint`，保留 `faceUv`。
- 验证：
  - `npm.cmd test -- referenceTemplateMesh` 通过：1 个测试文件，13 个测试。
  - `npm.cmd test` 通过：27 个测试文件，124 个测试。
  - `npm.cmd run build` 通过：TypeScript build 与 Vite production build 均完成。
  - 本地 production preview：`http://127.0.0.1:4176/gesture-mask-studio/` 返回 `HTTP 200`。
- 下一步：
  - 提交并同步本轮几何出界修复。
  - 基于当前构建重新录制视频，重新逐帧验证结构是否仍偏右/偏下，以及 face shader 细节是否继续需要调参。

## 阶段 33：参考人脸贴图粒子层增强

- 证据：
  - 参考视频中的人脸贴图不是普通连续色块，而是低像素、高饱和黄/绿/青色块叠加明显线稿/粒子化纹理。
  - 当前 shader 已有 `pixelateUv`、`rgbGlitch`、`faceEdgeMagnitude` 和红点白卡，但蓝/绿人脸材质缺少明确的低像素粒子点阵层。
- 根因：
  - `REFERENCE_FRAGMENT_SHADER` 的主 `paletteColor` 只混合了 palette、hue boost、face edge 和少量 scene backlight。
  - 人脸边缘能被提亮，但面内缺少参考视频中可见的破碎粒子/扫描线节奏，容易表现成大片平滑色块。
- TDD：
  - 新增 `adds a low-pixel portrait particle grid over the face texture`。
  - 红灯结果：shader 中不存在 `portraitParticleGrid`，也没有 `particleInk` 混入主 portrait ink。
- 实现：
  - 新增 GLSL `portraitParticleGrid(vec2 uv, float edge, float mask)`。
  - 使用低分辨率网格、cell noise、scanline 和 face edge boost 生成破碎粒子层。
  - 新增 `particleInk`，在青绿色和黄色之间按像素化人脸亮度映射。
  - 将粒子层混入 `portraitInk`，并继续保留 RGB glitch、face ROI、face edge 和少量 scene backlight。
- 验证：
  - `npm.cmd test -- referenceShaderSource` 通过：1 个测试文件，10 个测试。
  - `npm.cmd test -- referenceShaderSource referenceMaterials` 通过：2 个测试文件，12 个测试。
  - `npm.cmd test` 通过：27 个测试文件，125 个测试。
  - `npm.cmd run build` 通过：TypeScript build 与 Vite production build 均完成。
  - 本地 production preview：`http://127.0.0.1:4176/gesture-mask-studio/` 返回 `HTTP 200`。
- 下一步：
  - 提交并同步本轮 shader 修复。
  - 基于最新构建重新录制视频，验证面片上是否出现更接近参考的低像素人脸粒子和黄/绿/青高对比线稿。
