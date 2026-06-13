# Gesture Mask Studio 验证方案

本文档是每次功能开发、问题修复和部署变更都必须参考的固定验证清单。

English version: [verification-plan.md](verification-plan.md)

## 后续变更规则

每个新功能或问题修复，在视为完成前都必须包含具体的验证方案。

验证方案必须说明：

- 改了什么；
- 运行了哪些自动化检查；
- 做了哪些手动浏览器/设备检查；
- 哪些明确结果可以证明修改有效；
- 捕获或观察到了哪些证据；
- 还存在哪些未验证风险。

## 基线命令

合并或部署生产代码前，在 `app/` 下运行：

```bash
npm test
npm run build
```

当变更涉及依赖或 `package-lock.json` 时，还要运行：

```bash
npx npm@10.9.8 ci
```

这与当前 GitHub Pages workflow 使用的 GitHub Actions runner npm 版本一致。

## 部署验证

推送到 `main` 后：

1. 打开 GitHub Actions。
2. 查看 workflow `Deploy GitHub Pages`。
3. 确认两个 job 都是绿色：
   - `build`
   - `deploy`
4. 打开：
   - `https://baldman-jyh.github.io/gesture-mask-studio/`
5. 强制刷新页面。
6. 确认：
   - HTTP 状态是 `200`；
   - 页面标题是 `Gesture Mask Studio`；
   - DevTools Network 中没有缺失的 JS/CSS/wasm 资源；
   - 首次加载没有 console error。

## 实时摄像头验证

使用 Chrome 或 Edge，在 HTTPS 部署地址或本地 `127.0.0.1` 上验证。

1. 打开应用地址。
2. 确认首屏：
   - 顶部状态栏可见；
   - 摄像头舞台铺满页面主体；
   - 底部控制栏可见；
   - 自动手势样式状态、Mirror、Start camera 控件都可见；
   - Blueprint、Cards、Organic 不再作为手动页签按钮显示；
   - 页面没有横向滚动。
3. 点击 `Start camera`。
4. 授权摄像头。
5. 确认：
   - 按钮变成 `Stop camera`；
   - 出现实时摄像头预览；
   - 没有 console error；
   - 应用至少 30 秒内保持响应。

## 手势效果验证

核心效果是实时采样光片，不能表现为静态贴图覆盖。

1. 向摄像头展示一只手。
2. 预期：
   - 出现一只手预览几何，或跟踪状态发生更新。
3. 展示两只手。
4. 左右、上下移动双手。
5. 预期：
   - 光片跟随手部锚点移动；
   - 光片在双手之间拉伸；
   - 光片角度随双手连线角度变化；
   - 光片尺寸随手部张开程度变化。
6. 在光片区域背后移动可见物体或人脸。
7. 预期：
   - 光片内能实时采样背后的内容；
   - 光片内能看到背后运动；
   - 渲染内容不是冻结画面，也不是预生成图片。
8. 用双手改变张开程度。
9. 预期：
   - 样式根据手势推导的预设自动变化；
   - 底部控制栏显示当前 `Auto` 样式；
   - 每种样式都保持实时摄像头采样能力。

## 控件验证

1. 确认底部控制栏显示 `Auto` 和当前样式名。
2. 预期：
   - 没有手动 Blueprint/Cards/Organic 页签按钮；
   - 样式由手部追踪驱动，不依赖手动选择。
5. 点击 `Mirror`。
6. 预期：
   - 预览镜像状态变化；
   - 采样对齐仍然一致。
7. 点击 `Stop camera`。
8. 预期：
   - 摄像头流停止；
   - 按钮恢复为 `Start camera`；
   - 不残留过期跟踪状态。

## 权限和失败验证

1. 拒绝摄像头权限。
2. 预期：
   - 应用不崩溃；
   - 显示权限错误状态；
   - 控件仍可操作。
3. 重新加载并授权摄像头。
4. 预期：
   - 摄像头可以正常启动。
5. 条件允许时，测试无摄像头设备场景。
6. 预期：
   - 显示 unsupported/error 状态；
   - console 中没有未捕获异常。

## 移动端验证

至少测试一个移动端视口或真实手机。

1. 在移动端打开部署地址。
2. 确认：
   - 无横向滚动；
   - 顶部状态栏不与控件重叠；
   - 底部控制栏可用；
   - 按钮内文字不溢出；
   - 摄像头权限流程能打开；
   - Start/Stop camera 仍可点击。

## 浏览器自动化烟测

针对布局回归，使用 Playwright 或等价工具运行浏览器烟测：

- 桌面视口约 `1440x900`；
- 移动视口约 `390x844`；
- 确认 `Auto` 手势样式状态可见；
- 切换 Mirror；
- 启动 fake camera；
- 确认出现 `Stop camera`；
- 确认 WebGL canvas 已挂载；
- 确认没有 console errors 或 failed requests。

## Shader 和 WebGL 回归验证

当变更涉及 `features/light-sheet-renderer` shader 代码时：

1. 为要保护的可移植性规则新增或更新 shader source 单元测试。
2. 运行 `npm test -- src/features/light-sheet-renderer/shaderSource.test.ts`。
3. 条件允许时，在 Chrome 或 Edge 中运行浏览器级 WebGL 编译检查。
4. 预期：
   - fragment shader 在 WebGL1 和 WebGL2 下都能编译；
   - program 在 WebGL1 和 WebGL2 下都能 link；
   - console 中没有 `THREE.WebGLProgram: Shader Error`。

## 变更专项验证模板

后续工作总结中使用该模板：

```text
验证方案：
1. 自动化检查：
   - ...
2. 手动浏览器检查：
   - ...
3. 真实摄像头/手势检查：
   - ...
4. 部署检查：
   - ...
5. 预期结果：
   - ...
6. 证据：
   - ...
7. 未覆盖/残余风险：
   - ...
```

## Bug 修复验证模板

每次修复 bug 时：

1. 修复前先复现问题；如果无法复现，说明原因。
2. 若问题是确定性的，添加或更新最小有意义的自动化测试。
3. 应用修复。
4. 重新执行复现步骤。
5. 运行相关自动化检查。
6. 检查一个相邻回归路径。
7. 记录修复前/修复后的明确行为差异。
