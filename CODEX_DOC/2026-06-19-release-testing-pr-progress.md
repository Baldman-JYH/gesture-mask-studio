# 2026-06-19 参考效果发布测试与 PR 进展

## 阶段 1：功能分支接入清理后的 main

- 当前分支：`codex/reference-effect-replication`
- 基线分支：`main`
- 执行内容：
  - 从 `main` 切换到 `codex/reference-effect-replication`。
  - 执行 `git rebase main`。
- 结果：
  - rebase 无冲突完成。
  - 功能分支已接上敏感历史清理后的 `main`。
  - 当前差异集中在参考效果实现、相关测试、实现计划和进展文档。
- 下一步：
  - 在 `app/` 下执行 `npm test` 与 `npm run build`。

## 阶段 2：本地自动化验证

- 执行目录：`app/`
- 执行命令：
  - `npm test`
  - `npm run build`
- 验证结果：
  - `npm test` 通过：25 个测试文件、103 个测试。
  - `npm run build` 通过：TypeScript build 与 Vite production build 均完成。
  - build 输出包含 `dist/mediapipe/wasm` 复制逻辑和主 bundle，不依赖第三方 wasm CDN。
- 下一步：
  - 提交发布验证文档。
  - 推送 `codex/reference-effect-replication`。
  - 创建指向 `main` 的 draft PR。

## 阶段 3：功能分支推送

- 执行内容：
  - 提交发布验证进展文档：`docs: record reference effect release validation`。
  - 执行 `git push -u origin codex/reference-effect-replication`。
- 推送结果：
  - 远端新建分支：`origin/codex/reference-effect-replication`。
  - 本地分支已设置 upstream：`origin/codex/reference-effect-replication`。
- 下一步：
  - 创建 `codex/reference-effect-replication` -> `main` 的 draft PR。

## 阶段 4：Draft PR 创建

- 首选路径：
  - 尝试使用 GitHub connector 创建 draft PR。
  - 结果：GitHub API 返回 403 `Resource not accessible by integration`，connector 权限不足。
- 兜底路径：
  - 使用已认证的 GitHub CLI 执行 `gh pr create --draft`。
- PR 结果：
  - PR：`https://github.com/Baldman-JYH/gesture-mask-studio/pull/3`
  - base：`main`
  - head：`codex/reference-effect-replication`
  - 状态：draft
- 下一步：
  - 推送本阶段文档。
  - 触发 GitHub Pages workflow 在功能分支上部署测试版。

## 阶段 5：GitHub Pages 分支部署尝试

- 执行内容：
  - 执行 `gh workflow run pages.yml --ref codex/reference-effect-replication`。
  - 触发 workflow run：`https://github.com/Baldman-JYH/gesture-mask-studio/actions/runs/27813342180`。
- 执行结果：
  - `build` job 成功。
  - `Install`、`Test`、`Build`、`Upload artifact` 步骤均成功。
  - `deploy` job 失败。
- 失败特征：
  - `deploy` job 没有任何执行 step 日志。
  - deployment ref 为 `codex/reference-effect-replication`，环境为 `github-pages`。
  - deployment status 从 `waiting` 变为 `failure`。
  - 当前 Pages 配置源分支为 `main`，说明 `github-pages` 环境没有接受该非 `main` ref 的部署。
- 判断：
  - 功能分支 CI 级别的安装、测试、构建、artifact 上传已经通过。
  - Pages 线上发布仍需通过 `main` 分支部署，或临时调整 Pages 环境/部署策略允许功能分支部署。
- 下一步：
  - 推送本阶段文档。
  - 保持 draft PR，不自动合并到 `main`。
  - 若需要线上实机测试，建议由用户确认是否允许将 PR 合并/发布到 `main`。

## 阶段 6：本地 production preview

- 背景：
  - GitHub Pages 分支部署未通过 `github-pages` 环境。
  - 为了不自动合并 draft PR 到 `main`，先启动本地 production preview 供桌面摄像头验证。
- 执行内容：
  - 在 `app/` 下启动 `npm run preview -- --host 127.0.0.1 --port 4176`。
- 结果：
  - 本地地址：`http://127.0.0.1:4176/gesture-mask-studio/`
  - HTTP 检查：`200 OK`
  - preview 根进程：`cmd.exe` PID `19308`
  - 主要子进程：Node/Vite PID `25636`、`18068`
- 使用方式：
  - 在本机浏览器打开上述地址。
  - 点击 `Start camera` 授权摄像头。
  - 用桌面录屏工具录制验证视频，后续与 `参考视频.mp4` 进行 FFmpeg 逐帧对比。

