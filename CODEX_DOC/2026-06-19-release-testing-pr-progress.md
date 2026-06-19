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
