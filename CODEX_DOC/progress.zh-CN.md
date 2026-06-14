# Gesture Mask Studio 进展记录

English version: [progress.md](progress.md)

## 2026-06-13 13:00

### 已完成
- 创建隔离项目根目录：`D:\code\AIProjects\ShowProjects\gesture-mask-studio`。
- 创建 `CODEX_DOC/`、`docs/analysis/`、`docs/product/`、`docs/architecture/`、`docs/deployment/`、`assets/video-frames/`、`assets/design/`。
- 确认源 MP4 存在。

### 下一步
- 抽取视频帧并分析浏览器摄像头实现可行性。

## 2026-06-13 13:04

### 已完成
- 使用 FFprobe 读取 MP4 元数据：约 9.45 秒、716x572、30fps、282 帧。
- 抽取 4fps 样本帧、整秒参考帧、运动/场景帧和总览拼图到 `assets/video-frames/`。

### 当前结论
- 效果是手势驱动的实时摄像头合成。
- 光片类似双手之间有透视变形的 2D 平面，包含蓝色技术线稿、白色扑克牌图案、绿色自然/插画纹理等状态。

### 下一步
- 编写结构化视频分析文档。

## 2026-06-13 13:09

### 已完成
- 编写 `docs/analysis/video-effect-analysis.md`。
- 记录视频证据、视觉行为、纹理状态、手势推断、浏览器实现含义、风险和成功标准。

### 关键决策
- 采用手部关键点追踪 + WebGL 纹理变形作为主要实现路线。
- 原视频纹理切换逻辑未知，新产品中定义可重复、确定性的手势规则。

## 2026-06-13 13:15

### 已完成
- 编写 `docs/product/requirements-and-business-logic.md`。
- 编写 `docs/architecture/technical-architecture.md`。

### 关键决策
- 产品名为 `Gesture Mask Studio`。
- MVP 是一页式本地摄像头体验，使用 MediaPipe 手部追踪和 Three.js/WebGL 动态光片渲染。
- MVP 不需要后端或 GPU 服务。

## 2026-06-13 13:20

### 已完成
- 验证 GitHub CLI 已安装并以 `Baldman-JYH` 登录。
- 编写 `docs/deployment/github-pages-evaluation.md`。
- 添加初始 `README.md` 和 `.gitignore`。

### 部署结论
- GitHub Pages 适合该 MVP，因为它提供 HTTPS，可支持摄像头权限、MediaPipe WASM 和 WebGL 静态部署。

## 2026-06-13 13:23

### 已完成
- 初始化本地 git 仓库。
- 创建初始提交 `d49aba9 docs: initialize gesture mask studio planning`。

### 下一步
- 创建 GitHub 远程仓库并推送 `main`。

## 2026-06-13 13:25

### 已完成
- 创建公开 GitHub 仓库：`https://github.com/Baldman-JYH/gesture-mask-studio`。
- 添加 `origin` 并推送 `main`。

### 下一步
- 更新部署文档并继续原型设计。

## 2026-06-13 13:34

### 已完成
- 生成 3 个 Product Design 原型方向：
  - `assets/design/prototype-01-immersive-stage.png`
  - `assets/design/prototype-02-precision-tool.png`
  - `assets/design/prototype-03-performance-lens.png`
- 编写 `docs/product/prototype-directions.md`。

### 设计建议
- MVP 采用 `prototype-01-immersive-stage.png`。
- `prototype-02` 保留为未来高级/调试模式参考。
- `prototype-03` 中的预设栏和状态提示可选择性复用。

## 2026-06-13 13:36

### 已完成
- 提交并推送原型资产和文档。
- Commit：`439f5b1`。

### 当前仓库
- 本地路径：`D:\code\AIProjects\ShowProjects\gesture-mask-studio`。
- GitHub：`https://github.com/Baldman-JYH/gesture-mask-studio`。

## 2026-06-13 13:55

### 已完成
- 重新检查视频帧，修正术语为“手势驱动实时采样光片”。
- 明确效果不是简单遮挡，也不是只渲染人脸；光片覆盖范围内的人、手、衣服、背景都必须实时采样并重新渲染。
- 添加 `docs/architecture/adr-0001-realtime-scene-sampling-light-sheet.md`。
- 更新视频分析、技术架构、需求文档和 README。

### 关键决策
- 光片材质必须组合动态几何、实时视频采样、样式纹理、边缘提取、色调、透明度和高光。
- 未来样式通过 `LightSheetStylePreset` 扩展，不重写摄像头/追踪/渲染管线。

## 2026-06-13 13:58

### 已完成
- 提交并推送修正后的架构决策。
- Commit：`4d9cb6a`。

### 已确认基础
- 项目名可继续使用 `Gesture Mask Studio`。
- 运行时必须采样光片背后的实时摄像头场景。

## 2026-06-13 14:12

### 已完成
- 使用 `$brooks-debt` 做开发前架构技术债评估。
- 添加 `runtime-contracts.md`、`architecture-quality-gate.md`、`brooks-debt-architecture-review.md`。
- 统一架构术语和模块边界：`gesture-engine`、`light-sheet-renderer`、`scene-sampling`、`light-sheet-styles`。

### 关键决策
- 开发前已知架构债应为 0。
- 未来功能必须通过声明的扩展点进入，跨越运行时边界时需新增 ADR。

## 2026-06-13 14:18

### 已完成
- 移除重复的 `LightSheetStylePreset` 定义。
- 确认 `runtime-contracts.md` 是运行时接口唯一事实来源。
- 检查无遗留命名：`features/effects`、`MaskGestureState`、`mask-renderer`、`face-sampling`。

## 2026-06-13 14:20

### 已完成
- 提交并推送架构质量门禁文档。
- Commit：`108e07e`。

### 当前架构状态
- Brooks 技术债评估完成。
- 开发前已知架构债：0。

## 2026-06-13 14:30

### 已完成
- 开始 Superpowers 引导的实施流程。
- 验证当前检出为普通 `main`。
- 将 `.worktrees/` 加入 `.gitignore`。

### 下一步
- 创建隔离实现 worktree。

## 2026-06-13 14:36

### 已完成
- 创建 worktree：`D:\code\AIProjects\ShowProjects\gesture-mask-studio\.worktrees\implement-realtime-light-sheet`。
- 确认 Node.js `v24.13.0` 和 npm `11.6.2`。
- 编写实施计划：`docs/superpowers/plans/2026-06-13-realtime-light-sheet-mvp.md`。

## 2026-06-13 14:42

### 已完成
- 完成任务 1：React + Vite + TypeScript 应用脚手架。
- 完成 App 外壳 TDD RED/GREEN。
- 验证：`npm test` 通过，`npm run build` 通过，`npm audit --omit=dev` 为 0 漏洞。

## 2026-06-13 14:47

### 已完成
- 完成任务 2：运行时契约和样式预设。
- 添加标准运行时类型和 `blueprint`、`cards`、`organic` 三个预设。
- 验证：目标测试 3 个通过，整体测试 4 个通过，构建通过。

## 2026-06-13 14:52

### 已完成
- 完成任务 3：手势引擎几何和状态。
- 实现 `buildTwoHandLightSheetGeometry`、`buildOneHandPreviewGeometry`、`clampNormalizedPoint`、`deriveLightSheetGestureState`。
- 验证：目标手势状态测试 4 个通过，整体测试 12 个通过，构建通过。

## 2026-06-13 14:25

