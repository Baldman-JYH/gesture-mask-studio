# Brooks-Lint Review

**Mode:** Tech Debt Assessment
**Scope:** 整个规划阶段仓库；重点审查 `docs/architecture/`、`docs/product/`、`docs/analysis/` 中的拟定架构和可扩展性设计。
**Health Score:** 100/100 after remediation

当前没有未归属的已知架构债务；进入开发前必须遵守新增的运行时契约和质量准入门槛。

---

## Findings

本次复核发现的是“开发前风险”，已在同一阶段通过文档约束关闭，因此不保留 active Critical / Warning / Suggestion finding。

### Remediated Before Development

**Domain Model Distortion — `mask`、`面片`、`光片` 术语可能漂移**
Symptom: 早期文档中同时出现 `mask`、蒙版、面片、光片，代码若照此实现会形成多套领域语言。
Source: Domain-Driven Design — Ubiquitous Language
Consequence: 后续新增样式或手势时，开发者需要猜测某个模块到底处理遮挡、贴图还是实时采样光片，导致错误抽象和重复实现。
Remedy: 新增 `runtime-contracts.md`，规定实现层统一使用 `LightSheet`、`SceneSampling`、`GestureEngine`；`mask` 只保留为产品名 shorthand。

**Change Propagation — 样式扩展可能侵入核心 renderer**
Symptom: 只在 ADR 中描述样式 preset，不足以阻止后续把每个新样式写成 renderer 分支。
Source: Refactoring — Shotgun Surgery; A Philosophy of Software Design — Information Leakage
Consequence: 每新增一种光片样式都可能修改 renderer、gesture、UI、assets 多处代码，长期会迫使整体重构。
Remedy: 新增 `LightSheetStylePreset` 契约和样式新增流程，规定普通样式只能改 `light-sheet-styles/` 和可选 shader variant。

**Dependency Disorder — 模块依赖方向需要成为硬规则**
Symptom: 规划中有模块列表，但缺少明确的禁止依赖，例如 renderer 是否能直接读 MediaPipe、style 是否能读 DOM。
Source: Clean Architecture — Dependency Inversion Principle / Acyclic Dependencies Principle
Consequence: 一旦实现阶段互相导入，后续新增模型、录制或样式会引发循环依赖和测试困难。
Remedy: 新增模块依赖图、禁止依赖清单和公共 render input 类型，要求通过 composition 层组装。

**Accidental Complexity — 未来能力入口需要边界而不是预建设施**
Symptom: 文档提到 FaceLandmarker、PoseLandmarker、分割、录制等未来能力，但未规定它们如何接入。
Source: Refactoring — Speculative Generality; The Pragmatic Programmer — Orthogonality
Consequence: 若提前为所有未来能力搭框架会过度设计；若没有入口，未来又会侵入核心模块。
Remedy: 规定 `vision-extensions/`、截图/录制和 ADR 接入规则；基础版本仍只依赖实时视频采样运行。

---

## Debt Summary

| Risk | Findings | Avg Priority | Classification | Intent |
|------|----------|-------------|----------------|--------|
| Cognitive Overload | 0 active | 0.0 | None | n/a |
| Change Propagation | 0 active | 0.0 | None | n/a |
| Knowledge Duplication | 0 active | 0.0 | None | n/a |
| Accidental Complexity | 0 active | 0.0 | None | n/a |
| Dependency Disorder | 0 active | 0.0 | None | n/a |
| Domain Model Distortion | 0 active | 0.0 | None | n/a |

**Recommended focus:** 实现阶段持续检查 Change Propagation、Dependency Disorder、Domain Model Distortion；这三类最容易在实时视觉项目中变成重构成本。

---

## Summary

架构已经具备进入开发的最低严谨性：实时场景采样光片是唯一运行时核心，样式、手势、采样、渲染都有明确边界。后续新增功能必须先判断属于样式、手势、视觉增强、输出能力还是部署能力，不能直接穿透核心模块。
