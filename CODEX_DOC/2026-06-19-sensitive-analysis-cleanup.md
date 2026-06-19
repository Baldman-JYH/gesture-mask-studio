# 2026-06-19 敏感分析产物 Git 清理进展

## 阶段 1：main 分支清理准备

- 当前分支：`main`
- 远端：`origin` -> `https://github.com/Baldman-JYH/gesture-mask-studio.git`
- 远端默认分支：`main`
- 检查结果：
  - `origin/main` 当前文件树仍包含 570 个 `assets/analysis` 跟踪文件。
  - `.gitignore` 尚未忽略 `assets/analysis/`。
  - `gh auth status` 已确认当前账号具备 GitHub 访问权限。
- 执行计划：
  - 在 `main` 上加入 `.gitignore` 规则：`assets/analysis/`。
  - 使用 `git rm -r --cached --ignore-unmatch assets/analysis` 从 Git 索引移除分析产物。
  - 提交并推送 `main`，使 GitHub 默认分支最新文件树不再包含该目录。
  - 由于这些文件已存在于历史提交，普通删除提交不能彻底清除 GitHub 历史对象；历史级清理需要单独执行重写历史与 force push。

## 阶段 2：main 分支索引移除

- 执行内容：
  - 已加入 `.gitignore` 规则：`assets/analysis/`。
  - 已执行 `git rm -r --cached --ignore-unmatch assets/analysis`。
- 验证：
  - `git ls-files assets/analysis` 返回 0 个跟踪文件。
  - `git check-ignore -v assets/analysis/example.jpg` 确认 `assets/analysis/` 忽略规则生效。
- 当前状态：
  - 待提交范围包含 570 个 `assets/analysis` 删除项、`.gitignore`、本进展文档。

## 阶段 3：GitHub 推送尝试

- 本地提交：
  - `chore: stop tracking analysis artifacts`
- 推送目标：
  - `origin main`
- 推送结果：
  - 第一次 `git push origin main` 失败：GitHub HTTPS 连接被重置。
  - 第二次 `git push origin main` 失败：无法连接 `github.com:443`。
- 判断：
  - 本地 `main` 清理提交已完成，但尚未进入 GitHub 远端。
  - 当前阻塞是 GitHub 网络连通性，不是工作区或认证状态问题。

## 阶段 4：GitHub 远端文件树清理完成

- 时间：2026-06-19 网络恢复后验证阶段
- 执行内容：
  - 使用 `gh auth status` 确认 GitHub CLI 登录正常。
  - 使用 `gh repo view --json nameWithOwner,defaultBranchRef,url` 确认仓库为 `Baldman-JYH/gesture-mask-studio`，默认分支为 `main`。
  - 执行 `git push origin main`，将 `1cbde62 chore: stop tracking analysis artifacts` 推送到 `origin/main`。
- 远端验证：
  - `git fetch origin main` 后，本地 `HEAD` 与 `origin/main` 均为 `1cbde62101b58ca34a2dad60d08d65c56a0ab19e`。
  - `git ls-tree -r --name-only origin/main assets/analysis` 返回 0 个文件。
  - `gh api repos/Baldman-JYH/gesture-mask-studio/contents/assets/analysis` 返回 404，说明默认分支最新文件树已无该目录。
- 残余风险：
  - 当前完成的是默认分支最新文件树删除和后续忽略。
  - 因为 `assets/analysis` 曾存在于历史提交，若其中包含已泄露凭证或敏感个人信息，仍需要执行历史重写与 GitHub 敏感数据清理流程；凭证类内容应立即轮换或作废。

## 阶段 5：历史重写准备检查

- 时间：2026-06-19 历史级清理准备阶段
- 工具检查：
  - 初始环境未安装 `git-filter-repo`。
  - 已执行 `python -m pip install --user --upgrade git-filter-repo`。
  - 已安装 `git-filter-repo` 2.47.0，满足 GitHub 官方敏感数据清理流程对 `--sensitive-data-removal` 的版本要求。
- 远端 ref 检查：
  - `origin/main` 最新文件树中 `assets/analysis` 为 0。
  - `origin/codex/fix-3d-template-dedupe` 最新文件树仍包含 570 个 `assets/analysis` 文件。
  - `origin/feat/spatial-template-mvp` 最新文件树仍包含 570 个 `assets/analysis` 文件。
- 下一步：
  - 创建独立备份与清理克隆。
  - 使用 `git filter-repo --sensitive-data-removal --invert-paths --path assets/analysis/` 重写历史。
  - 验证所有本地 refs 中不再包含 `assets/analysis` 后，强制推送需要保留的远端分支。

## 阶段 6：历史重写执行与本地验证

- 隔离目录：
  - 原始备份镜像：`D:\code\AIProjects\ShowProjects\gesture-mask-studio-sensitive-backup-20260619-154417.git`
  - 清理镜像：`D:\code\AIProjects\ShowProjects\gesture-mask-studio-history-clean-20260619-154417.git`
  - filter-repo 日志：`D:\code\AIProjects\ShowProjects\gesture-mask-studio-filter-repo-20260619-154417.log`
- 执行命令：
  - `python -m git_filter_repo --sensitive-data-removal --invert-paths --path assets/analysis/ --force`
- 执行结果：
  - 共解析 50 个提交。
  - 重写 26 个提交。
  - First Changed Commit：`3774e09930636b3658a6763e59811290a14a932c`。
  - LFS 未使用，因此未检查 LFS orphaning。