### 已完成
- 完成任务 4：摄像头、手部追踪适配器、场景采样和渲染核心。
- 添加摄像头控制器、MediaPipe 适配器、视频 UV 采样、Three.js 渲染核心和 `LightSheetCanvas`。
- 验证：任务 4 目标测试 9 个通过，整体测试 21 个通过，构建通过。

## 2026-06-13 14:41

### 已完成
- 完成任务 5：摄像头舞台 UI、GitHub Pages workflow 和浏览器验证。
- 实现全屏实时摄像头舞台、顶部状态栏、底部控制 Dock、样式选择、镜像开关和摄像头启动/停止。
- 连接摄像头、MediaPipe、手势几何、场景采样和 Three.js 光片渲染。
- 添加本地 MediaPipe wasm 复制/服务逻辑。
- 浏览器验证覆盖桌面和移动视口、虚拟摄像头、WebGL canvas、预设切换、镜像切换、无横向溢出、无控制台错误和失败请求。
- 验证：`npm test` 23 个通过，`npm run build` 通过。

## 2026-06-13 14:45

### 已完成
- 完成最终验证和 Brooks 风格合并前自审。
- 修复异步 MediaPipe tracker 停止后的陈旧写回风险。
- 修复 MediaPipe dev middleware 路径型文件名风险。
- 添加 `actions/configure-pages@v5`。
- 最终验证：23 个测试通过，生产构建通过，Chrome + Playwright smoke 通过。

## 2026-06-13 14:50

### 已完成
- 将 `implement-realtime-light-sheet` 快进合并到本地 `main`。
- 尝试推送 `main` 到 `origin`。

### 阻塞
- 当时 GitHub 网络连接异常，push 多次失败。

## 2026-06-13 15:04

### 已完成
- 排查 GitHub Pages workflow 失败。
- 确认 Pages site 未启用导致 `actions/configure-pages@v5` 返回 404。
- 通过 GitHub API 启用 Pages workflow 部署。
- 排查并修复 `npm ci` 失败：使用 `npm@10.9.8` 重新生成 `app/package-lock.json`。
- 在 workflow 中添加 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`。
- 本地验证：`npx npm@10.9.8 ci`、`npm test`、`npm run build` 均通过。

## 2026-06-13 15:07

### 已完成
- 推送 workflow/lockfile/进展修复提交：`a27177e fix: stabilize github pages workflow`。
- 确认 GitHub Actions run `27459870548` 成功。
- 确认 Pages URL 可访问：`https://baldman-jyh.github.io/gesture-mask-studio/`，HTTP 200。

## 2026-06-13 15:16

### 已完成
- 添加长期验证方案：`docs/verification/verification-plan.md`。
- 定义规则：每次新增功能或问题修复都必须给出具体验证方案。
- 验证范围覆盖基线命令、部署、实时摄像头、手势效果、控件、权限失败、移动端、浏览器自动化 smoke、变更专项和问题修复模板。

## 2026-06-13 15:25

### 已完成
- 为现有英文项目文档添加中文对应文档。
- 添加 `README.zh-CN.md`。
- 添加中文验证方案、规划、产品、架构、部署和实施计划文档。
- 添加双语文档规范：
  - `docs/documentation-bilingual-policy.md`
  - `docs/documentation-bilingual-policy.zh-CN.md`
- 添加中文进展文档：
  - `CODEX_DOC/progress.zh-CN.md`
- 更新 `README.md` 和 `README.zh-CN.md`，链接中文对应文档。

### 文档规则
- 未来面向使用者和维护者的项目文档必须中英双语维护。
- 英文文档保留原路径。
- 中文对应文档使用相同路径，并在扩展名前增加 `.zh-CN`。
- 如未来只更新一个语言版本，必须在进展文档中记录为未完成，且不能视为文档任务完成。

### 下一步
- 验证所有英文项目文档都有中文对应文档。
- 提交并推送双语文档更新。

## 2026-06-13 15:34

### 已完成
- 验证所有已跟踪英文项目文档都有中文对应文件。
- 验证 `git diff --check` 只报告 Windows 换行提示，没有空白错误。
- 提交双语文档更新：
  - Commit：`7b8a430`
  - Message：`docs: add bilingual documentation`
- 推送 `main` 到 GitHub。
- 确认 GitHub Pages workflow 成功：
  - Run：`27460474005`
  - build job：success
  - deploy job：success

### 本次使用的验证方案
- 文档配对检查：每个英文 `README.md`、`docs/**/*.md` 和 `CODEX_DOC/**/*.md` 文件必须有 `.zh-CN.md` 中文对应文件。
- 空白检查：`git diff --check`。
- 部署检查：`gh run watch 27460474005 --exit-status`。

### 下一步
- 后续所有文档、功能或问题修复工作，都要同时更新英文和中文文档，并给出具体验证方案。

## 2026-06-13 15:53

### 已完成
- 排查真实设备反馈：摄像头能打开，但没有看到光片效果。
- 根因：
  - MediaPipe 启动日志属于信息/警告，不是致命错误。
  - 真正阻塞效果的是 `THREE.WebGLProgram: Shader Error`，即光片 fragment shader 编译失败。
  - 浏览器级 shader 编译测试证明，最初基于 extension 的假设在 WebGL1 可通过，但在 WebGL2 会失败。
  - 最终根因：fragment shader 依赖 `fwidth()`，该函数在 Chrome/Edge 当前 WebGL2/GLSL 1.00 路径下不可移植。
- 修复 shader 可移植性：
  - 移除依赖 derivatives 的 `fwidth()`；
  - 改为固定宽度 `smoothstep` 网格逻辑；
  - 添加 `shaderSource.test.ts`，防止再次引入 derivative-only shader 函数。
- 修正产品行为偏差：
  - 默认 UI 移除手动 Blueprint/Cards/Organic 页签按钮；
  - 样式默认由手势驱动选择；
  - 底部控制栏显示当前 `Auto` 样式状态；
  - 模型 ready 但未检测到手时，顶部状态显示 `No hands`。
- 更新中英文文档：
  - README；
  - 需求与业务逻辑；
  - 技术架构；
  - 验证方案。

### 验证
- 修复前按 TDD 确认 RED：
  - shader 可移植性测试因 `fwidth()` 失败；
  - 手势自动样式选择测试失败；
  - UI 测试因仍存在手动预设页签失败；
  - `No hands` 状态测试失败。
- 修复后自动化检查：
  - 目标测试：10 个通过；
  - `npm test`：26 个通过；
  - `npm run build`：通过。
- 浏览器/WebGL 检查：
  - 系统 Chrome WebGL 编译/link 测试在 WebGL1 和 WebGL2 下均通过；
  - 本地 Browser 检查 `http://127.0.0.1:5174/gesture-mask-studio/` 显示 `Auto` 状态，且无手动预设按钮；
  - fake camera smoke 进入 `Stop camera`，挂载 1 个 WebGL canvas，且无 shader error。
- 剩余真实设备检查：
  - 部署后需要在有摄像头的电脑上分别展示一只手和两只手，验证光片出现和样式自动切换。

## 2026-06-13 15:57

### 已完成
- 提交并推送渲染修复：
  - Commit：`cad0446`
  - Message：`fix: restore light sheet rendering`
- 确认 GitHub Pages workflow 成功：
  - Run：`27460970039`
  - build job：success
  - deploy job：success

### 说明
- GitHub Actions 仍会显示第三方 actions 的 Node.js 20 deprecation annotation，但 workflow 已强制使用 Node.js 24，并且本次运行成功。
- 下一轮真实设备验证应在部署地址强制刷新后，重新测试手势驱动渲染。

