# GitHub Pages 部署评估

English version: [github-pages-evaluation.md](github-pages-evaluation.md)

## 1. 结论

使用 GitHub Pages 部署 `Gesture Mask Studio` 可行，并且适合个人开发者。

原因：

- 项目 MVP 是纯前端静态应用，不依赖后端服务。
- 摄像头通过浏览器 `getUserMedia` 访问，需要安全上下文。
- GitHub Pages 默认提供 HTTPS，满足摄像头权限要求。
- MediaPipe wasm、纹理图片和前端 bundle 都可作为静态资源发布。

## 2. 必须满足的条件

- 页面必须通过 HTTPS 访问。
- 浏览器必须支持：
  - `navigator.mediaDevices.getUserMedia`
  - WebGL
  - WebAssembly
- 用户必须手动授权摄像头。
- 构建产物必须正确配置静态资源路径。

## 3. Vite 配置

仓库部署地址是：

```text
https://baldman-jyh.github.io/gesture-mask-studio/
```

因此 Vite 需要配置：

```ts
export default defineConfig({
  base: '/gesture-mask-studio/',
});
```

否则 JS、CSS、模型和纹理资源可能在 GitHub Pages 子路径下加载失败。

## 4. 部署方式

使用 GitHub Actions 自动部署到 GitHub Pages：

1. push 到 `main`。
2. GitHub Actions 在 `app/` 下执行依赖安装。
3. 执行 `npm test`。
4. 执行 `npm run build`。
5. 发布 `app/dist` 到 GitHub Pages。

当前 workflow：`.github/workflows/pages.yml`

## 5. MediaPipe wasm 策略

最初如果依赖第三方 wasm CDN，可能出现：

- CDN 路径变更；
- 404；
- MIME type 错误；
- 国内网络访问不稳定。

当前实现使用 Vite 插件在构建时复制：

```text
node_modules/@mediapipe/tasks-vision/wasm
```

到：

```text
dist/mediapipe/wasm
```

部署后页面从自身站点加载 wasm，不依赖第三方 wasm CDN。

## 6. 个人开发者适配性

适合：

- 成本低：GitHub Pages 免费。
- 维护低：无服务器、无数据库、无模型服务。
- 分享方便：直接提供 URL。
- 隐私更好：摄像头帧在浏览器本地处理，不上传服务器。

限制：

- 不能做服务端录制、账号系统或云端推理。
- 免费静态站点无法隐藏前端代码和模型资源。
- 大模型或大型资源会影响首次加载速度。
- 中国大陆网络访问 GitHub Pages 可能不稳定，必要时可备用 Vercel、Netlify 或 Cloudflare Pages。

## 7. 当前状态

- GitHub 仓库：`https://github.com/Baldman-JYH/gesture-mask-studio`
- GitHub Pages 地址：`https://baldman-jyh.github.io/gesture-mask-studio/`
- Pages build type：`workflow`
- HTTPS：已启用。
- 最新部署：已通过 `build` 和 `deploy`。

## 8. 验证要求

部署后必须验证：

- GitHub Actions `build` 成功。
- GitHub Actions `deploy` 成功。
- Pages 地址返回 HTTP `200`。
- 页面标题为 `Gesture Mask Studio`。
- DevTools Network 无缺失的 JS/CSS/wasm 资源。
- 首次加载无 console error。
