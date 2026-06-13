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
