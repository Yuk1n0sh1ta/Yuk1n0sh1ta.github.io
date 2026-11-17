import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '@/config/site';
import { loadHomePage } from '@/lib/yaml-content';
import { extractExcerpt, getAllPosts, getPostTitle, getPostUrl } from '@/lib/posts';

export const GET: APIRoute = async (context) => {
  const [posts, home] = await Promise.all([getAllPosts(), loadHomePage()]);
  return rss({
    title: home.siteTitle,
    description: home.seoDescription,
    site: context.site ?? SITE.url,
    items: posts.slice(0, 40).map((post) => ({
      title: getPostTitle(post),
      pubDate: post.data.date,
      description: extractExcerpt(post.body ?? '', post.data.summary),
      link: getPostUrl(post),
      categories: [post.data.category, ...post.data.tags],
    })),
    customData: `<language>zh-cn</language>`,
  });
};
