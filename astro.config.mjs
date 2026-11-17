import { defineConfig, sharpImageService } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkLegacyCompat } from './src/lib/markdown/remark-legacy-compat';
import { SITE } from './src/config/site';

export default defineConfig({
  site: process.env.SITE_URL || SITE.url,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  image: {
    service: sharpImageService({
      limitInputPixels: false,
    }),
  },
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      langAlias: {
        C: 'c',
        Cpp: 'cpp',
        CPP: 'cpp',
        Python: 'python',
        Bash: 'bash',
        Shell: 'bash',
        Plaintext: 'plaintext',
        Text: 'plaintext',
        JS: 'javascript',
        TS: 'typescript',
      },
      wrap: false,
    },
    remarkPlugins: [remarkMath, remarkLegacyCompat],
    rehypePlugins: [
      [
        rehypeKatex,
        {
          strict: false,
          trust: true,
          throwOnError: false,
        },
      ],
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