## 2026-06-13 16:29

### 已完成
- 对基于提交 `cad0446f108e5873c13a44582709af8191474a0a` 的真实设备验证视频与原始参考视频进行了对比分析。
- 使用 FFmpeg 抽取对比证据：
  - 测试视频 74 张 1fps 连续帧；
  - 参考视频 38 张 4fps 连续帧；
  - 1fps/4fps/8fps 总览拼图，以及三个 6fps 测试动态片段。
- 读取浏览器控制台日志，确认已经没有 `THREE.WebGLProgram: Shader Error`。
- 新增中英文分析文档：
  - `docs/analysis/cad0446-real-device-video-comparison.md`
  - `docs/analysis/cad0446-real-device-video-comparison.zh-CN.md`

### 结论
- `cad0446` 的 shader 修复有效；当前剩余问题是视觉拟真度和架构问题，不是 WebGL 编译失败。
- 参考视频更像手势锚定的三维模板/折叠光带，具有多面纹理、透视、边缘高光和翻转/旋转行为。
- 当前实现更像扁平二维屏幕空间三角形/四边形光片，虽然有实时视频采样，但不足以复现参考视频。
- 左右反转是坐标空间 bug：视频预览通过 CSS 镜像，但手部 landmark 没有在几何生成前镜像。

### 下一步
- 用单元测试和真实设备验证清单修复镜像坐标 bug。
- 准备新的架构决策，用手势锚定三维纹理模板模型替代当前扁平 `LightSheetGeometry` 主线。

## 2026-06-13 16:41

### 已完成
- 新增有测试覆盖的 `features/coordinate-space` 模块，用于区分 camera-space 追踪结果和 display-space 可见几何。
- 修复镜像 bug：在进入 `deriveLightSheetGestureState` 前，先把手部 landmark 转换到显示坐标。
- 保留现有镜像视频 UV 采样路径，使渲染纹理仍能正确映射源摄像头画面。
- 新增架构决策文档：
  - `docs/architecture/adr-0002-hand-anchored-3d-template-model.md`
  - `docs/architecture/adr-0002-hand-anchored-3d-template-model.zh-CN.md`
- 更新运行时契约和 README，补充 `coordinate-space`、真实设备视频对比和 ADR-0002。
- 将 `测试记录/` 加入 `.gitignore`，避免真实设备原始录像和控制台日志被误推送到公开仓库。

### TDD 证据
- RED：`npm test -- src/features/coordinate-space/displaySpace.test.ts` 因 `./displaySpace` 不存在而失败。
- GREEN：实现最小坐标转换后，`npm test -- src/features/coordinate-space/displaySpace.test.ts` 通过，3 个测试通过。
- 相关采样回归检查通过：
  - `npm test -- src/features/scene-sampling/screenSpaceSampling.test.ts src/features/light-sheet-renderer/rendererCore.test.ts`

### 本次变更验证方案
- 自动化：
  - 运行 coordinate-space 目标测试；
  - 运行 scene-sampling 和 renderer-core 测试；
  - 运行完整 `npm test`；
  - 运行 `npm run build`；
  - 运行 `git diff --check`；
  - 验证每个新增英文文档都有 `.zh-CN.md` 中文对应文件。
- 仓库卫生：
  - 原始 `测试记录/` 文件只保留在本地；
  - 只提交 `assets/analysis/` 下的派生分析证据。
- 真实设备：
  - 部署后强制刷新 GitHub Pages 页面；
  - 保持 Mirror 开启，左右移动一只手；
  - 确认渲染效果与手部可见移动方向一致；
  - 关闭 Mirror 后重复一次；
  - 录制短视频，与已抽取拼图继续对比。

### 下一步
- 运行完整验证。
- 如果验证通过，提交并推送镜像修复和 ADR-0002。
- 部署后执行真实设备左右方向验证。

### 验证结果
- `npm test`：29 个测试通过。
- `npm run build`：通过。
- 项目文档配对检查：所有英文项目文档都有 `.zh-CN.md` 中文对应文件。
- `git diff --check`：只有 Windows 换行提示，没有空白错误。
- 浏览器 smoke，地址 `http://127.0.0.1:5174/gesture-mask-studio/`：
  - 标题数量：1；
  - `Start camera` 按钮数量：1；
  - `Mirror` 按钮数量：1；
  - `Mirror` 默认 `aria-pressed`：`true`；
  - 控制台 error 日志：0。
- 提交与部署：
  - Commit：`3774e09 fix: align mirrored gesture coordinates`；
  - GitHub Actions run：`27462088325`；
  - build job：success；
  - deploy job：success。

### 部署说明
- GitHub Actions 仍会显示第三方 action 的 Node.js 20 deprecation annotation。
- workflow 已强制这些 actions 在 Node.js 24 下运行，并且部署已成功完成。
- 剩余必须验证项是真实设备移动方向：Mirror 开/关、手部左右移动，并录制短视频继续对比。

## 2026-06-13 17:35

### 已完成
- 分析了基于提交 `e79f74f257c80db9ae39c2b0d3e0b47425a31609` 的真实设备录屏。
- 使用 FFmpeg 抽取证据：
  - 真实设备录屏 179 张 1fps 连续帧；
  - 1 张 1fps 总览拼图；
  - 20s-40s、60s-85s、120s-145s 三个 4fps 片段拼图。
- 根据控制台截图确认，本次测试中已经没有之前的 WebGL shader 编译错误。
- 确认当前剩余可见缺陷是光片内部采样内容上下反向，不是左右移动方向，也不是光片几何位置。
- 新增中英文分析文档：
  - `docs/analysis/e79f74f-real-device-vertical-comparison.md`
  - `docs/analysis/e79f74f-real-device-vertical-comparison.zh-CN.md`

### 根因
- `display-space` 几何坐标中，`y = 0` 表示画面顶部，`y = 1` 表示画面底部。
- WebGL 顶点位置转换已经正确：`clipY = 1 - displayY * 2`。
- 问题出在 display-space 到 Three.js 视频纹理的映射：之前使用 `v = y`，在当前渲染路径下会采样到视频纹理垂直相反的一侧。
- 正确映射应为 `videoV = 1 - displayY`；水平镜像仍然是独立的 `x` 方向规则。

### TDD 证据
- RED：先更新 `screenSpaceSampling.test.ts` 和 `rendererCore.test.ts` 的期望 UV 行为后，目标测试失败，因为实现仍返回 `v = y`。
- GREEN：把 `toVideoUv` 修改为返回 `v = 1 - y` 后，目标测试通过：
  - `npm test -- src/features/scene-sampling/screenSpaceSampling.test.ts src/features/light-sheet-renderer/rendererCore.test.ts`
  - 2 个测试文件通过，6 个测试通过。

### 本次变更验证方案
- 自动化：
  - 重新运行 scene-sampling 和 renderer-core 目标测试；
  - 运行完整 `npm test`；
  - 运行 `npm run build`；
  - 运行中英文文档配对检查；
  - 运行 `git diff --check`。
- 浏览器 smoke：
  - 加载本地 Vite 页面；
  - 确认应用外壳渲染正常，摄像头启动前没有 console error。
- 部署后的真实设备验证：
  - 强制刷新 GitHub Pages 页面；
  - 保持 Mirror 开启，移动手部左/右/上/下；
  - 验证左右方向仍然一致；
  - 验证光片内部采样内容不再上下反向；
  - 关闭 Mirror 后重复；
  - 录制短视频作为后续对比证据。

