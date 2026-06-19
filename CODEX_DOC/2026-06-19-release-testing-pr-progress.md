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
