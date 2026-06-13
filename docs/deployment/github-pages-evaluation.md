# GitHub Pages 部署评估

## 1. 结论

使用 GitHub Pages 部署 `Gesture Mask Studio` 可行，并且适合个人开发者。

原因：

- 项目 MVP 是纯前端静态应用，不依赖后端服务。
- 摄像头通过浏览器 `getUserMedia` 访问，要求安全上下文。
- GitHub Pages 默认提供 HTTPS，满足摄像头权限要求。
- MediaPipe WASM 模型、纹理图片、前端 bundle 都可以作为静态资源发布。

## 2. 适配条件

### 必须满足

- 页面必须通过 HTTPS 访问。
- 浏览器必须支持：
  - `navigator.mediaDevices.getUserMedia`
  - WebGL
  - WebAssembly
- 用户必须手动授权摄像头。
- 构建产物必须正确配置静态资源路径。

### Vite 配置注意

如果仓库部署为 `https://Baldman-JYH.github.io/gesture-mask-studio/`，Vite 需要配置：

```ts
export default defineConfig({
  base: '/gesture-mask-studio/',
});
```

否则 JS、CSS、模型和纹理资源可能在 GitHub Pages 子路径下加载失败。

## 3. 推荐部署方式

使用 GitHub Actions 自动部署到 GitHub Pages：

1. push 到 `main`。
2. GitHub Actions 安装依赖并执行 `npm run build`。
3. 将 `app/dist` 发布到 GitHub Pages。

当前阶段尚未创建 `app/` 运行代码，因此先创建文档型仓库。进入实现阶段后再添加 Pages workflow。

## 4. 个人开发者适配性

适合：

- 成本低：GitHub Pages 免费。
- 维护低：无服务器、无数据库、无模型服务。
- 分享方便：直接给 URL。
- 隐私更好：摄像头帧不上传服务器。

限制：

- 不能做服务端录制、账号系统或云端推理。
- 免费静态站点无法隐藏前端代码和模型资源。
- 大模型或大型资源会影响首次加载速度。
- 中国大陆网络访问 GitHub Pages 可能不稳定，必要时可备用 Vercel/Netlify/Cloudflare Pages。

## 5. 当前 GitHub 状态

- GitHub CLI: available.
- Authenticated account: `Baldman-JYH`.
- Target repository checked: `Baldman-JYH/gesture-mask-studio`.
- Current result: repository does not exist and can be created.

## 6. 仓库创建计划

仓库名：`gesture-mask-studio`

可见性：`public`

首个提交内容：

- `CODEX_DOC/progress.md`
- `docs/analysis/video-effect-analysis.md`
- `docs/product/requirements-and-business-logic.md`
- `docs/architecture/technical-architecture.md`
- `docs/deployment/github-pages-evaluation.md`
- `assets/video-frames/` 中的抽帧证据
- `README.md`
- `.gitignore`

是否推送：是。用户已明确要求建立对应 GitHub 远程个人仓库。
