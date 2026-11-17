import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '@/config/site';
import { computeBasePostSlug, formatDateUtcYmd, stripLeadingDatePrefix } from '@/lib/slug';

export type BlogPost = CollectionEntry<'posts'>;

const resolvedSlugCache = new Map<string, string>();

export function getPostTitle(post: BlogPost): string {
  const t = post.data.title?.trim();
  if (t) return t;
  const stem = post.id.replace(/\.md$/i, '');
  return stripLeadingDatePrefix(stem) || stem;
}

export function getPostSlug(post: BlogPost): string {
  const cached = resolvedSlugCache.get(post.id);
  if (cached) return cached;
  return computeBasePostSlug({
    id: post.id,
    title: post.data.title,
    date: post.data.date,
    explicitSlug: post.data.slug,
  });
}

export function getPostUrl(post: BlogPost): string {
  return `/posts/${encodeURIComponent(getPostSlug(post))}/`;
}

export function estimateReadingStats(rawBody: string) {
  const plain = rawBody
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*`~$[\]()_|-]/g, ' ');
  const cjkCount = (plain.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) || []).length;
  const latinWords = (plain.replace(/[\u4e00-\u9fff\u3040-\u30ff]/g, ' ').match(/[a-zA-Z0-9]+/g) || []).length;
  const wordCount = cjkCount + latinWords;
  const minutes = Math.max(1, Math.round(wordCount / 360));
  return { wordCount, minutes };
}

export function extractExcerpt(rawBody: string, customSummary?: string): string {
  if (customSummary && customSummary.trim()) return customSummary.trim();
  const lines = rawBody
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('|'));

  const text = lines
    .join(' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > 130 ? text.slice(0, 130).trim() + '…' : text;
}

export function formatDateShort(date: Date): string {
  return formatDateUtcYmd(date);
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const chronological = [...posts].sort((a, b) => {
    const diff = a.data.date.getTime() - b.data.date.getTime();
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });

  // Compute collision-free build-time URL slugs (YYYY-MM-DD-slug) from short filenames/titles
  resolvedSlugCache.clear();
  const used = new Set<string>();
  for (const post of chronological) {
    const base = computeBasePostSlug({
      id: post.id,
      title: post.data.title,
      date: post.data.date,
      explicitSlug: post.data.slug,
    });
    let slug = base;
    let counter = 2;
    while (used.has(slug)) {
      slug = `${base}-${counter++}`;
    }
    used.add(slug);
    resolvedSlugCache.set(post.id, slug);
  }

  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export interface SeriesGroup {
  name: string;
  title: string;
  slug: string;
  overline: string;
  description: string;
  order: number;
  posts: BlogPost[];
}

export const MIN_SERIES_POSTS = 5;

export function groupPostsBySeries(posts: BlogPost[]): SeriesGroup[] {
  const map = new Map<string, BlogPost[]>();
  for (const post of posts) {
    if (!post.data.series) continue;
    const list = map.get(post.data.series) ?? [];
    list.push(post);
    map.set(post.data.series, list);
  }

  const groups: SeriesGroup[] = [];
  for (const [name, list] of map.entries()) {
    // Only groups with at least 5 articles qualify as a structured series
    if (list.length < MIN_SERIES_POSTS) continue;
    const meta = SITE.seriesMeta[name];
    const sorted = [...list].sort((a, b) => {
      const oa = a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      const ob = b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      if (oa !== ob) return oa - ob;
      return a.data.date.getTime() - b.data.date.getTime();
    });
    groups.push({
      name,
      title: meta?.title ?? name,
      slug: name,
      overline: meta?.overline ?? 'Series',
      description: meta?.description ?? `收录「${name}」系列文章共 ${sorted.length} 篇。`,
      order: meta?.order ?? 99,
      posts: sorted,
    });
  }

  return groups.sort((a, b) => a.order - b.order);
}
