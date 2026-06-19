# 2026-06-18 视频与技术路线分析进展

## 阶段 1：启动与范围确认

- 时间：2026-06-18 22:17:23 +08:00
- 输入素材：
  - 最新测试视频：`测试记录/基于提交 f74f885e3159cd648a510236740dad052c88902a 测试/屏幕录制 2026-06-18 221037.mp4`
  - 目标参考视频：`参考视频.mp4`
- 约束：
  - 按用户要求，每完成一小阶段任务后更新本文件。
  - 技术框架/路线复核按 `brooks-review` 技能执行，先诊断风险，再给补救建议。
  - 当前工作区已有大量历史分析图片处于删除状态，视为既有改动，不回滚、不覆盖。
- 本轮目标：
  - 熟悉项目结构与当前实现。
  - 用 ffmpeg 对测试视频与参考视频提取帧、关键片段和元数据，做逐帧/抽样对比。
  - 判断当前框架是否足以实现目标参考效果，以及是否应转向 WebGL/Three.js + MediaPipe 的实时 AR 方案。

## 阶段 2：项目结构与当前实现熟悉

- 时间：2026-06-18 22:20 左右 +08:00
- 已读范围：
  - `README.md`
  - `app/package.json`
  - `app/src/App.tsx`
  - `app/src/components/CameraStage.tsx`
  - `app/src/features/hand-tracking/handTracker.ts`
  - `app/src/features/hand-topology/handTopology.ts`
  - `app/src/features/fingertip-lattice/fingertipLattice.ts`
  - `app/src/features/spatial-template-model/templateMesh.ts`
  - `app/src/features/spatial-template-renderer/*`
  - 相关历史分析文档：`docs/analysis/c9076f2-real-device-reference-comparison.md` 等。
- 当前框架判断：
  - 项目已经使用 React + Vite + TypeScript、MediaPipe Tasks Vision、Three.js/WebGL。
  - 当前运行路径默认使用 `SpatialTemplateCanvas`，几何由双手/单手指尖 lattice 直接生成。
  - 当前空间模板 renderer 使用 `MeshBasicMaterial` 多材质槽；旧的 `LightSheetCanvas` 有 RawShaderMaterial，但不在当前主路径中使用。
  - 当前没有目标需求中的面部区域捕获、低像素粒子化、高饱和黄/绿/青调色、RGB 故障色差 shader。
  - 当前几何没有独立的 `TemplateState` 层，仍把每帧手指尖直接转成闭合体，因此容易出现盒状、管状、闪烁或不受控折叠。
- 视频元数据：
  - 最新测试视频：3800x1946、30fps、36.77 秒、1103 帧。
  - 参考视频：1226x686、30fps、24.53 秒、736 帧。
- 下一步：
  - 建立本轮 ffmpeg 输出目录。
  - 提取测试视频和参考视频全帧、1fps/4fps 接触表和关键区间证据。

## 阶段 3：ffmpeg 全帧提取与证据生成

- 时间：2026-06-18 22:23-22:25 +08:00
- 输出目录：`output/f74f885-frame-analysis-20260618-221723/`
- 已生成：
  - 测试视频全帧：`test_frames_full/test_0001.jpg` 到 `test_1103.jpg`，共 1103 帧。
  - 参考视频全帧：`reference_frames_full/reference_0001.jpg` 到 `reference_0736.jpg`，共 736 帧。
  - 1fps 抽样帧：`test_1fps/`、`reference_1fps/`。
  - 4fps 抽样帧：`test_4fps/`、`reference_4fps/`。
  - 接触表：
    - `sheets/test_contact_1fps.jpg`
    - `sheets/reference_contact_1fps.jpg`
    - `sheets/test_normalized_25.jpg`
    - `sheets/reference_normalized_25.jpg`
    - `sheets/test_segment_000_012_4fps.jpg`
    - `sheets/test_segment_012_024_4fps.jpg`
    - `sheets/test_segment_024_037_4fps.jpg`
    - `sheets/reference_segment_000_012_4fps.jpg`
    - `sheets/reference_segment_012_025_4fps.jpg`
- 说明：
  - 两段视频分辨率、时长和人物动作不同，不适合做逐像素差分。
  - 本轮采用“全帧落盘 + 真实时间接触表 + 归一化 25 格接触表 + 代表性全分辨率单帧”的方式做逐帧人工可读对比。

