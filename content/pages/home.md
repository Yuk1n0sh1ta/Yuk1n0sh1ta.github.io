---
siteTitle: Yuk1n0のBlog
siteSubtitle: Notes on NLP, Japanese, Engineering & Photography
authorLabel: Yuk1n0 · Digital Garden
seoTitle: ""
seoDescription: ""
eyebrow: Yuk1n0 · Personal Archive (2019 — Present)
showStatsInEyebrow: true
heading: 在这里，你和我都可以更了解Yuk1n0
description: 拒绝碎片化信息流，拥抱系统化工作流
primaryCtaLabel: 阅读最新文章
primaryCtaHref: /posts
secondaryCtaLabel: 探索专栏体系
secondaryCtaHref: /series
showSearchButton: true
showFeaturedPhoto: true
randomFeaturedPhoto: true
featuredPhoto: photos/DSCF1373.jpg
featuredCaption: 函馆山展望台 · Fujifilm Photography
recentEyebrow: Recent Writing
recentHeading: 最新文章与笔记
galleryEyebrow: Visual Archive
galleryHeading: 光影与色彩
showcasePhotos:
  - photos/DSCF1399.jpg
  - photos/DSCF0503.jpg
  - photos/DSCF2185.jpg
  - photos/DSCF3702.jpg
---

# 首页配置说明（Obsidian 可直接编辑）

在上方 **属性（Properties）** 或源码 Frontmatter 中直接修改字段，保存并通过 Git 推送后即可生效：

- `heading`：首页主视觉大标题
- `description`：首页主标题下方的介绍文案
- `eyebrow`：主标题上方的小字眉标（`showStatsInEyebrow` 控制是否自动拼接 `· XX 篇文章 · X 个专栏`）
- `siteTitle` / `siteSubtitle` / `authorLabel`：左侧边栏品牌名、浏览器标签标题与作者副标题
- `seoTitle` / `seoDescription`：可选，用于单独覆写首页 HTML `<title>` 与搜索引擎 `<meta description>`（留空则自动组合 `siteTitle` 与 `description`）
- `primaryCtaLabel` / `secondaryCtaLabel`：主视觉按钮文案与跳转链接
- `showFeaturedPhoto` / `randomFeaturedPhoto` / `featuredPhoto` / `featuredCaption`：控制首页右侧封面图开关、是否每次刷新随机展示 `3:2` 相册原图，以及默认图路径
- `recentHeading` / `galleryHeading` / `showcasePhotos`：首页「最新文章与笔记」「照片墙与美术馆」标题及底部 4 张精选图路径（相对 `content/assets/`）