- 清理后 refs：
  - `main` -> `365d2b1`
  - `feat/spatial-template-mvp` -> `179d584`
  - `codex/fix-3d-template-dedupe` -> `481bad7`
  - 本地清理镜像中的 `pull/1/head` 与 `pull/2/head` 也已重写，但 GitHub 的 `refs/pull/*` 是只读引用，不能直接推送覆盖。
- 本地验证：
  - `git for-each-ref` + `git ls-tree` 检查所有 refs，未发现 `assets/analysis`。
  - `git log --all --name-only -- assets/analysis` 无输出。
- 下一步：
  - 强制推送 `main`、`feat/spatial-template-mvp`、`codex/fix-3d-template-dedupe` 三个可写远端分支。

## 阶段 7：远端分支历史强制更新

- 执行内容：
  - 使用显式 refspec 强制推送三个可写分支：
    - `main`
    - `codex/fix-3d-template-dedupe`
    - `feat/spatial-template-mvp`
  - 镜像克隆默认配置 `remote.origin.mirror=true`，不能与显式 refspec 混用；已通过临时配置 `-c remote.origin.mirror=false` 执行分支级 force push，避免误推 `refs/pull/*`。
- 推送结果：
  - `main`：`5e6c7e7` -> `365d2b1`
  - `codex/fix-3d-template-dedupe`：`ef50df4` -> `481bad7`
  - `feat/spatial-template-mvp`：`1564095` -> `179d584`
- 远端验证：
  - `git fetch origin --prune` 后，`refs/remotes/origin/*` 的最新文件树均不再包含 `assets/analysis`。
  - GitHub Contents API 对 `contents/assets/analysis` 返回 404。
- PR refs 残留：
  - `refs/pull/1/head` 仍指向 `156409593d720a7a127bac824976a07bd40e9dda`。
  - `refs/pull/2/head` 仍指向 `ef50df4b1d7016e19bb66878a41ede40193871c9`。
  - 两个旧 PR head commit 的树中仍各包含 570 个 `assets/analysis` 文件。
  - 这两个 PR 均为 merged PR，GitHub 的 `refs/pull/*` 是只读引用，不能由普通 git push 直接覆盖。
- 下一步：
  - 准备 GitHub Support 敏感数据清理请求，包含仓库、受影响 PR、First Changed Commit、已强推分支和需清理的路径。

## 阶段 8：本地仓库历史清理

- 背景：
  - 远端可写分支已经清理，但当前本地工作仓库仍保留旧分支 refs 和旧对象。
  - 为避免本地 `.git` 继续持有敏感对象，需要对当前工作仓库执行同样路径过滤。
- 执行内容：
  - 已先提交进展文档：`docs: record history cleanup progress`。
  - 首次执行 `python -m git_filter_repo --sensitive-data-removal --invert-paths --path assets/analysis/ --force` 时，工具检测到本地分支和远端分支不同，试图先执行会丢弃本地变更的 mirror-like fetch；非交互环境下中止。
  - 已改用 `--no-fetch` 保留本地分支：`python -m git_filter_repo --sensitive-data-removal --no-fetch --invert-paths --path assets/analysis/ --force`。
- 执行结果：
  - 共解析 62 个提交。
  - 重写 38 个提交。
  - First Changed Commit 仍为 `3774e09930636b3658a6763e59811290a14a932c`。
  - 本地 `main` 更新为 `5084f7a docs: record history cleanup progress`。
  - 本地 `codex/reference-effect-replication` 更新为 `2d0da6a`，保留了此前参考效果实现分支。
  - 本地 `feat/spatial-template-mvp` 更新为 `9d86dd9`，仍比远端对应清理分支领先 1 个本地提交。
- 本地验证：
  - `git for-each-ref` + `git ls-tree` 检查所有 refs，未发现 `assets/analysis`。
  - `git log --all --name-only -- assets/analysis` 无输出。
  - 旧 PR head commits `156409593d720a7a127bac824976a07bd40e9dda`、`ef50df4b1d7016e19bb66878a41ede40193871c9` 以及 First Changed Commit 在当前本地仓库中均已无法解析。
  - 附加 worktree `.worktrees/implement-realtime-light-sheet` 状态干净。
- 远端同步：
  - 已执行 `git push origin main`，将文档提交推送到远端。
  - 当时远端 `main` 更新到 `5084f7a7a4f0cab0ca8ae878e033a93b619b06d4`，后续阶段文档会继续产生新的 `main` 提交。

## 阶段 9：临时镜像清理与 Support 材料

- 临时镜像：
  - 已删除 `D:\code\AIProjects\ShowProjects\gesture-mask-studio-sensitive-backup-20260619-154417.git`。
  - 已删除 `D:\code\AIProjects\ShowProjects\gesture-mask-studio-history-clean-20260619-154417.git`。
  - 删除前已确认清理镜像中旧敏感 commits 均无法解析。
- 保留日志：
  - `D:\code\AIProjects\ShowProjects\gesture-mask-studio-filter-repo-20260619-154417.log`
  - `D:\code\AIProjects\ShowProjects\gesture-mask-studio-local-filter-repo-20260619-154417.log`
  - 日志仅包含 filter-repo 输出、commit id 和路径信息，不包含图片内容。
- 当前仍需 GitHub Support 处理：
  - `refs/pull/1/head` 仍指向旧 commit `156409593d720a7a127bac824976a07bd40e9dda`。
  - `refs/pull/2/head` 仍指向旧 commit `ef50df4b1d7016e19bb66878a41ede40193871c9`。
  - 这两个 PR head refs 是 GitHub 只读引用，CLI 无法直接覆盖。
  - 已新增 `CODEX_DOC/2026-06-19-github-support-sensitive-cleanup-request.md` 作为提交给 GitHub Support 的材料草稿。