## 阶段 4：视频对比发现

- 时间：2026-06-18 22:25 左右 +08:00
- 测试视频主要表现：
  - 效果相比早期版本更稳定，持续大面积闪烁已不是主问题。
  - 单手阶段仍会出现青绿色半透明片/小面，例如 `test_frames_full/test_0331.jpg` 和 `test_0541.jpg` 附近。
  - `test_frames_full/test_0781.jpg` 顶栏显示 `2 hands`，但模板未显示，说明“双手识别状态”和“可渲染模板状态”仍会断层。
  - `test_frames_full/test_0901.jpg` 附近出现大体积半透明盒状结构，能看到多面体，但观感是灰绿透明块，不是目标视频中的薄折纸面。
- 参考视频主要特征：
  - 宽条、三角面、薄边、大面板之间切换稳定，属于受控模板状态，不是每帧直接连接指尖。
  - 有非常清晰的白色硬边、折线和分面轮廓。
  - 主视觉材质有强对比：蓝/青/白人脸线稿、白底红色像素块、绿色高对比纹理。
  - 面部内容经过低像素/高对比处理后成为模板纹理，而不是简单把背景视频半透明贴到所有面上。
- 当前缺口：
  - 几何层缺 `TemplateState`：当前是 raw fingertip lattice，目标是受控折叠模板。
  - 材质层缺 custom shader：当前主路径是 `MeshBasicMaterial`，目标需要低像素化、调色、RGB 色差、边缘/折线控制。
  - 采样层缺 face ROI：当前只采样被面片覆盖处的视频，目标要求能稳定捕获用户面部作为纹理来源。
  - 状态层仍有断层：双手识别和模板输出不是同一个稳定状态机。

## 阶段 5：Brooks Review 路线复核

- 时间：2026-06-18 22:26 左右 +08:00
- 模式：PR Review 范围内的技术路线/架构质量复核。
- Scope：当前主运行路径 `CameraStage`、`hand-tracking`、`fingertip-lattice`、`spatial-template-model`、`spatial-template-renderer`，并结合 `f74f885` 测试视频证据。
- Health Score：53/100。
- Findings：
  - Critical：`SpatialTemplateMesh` 名称上已经进入空间模板，但 `templateMesh.ts` 实际只把 `buildFingertipLattice(extractHandTopologyFrame(hands))` 直接透传出去；`fingertipLattice.ts` 直接用 A/B/C/D/E 指尖构建闭合体。结果是盒状/管状/消失，而不是目标折叠状态机。Remedy：新增 `TemplateState` 层，输出 `two-hand-bar`、`two-hand-folded`、`two-hand-triangle`、`thin-edge` 等稳定状态，再由状态生成 mesh。
  - Warning：主路径 `SpatialTemplateCanvas.tsx` 使用 `MeshBasicMaterial` 多材质槽，旧 `light-sheet-renderer` 才有 RawShaderMaterial，但主路径不用。Remedy：把 shader 能力迁移到 spatial renderer，使用自定义 ShaderMaterial/RawShaderMaterial 做人脸纹理、像素化、RGB 色差、调色和边缘。
  - Warning：`CameraStage.tsx` 每帧调用 `setHandsCount` 和 `setRenderInput`，React state 被用作实时渲染数据总线。Remedy：React 只持有 UI 状态；检测结果和 render input 走 imperative renderer/controller ref。
  - Warning：`light-sheet-renderer` 与 `spatial-template-renderer` 并存，旧 shader 测试仍在，但用户可见主路径在另一套 renderer。Remedy：合并或废弃旧 renderer，避免 shader/UV/材质修复落到错误路径。
  - Warning：当前只创建 `HandLandmarker`，没有面部 ROI/FaceLandmarker 管线。目标要求面部画面作为 3D 网格纹理时，必须新增 face capture/source texture 层。

## 阶段 6：验证与结论

- 时间：2026-06-18 22:26 左右 +08:00
- 验证：
  - `npm.cmd test` 通过：19 个测试文件，69 个测试。
  - `npm.cmd run build` 通过。
