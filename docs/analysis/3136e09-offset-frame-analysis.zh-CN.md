# 3136e09 偏移逐帧分析

English version: [3136e09-offset-frame-analysis.md](3136e09-offset-frame-analysis.md)

## 输入

- 测试录屏：`测试记录/基于提交 3136e094b0210928d2eb01f8f06d8541535e6ca2测试/屏幕录制 2026-06-14 130340.mp4`
- 参考录屏：`参考视频.mp4`
- 测试录屏元信息：1904x878，30fps，约 206.5 秒，6191 帧。
- 参考视频元信息：1226x686，30fps，约 24.58 秒，736 帧。

## 抽帧证据

已使用 FFmpeg 抽取全部帧到：

`测试记录/基于提交 3136e094b0210928d2eb01f8f06d8541535e6ca2测试/ffmpeg逐帧对比_20260614_130340/`

已生成拼图：

- `sheets/test_contact_1fps.jpg`
- `sheets/reference_contact_1fps.jpg`
- `sheets/test_segment_000_060_4fps.jpg`
- `sheets/test_segment_060_120_4fps.jpg`
- `sheets/test_segment_120_180_4fps.jpg`
- `sheets/test_segment_180_207_4fps.jpg`
- `sheets/reference_segment_000_025_4fps.jpg`

代表性关键帧：

- `keyframes/test_100s_horizontal_low_offset.jpg`
- `keyframes/test_145s_single_hand_slab.jpg`
- `keyframes/test_190s_diagonal_capsule.jpg`
- `keyframes/reference_002s_hand_anchored_strip.jpg`
- `keyframes/reference_008s_thin_fold.jpg`
- `keyframes/reference_015s_wide_face_anchor.jpg`

## 发现

`3136e09` 已经修复之前的开放体问题，整体几何现在基本闭合。

剩余偏移不是单纯镜像轴错误。偏移会随手势姿态和画面垂直位置变化。在 1904x878 测试录屏中，双手水平展开时，闭合长体经常低于可见指尖；单手时也会出现小片或厚板偏到手旁，而不是直接贴在可见指尖闭环上。

参考视频表现不同：模板边缘更稳定地贴近手指控制点，并且会在细条、三角折面和宽面之间变化，但不会明显漂离手部控制点。

## 根因

运行时混用了两套坐标：

1. MediaPipe 返回的是源视频归一化 landmarks。
2. 浏览器用 `object-fit: cover` 把摄像头视频显示在可见舞台内。
3. 空间模板几何却直接把源视频 landmarks 当作显示空间顶点使用。

本次录屏中，可见舞台比摄像头视频更宽。`object-fit: cover` 会按舞台宽度缩放源视频，并在垂直方向裁切。源视频点 `y=0.3` 在可见舞台中约为 `y=0.256`，不是 `y=0.3`。缺少这一步源视频坐标到可见显示坐标的转换，可以解释当前随姿态变化的垂直偏移。

另一个次要视觉问题仍然存在：MediaPipe 的 `z` 仍直接作为空间模板深度进入透视投影。单手或斜向姿态下，这会放大“厚胶囊/厚板”感。它应在验证坐标修复后作为独立问题处理。

## 已做修改

`toDisplayHands` 现在会先把源视频 landmarks 经过与可见视频一致的居中 `object-fit: cover` 映射，再执行镜像转换。`CameraStage` 会把当前 video 和 viewport 尺寸传入该映射。

这样进入手部拓扑和空间模板渲染的坐标，与用户实际看到的摄像头画面处于同一坐标空间。

## 仍需验证

自动化测试已覆盖本次宽屏录屏对应的垂直裁切场景。

由于真实偏移还受物理设备画幅、浏览器视口和摄像头流尺寸影响，仍需要在有摄像头设备上重新录屏验证。