### 验证结果
- 目标 UV/renderer 测试：2 个测试文件通过，6 个测试通过。
- 完整测试：10 个测试文件通过，29 个测试通过。
- 生产构建：通过。
- 中英文文档配对检查：通过。
- `git diff --check`：无空白错误；只有 Windows 换行提示。
- 本地浏览器 smoke，地址 `http://127.0.0.1:5174/gesture-mask-studio/`：
  - 页面标题：`Gesture Mask Studio`；
  - 一级标题：`Gesture Mask Studio`；
  - `Start camera` 按钮可见；
  - Mirror 图标按钮存在，且 `aria-pressed="true"`；
  - console error 日志：0。

### 三维效果状态
- 当前运行时仍然是扁平的屏幕空间光片。
- 指尖锚定三维模板行为已经作为 ADR-0002 记录，应该作为下一阶段架构能力实现，不应混入本次收敛的 UV bug 修复。

### 提交与部署
- Commit：`d6c8f95 fix: correct vertical video sampling`。
- GitHub Actions run：`27463350449`。
- build job：success。
- deploy job：success。
- GitHub 仍然报告第三方 action 的 Node.js 20 deprecation annotation，但 workflow 已强制使用 Node.js 24，并且本次运行成功完成。

## 2026-06-13 18:08

### 已完成
- 开始对基于提交 `c9076f2f94c8c8117356d2ea8186bccc6f1c46f1` 的真实设备验证进行系统化调试。
- 确认输入视频：
  - 最新真实设备录屏：1896x762，30fps，116.31 秒，3485 个视频帧；
  - 新参考视频：1226x686，30fps，24.58 秒，736 个视频帧。
- 使用 FFmpeg 在 `assets/analysis/c9076f2-real-device-offset-comparison/` 下抽取证据：
  - 最新真实设备录屏 117 张 1fps 连续帧；
  - 3 张真实设备 4fps 分段拼图；
  - 新参考视频 50 张 2fps 连续帧；
  - 1 张参考视频 4fps 总览拼图。

### 下一步
- 对比抽帧证据并分类：
  - 单手出现光片是 bug 还是预览态；
  - 剩余偏移是否属于坐标空间/布局映射问题；
  - 新参考视频与当前扁平光片实现的差异。

### 发现
- 新参考视频展示的是手指锚定三维模板，包含透视、多面材质变化、折叠和指尖驱动移动。
- 当前实现仍然是扁平二维屏幕空间光片，只能近似实时采样，无法完整复现参考视频行为。
- 最新真实设备测试中，上下颠倒问题已经修正。
- 当前剩余的可见偏移符合 `object-fit: cover` 根因：可见摄像头预览被 CSS 裁剪/缩放，但 WebGL 仍按完整摄像头纹理直接采样。
- 单手预览是早期原型行为。对于当前部署的二维光片，一只手不应渲染光片。

### TDD 证据
- RED：
  - `toVideoUv` 的 object-fit cover 测试失败，因为 UV 映射没有使用 viewport/video 尺寸；
  - renderer UV 测试失败，因为 renderer 仍然只传入 `mirrored`；
  - 单手手势测试失败，因为一只手仍然进入 `one-hand-preview`。
- GREEN：
  - 实现 cover-aware 视频 UV 映射；
  - 从 `LightSheetCanvas` 向 renderer UV 生成传入 viewport/video 尺寸；
  - 将单手手势状态改为 `hidden`；
  - 目标测试通过：3 个测试文件，14 个测试通过。

### GREEN 后重构
- 从当前二维运行时中移除未使用的 `one-hand-preview` 模式和单手几何构造器。
- 明确当前部署行为：只有确认到两只手时才渲染二维光片；零只或一只手都渲染隐藏几何。
- 相关目标测试通过：4 个测试文件，17 个测试通过。

### 验证结果
- 完整测试：10 个测试文件通过，31 个测试通过。
- 生产构建：通过。
- 中英文文档配对检查：通过。
- 当前运行时代码/文档不再引用 `one-hand-preview`。
- `git diff --check`：无空白错误；只有 Windows 换行提示。
- 本地浏览器 smoke，地址 `http://127.0.0.1:5174/gesture-mask-studio/`：
  - 页面标题：`Gesture Mask Studio`；
  - 一级标题：`Gesture Mask Studio`；
  - `Start camera` 按钮可见；
  - Mirror 图标按钮存在，且 `aria-pressed="true"`；
  - console error 日志：0。

### 真实设备验证方案
- 下一次部署完成后，强制刷新 GitHub Pages 页面。
- 只有一只手可见时，确认摄像头区域不渲染光片。
- 两只手可见时，确认光片渲染。
- 使用易识别背景标记，检查光片内部采样内容比提交 `c9076f2` 更接近可见背景位置。
- Mirror 开启和关闭都重复验证。
- 确认控制台没有 `THREE.WebGLProgram: Shader Error`。

### 提交与部署
- Commit：`2719a35 fix: align cover-cropped video sampling`。
- GitHub Actions run：`27464484453`。
- build job：success。
- deploy job：success。
- GitHub 仍然报告第三方 action 的 Node.js 20 deprecation annotation，但 workflow 已强制使用 Node.js 24，并且本次运行成功完成。

## 2026-06-13 19:10

### 已完成
- 复核了基于提交 `2719a35a7abd998f3c3818efd30e84b1c1c5a736` 的真实设备验证录屏。
- 使用 FFmpeg 在 `assets/analysis/2719a35-real-device-architecture-decision/` 下抽取证据：
  - 真实设备录屏 69 张 1fps 连续帧；
  - 重新获取的参考视频 25 张 1fps 连续帧；
  - 两个视频各 1 张 1fps 总览拼图；
  - 测试视频和参考视频的 4fps 分段拼图。
- 新增中英文分析文档：
  - `docs/analysis/2719a35-offset-vs-3d-template-decision.md`
  - `docs/analysis/2719a35-offset-vs-3d-template-decision.zh-CN.md`

### 发现
- 当前剩余可见差异主要是架构问题，而不只是坐标偏移问题。
- 当前实现仍是基于实时视频采样的扁平屏幕空间光片；参考视频则是指尖锚定的三维模板，包含多面材质、透视、折叠和翻转。
- 继续调整二维光片可以改善过渡 demo，但不会收敛到参考视频的目标行为。

### 决策
- 下一步进入 ADR-0002 三维模板实现。
- 当前二维 renderer 只保留为坐标空间和 video-uv 映射的校准/调试工具。
- brooks-debt 复核：继续把折叠多面行为写进 `light-sheet-renderer` 会形成 Domain Model Distortion 和 Change Propagation 债务；新增 spatial-template 边界是更低债务路线。

### 下一次变更验证方案
- 增加 landmark 到 anchor-frame 转换测试。
- 增加 mesh 构造、面顺序、材质 id 和折叠状态测试。
- 增加模板材质和 shader 编译的 renderer smoke 覆盖。
- 执行完整 `npm test`、`npm run build`、中英文文档配对检查和 `git diff --check`。
- 真实设备验证时，检查空间移动、前后透视、多面可见性，并将新录屏与参考视频拼图对比。

## 2026-06-13 19:20

### 已完成
- 创建实现分支 `feat/spatial-template-mvp`，避免直接在 `main` 上实施代码。
- 在新增实现前运行干净基线：
  - 命令：`npm test`
  - 结果：10 个测试文件通过，31 个测试通过。