- 结论：
  - 技术大方向没有错：浏览器端 MediaPipe + Three.js/WebGL 是正确路线。
  - 但当前项目还没有实现用户描述的实时 AR 特效脚本核心：折纸飞机式受控 3D 模板、面部纹理捕获、自定义 shader、双手距离/倾角驱动的稳定缩放旋转。
  - 不建议推倒重写；建议在现有架构上替换主渲染模型：`HandLandmarker + FaceLandmarker/FaceDetector + TemplateState + Spatial Shader Renderer`。

## 阶段 7：效果消失问题根因确认

- 时间：2026-06-18 22:30 左右 +08:00
- 用户补充：正常情况下效果不应该消失。
- 调试结论：
  - 当前 `renderStabilizer` 使用固定 `DEFAULT_HOLD_MS = 520`。
  - 当当前帧 mesh 变为 `hidden` 或一手低质量降级时，超过 520ms 后会清空 `renderInput`。
  - 现有测试 `clears the held template after the hidden gap exceeds the hold window` 正是在验证这个清空行为。
  - `CameraStage` 的顶部手数来自 `deriveGestureAnchorFrame`，实际可渲染 mesh 来自 `buildFingertipLattice`。因此会出现“状态栏显示 2 hands，但渲染层已经 hidden/null”的断层。
- 修复方向：
  - 让 stabilizer 区分“没有手/离开画面”和“仍有手但当前 lattice 无效”。
  - 只在没有活动手势时允许超时清空；当仍检测到手时，应保持最近的可见模板直到新模板到来。

## 阶段 8：效果不应消失的状态修复

- 时间：2026-06-18 22:31 左右 +08:00
- TDD RED：
  - 在 `renderStabilizer.test.ts` 新增用例：当 hidden gap 超过原 520ms hold window，但 `activeHandCount=2` 时，上一帧可见模板仍必须保持。
  - 目标测试先失败，失败表现为 `renderInput` 被清空。
- 实现：
  - `SpatialTemplateRenderInput` 新增 `activeHandCount`。
  - `CameraStage` 从 `deriveGestureAnchorFrame` 得到活动手数，并传给 `createSpatialTemplateRenderInput`。
  - `renderStabilizer` 在 `activeHandCount > 0` 且当前帧是 hidden/低质量降级时，持续持有上一帧可见模板，不再按 520ms 清空或降低透明度。
  - 当 `activeHandCount = 0` 时，仍保留原有超时清空行为，避免用户离开画面后永久残留。
- 验证：
  - 目标测试通过：`renderStabilizer.test.ts` 与 `renderInput.test.ts` 共 9 个测试通过。
  - 全量测试通过：19 个测试文件，70 个测试。
  - 生产构建通过：`npm.cmd run build`。
- 影响范围：
  - 解决“仍有手时效果突然消失”的状态策略问题。
  - 不改变当前几何模型本身；折纸/飞机式形态和 shader 材质仍属于下一阶段工作。

## 阶段 9：完美复刻目标参考视频的实施规划

- 时间：2026-06-18 规划阶段
- 已新增计划文档：`docs/superpowers/plans/2026-06-18-reference-effect-replication.md`
- 规划目标：
  - 在现有 React/Vite、MediaPipe、Three.js/WebGL 基础上复刻参考视频效果。
  - 保证活动手势期间效果不消失。
  - 用 `TemplateState` 替代 raw fingertip lattice 直连渲染。
  - 用受控 3D 模板 mesh 生成宽条、三角折面、薄边、一手楔形等状态。
  - 新增 face texture source，为 shader 提供稳定面部 ROI。
  - 将 `SpatialTemplateCanvas` 从 `MeshBasicMaterial` 路线升级到自定义 shader 路线。
  - 用 FFmpeg 全帧提取和接触表做真实设备验收。
- 推荐执行顺序：
  1. 固化不消失策略。
  2. 新增 `template-state` 边界。
  3. 新增 canonical reference mesh builder。
  4. 新增 face texture source。
  5. 新增 reference shader source。
  6. 集成主渲染路径。
  7. 真实设备录屏与 FFmpeg 对比验收。
- 验收重点：
  - 活动手势期间无消失。
  - 双手距离和倾斜角控制缩放、旋转、折叠。
  - 形态不再是半透明盒体，而是参考视频中的薄折面/三角面/长条。
  - 白色硬边和分面折线稳定可见。
  - 面部纹理经过低像素、高饱和、RGB 色差处理后清晰出现在模板面上。

