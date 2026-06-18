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