## 阶段 7：合并后新测试视频接收

- 用户提供新测试视频：
  - `D:\code\AIProjects\ShowProjects\gesture-mask-studio\测试记录\测试视频\屏幕录制 2026-06-19 161039.mp4`
- 参考视频：
  - `D:\code\AIProjects\ShowProjects\gesture-mask-studio\参考视频.mp4`
- GitHub 状态：
  - PR #3：`https://github.com/Baldman-JYH/gesture-mask-studio/pull/3`
  - 状态：merged
  - head：`codex/reference-effect-replication`
  - base：`main`
- 视频元数据：
  - 新测试视频：3832x1954，30fps，1247 帧，41.64 秒。
  - 参考视频：1226x686，30fps，736 帧，24.58 秒。
- 下一步：
  - 使用 FFmpeg 抽取全帧和抽样 contact sheet。
  - 对比参考视频的结构、颜色、面部采样、稳定性和跟手缩放/旋转。

## 阶段 8：新测试视频全帧抽取

- 输出目录：
  - `D:\code\AIProjects\ShowProjects\gesture-mask-studio\output\reference-validation-20260619-161039`
- 抽取内容：
  - 新测试视频全帧：`test_frames_1280/test_%04d.jpg`
  - 参考视频全帧：`reference_frames_1280/reference_%04d.jpg`
  - 抽样总览图：`contact_sheets/test_1fps_contact.jpg`、`contact_sheets/reference_1fps_contact.jpg`
- 抽取结果：
  - 新测试视频：1247 帧。
  - 参考视频：736 帧。
  - 两组帧均统一缩放到 1280 宽，便于逐帧和抽样对比。
- 下一步：
  - 先看 1fps 总览图定位关键时段，再提取更密集的片段 contact sheet。
  - 重点检查效果是否仍会消失、是否在双手之间、网格形态是否接近目标、Shader 颜色与面部纹理是否达标。

## 阶段 9：新构建视觉对比与消失根因定位

- 新增抽样总览图：
  - `contact_sheets/test_2fps_00_24s.jpg`
  - `contact_sheets/test_2fps_24_42s.jpg`
  - `contact_sheets/reference_2fps_00_24s.jpg`
- 视觉结论：
  - 新测试视频约 10.5 秒后才出现结构；参考视频开头即有大尺寸结构，并持续占据双手之间的主体区域。
  - 新测试视频中的结构仍偏平面三角贴片/短楔形，缺少参考视频中长条折面、三角折面、多材质面片和明显透视厚度。
  - 新测试视频的材质主要是青、红、紫块状颜色，未形成参考视频中清晰的脸部轮廓/低像素肖像采样，也缺少黄、绿、青为主的高饱和对比。
  - 新测试视频末尾约 39.5 秒检测为 `No hands` 时结构消失；约 40.5 秒后摄像头进入 `Camera idle`，画面变为空网格。
- 代码根因：
  - `deriveTemplateState` 在 `activeHandCount === 0` 时生成 hidden state。
  - `renderStabilizer` 默认只保留上一次可见结构约 520ms，超过窗口后返回空状态。
  - `stopCamera` 会清空 stabilizer/template state，这是显式停止摄像头时的正常行为。
- 判断：
  - 当前技术路线没有根本性错误：项目已经使用 MediaPipe 手势跟踪、Three.js/WebGL 和自定义 Shader。
  - 当前实现缺陷在于策略和效果模型：可见状态保留时间太短、面部 ROI 仍是 fallback、几何模型过于简化、材质没有稳定地产生参考视频的人脸低像素故障图案。
- 下一步：
  - 优先修改稳定器：摄像头仍处于 live 时，最后一个有效结构应持续保留，不能因短时或长时丢手自动消失。
  - 然后再进入几何和 Shader 的第二轮复刻。

## 阶段 10：不消失稳定器补丁

- 修改内容：
  - 将 `spatial-template-renderer/renderStabilizer` 的默认 hold 策略改为持久保留最后一次有效结构。
  - 摄像头仍 live 时，即使 MediaPipe 后续返回 0 手，也继续渲染最后一次有效 mesh，不再因默认 520ms 窗口到期而清空。
  - 保留显式 `holdMs` 选项，未来仍可在测试或特殊模式下使用有限保留窗口。
- 测试更新：
  - 增加“长时间 no-hand gap 默认仍保留结构”的稳定器用例。
  - 保留“显式有限 holdMs 超时后清空”的行为覆盖。