## 阶段 10：Subagent-Driven 执行前确认

- 时间：2026-06-18 继续执行阶段
- 结论：
  - 不需要推倒重写当前项目；React/Vite、MediaPipe、Three.js/WebGL、测试体系都可继续使用。
  - 为了复刻参考视频，最高效可行路线是 Subagent-Driven：每个阶段独立实现、独立复核，再由主线程集成。
  - 当前普通 checkout 位于 `main`，已切换到 `codex/reference-effect-replication` 分支承载后续工作；没有推送远端。
  - 子代理工具可用，worker 会使用 forked workspace 执行代码任务，适合按计划拆分实现。
- 风险控制：
  - 工作区已有大量 `assets/analysis/...` 删除状态，视为既有改动，后续不会回滚或纳入本次实现。
  - 每个阶段继续只修改计划中指定文件，并在完成后更新本进展文档。

## 阶段 11：Task 1 不消失契约复核与基线验证

- 时间：2026-06-18 Task 1 收口阶段
- 规格复核：
  - 子代理独立检查 `renderStabilizer.test.ts`、`renderStabilizer.ts`、`renderInput.ts`、`CameraStage.tsx`。
  - 结论：符合 Task 1 规格，未发现缺项。
  - 证据：`activeHandCount` 已进入 `SpatialTemplateRenderInput`，`CameraStage` 从 `deriveGestureAnchorFrame` 得到活动手数并传入 render input。
  - 证据：`renderStabilizer` 在 `activeHandCount > 0` 且下一帧为 hidden/低保真降级时，继续持有上一帧可见模板，不再受 520ms 清空窗口限制。
- Brooks Review 质量复核：
  - 结论：Health Score 100/100。
  - 未发现 Critical、Warning、Suggestion 级别 finding。
  - no-hands 超时清空行为仍保留，并由测试覆盖。
- 本地主线程验证：
  - `npm.cmd test -- src/features/spatial-template-renderer/renderStabilizer.test.ts src/features/spatial-template-renderer/renderInput.test.ts` 通过，2 个测试文件、9 个测试。
  - `npm.cmd test` 通过，19 个测试文件、70 个测试。
  - `npm.cmd run build` 通过。
  - `git diff --check` 无 whitespace error，仅有 Windows LF/CRLF 提示。
- 结论：
  - “有活动手势时效果不应消失”的状态契约已经锁定，可以作为后续 TemplateState 和参考 shader renderer 的基线。

## 阶段 12：Task 2 TemplateState 领域边界

- 时间：2026-06-18 Task 2 实施与复核阶段
- 新增文件：
  - `app/src/features/template-state/types.ts`
  - `app/src/features/template-state/deriveTemplateState.ts`
  - `app/src/features/template-state/deriveTemplateState.test.ts`
- 实现内容：
  - 新增 `TemplateState`、`TemplateMode`、`TemplateMaterialPreset`、`FingertipQuality` 和 `DeriveTemplateStateInput`。
  - `deriveTemplateState` 现在把活动手数、左右手锚点、投影高度、指尖质量和上一个状态转换成稳定模板状态。
  - 当手仍活跃但当前指尖质量无效时，保持上一个可见状态并恢复完整 opacity。
  - 新增 signed `depthDelta = rightZ - leftZ`，保留左右手谁更靠近摄像头的信息；`depthTilt` 继续表示绝对倾斜强度。
  - `thin-edge`、`triangle-fold`、`wide-blue-face`、`white-card-face`、`green-cyan-face`、`one-hand-wedge` 均有明确派生或返回路径。
  - 材质映射改为 exhaustive switch，避免后续新增 mode 时静默落到错误材质。
- TDD 过程：
  - 初始 Task 2 测试覆盖 invalid quality 持有、thin-edge 选择和 triangle-fold 选择。
  - Brooks 质量复核发现 `depthTilt` 丢失方向，以及 `white-card-face` / `green-cyan-face` 不可达。
  - 先新增 failing tests：signed depth direction、compact white-card、mid-height green-cyan。
  - 目标测试先失败，再实现 `depthDelta` 和 mode/material 补齐后变绿。
