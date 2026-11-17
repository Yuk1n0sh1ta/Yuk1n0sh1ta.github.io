/**
 * Central site configuration — designed to keep aesthetic, layout, media,
 * navigation, and third-party integration choices flexible and declarative.
 */

export type AccentPreset = 'rose' | 'monochrome' | 'indigo' | 'sage';
export type ThemeMode = 'system' | 'light' | 'dark';
export type FontSizePreset = 'sm' | 'md' | 'lg';
export type ListViewPreset = 'cards' | 'compact';
export type GalleryLayoutPreset = 'masonry' | 'grid';

export interface NavItem {
  label: string;
  href: string;
  enabled: boolean;
  matchPrefix?: string;
}

export interface SeriesMetaItem {
  overline: string;
  title: string;
  description: string;
  order: number;
}

export const SITE = {
  // 1. 基本站点信息
  title: 'Yuk1n0のBlog',
  shortTitle: 'Yuk1n0',
  brandIcon: '/plane-icon.png',
  subtitle: 'Notes on NLP, Japanese, Engineering & Photography',
  description: 'Yuk1n0 的个人博客 —— 记录深度学习、自然语言处理、日语语法精炼笔记与旅途摄影。',
  author: 'Yuk1n0',
  url: 'https://yuk1n0-5b3.pages.dev', // 部署到 Cloudflare Pages 或绑定自定义域名后可修改此处
  foundedYear: 2019,

  // 2. 视觉与排版预设（也支持在页面顶部/阅读条实时切换；可选 'light' | 'dark' | 'system'）
  appearance: {
    defaultTheme: 'dark' as ThemeMode,
    defaultAccent: 'indigo' as AccentPreset, // 'rose' (jpgrammar) | 'monochrome' (OpenAI) | 'indigo' (Google) | 'sage'
    allowAccentSwitch: true, // 允许访客/作者在前端外观菜单切换 4 套克制色调
    defaultFontSize: 'md' as FontSizePreset,
    defaultListView: 'cards' as ListViewPreset,
    defaultGalleryLayout: 'masonry' as GalleryLayoutPreset,
    defaultGalleryColumns: 3 as 2 | 3,
  },

  // 3. 媒体托管抽象（留给未来平滑迁移 Cloudflare R2）
  // 当前为空字符串：图片由 Astro 构建期优化并随 Cloudflare Pages 分发；
  // 以后迁移到 R2 时，只需设置环境变量 PUBLIC_MEDIA_BASE=https://img.yourdomain.com
  media: {
    baseUrl: import.meta.env.PUBLIC_MEDIA_BASE ?? '',
    heroImage: 'photos/DSCF1373.jpg',
    heroCaption: '函馆山展望台 · Fujifilm Photography',
    avatarImage: 'site/cover/s01.jpg',
  },

  // 4. 首页 Hero 默认兜底文案（日常可直接到 content/pages/home.md 修改，在 Obsidian 中即可编辑）
  hero: {
    eyebrow: 'Yuk1n0 · Personal Archive (2019 — Present)',
    heading: '思考、学习与光的记录',
    lead: '面向阅读与检索而设计的个人数字花园。收录人工智能与工程笔记、日语语法精炼、以及富士相机下的旅途影像。',
    primaryCta: { label: '阅读最新文章', href: '/posts' },
    secondaryCta: { label: '探索专栏体系', href: '/series' },
    showFeaturedPhoto: true,
  },

  // 5. 导航栏开关与顺序（可自由隐藏或增删）
  nav: [
    { label: '首页', href: '/', enabled: true },
    { label: '文章', href: '/posts', enabled: true, matchPrefix: '/posts' },
    { label: '专栏', href: '/series', enabled: true, matchPrefix: '/series' },
    { label: '光影', href: '/photos', enabled: true, matchPrefix: '/photos' },
    { label: '色彩', href: '/gallery', enabled: true, matchPrefix: '/gallery' },
    { label: '频谱', href: '/music', enabled: true, matchPrefix: '/music' },
    { label: '关于', href: '/about', enabled: true, matchPrefix: '/about' },
  ] satisfies NavItem[],

  // 6. 专栏元数据（决定 /series 与文章侧边栏的展示文案与顺序）
  seriesMeta: {
    '日语语法指南': {
      overline: 'Japanese Grammar',
      title: '日语语法指南',
      description: '依据 Tae Kim 日语语法指南与中文译本精炼整理，含活用表格、例句与助词体系。',
      order: 1,
    },
    'CS224N 深度学习笔记': {
      overline: 'Stanford CS224N',
      title: 'CS224N 深度学习笔记',
      description: '词向量、分布式语义、语言模型与神经机器翻译核心数学推导记录。',
      order: 2,
    },
    '深度学习核心模型': {
      overline: 'Deep Learning Architectures',
      title: '深度学习核心模型',
      description: '从 CNN、RNN/LSTM 到 Attention、Transformer 与 BERT 的原理拆解。',
      order: 3,
    },
    'NLP 论文精读': {
      overline: 'Paper Reading',
      title: 'NLP 论文精读',
      description: 'RoBERTa、TinyBERT、BERTSUM、文本语义匹配等经典论文结构与方法梳理。',
      order: 4,
    },
    '语音与语言处理笔记': {
      overline: 'Speech & Language Processing',
      title: '语音与语言处理笔记',
      description: '《Speech and Language Processing》第三版基础章节精读笔记。',
      order: 5,
    },
    'Python 核心基础': {
      overline: 'Python Fundamentals',
      title: 'Python 核心基础',
      description: '内置类型、函数、文件 IO、地址引用与多进程实践速查。',
      order: 6,
    },
    'JLPT N2 核心词汇': {
      overline: 'Japanese Vocabulary',
      title: 'JLPT N2 核心词汇',
      description: 'N2 高频词表分阶段整理与例句记忆。',
      order: 7,
    },
  } as Record<string, SeriesMetaItem>,

  // 7. 社交与页脚链接
  social: [
    { id: 'github', label: 'GitHub', href: 'https://github.com/Yuk1n0sh1ta' },
    { id: 'bilibili', label: 'Bilibili', href: 'https://space.bilibili.com/39873026' },
    { id: 'rss', label: 'RSS', href: '/rss.xml' },
  ],

  // 8. 评论系统预留（推荐 Giscus：基于 GitHub Discussions，天然适配浅/深模式）
  // 推送到 GitHub 后在 https://giscus.app 获取参数并将 enabled 改为 true 即可启用
  comments: {
    enabled: false,
    provider: 'giscus' as const,
    repo: 'yuk1n0sh1ta/blog',
    repoId: '',
    category: 'Announcements',
    categoryId: '',
    mapping: 'pathname' as const,
    lang: 'zh-CN',
  },
} as const;