- 验证结果：
  - `npm test -- renderStabilizer`：通过，1 个测试文件、6 个测试。
  - `npm test`：通过，25 个测试文件、104 个测试。
  - `npm run build`：通过，TypeScript 与 Vite production build 均完成。
- 下一步：
  - 若需要发布验证，需要基于最新 `main` 开新分支/PR 或等网络恢复后确认远端状态。
  - 本补丁只解决“丢手后结构消失”；几何和 Shader 还需要下一轮复刻增强。

## 阶段 11：稳定性补丁分支整理

- 分支策略：
  - PR #3 已合并，原功能分支不再适合作为后续发布入口。
  - 已从当前实现切出新分支：`codex/reference-effect-stability`。
- 本分支包含：
  - 新测试视频的 FFmpeg 抽帧与视觉对比记录。
  - “效果不应因 no-hand gap 消失”的稳定器补丁。
  - 对应单元测试更新与全量测试/build 结果。
- 网络状态：
  - `git fetch origin` 当前失败，无法在本阶段确认 `origin/main` 的最新 merge commit。
- 下一步：
  - 提交本地补丁。
  - 网络恢复后推送 `codex/reference-effect-stability`，并基于 `main` 创建新的 PR 做发布验证。

## 阶段 12：稳定性补丁提交与推送

- 本地提交：
  - `fcd6290 fix: persist reference effect through tracking gaps`
- 推送结果：
  - 远端分支已创建：`origin/codex/reference-effect-stability`
  - upstream 已设置：`codex/reference-effect-stability` -> `origin/codex/reference-effect-stability`
- GitHub 提示的 PR 地址：
  - `https://github.com/Baldman-JYH/gesture-mask-studio/pull/new/codex/reference-effect-stability`
- 下一步：
  - 创建 `codex/reference-effect-stability` -> `main` 的 PR。
  - 等 PR 构建完成后，用新的线上构建再录一次短视频，重点验证 no-hand gap 后结构是否持续保留。

## 阶段 13：使用 GitHub CLI 对齐远端分支

- 背景：
  - 本地分支 `codex/reference-effect-stability` 比 `origin/codex/reference-effect-stability` ahead 1。
  - 普通 `git push` 多次因 GitHub HTTPS 连接失败无法完成。
- 执行内容：
  - 使用 `gh auth status` 确认 GitHub CLI 登录和 token 权限正常。
  - 使用 `gh repo view`、`gh pr list`、`gh api git/ref` 检查仓库、PR 和远端 ref。
  - 通过 `gh api` 创建与本地 Git 对象一致的 blob/tree/commit，并用 `PATCH git/refs` 快进远端分支。
  - 使用 `git update-ref` 将本地 remote-tracking ref 对齐到经 `gh api` 验证过的远端 SHA。
- 结果：
  - 远端 `codex/reference-effect-stability` 已对齐到本地提交 `a18fae6a8bcd6119ee093dd39ccf2bdec5664647`。
  - `origin/codex/reference-effect-stability...HEAD` 差异为 `0 0`。
  - 当前没有已创建的 `codex/reference-effect-stability` -> `main` PR。
- 下一步：
  - 提交并同步本阶段文档记录。
  - 再次确认本地工作区和远端分支保持一致。

## 阶段 14：接收 18:36 最新测试视频

- 当前分支：
  - `codex/reference-effect-stability`
  - 本地与 `origin/codex/reference-effect-stability` 已对齐。
- 最新测试视频：
  - `D:\code\AIProjects\ShowProjects\gesture-mask-studio\测试记录\测试视频\屏幕录制 2026-06-19 183611.mp4`
  - 3814x1946，30fps，820 帧，约 27.43 秒。
- 参考视频：
  - `D:\code\AIProjects\ShowProjects\gesture-mask-studio\参考视频.mp4`
  - 1226x686，30fps，736 帧，约 24.58 秒。
- 本阶段目标：
  - 重新抽帧对比最新构建效果与参考视频。
  - 判断前一轮“不消失”补丁是否生效。
  - 继续定位几何、Shader、面部采样和跟手关系的剩余差距。

## 阶段 15：18:36 视频抽帧完成

- 输出目录：
  - `D:\code\AIProjects\ShowProjects\gesture-mask-studio\output\reference-validation-20260619-183611`
- 抽取内容：
  - 最新测试视频全帧：`test_frames_1280/test_%04d.jpg`
  - 参考视频全帧：`reference_frames_1280/reference_%04d.jpg`
  - 抽样总览图：`contact_sheets/test_1fps_contact.jpg`、`contact_sheets/test_2fps_contact.jpg`、`contact_sheets/reference_1fps_contact.jpg`、`contact_sheets/reference_2fps_contact.jpg`