- 复核结果：
  - 规格复核：通过，确认 `leftAnchor` 缺失但 `activeHandCount > 0` 时保留活动手数是合理的，因为它区分“有手但锚点不可用”和“无手”。
  - 初次 Brooks Review：Health Score 87/100，要求先修 signed depth 后再进入 mesh。
  - 修复后 Brooks Review：Health Score 100/100，无 Critical、Warning、Suggestion finding。
  - `NormalizedPoint` 仍按计划从 `shared/runtime/types` type-only 引入；共享类型拆分属于后续可选整理，不在 Task 2 扩大范围。
- 验证：
  - `npm.cmd test -- src/features/template-state/deriveTemplateState.test.ts` 通过，1 个测试文件、6 个测试。
  - `npm.cmd test` 通过，20 个测试文件、76 个测试。
  - `npm.cmd run build` 通过。
  - `git diff --check` 无 whitespace error，仅有 Windows LF/CRLF 提示。
- 结论：
  - Task 2 已具备进入 Task 3 canonical reference mesh builder 的条件；后续网格可使用 `depthDelta` 做左右镜像折叠方向，而不必在 renderer 层补救。

## 阶段 13：Task 3 受控参考网格生成

- 时间：2026-06-18 Task 3 实施与复核阶段
- 新增/修改文件：
  - `app/src/features/spatial-template-model/referenceTemplateMesh.ts`
  - `app/src/features/spatial-template-model/referenceTemplateMesh.test.ts`
  - `app/src/features/spatial-template-model/types.ts`
- 实现内容：
  - 新增 `buildReferenceTemplateMesh(state)`，从 `TemplateState` 生成受控空间模板网格。
  - 新增材质 id：`face-blue`、`face-card`、`face-green`、`edge-white`、`glass-clear`。
  - 支持 `wide-blue-face`、`triangle-fold`、`thin-edge`、`white-card-face`、`green-cyan-face`、`one-hand-wedge` 和 hidden/invisible 状态。
  - 使用 `state.rotation` 把局部几何旋转到显示坐标。
  - 使用 signed `state.depthDelta` 控制折叠深度方向，保留左右镜像折叠能力。
  - hidden/invisible/opacity 为 0 时返回空 mesh。
- TDD 与修复：
  - worker 先实现并提交 Task 3 主体。
  - 主线程构建发现 TypeScript 不可达分支：guard 已排除 `hidden` 后，`switch` 中再写 `case 'hidden'` 不可比较；已移除该分支。
  - 规格复核发现 rotation transform 已实现但缺少非零角度测试。
  - 已新增 `rotates local mesh points around the template center` 测试，确认 `rotation: Math.PI / 2` 时宽条变为高条。
- 复核结果：
  - 初次规格复核：实现本身满足网格需求，但因缺少 rotation 覆盖，严格视为不完整。
  - 修复后规格复核：Health Score 100/100，Task 3 spec compliant，无 blocker。
  - Brooks Review：Health Score 100/100，无 Critical、Warning、Suggestion finding。
  - renderer material slot 映射暂不在 Task 3 修改；已记录为 Task 6 集成前必须处理，否则新 material id 会回落到 slot 0。
- 验证：
  - `npm.cmd test -- src/features/spatial-template-model/referenceTemplateMesh.test.ts src/features/template-state/deriveTemplateState.test.ts` 通过，2 个测试文件、14 个测试。
  - `npm.cmd test` 通过，21 个测试文件、84 个测试。
  - `npm.cmd run build` 通过。
  - `git diff --check` 无 whitespace error，仅有 Windows LF/CRLF 提示。
- 结论：
  - 几何层已经从 raw fingertip lattice 迈向可控折纸/三角/薄边模板；下一步可以独立推进 face texture source 和 reference shader。

## 阶段 14：Task 4 人脸纹理 ROI 源

- 时间：2026-06-18 Task 4 实施与复核阶段
- 新增文件：
  - `app/src/features/face-texture/faceTextureSource.ts`
  - `app/src/features/face-texture/faceTextureSource.test.ts`
- 实现内容：
  - 新增 `FaceRoi` 类型，使用 normalized `{ x, y, width, height }` 表示人脸纹理裁剪区域。
  - 新增 `fallbackFaceRoi()`，默认返回 `{ x: 0.34, y: 0.12, width: 0.32, height: 0.42 }`，作为没有 face detector 时的中心偏上人脸区域。
  - 新增 `clampFaceRoi()`，确保 ROI 不越出 0..1 的视频范围。
  - 新增 `smoothFaceRoi(previous, next, amount)`，用于后续低频 face ROI 更新时平滑纹理区域。