- 新增双语 Superpowers 实施计划：
  - `docs/superpowers/plans/2026-06-13-spatial-template-mvp.md`
  - `docs/superpowers/plans/2026-06-13-spatial-template-mvp.zh-CN.md`

### 计划
- 实现 ADR-0002 的第一个里程碑，新增三个边界：
  - `gesture-anchor-frame`
  - `spatial-template-model`
  - `spatial-template-renderer`
- 在 React 接入前，先用 TDD 覆盖锚点推导、mesh 构造和 renderer buffer 转换。

### TDD 进展
- RED：`npm test -- src/features/gesture-anchor-frame/anchorFrame.test.ts` 失败，原因是 `./anchorFrame` 不存在。
- GREEN：实现 `deriveGestureAnchorFrame`；目标测试通过，1 个测试文件、3 个测试通过。
- RED：`npm test -- src/features/spatial-template-model/templateMesh.test.ts` 失败，原因是 `./templateMesh` 不存在。
- GREEN：实现 `buildSpatialTemplateMesh`；目标测试通过，1 个测试文件、4 个测试通过。
- RED：`npm test -- src/features/spatial-template-renderer/rendererCore.test.ts` 失败，原因是 `./rendererCore` 不存在。
- REPAIR：最小实现后有一个断言因浮点严格相等失败；已将测试改为 `toBeCloseTo` 近似断言。
- GREEN：实现 `spatialTemplateToBufferData`；目标测试通过，1 个测试文件、2 个测试通过。
- RED：`npm test -- src/features/spatial-template-renderer/renderInput.test.ts` 失败，原因是 `./renderInput` 不存在。
- GREEN：实现 `createSpatialTemplateRenderInput`；目标测试通过，1 个测试文件、2 个测试通过。

### 实现
- 新增 `SpatialTemplateCanvas`，用于空间模板 mesh 的 Three.js 透视渲染。
- 更新 `CameraStage`，从 display-space hands 构建 spatial template render input，并渲染新的空间模板 canvas。
- 当前 renderer 行为：
  - 一只可信手 -> 明确的 `one-hand-wedge` 空间模板；
  - 两只可信手 -> `two-hand-ribbon` 空间模板；
  - 没有可信手 -> 不生成模板渲染输入。

### 验证结果
- 空间模板目标测试：4 个测试文件通过，11 个测试通过。
- App shell 测试：2 个测试文件通过，4 个测试通过。
- Brooks-review 自审发现一个维护性问题：`updateRenderInput` 混合了 texture、geometry 和 material 更新。已拆分为更聚焦的辅助函数。
- refactor 后完整测试：14 个测试文件通过，42 个测试通过。
- refactor 后生产构建：通过。
- 本地 HTTP smoke：`http://127.0.0.1:5174/gesture-mask-studio/` 返回 200，并包含 `Gesture Mask Studio`。
- Playwright 浏览器快照确认页面标题、摄像头状态、追踪状态、Mirror 按钮和 Start camera 按钮可见。

### 真实设备验证方案
- 在有摄像头的设备上打开部署版或本地应用。
- 强制刷新页面并启动摄像头。
- 只有一只手可见时，确认效果是小型三角/楔形空间模板，而不是旧的大面积扁平光片。
- 两只手可见时，确认效果变为带状/棱柱模板，并能看到透视和至少两个材质面。
- 左/右/上/下移动手部，确认模板沿可见同方向移动。
- 前后移动手部，确认模板出现尺寸/深度变化。
- 录制短视频，并与 `assets/analysis/2719a35-real-device-architecture-decision/reference_segment_000_024_4fps.jpg` 对比。

## 2026-06-13 19:56

### 提交前验证
- 分支：`feat/spatial-template-mvp`。
- 完整测试：14 个测试文件通过，42 个测试通过。
- 生产构建：通过。
- 中英文文档配对检查：通过。
- `git diff --check`：无空白错误；仅有 Windows 换行提示。

### 下一步
- 提交 spatial template MVP 实现和配套双语文档。
- 如网络可用，将 feature branch 推送到 GitHub。

### 提交与推送
- Commit：`4a37af5 feat: add spatial template mvp`。
- 分支：`feat/spatial-template-mvp`。
- 推送结果：成功。
- 远程分支：`origin/feat/spatial-template-mvp`。
- PR 创建地址：`https://github.com/Baldman-JYH/gesture-mask-studio/pull/new/feat/spatial-template-mvp`。
- Pull request：`https://github.com/Baldman-JYH/gesture-mask-studio/pull/1`。

## 2026-06-13 20:10

### 部署后验证方案
- 用户反馈 PR #1 和 GitHub Pages workflow 已完成。
- 下一步验证必须以真实设备为主，因为本地自动化无法验证摄像头追踪、手部深度和主观三维运动效果。
- 验证地址应使用 workflow 输出的 GitHub Pages 部署地址，通常是 `https://baldman-jyh.github.io/gesture-mask-studio/`。
- 测试前使用 cache-busting 参数，例如 `?v=spatial-template-mvp-20260613-2010`。

### 需要采集的证据
- 启动摄像头后的浏览器控制台截图。
- 覆盖以下场景的真实设备短录屏：
  - 无手；
  - 单手；
  - 双手；
  - 左/右/上/下移动；
  - 前后远近移动；
  - Mirror 开/关。
- 如果出现缺陷，将录屏保存到 `测试记录/基于提交 <deployed-commit>测试/`，并附带控制台日志。

## 2026-06-13 20:43

### 真实设备逐帧分析
- 已对部署提交 `4dd3d98105b96f39726dcd1d0bace974fb540511` 的验证录屏与新版 `参考视频.mp4` 进行对比。
- FFmpeg 抽帧证据已生成在 `测试记录/基于提交 4dd3d98105b96f39726dcd1d0bace974fb540511测试/ffmpeg逐帧分析/`。
- 输入摘要：
  - 真实设备录屏：1912x932，30fps，191.34 秒，5736 帧；
  - 参考视频：1226x686，30fps，24.58 秒，736 帧。
- 新增双语分析文档：
  - `docs/analysis/4dd3d-real-device-3d-template-gap.md`
  - `docs/analysis/4dd3d-real-device-3d-template-gap.zh-CN.md`

### 决策
- 当前技术栈仍然可行：browser + MediaPipe Hands + Three.js + GitHub Pages 可以实现参考视频这一类实时三维模板效果。
- 当前实现仍然过于扁平：它主要是薄棱柱/薄片，视觉上更像半透明覆盖层，不像折叠的三维模型。
- 一个物理手显示为 `2 hands` 的直接原因是 UI 使用了原始 detector 数量，没有先进行重复手过滤，也没有从过滤后的 gesture anchor frame 派生状态。

### 下一步
- 先补充失败测试，覆盖重复手收敛与非扁平多面体模板 mesh。
- 然后更新 gesture anchor frame、spatial template model、renderer material groups 和顶部状态手数来源。

### TDD RED 证据
- 已新增失败测试，覆盖重复物理手检测、可用锚点手数、单手折叠模板形态、双手折叠模板形态、稳定材质槽，以及构建 render input 前的重复手过滤。
- 目标测试命令：
  - `npm test -- src/features/gesture-anchor-frame/anchorFrame.test.ts src/features/gesture-engine/gestureState.test.ts src/features/spatial-template-model/templateMesh.test.ts src/features/spatial-template-renderer/rendererCore.test.ts src/features/spatial-template-renderer/renderInput.test.ts`
- RED 结果：5 个测试文件按预期失败，共 10 个断言失败，失败点均对应尚未实现的目标行为。