- 抽取结果：
  - 最新测试视频：820 帧。
  - 参考视频：736 帧。
  - 全帧统一缩放到 1280 宽，便于关键帧对比。
- 下一步：
  - 查看总览图和关键帧，确认“不消失”是否生效。
  - 继续拆分几何形态、面部纹理、颜色 Shader、跟手位置/尺度的剩余差距。

## 阶段 16：18:36 视频差距定位与第一轮修复

- 逐帧/关键帧结论：
  - “丢手后立即消失”的问题已有改善；最新测试中结构在 1 手/2 手波动期间保持可见。
  - 末尾消失对应用户点击 `Stop camera` 后进入 `Camera idle`，属于显式停止摄像头流程。
  - 主要剩余差距集中在几何和材质：当前结构仍偏小、偏三角楔形、偏右/偏低；参考视频是横跨双手的大尺寸折纸飞机状长条结构。
  - 当前材质仍缺少清晰的人脸低像素肖像和黄/绿/青为主的高饱和边缘故障效果。
- 根因定位：
  - `fallbackFaceRoi` 固定采样画面上方，测试者脸部在画面下方时采不到脸。
  - `referenceTemplateMesh` 的宽度/高度比例偏保守，三角折面和单手 fallback 过小。
  - Shader 只做亮度调色和 RGB 偏移，缺少参考视频里明显的人脸边缘墨线。
- 已实现修复：
  - 新增动态 `deriveGestureFaceRoi`，根据模板中心和 span 推导更宽的人像采样区域。
  - `createSpatialTemplateRenderInput` 接入动态 face ROI。
  - 放大 wide strip、triangle fold、white card、green cyan、one-hand wedge 的参考几何比例。
  - 单手 fallback span 从 `0.24` 提升到 `0.44`，避免初始小楔形。
  - Shader 增加 `faceEdgeMagnitude`、`portraitInk`、`referenceHueBoost`，减少默认红色块，强化黄/绿/青与人脸边缘。
- TDD 验证：
  - 先添加失败测试覆盖 ROI、几何尺寸、Shader 边缘增强和单手 fallback 尺寸。
  - 实现后运行 `npm test -- deriveTemplateState faceTextureSource referenceTemplateMesh referenceShaderSource referenceMaterials renderInput`。
  - 结果：6 个测试文件、38 个测试通过。
- 下一步：
  - 运行全量测试和 production build。
  - 使用浏览器验证 production preview 可加载，无框架错误。
  - 让用户基于新构建录制下一轮视频，继续和参考视频逐帧比对。

## 阶段 17：全量验证与本地预览检查

- 自动化验证：
  - `npm test`：通过，25 个测试文件、108 个测试。
  - `npm run build`：通过，TypeScript 与 Vite production build 均完成。
  - 受 Windows PowerShell execution policy 影响，最终复跑使用 `npm.cmd test` 和 `npm.cmd run build`，结果同样通过。
- 浏览器验证：
  - 地址：`http://127.0.0.1:4176/gesture-mask-studio/`
  - 页面标题：`Gesture Mask Studio`
  - DOM 快照包含 `Gesture Mask Studio`、`Camera idle`、`Tracking idle`、`Start camera`。
  - 未检测到 Vite/框架错误覆盖。
  - 控制台 error/warn 数量：0。
- 限制：
  - in-app browser 截图接口 `Page.captureScreenshot` 连续超时，本阶段未把浏览器截图作为验收证据。
  - 摄像头实拍验证仍需要用户在本机授权摄像头后录制新视频。
- 下一步：
  - 提交本轮几何、Shader、ROI 和文档修复。
  - 用新构建录制下一轮视频，重点观察结构尺寸、位置、脸部纹理和黄/绿/青故障色是否更接近参考视频。

## 阶段 18：18:36 对比修复提交与推送

- 本地提交：
  - `ca3d048 feat: improve reference effect fidelity`
- 推送结果：
  - 已推送到 `origin/codex/reference-effect-stability`
  - 远端范围从 `1c8876e` 更新到 `ca3d048`
- 本轮修复范围：
  - 动态面部 ROI。
  - 放大参考几何与单手 fallback。
  - 强化 Shader 的人脸边缘、黄/绿/青调色与故障肖像效果。
  - 补充对应 TDD 测试和 18:36 视频对比记录。
- 下一步：
  - 同步本阶段文档提交。
  - 基于 `ca3d048` 的构建进行下一轮摄像头实拍，继续逐帧比对参考视频。