- TDD 与复核修复：
  - worker 先以缺失模块作为 RED，实现 clamp、smooth、fallback 后目标测试变绿。
  - Brooks 复核指出 `smoothFaceRoi` 对 `amount` 不设边界会在 tab resume 或相机卡顿时外推 ROI。
  - 已新增越界测试，确认 `amount < 0` 回到 previous，`amount > 1` 回到 next；实现中将 `amount` clamp 到 `[0, 1]`。
- 复核结果：
  - Task 4 规格复核通过，确认纯模块、无 DOM/Three.js 依赖。
  - 最新 Brooks Review：Health Score 100/100，无 Critical、Warning、Suggestion finding。
- 验证：
  - `npm.cmd test -- src/features/face-texture/faceTextureSource.test.ts` 通过，1 个测试文件、4 个测试。
  - 与 Task 5 一起执行的全量 `npm.cmd test` 通过，24 个测试文件、96 个测试。
  - `npm.cmd run build` 通过。
  - `git diff --check` 无 whitespace error，仅有 Windows LF/CRLF 提示。
- 结论：
  - 人脸纹理裁剪的纯数据层已经准备好；Task 6 集成时可以先用 fallback ROI，再按需要接入 FaceLandmarker/FaceDetector。

## 阶段 15：Task 5 参考效果 Shader 与材质 mode 合同

- 时间：2026-06-18 Task 5 实施与复核阶段
- 新增/修改文件：
  - `app/src/features/spatial-template-renderer/referenceShaderSource.ts`
  - `app/src/features/spatial-template-renderer/referenceShaderSource.test.ts`
  - `app/src/features/spatial-template-renderer/referenceMaterialModes.ts`
  - `app/src/features/spatial-template-renderer/referenceMaterialModes.test.ts`
  - `docs/superpowers/plans/2026-06-18-reference-effect-replication.md`
- 实现内容：
  - 新增 `REFERENCE_VERTEX_SHADER` 和 `REFERENCE_FRAGMENT_SHADER` 静态 shader source。
  - shader 暴露 `uSceneTexture`、`uFaceTexture`、`uOpacity`、`uTime`、`uPixelSize`、`uGlitchAmount`、`uMaterialMode`。
  - fragment shader 包含 `pixelateUv`、`paletteMap`、`rgbGlitch`，并以 `uFaceTexture` 作为低像素化、调色和 RGB 色差的主来源。
  - `uSceneTexture` 仅作为很轻的环境 backlight 混合，不再驱动主纹理效果。
  - modes 1/2/3 保留 `paletteColor` 作为人脸派生主基底，分别调制蓝面、白红卡面、绿青面；mode 4 保留为白色边缘材质。
  - 新增 `REFERENCE_MATERIAL_MODES` 和 `materialModeForTemplateMaterial()`，把 `face-blue`、`face-card`、`face-green`、`edge-white` 映射为稳定 shader mode。
  - shader 中的 GLSL `MATERIAL_MODE_*` 常量由同一份 `REFERENCE_MATERIAL_MODES` 生成，测试也从同一常量断言，避免 Task 6 集成时裸数字漂移。
- TDD 与复核修复：
  - 初始 worker 版本满足静态 shader 合同，但 RGB glitch 采样的是 `uSceneTexture`；主线程新增失败测试后改为采样 `uFaceTexture`。
  - 规格复核指出材质分支会覆盖人脸像素化主效果；已新增测试并改为 modes 1/2/3 都以 `paletteColor` 为主基底。
  - Brooks 复核指出材质 mode 裸数字可能漂移；已新增 `referenceMaterialModes` 合同，并把 shader GLSL 常量从该合同生成。
  - shader 单元测试补齐 `uOpacity`、`uTime`、face texture 主来源、material mode 分支和 palette 基底约束。
- 复核结果：
  - 规格复核：Health Score 100/100，确认四个 prior findings 均关闭。
  - 最新 Brooks Review：Health Score 100/100，无 Critical、Warning、Suggestion finding。
  - 残余风险：当前仍是字符串/TypeScript 合同测试，真实 WebGL shader compile smoke 应放到 Task 6 renderer 集成阶段完成。
