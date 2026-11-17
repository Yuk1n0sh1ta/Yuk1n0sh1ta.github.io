import type { APIRoute } from 'astro';
import { extractExcerpt, formatDateShort, getAllPosts, getPostTitle, getPostUrl } from '@/lib/posts';

export const GET: APIRoute = async () => {
  const posts = await getAllPosts();
  const records = posts.map((post) => ({
    title: getPostTitle(post),
    url: getPostUrl(post),
    date: formatDateShort(post.data.date),
    category: post.data.category,
    series: post.data.series ?? '',
    tags: post.data.tags,
    excerpt: extractExcerpt(post.body ?? '', post.data.summary),
  }));

  return new Response(JSON.stringify(records), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
