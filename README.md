# Yuk1n0のBlog

基于 **Astro 5 + Tailwind CSS v4 + KaTeX + Shiki + Pagefind + PhotoSwipe** 构建的个人博客与影像归档站点，采用克制的左侧边栏与随动大纲阅读体验，适配 **Obsidian + Git + Cloudflare Pages** 工作流。

## 目录结构

- `content/` — **直接用 Obsidian 打开此目录作为 Vault**
  - `posts/`：Markdown 文章与专栏笔记（文件名只需保留简短标题，如 `文章标题.md`；构建时自动按日期生成 `/posts/YYYY-MM-DD-slug/` 路由）
  - `albums/`：`photos.yaml`（相册）与 `gallery.yaml`（美术馆）配置文件
  - `pages/`：`home.md`（主页标题、描述与板块开关，Obsidian 内可直接编辑）、`about.yaml`（交互对话配置）与 `music.yaml`（Apple Music 歌单）
  - `assets/`：统一媒体库（`posts/`、`photos/`、`gallery/`、`attachments/`）
  - `templates/`：Obsidian 新文章与相册模板
- `src/config/site.ts` — 站点总配置（标题、导航开关、默认浅/深主题、4 套强调色调、Giscus 评论、R2 媒体域名前缀）
- `src/lib/slug.ts` — 内部文章 URL 生成器（构建时自动基于 `date` 与 `title`/文件名生成带日期的长路由）
- `src/lib/markdown/remark-legacy-compat.ts` — 兼容 Obsidian `![[嵌入]]` / `[[双链]]` / `==高亮==` / `> [!callout]` 及历史 LaTeX 写法
- `scripts/migrate-hexo.mjs` — 旧站迁移脚本
- `public/_redirects` — Cloudflare Pages 旧 Hexo URL 301 重定向规则

## 本地开发与构建

> 需要 Node.js >= 20（仓库根目录 `.node-version` 已指定 `22`）。Windows 下可直接双击或运行根目录的 [`build-and-run.bat`](build-and-run.bat) 一键构建并启动预览。

```bash
npm install
npm run dev      # 本地预览 http://localhost:4321
npm run build    # 构建静态站点至 dist/ 并生成 Pagefind 全文搜索索引
npm run preview  # 本地预览构建产物
```

## 部署到 Cloudflare Pages

1. 将本仓库推送至 GitHub。
2. 在 Cloudflare Dashboard -> **Workers & Pages** -> **Create** -> **Pages** -> **Connect to Git**，选择本仓库。
3. 构建设置：
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. `.node-version` 文件会自动告知 Cloudflare Pages 使用 Node 22。

## 后续平滑迁移图片至 Cloudflare R2

目前图片统一保存在 `content/assets/` 下并由 Astro 构建期转为 WebP。若未来图库体积增长需要迁往 R2：
1. 使用 `rclone` 或 Wrangler 将 `content/assets/` 同步上传至 R2 Bucket，并绑定自定义域名（如 `https://img.yourdomain.com`）。
2. 在 Cloudflare Pages 环境变量中配置 `PUBLIC_MEDIA_BASE=https://img.yourdomain.com`。
3. 随后即可移除本地大体积原图，站点会自动从 R2 加载图片。
