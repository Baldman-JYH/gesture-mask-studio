# ce0a171 真实摄像头逐帧分析

English version: [ce0a171-real-camera-frame-analysis.md](ce0a171-real-camera-frame-analysis.md)

## 输入

- 测试录屏：`测试记录/基于提交 ce0a171850d0d010332baa70880bae3744da503c测/屏幕录制 2026-06-14 175634.mp4`
- 参考录屏：`参考视频.mp4`
- 测试录屏元信息：3832x2028，30fps，约 142.12 秒，4261 帧。
- 参考录屏元信息：1226x686，30fps，约 24.58 秒，736 帧。

## 抽帧证据

已用 FFmpeg 抽取全部帧到：

`测试记录/基于提交 ce0a171850d0d010332baa70880bae3744da503c测/ffmpeg逐帧对比_20260614_175634/`

已生成对照图：

- `sheets/test_contact_1fps.jpg`
- `sheets/test_segment_000_036_4fps.jpg`
- `sheets/test_segment_036_072_4fps.jpg`
- `sheets/test_segment_072_108_4fps.jpg`
- `sheets/test_segment_108_143_4fps.jpg`
- `sheets/test_keyframes_labeled.jpg`
- `sheets/reference_contact_1fps.jpg`
- `sheets/reference_segment_000_025_4fps.jpg`
- `sheets/reference_keyframes_labeled.jpg`

代表性关键帧：

- 测试视频：`test_t014.jpg`、`test_t020.jpg`、`test_t027.jpg`、`test_t034.jpg`、`test_t042.jpg`、`test_t050.jpg`、`test_t058.jpg`、`test_t066.jpg`、`test_t078.jpg`、`test_t090.jpg`、`test_t102.jpg`、`test_t114.jpg`、`test_t126.jpg`、`test_t138.jpg`
- 参考视频：`reference_t000.jpg`、`reference_t004.jpg`、`reference_t006.jpg`、`reference_t008.jpg`、`reference_t010.jpg`、`reference_t012.jpg`、`reference_t016.jpg`、`reference_t020.jpg`、`reference_t024.jpg`

## 发现

`ce0a171` 相比上一轮已有进步：单手挤出厚体基本消失，无效单手姿态通常会隐藏，双手闭合指尖 lattice 可以出现。

仍存在的问题：

1. **双手一起运动时几何体闪烁。** 最新实测中，双手同步移动时模板会消失又出现。根因是 `CameraStage` 每一帧直接把当前 mesh 写入 React state；MediaPipe 或 lattice 质量门短暂返回 `hidden` 时，canvas 输入会立刻被移除。
2. **双手闭合体仍会读成较长的暗盒。** `test_t027.jpg`、`test_t102.jpg`、`test_t114.jpg`、`test_t126.jpg` 等帧中，闭合体虽然存在，但背面和端面叠加后视觉上像一整块深色半透明盒子。这一部分主要是材质问题：背面太重，且过多面使用了视频纹理叠加。
3. **当前模型相对参考视频仍过于字面化。** 参考视频更像一个受控的手势模板，会在长条、薄边、三角面、折叠面和大纹理面之间切换；当前实现仍偏向把当前帧指尖直接连成 mesh。
4. **手部遮挡和深度层级尚未解决。** 参考视频中手指经常视觉上压在模板前方；当前渲染层仍是把 mesh 叠加在摄像头画面上方，没有手部或人体分割。
5. **每个面的视觉身份还不够清晰。** 参考视频有强白边和不同面的纹理区分。当前阶段应先用简单独立颜色区分各个侧面，后续再升级为纹理和边缘风格。

## 本轮修正

- 新增 spatial-template 稳定层，在短暂 hidden tracking gap 中保留上一帧可见 mesh，直接针对本次反馈的双手运动闪烁。
- 修改 `CameraStage`，让 render input 先经过稳定层再更新 React state。
- 新增可测试的空间模板材质配置层。
- 修改渲染器，使 `AB/BC/CD/DE/EA` 五个侧面使用可区分颜色。
- 降低背面和端面的视觉权重，并停止给深色背面贴视频纹理，降低闭合体读成黑盒的概率。
- 让边缘透明度跟随 held mesh opacity 一起衰减，避免短暂 tracking gap 淡出时残留高亮边线。

## 后续架构方向

当前技术栈仍然可行：MediaPipe Hands、display-space 指尖拓扑、Three.js 和 GitHub Pages 都能支撑目标效果。

下一步模型层不应继续零散补面，而应在原始指尖拓扑和 mesh 构建之间加入 `TemplateState` 层：

- 分类稳定状态，例如 `hidden`、`one-hand-face`、`two-hand-bar`、`two-hand-folded`、`two-hand-triangle`；
- 指尖作为约束点，而不是每一帧都无约束地直接成为自由形变 mesh 顶点；
- 状态变化加入滞回；
- 保留当前 fingertip lattice 作为诊断/完整体状态，但不要把每个有效帧都强行变成同一个闭合体。

## 下一步验证方案

1. 部署本轮构建后，在有摄像头设备上硬刷新 GitHub Pages 链接。
2. 双手闪烁测试：双手一起移动至少 20 秒。预期：短暂 tracking gap 应淡出或保持上一帧几何体，不应整块模型瞬间闪没。
3. 多面样式测试：双手保持稳定。预期：五个侧面应能通过颜色区分，不应全部同步为同一种整体色调。
4. 暗盒回归测试：复现上次 `test_t027`、`test_t102`、`test_t126` 附近姿态。预期：几何形态可能仍需继续优化，但视觉上不应再堆成很重的黑色盒子。
5. 单手测试：只展示一只手并张开五指。预期：不出现厚体；只允许有效单手面或隐藏。
6. 录屏后继续用 FFmpeg 全量拆帧，并与同一参考视频关键状态再次对比。