### GREEN 实现
- 在 `deriveGestureAnchorFrame` 中新增重复手过滤，针对同一物理手的重叠检测保留最高置信度结果。
- 新增 `getGestureAnchorHandCount`，并将 `CameraStage` 顶部状态手数来源改为过滤后的 anchor frame，而不是原始 MediaPipe 检测数量。
- 旧的 gesture-state 自动样式选择也复用过滤后的 anchor frame，避免重复检测进入双手模式。
- 将单手三角形/楔形几何替换为折叠矩形 `one-hand-template`。
- 将扁平双手 ribbon prism 替换为折叠多面 `two-hand-template`。
- 将 spatial template 材质 id 和 renderer slot 扩展为 `scene`、`panel`、`back`、`accent`、`edge`。
- 目标 GREEN 结果：5 个测试文件通过，21 个测试通过。

### 验证结果
- 完整测试：`npm test` 通过，共 14 个测试文件、47 个测试。
- 生产构建：`npm run build` 通过。
- 文档配对检查：`docs/**/*.md` 与 `docs/**/*.zh-CN.md` 配对通过。
- `git diff --check`：通过；仅报告 Windows 换行提示。
- 浏览器烟测：
  - 本地 Vite dev server 在 `http://127.0.0.1:5174/gesture-mask-studio/` 返回 HTTP 200；
  - Playwright 内置 Chromium 未安装，因此使用本机 Edge/Chromium 通道完成 smoke；
  - 页面标题为 `Gesture Mask Studio`；
  - 主标题、`Start camera`、`Mirror` 控件可见；
  - 首次加载 console error：无。

### 已补充验证方案
- 已在以下文件新增三维空间模板专项验证：
  - `docs/verification/verification-plan.md`
  - `docs/verification/verification-plan.zh-CN.md`
- 真实设备通过标准已明确覆盖：误显示 `2 hands`、单手折叠矩形几何、双手多面几何、边缘可见性、透视/深度运动，以及无 WebGL shader error。

## 2026-06-13 21:49

### 提交和推送
- PR #1 已经合并，因此本轮修复没有继续推送到旧的已合并 feature 分支，而是基于最新 `origin/main` 新建修复分支。
- 新分支：`codex/fix-3d-template-dedupe`。
- 已带入此前本地进展文档提交：
  - `f560788 docs: record spatial template pull request`
- 主修复提交：
  - `89f9ef4 fix: improve spatial template hand anchoring`
- 推送结果：成功。
- Draft PR：
  - `https://github.com/Baldman-JYH/gesture-mask-studio/pull/2`

### 推送前验证
- `npm test`：通过，14 个测试文件、47 个测试。
- `npm run build`：通过。
- 中英文文档配对检查：通过。
- `git diff --check`：通过。

## 2026-06-14 11:35

### 逐帧模型复核
- 已对提交 `6f5dc25a3c5721988c33cebf78adabef4abdd326` 的真实设备验证视频逐帧抽取。
- 测试录屏证据：
  - 1910x890，30fps，约 84.80 秒，2541 帧。
  - 抽帧目录：`测试记录/基于提交 6f5dc25a3c5721988c33cebf78adabef4abdd326测试/ffmpeg逐帧对比_20260614/`。
- 参考视频证据：
  - `参考视频.mp4`，1226x686，30fps，约 24.58 秒，736 帧。
  - 已抽取到同一对比目录。
- 已生成 1fps 总览拼图和 4fps 动态分段拼图，用于人工对比。

### 发现
- 参考视频更准确的描述是“手部驱动的折叠空间模板”或“指尖拓扑网格”，不是简单蒙版，也不是固定半透明薄片。
- 当前应用仍然把每只手压缩为一个锚点，并基于这些锚点生成固定空间模板。
- 用户提出的“点-线-面-体”方向可行，但原始 `A-B-C-D-E-A` 指尖闭环在变成面之前，必须处理共面、自相交、退化、左右手、深度和置信度问题。

### 文档
- 新增中英文模型分析：
  - `docs/analysis/6f5dc25-fingertip-lattice-model.md`
  - `docs/analysis/6f5dc25-fingertip-lattice-model.zh-CN.md`
- 新增中英文架构决策：
  - `docs/architecture/adr-0003-fingertip-lattice-spatial-template.md`
  - `docs/architecture/adr-0003-fingertip-lattice-spatial-template.zh-CN.md`

### 下一步
- 用 TDD 实现指尖拓扑网格模型：
  - 语义指尖提取；
  - 连线和条带面构建；
  - 带校验的三角化；
  - 厚度和材质组；
  - 重复手过滤和单手 fallback 行为。

## 2026-06-14 11:27

### 指尖拓扑网格 TDD 第一阶段
- 新增语义手部拓扑提取 RED 测试：
  - MediaPipe 指尖 landmarks 映射到 `A/B/C/D/E`；
  - 两只手按 display-space 从左到右排序；
  - 不完整手部会被忽略。
- RED 证据：
  - `npm test -- src/features/hand-topology/handTopology.test.ts`
  - 因 `./handTopology` 不存在而失败。
- GREEN 实现：
  - 新增 `features/hand-topology/handTopology.ts`；
  - 引入 `HandTopologyFrame`、`HandTopology` 和语义 `FingertipSet`；
  - 提取 4、8、12、16、20 号指尖 landmarks；
  - 从手腕/掌指关节稳定点推导掌心中心。
- GREEN 证据：
  - `npm test -- src/features/hand-topology/handTopology.test.ts`
  - 1 个测试文件通过，3 个测试通过。

## 2026-06-14 11:30

### 指尖拓扑网格 TDD 第二阶段
- 新增指尖拓扑网格领域模型 RED 测试：
  - `A/B/C/D/E` 五条横向 rail；
  - `AB`、`BC`、`CD`、`DE` 四个主条带；
  - 面必须全部是三角形；
  - 厚度、背面、边缘材质组；
  - 退化条带剔除；
  - 单手 fallback 使用虚拟 rail。
- RED 证据：
  - `npm test -- src/features/fingertip-lattice/fingertipLattice.test.ts`
  - 因 `./fingertipLattice` 不存在而失败。
- GREEN 实现：
  - 新增 `features/fingertip-lattice/fingertipLattice.ts`；
  - 引入 `FingertipLattice`、`FingertipCrossRail` 和 `FingertipStrip`；
  - 基于语义指尖直接生成双手拓扑网格；
  - 用虚拟 rail 生成受控单手 fallback 网格；
  - 在交给 renderer 前剔除零面积三角形。
- GREEN 证据：
  - `npm test -- src/features/fingertip-lattice/fingertipLattice.test.ts`
  - 1 个测试文件通过，4 个测试通过。

## 2026-06-14 11:34

### 指尖拓扑网格 TDD 第三阶段
- 新增 `spatial-template-model` 接入 RED 覆盖：
  - `buildSpatialTemplateMeshFromHands` 必须生成 `two-hand-lattice`；
  - 生成 mesh 的 faces 必须已经是三角面。
- RED 证据：
  - `npm test -- src/features/spatial-template-model/templateMesh.test.ts`
  - 因 `buildSpatialTemplateMeshFromHands` 尚未实现而失败。
- GREEN 实现：
  - 扩展 `SpatialTemplateMode`，新增 `one-hand-lattice` 和 `two-hand-lattice`；
  - 新增 `buildSpatialTemplateMeshFromHands`；
  - 修改 `createSpatialTemplateRenderInput`，优先使用指尖拓扑 mesh，仅在无法构建 topology 时回退到旧 anchor template；
  - 在 `hand-topology` 中新增重复手过滤。
