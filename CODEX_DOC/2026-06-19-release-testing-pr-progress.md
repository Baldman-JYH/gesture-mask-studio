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
