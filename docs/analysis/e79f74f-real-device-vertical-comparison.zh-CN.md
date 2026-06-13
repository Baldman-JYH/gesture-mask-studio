# e79f74f 真实设备上下采样分析

English version: [e79f74f-real-device-vertical-comparison.md](e79f74f-real-device-vertical-comparison.md)

## 范围

本文对基于提交 `e79f74f257c80db9ae39c2b0d3e0b47425a31609` 的真实设备验证录屏进行分析，并与参考视频期望效果进行对比。

输入：

- 真实设备录屏：`测试记录/基于提交 e79f74f257c80db9ae39c2b0d3e0b47425a31609测试/屏幕录制 2026-06-13 170040.mp4`
- 控制台截图：`测试记录/基于提交 e79f74f257c80db9ae39c2b0d3e0b47425a31609测试/image.png`
- 参考行为：`docs/analysis/video-effect-analysis.zh-CN.md`
- 派生分析证据：`assets/analysis/e79f74f-real-device-vertical-comparison/`

FFmpeg 抽取结果：

- 从真实设备录屏抽取 179 张 1fps 连续帧；
- 生成 1 张 1fps 总览拼图；
- 生成 20s-40s、60s-85s、120s-145s 三个 4fps 片段拼图。

## 发现

控制台截图中已经没有之前的 WebGL shader 编译失败。MediaPipe 能正常启动，仅输出已知运行时 warning，并在摄像头停止时正常关闭。

上一轮左右方向修复在录屏中已经可见。当前剩余缺陷是光片内部采样到的摄像头内容上下反向。失败层不是光片的屏幕几何位置，而是视频纹理采样方向。

当前运行时仍然是扁平的屏幕空间光片。它还没有实现参考视频中的手指锚定三维模板模型、指尖定位深度移动、多面网格、折叠和旋转行为；这些属于 ADR-0002 描述的下一阶段能力。

## 根因

项目运行时涉及三个坐标空间：

- `display-space`：用户看到的归一化屏幕坐标，`y = 0` 表示可见摄像头画面顶部，`y = 1` 表示底部；
- `clip-space`：WebGL 顶点坐标，`+1` 表示顶部，`-1` 表示底部；
- `video-uv-space`：Three.js 视频纹理采样坐标。

几何转换本身是正确的：

```ts
clipY = 1 - displayY * 2;
```

问题出在 `scene-sampling` 的视频 UV 转换。之前直接把显示坐标 `y` 映射到 `v`，导致 Three.js `VideoTexture` 采样到相反的垂直方向：

```ts
v = y; // 当前 VideoTexture 路径下错误
```

当前渲染器下，显示坐标到视频纹理坐标必须使用：

```ts
v = 1 - y;
```

水平镜像规则保持独立：只有可见摄像头预览开启镜像时，`x` 才进行水平翻转。

## 修复方向

修复应保持范围收敛：

- 不修改几何 `y` 转换；
- 不修改上一轮的 display-space 镜像转换；
- 只修改 display-space 到 video-UV 的转换，使 `v = 1 - y`；
- 在 `scene-sampling` 和 `light-sheet-renderer` 中用单元测试锁定行为。

## 验证要求

自动化验证：

- `npm test -- src/features/scene-sampling/screenSpaceSampling.test.ts src/features/light-sheet-renderer/rendererCore.test.ts`
- 完整 `npm test`
- `npm run build`
- 中英文文档配对检查
- `git diff --check`

部署后的真实设备验证：

- 强制刷新 GitHub Pages 页面；
- 保持 Mirror 开启，移动手部左/右/上/下；
- 验证左右方向仍然一致；
- 验证光片内部采样内容不再上下反向；
- 关闭 Mirror 后重复；
- 录制短视频，原始录像继续只保存在本地 `测试记录/` 下。