- 验证：
  - `npm.cmd test -- src/features/spatial-template-renderer/referenceShaderSource.test.ts src/features/spatial-template-renderer/referenceMaterialModes.test.ts` 通过，2 个测试文件、8 个测试。
  - `npm.cmd test -- src/features/face-texture/faceTextureSource.test.ts` 通过，1 个测试文件、4 个测试。
  - `npm.cmd test` 通过，24 个测试文件、96 个测试。
  - `npm.cmd run build` 通过。
  - `git diff --check` 无 whitespace error，仅有 Windows LF/CRLF 提示。
- 结论：
  - 参考视频所需的低像素人脸纹理、黄/绿/青高对比调色、RGB 色差和稳定材质 mode 合同已经在静态 shader 层锁定；下一步可以进入 Task 6，把 TemplateState、reference mesh、face ROI 和 shader material 接入 `SpatialTemplateCanvas` 主渲染路径。

## 阶段 16：Task 6 主渲染路径集成

- 时间：2026-06-18 Task 6 实施与复核阶段
- 修改/新增文件：
  - `app/src/components/CameraStage.tsx`
  - `app/src/features/spatial-template-model/types.ts`
  - `app/src/features/spatial-template-model/templateMesh.ts`
  - `app/src/features/spatial-template-model/templateMesh.test.ts`
  - `app/src/features/spatial-template-model/referenceTemplateMesh.ts`
  - `app/src/features/spatial-template-model/referenceTemplateMesh.test.ts`
  - `app/src/features/spatial-template-renderer/renderInput.ts`
  - `app/src/features/spatial-template-renderer/renderInput.test.ts`
  - `app/src/features/spatial-template-renderer/rendererCore.ts`
  - `app/src/features/spatial-template-renderer/rendererCore.test.ts`
  - `app/src/features/spatial-template-renderer/SpatialTemplateCanvas.tsx`
  - `app/src/features/spatial-template-renderer/referenceMaterials.ts`
  - `app/src/features/spatial-template-renderer/referenceMaterials.test.ts`
  - `app/src/features/spatial-template-renderer/referenceShaderSource.ts`
  - `app/src/features/spatial-template-renderer/referenceShaderSource.test.ts`
  - `app/src/features/template-state/deriveTemplateState.ts`
  - `app/src/features/template-state/deriveTemplateState.test.ts`
  - `docs/superpowers/plans/2026-06-18-reference-effect-replication.md`
- 实现内容：
  - 主生产路径已从 raw fingertip lattice 改为 `TemplateState -> buildReferenceTemplateMesh -> shader renderer`。
  - `templateMesh.ts` 现在负责集成手势 anchor、hand topology、TemplateState 和 reference mesh；旧 lattice 不再作为可见 mesh 输出。
  - `renderInput` 新增 `templateState` 和 `faceRoi`，并让 `activeHandCount` 来自 `TemplateState`，避免 duplicate hand collapse 后状态不一致。
  - `CameraStage` 新增 `templateStateRef`，每帧向 render input 传入上一帧 TemplateState；视频不可渲染或停止相机时同步重置。
  - `SpatialTemplateCanvas` 从 `MeshBasicMaterial` 切换为 shader materials，统一更新 live video texture、face texture、opacity、time、pixel size、glitch amount 和 face ROI uniforms。
  - `rendererCore` 新增稳定材质槽数组，`face-blue`、`face-card`、`face-green`、`edge-white`、`glass-clear` 不再回落到 slot 0。
  - 新增 `faceUv` attribute：scene/video UV 和 face-local UV 分离，face ROI 按 canonical local surface 铺到 reference mesh 上。
  - reference mesh 顶点新增 canonical `faceUv`，在旋转前基于局部几何生成；rendererCore 优先使用该 `faceUv`，仅 legacy mesh 缺失时 fallback 到 bounds。
  - shader `uTime` 改为秒单位，避免毫秒输入导致 glitch/card band 过快闪烁。
- TDD 与复核修复：
  - 先写失败测试覆盖：renderInput 输出 reference mesh、activeHandCount/templateState 一致、material slot、新 shader uniforms、reference materials、invalid fingertips 与 previous state。
  - 初次实现后 Brooks 复核指出三个 warning：face UV 与 scene UV 混用、reference route 仍受旧 lattice hidden 语义控制、`uTime` 时间单位不一致。
  - 已修复为独立 canonical face-local UV、anchor/hand-count 优先的 degraded template、秒单位 `uTime`。
  - 后续 Brooks 复核又指出 invalid fingertips + previous state 会冻结 pose；已改为保留上一帧 shape/mode/fold/material，但用当前 anchors 更新 center/span/rotation/depthDelta。