- GREEN 证据：
  - `npm test -- src/features/spatial-template-model/templateMesh.test.ts`
  - 1 个测试文件通过，5 个测试通过。
  - `npm test -- src/features/spatial-template-renderer/renderInput.test.ts`
  - 1 个测试文件通过，3 个测试通过。
  - 阶段组合检查通过：4 个测试文件，15 个测试。

## 2026-06-14 11:39

### 验证
- 完整测试：
  - `npm test`
  - 16 个测试文件通过，55 个测试通过。
- 生产构建：
  - `npm run build`
  - `tsc -b` 和 Vite 生产构建通过。
- 浏览器 smoke：
  - 本地地址：`http://127.0.0.1:5174/gesture-mask-studio/`；
  - 页面标题：`Gesture Mask Studio`；
  - 主标题、`Start camera`、`Mirror` 和 canvas 容器可见；
  - 浏览器控制台 error 数量：0；
  - 截图保存到 `output/browser-smoke-fingertip-lattice-20260614.png`。
- 文档配对：
  - 中英文文档配对检查通过。
- diff 空白检查：
  - `git diff --check` 通过，仅有 Windows 换行提示。

## 2026-06-14 11:45

### 提交和推送准备
- 用户要求提交并推送指尖拓扑网格实现。
- 本次预期范围：
  - 新增 `hand-topology` 语义指尖提取；
  - 新增 `fingertip-lattice` 连线/条带/三角化 mesh 构建；
  - 接入 spatial template model/render input；
  - 补充中英文分析、ADR 和进展文档。
- 提交前分支：`main`。
- 提交前远程：`origin/main`。
- 提交前正在重新执行 pre-push 验证。

## 2026-06-14 12:05

### 4159dbe 真实设备逐帧分析
- 新验证输入：
  - `测试记录/基于提交 4159dbe0bf5ada0fc3a51f94079e6489f89ac536测试/屏幕录制 2026-06-14 115010.mp4`
  - 1898x880，30fps，约 113.7 秒，3407 帧。
- 参考输入：
  - `参考视频.mp4`
  - 1226x686，30fps，约 24.58 秒，736 帧。
- 已逐帧抽取到：
  - `测试记录/基于提交 4159dbe0bf5ada0fc3a51f94079e6489f89ac536测试/ffmpeg逐帧对比_20260614_115010/`
- 已生成对比拼图：
  - `test_contact_1fps.jpg`
  - `reference_contact_1fps.jpg`
  - `test_segment_000_030_4fps.jpg`
  - `test_segment_030_060_4fps.jpg`
  - `test_segment_060_090_4fps.jpg`
  - `test_segment_090_114_4fps.jpg`
  - `reference_segment_000_025_4fps.jpg`

### 发现
- `4159dbe` 比前一版固定锚点模板更稳定，但仍未完全符合用户要求的点-线-面-体拓扑。
- 根因 1：单手模式仍创建虚拟第二只手，所以一只手渲染为条带/ribbon，而不是用户要求的 `A-B-C-D-E-A` 单手面。
- 根因 2：双手模式只输出 `AB/BC/CD/DE` 条带面，缺少 `EA` 闭合条带，也缺少左右手各自的 `A-B-C-D-E-A` 端面，因此几何体不是闭合体。
- 根因 3：面材质分组过粗，并且主要受同一个 active preset tint 影响，所以视觉上经常是整体同时变色，而不是稳定的不同面不同颜色。
- 额外可见问题：双手靠近或交叉时，由于闭合拓扑缺失，模型容易退化成长的开放板。

### 下一步
- 将单手虚拟 rail fallback 替换为真实单手 `A-B-C-D-E-A` 面。
- 为双手模式增加 `EA` 闭合条带。
- 为双手模式增加左/右端面。
- 按拓扑角色分配更明显的面级材质，而不是主要依赖全局 preset tint。

## 2026-06-14 12:13

### 闭合拓扑 TDD
- 新增用户要求的点-线-面-体行为 RED 测试：
  - 单手模式不能创建虚拟 rail；
  - 单手模式必须暴露 `AB/BC/CD/DE/EA` 边界边和 `single-hand` 端面；
  - 双手模式必须包含五个条带：`AB/BC/CD/DE/EA`；
  - 双手模式必须包含 `left-hand` 和 `right-hand` 端面；
  - material id 必须在 `scene/panel/back/accent/edge` 外包含 `cap`；
  - 所有生成的 renderer faces 仍然是非零面积三角形。
- RED 证据：
  - `npm test -- src/features/fingertip-lattice/fingertipLattice.test.ts`
  - 4 个测试失败，失败点分别对应缺少 `EA`、缺少端面、缺少 `cap` 材质和单手虚拟 rail 行为。
- GREEN 实现：
  - 移除单手虚拟手 fallback；
  - 新增单手 `A-B-C-D-E-A` 闭合面，并带背面和边缘面；
  - 新增双手 `EA` 闭合条带；
  - 新增左右手端面；
  - 新增 `cap` material id 和 renderer 材质槽。
- GREEN 证据：
  - `npm test -- src/features/fingertip-lattice/fingertipLattice.test.ts`
  - 1 个测试文件通过，4 个测试通过。
  - 相关阶段检查通过：4 个测试文件，15 个测试。

## 2026-06-14 12:23

### 闭合拓扑验证和文档
- 已更新中英文验证标准：
  - 单手预期结果是紧凑的 `A-B-C-D-E-A` 闭合手部面；
  - 双手预期结果是包含 `AB/BC/CD/DE/EA` 条带和左右端面的闭合体；
  - 相邻面必须有明显不同的视觉处理，不能整体作为一张全局变色光片。
- 自审修正：
  - 单手正面已使用实时 `scene` 材质，而不是不采样视频的 `cap` 材质；
  - 所有非边缘空间模板材质现在都绑定实时视频纹理，并通过不同 tint/opacity 区分面。
- 已更新中英文 ADR-0003，使架构描述与当前点-线-面-体模型一致。
- 已新增 `4159dbe` 真实设备录屏和参考视频对比的中英文分析文档。
- 验证证据：
  - `npm test` 通过：16 个测试文件，55 个测试。
  - `npm run build` 通过。
  - 已跟踪和新增的中英文文档配对检查通过。
  - `git diff --check` 通过，仅有 Git 换行提示。
  - 本地浏览器冒烟验证 `http://127.0.0.1:5174/gesture-mask-studio/` 通过：标题为 `Gesture Mask Studio`，核心控件可见，启动摄像头前无 console error。
  - 截图保存到 `output/browser-smoke-closed-lattice-20260614.png`。
- 仍需真实设备手动验证：
  - 在有摄像头的设备上运行部署版或本地构建；
  - 录制单手和双手移动；
  - 确认可见效果已经遵循闭合指尖拓扑，并再次与 `参考视频.mp4` 抽帧拼图对比。

## 2026-06-14 12:47

### 提交和部署触发
- 用户要求提交并推送闭合指尖拓扑修复，以触发 GitHub Pages 部署构建。
- 已确认当前在 `main` 分支，提交范围为：
  - 闭合指尖拓扑实现；
  - renderer 材质实时采样更新；
  - 中英文分析、ADR、验证方案和进展文档。
- 新鲜提交前验证：
  - `npm test` 通过：16 个测试文件，55 个测试。
  - `npm run build` 通过。
  - 已跟踪和新增的中英文文档配对检查通过。
  - `git diff --check` 通过，仅有 Git 换行提示。
