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
