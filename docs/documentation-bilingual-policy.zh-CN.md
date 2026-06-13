# 文档双语规范

English version: [documentation-bilingual-policy.md](documentation-bilingual-policy.md)

所有面向项目使用者、协作者和后续维护者的项目文档，都必须同时维护英文版和简体中文版。

## 规则

- 英文文档保留现有文件名，例如 `technical-architecture.md`。
- 中文对应文档使用同路径和 `zh-CN` 后缀，例如 `technical-architecture.zh-CN.md`。
- 根目录 README 使用：
  - `README.md`
  - `README.zh-CN.md`
- 修改文档时，应尽量在同一次任务中同步更新两个语言版本。
- 如果某次修改无法立即翻译，必须在进展文档中明确记录，并视为待完成工作。
- 验证方案、发布说明、架构决策和面向使用者的操作指南必须始终中英双语。
- 进展文档也按中英双语维护：
  - `CODEX_DOC/progress.md`
  - `CODEX_DOC/progress.zh-CN.md`
- 内部代码注释可以继续使用英文；如果注释解释的是产品行为或用户可见行为，优先使用中文或中英双语。

## 推荐检查清单

1. 更新英文文档。
2. 更新对应的 `*.zh-CN.md` 中文文档。
3. 检查两个版本之间的链接。
4. 更新 `CODEX_DOC/progress.md` 和 `CODEX_DOC/progress.zh-CN.md`。
5. 在最终回复中说明是否已同步两个语言版本。