- GitHub CLI 已安装，并已通过 `Baldman-JYH` 账号认证。

## 2026-06-14 13:24

### 3136e09 偏移逐帧分析和坐标修复
- 新验证输入：
  - `测试记录/基于提交 3136e094b0210928d2eb01f8f06d8541535e6ca2测试/屏幕录制 2026-06-14 130340.mp4`
  - 1904x878，30fps，约 206.5 秒，6191 帧。
- 参考输入：
  - `参考视频.mp4`
  - 1226x686，30fps，约 24.58 秒，736 帧。
- 已抽取全部帧并生成拼图到：
  - `测试记录/基于提交 3136e094b0210928d2eb01f8f06d8541535e6ca2测试/ffmpeg逐帧对比_20260614_130340/`
- 新增中英文分析：
  - `docs/analysis/3136e09-offset-frame-analysis.md`
  - `docs/analysis/3136e09-offset-frame-analysis.zh-CN.md`
- 已定位根因：
  - 手部 landmarks 仍是源视频归一化坐标；
  - 可见摄像头预览使用 CSS `object-fit: cover`；
  - spatial-template 几何把源视频坐标直接当作显示坐标使用，因此在宽视口上产生随姿态变化的可见偏移。
- 新增 RED 测试：
  - `npm test -- src/features/coordinate-space/displaySpace.test.ts`
  - 失败原因是源视频 `y=0.3` 仍保持为 `0.3`，没有映射到可见 `y≈0.256`。
- GREEN 实现：
  - `toDisplayHands` 现在先按居中 cover 规则把源视频 landmarks 映射到可见显示坐标，再做镜像转换；
  - `CameraStage` 会把当前 video 和 viewport 尺寸传入坐标映射。
- GREEN 证据：
  - `npm test -- src/features/coordinate-space/displaySpace.test.ts`
  - 1 个测试文件通过，4 个测试通过。
- 完整验证：
  - `npm test` 通过：16 个测试文件，56 个测试。
  - `npm run build` 通过。
  - 已跟踪和新增的中英文文档配对检查通过。
  - `git diff --check` 通过，仅有 Git 换行提示。
  - 本地浏览器冒烟验证 `http://127.0.0.1:5174/gesture-mask-studio/` 通过，初始无 console error。
  - 截图保存到 `output/browser-smoke-coordinate-fix-20260614.png`。
- 后续仍需单独验证的问题：
  - MediaPipe `z` 仍直接参与空间模板深度，单手和斜向姿态下仍可能造成厚胶囊/厚板感。

## 2026-06-14 13:34

### 坐标修复提交和部署触发
- 用户要求提交并推送坐标空间偏移修复，用于真实设备验证。
- 已确认当前在 `main` 分支，提交范围为：
  - 手部 landmarks 从源视频坐标到可见显示坐标的映射；
  - `CameraStage` 传递 viewport/video 尺寸；
  - 宽屏 `object-fit: cover` 映射回归测试；
  - 中英文 `3136e09` 偏移分析和进展文档。
- 新鲜提交前验证：
  - `npm test` 通过：16 个测试文件，56 个测试。
  - `npm run build` 通过。
  - 已跟踪和新增的中英文文档配对检查通过。
  - `git diff --check` 通过，仅有 Git 换行提示。

## 2026-06-14 14:10

### 918465d 真实设备逐帧分析
- 新验证输入：
  - `测试记录/基于提交 918465d6bc73a750691917c262f9b9c7c438a0df测试/屏幕录制 2026-06-14 134907.mp4`
  - 1894x884，30fps，约 152.04 秒，4557 帧。
- 参考输入：
  - `参考视频.mp4`
  - 1226x686，30fps，约 24.58 秒，736 帧。
- 已使用 FFmpeg 抽取全部帧，并生成 1fps 总览、4fps 分段联系表和带标签关键帧联系表，目录为：
  - `测试记录/基于提交 918465d6bc73a750691917c262f9b9c7c438a0df测试/ffmpeg逐帧对比_20260614_134907/`
- 新增中英文分析：
  - `docs/analysis/918465d-post-coordinate-fix-frame-analysis.md`
  - `docs/analysis/918465d-post-coordinate-fix-frame-analysis.zh-CN.md`
- 发现：
  - 之前的左右、上下坐标空间错误没有复现；
  - 稳定双手几何现在已经更贴近可见手部区域；
  - 单手模式仍可能渲染退化细片或孤立三角；
  - 双手拓扑已经闭合，但视觉上仍更像厚盒子/胶囊体，而不是参考视频中的折叠模板；
  - 原始 MediaPipe landmark `z` 在交叉手或斜向姿态下仍会产生过度深度；
  - 面材质相对参考视频仍过于统一，缺少更强的分面模板身份。
- 建议下一步实现范围：
  - 增加单手面积、长宽比、指尖展开、过期/重复手状态和渐隐 hysteresis 的拓扑有效性门控；
  - 用受限且平滑的模板深度模型替代原始 landmark `z`；
  - 增加显式白色边缘几何和更强的逐面材质身份。
- 本阶段只修改文档，没有修改业务代码。

## 2026-06-14 14:20

### 拓扑门控和深度模型 TDD
- 已根据 `918465d` 逐帧分析开始下一步实现。
- 新增 RED 测试覆盖：
  - 单手指尖闭环塌缩时必须隐藏，而不是渲染远端细片或孤立三角；
  - 极端 raw MediaPipe landmark `z` 不能直接成为不受控的渲染深度。
- RED 证据：
  - `npm test -- src/features/fingertip-lattice/fingertipLattice.test.ts`
  - 2 个预期失败：
    - 塌缩单手输入仍返回 `one-hand-lattice`；
    - raw `z=0.9` 直接进入渲染顶点深度。
- GREEN 实现：
  - 新增单手闭环多边形面积、指尖展开度和长宽比门控；
  - 指尖拓扑顶点深度改为受控模板 depth profile，不再使用原始 landmark `z`；
  - 减小拓扑体厚度，降低交叉/斜向姿态形成厚盒子的概率；
  - 条带有效性改为屏幕空间面积判断，避免深度差把视觉上退化的条带重新判定为有效。
- GREEN 证据：
  - `npm test -- src/features/fingertip-lattice/fingertipLattice.test.ts` 通过：1 个测试文件，6 个测试。
  - 相关 spatial-template 测试通过：3 个测试文件，11 个测试。
- 完整验证：
  - `npm test` 通过：16 个测试文件，58 个测试。
  - `npm run build` 通过。
  - 已跟踪和新增的中英文文档配对检查通过。
  - `git diff --check` 通过，仅有 Git 换行提示。
  - 本地 HTTP 冒烟验证 `http://127.0.0.1:5174/gesture-mask-studio/` 返回 HTTP 200，并包含预期页面标题。
- 仍需在有摄像头设备上做真实摄像头验证。

## 2026-06-14 14:28

### 提交和部署触发准备
- 用户确认本机没有摄像头，并询问是否已经提交和推送。
- 当前变更此前尚未提交和推送，因此下一步直接推送 `main`，触发既有 GitHub Pages workflow，便于在有摄像头设备上验证。
- 已确认 GitHub CLI 可用且已认证：
  - `gh --version` 返回 `2.91.0`。
  - `gh auth status` 已通过 `Baldman-JYH` 账号认证。
- 新鲜提交前验证：
  - `npm test` 通过：16 个测试文件，58 个测试。
  - `npm run build` 通过。
  - 已跟踪和新增的中英文文档配对检查通过。