- 浏览器验证：
  - 生产 preview 服务：`http://127.0.0.1:4176/gesture-mask-studio/`。
  - in-app Browser 页面 smoke 通过：标题为 `Gesture Mask Studio`，`Start camera` 可见，无 framework overlay，无 console warn/error。
  - 交互 proof：`Mirror` 按钮从 `aria-pressed=true` 切换为 `false`，控制台仍无 warn/error。
  - 尝试通过 `data:` 页面做 WebGL shader compile smoke 被 Browser 安全策略阻止；按策略未绕过。真实 shader 编译与摄像头纹理效果需进入 Task 7 实机验证。
- 复核结果：
  - 最终规格复核：Health Score 100/100，无 Critical、Warning、Suggestion finding。
  - 最终 Brooks Review：Health Score 100/100，无 Critical、Warning、Suggestion finding。
  - 残余风险：代码级 blocker 已清除；剩余风险集中在真实浏览器/WebGL shader compile、摄像头 face ROI、pixel size、glitch amount、旋转/缩放手感的实机视觉校准。
- 验证：
  - `npm.cmd test -- src/features/template-state/deriveTemplateState.test.ts src/features/spatial-template-model/referenceTemplateMesh.test.ts src/features/spatial-template-renderer/renderInput.test.ts src/features/spatial-template-renderer/rendererCore.test.ts src/features/spatial-template-renderer/referenceMaterials.test.ts` 通过，5 个测试文件、28 个测试。
  - `npm.cmd test -- src/features/template-state/deriveTemplateState.test.ts src/features/spatial-template-renderer/renderInput.test.ts src/features/spatial-template-model/templateMesh.test.ts src/features/spatial-template-renderer/rendererCore.test.ts src/features/spatial-template-renderer/referenceMaterials.test.ts src/features/spatial-template-renderer/referenceShaderSource.test.ts` 通过，6 个测试文件、27 个测试。
  - `npm.cmd test` 通过，25 个测试文件、103 个测试。
  - `npm.cmd run build` 通过。
  - `git diff --check` 无 whitespace error，仅有 Windows LF/CRLF 提示。
- 结论：
  - Task 6 已把参考效果路线接入主渲染路径：可见性不再由 raw fingertip lattice 决定，活动手势期间可生成/保持 reference template，shader material 已进入生产 Canvas。下一步应进入 Task 7，在真实摄像头和 FFmpeg 逐帧对比中校准视觉参数并验证是否接近目标参考视频。

## 阶段 17：敏感分析产物移出 Git 跟踪

- 时间：2026-06-19 敏感文件清理检查阶段
- 范围：
  - `assets/analysis/`
  - `.gitignore`
- 检查结果：
  - `assets/analysis` 当前有 570 个已跟踪文件，工作区已显示为删除状态。
  - 除 `assets/analysis` 外，当前没有其他未提交改动。
  - GitHub 远端为 `https://github.com/Baldman-JYH/gesture-mask-studio.git`，默认分支为 `main`。
  - `gh` 已登录并具备 `repo` 权限；`git-filter-repo` 当前环境未安装。
- 处理计划：
  - 先执行当前树清理：把 `assets/analysis/` 加入 `.gitignore`，并用 `git rm --cached --ignore-unmatch` 从 Git 索引移除该目录。
  - 提交并推送后，远端对应分支的最新文件树将不再包含 `assets/analysis`。
  - 如果这些文件曾经推送到 GitHub 历史中，仅普通删除提交不足以彻底清除历史对象；后续需要执行历史重写并 force push，或按 GitHub sensitive data removal 流程清理缓存和派生引用。
- 执行结果：
  - 已加入 `.gitignore` 规则：`assets/analysis/`。
  - 已执行 `git rm -r --cached --ignore-unmatch assets/analysis`。
  - `git ls-files assets/analysis` 已返回 0 个跟踪文件。
  - `git check-ignore -v assets/analysis/example.jpg` 确认忽略规则生效。
