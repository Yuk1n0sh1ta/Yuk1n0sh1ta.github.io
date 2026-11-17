import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { SITE } from '@/config/site';
import { resolveMedia, type ResolvedMedia } from './media';

export interface AlbumPhotoInput {
  src: string;
  caption?: string;
}

export interface AlbumPhoto extends AlbumPhotoInput {
  media: ResolvedMedia;
}

export interface AlbumSectionInput {
  id: string;
  title: string;
  handle?: string;
  sourceUrl?: string;
  featured?: AlbumPhotoInput | null;
  items: AlbumPhotoInput[];
}

export interface AlbumSection {
  id: string;
  title: string;
  handle?: string;
  sourceUrl?: string;
  featured: AlbumPhoto | null;
  items: AlbumPhoto[];
}

export interface AlbumDoc {
  title: string;
  subtitle: string;
  description?: string;
  notice?: string;
  sections: AlbumSection[];
}

export async function loadAlbum(filename: 'photos.yaml' | 'gallery.yaml'): Promise<AlbumDoc> {
  const filePath = path.resolve(process.cwd(), 'content', 'albums', filename);
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = yaml.load(raw) as {
    title: string;
    subtitle: string;
    description?: string;
    notice?: string;
    sections: AlbumSectionInput[];
  };

  const sections: AlbumSection[] = [];
  for (const sec of parsed.sections ?? []) {
    const featured = sec.featured
      ? {
          ...sec.featured,
          media: await resolveMedia(sec.featured.src),
        }
      : null;

    const items = await Promise.all(
      (sec.items ?? []).map(async (item) => ({
        ...item,
        media: await resolveMedia(item.src),
      }))
    );

    sections.push({
      id: sec.id,
      title: sec.title,
      handle: sec.handle,
      sourceUrl: sec.sourceUrl,
      featured,
      items,
    });
  }

  return {
    title: parsed.title,
    subtitle: parsed.subtitle,
    description: parsed.description,
    notice: parsed.notice,
    sections,
  };
}

export interface AboutChoice {
  label: string;
  next?: string;
  href?: string;
}

export interface AboutNode {
  messages: string[];
  choices?: AboutChoice[];
}

export interface AboutDoc {
  title: string;
  subtitle: string;
  description: string;
  profile: {
    name: string;
    role: string;
    status: string;
    location: string;
    avatar: string;
    avatarMedia: ResolvedMedia;
    links: { label: string; url: string }[];
  };
  startNode: string;
  nodes: Record<string, AboutNode>;
}

export async function loadAboutPage(): Promise<AboutDoc> {
  const filePath = path.resolve(process.cwd(), 'content', 'pages', 'about.yaml');
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = yaml.load(raw) as Omit<AboutDoc, 'profile'> & {
    profile: Omit<AboutDoc['profile'], 'avatarMedia'>;
  };
  const avatarMedia = await resolveMedia(parsed.profile.avatar, { thumbWidth: 240, fullWidth: 480 });
  return {
    ...parsed,
    profile: {
      ...parsed.profile,
      avatarMedia,
    },
  };
}

export interface MusicItem {
  title: string;
  artist: string;
  note?: string;
  appleMusicUrl: string;
  embedBaseUrl: string;
  isSingle: boolean;
  height: number;
}

export interface MusicGroup {
  id: string;
  title: string;
  overline: string;
  items: MusicItem[];
}

export interface MusicDoc {
  title: string;
  subtitle: string;
  description: string;
  groups: MusicGroup[];
}

export function toAppleMusicEmbedUrl(shareUrl: string): string {
  try {
    const u = new URL(shareUrl);
    u.hostname = 'embed.music.apple.com';
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length > 0 && ['album', 'playlist', 'song', 'music-video'].includes(parts[0])) {
      u.pathname = `/cn/${parts.join('/')}`;
    } else if (parts.length > 0 && parts[0].length === 2) {
      parts[0] = 'cn';
      u.pathname = `/${parts.join('/')}`;
    }
    if (!u.searchParams.has('l')) {
      u.searchParams.set('l', 'zh-Hans');
    }
    return u.toString();
  } catch {
    return shareUrl.replace('https://music.apple.com', 'https://embed.music.apple.com');
  }
}

export function buildAppleMusicEmbedSrc(embedBaseUrl: string, theme: 'light' | 'dark' = 'light'): string {
  try {
    const u = new URL(embedBaseUrl);
    if (!u.searchParams.has('l')) {
      u.searchParams.set('l', 'zh-Hans');
    }
    u.searchParams.set('theme', theme);
    return u.toString();
  } catch {
    const sep = embedBaseUrl.includes('?') ? '&' : '?';
    return `${embedBaseUrl}${sep}l=zh-Hans&theme=${theme}`;
  }
}

export function isAppleMusicSingleUrl(shareUrl: string): boolean {
  try {
    const u = new URL(shareUrl);
    if (u.searchParams.has('i')) return true;
    const parts = u.pathname.split('/').filter(Boolean);
    return parts.includes('song');
  } catch {
    return shareUrl.includes('?i=') || shareUrl.includes('/song/');
  }
}

export async function loadMusicPage(): Promise<MusicDoc> {
  const filePath = path.resolve(process.cwd(), 'content', 'pages', 'music.yaml');
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = yaml.load(raw) as {
    title: string;
    subtitle: string;
    description: string;
    groups: Array<{
      id: string;
      title: string;
      overline: string;
      items: Array<{
        title: string;
        artist: string;
        note?: string;
        appleMusicUrl: string;
        height?: number;
      }>;
    }>;
  };

  return {
    ...parsed,
    groups: parsed.groups.map((g) => ({
      ...g,
      items: g.items.map((item) => {
        const isSingle = isAppleMusicSingleUrl(item.appleMusicUrl);
        return {
          ...item,
          embedBaseUrl: toAppleMusicEmbedUrl(item.appleMusicUrl),
          isSingle,
          // Apple Music's embed DOM hardcodes 450px for albums/playlists and 175px for ?i= single tracks.
          height: item.height ?? (isSingle ? 175 : 450),
        };
      }),
    })),
  };
}

export interface HomePageDoc {
  siteTitle: string;
  siteSubtitle: string;
  authorLabel: string;
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  showStatsInEyebrow: boolean;
  heading: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  showSearchButton: boolean;
  showFeaturedPhoto: boolean;
  randomFeaturedPhoto: boolean;
  featuredPhoto: string;
  featuredCaption: string;
  heroMedia: ResolvedMedia;
  recentEyebrow: string;
  recentHeading: string;
  galleryEyebrow: string;
  galleryHeading: string;
  showcasePhotos: string[];
}

const DEFAULT_SHOWCASE_PHOTOS = [
  'photos/DSCF1399.jpg',
  'photos/DSCF0503.jpg',
  'photos/DSCF2185.jpg',
  'photos/DSCF3702.jpg',
];

function nonEmptyString(val: unknown, fallback: string): string {
  return typeof val === 'string' && val.trim().length > 0 ? val.trim() : fallback;
}

export async function loadHomePage(): Promise<HomePageDoc> {
  const mdPath = path.resolve(process.cwd(), 'content', 'pages', 'home.md');
  const yamlPath = path.resolve(process.cwd(), 'content', 'pages', 'home.yaml');
  let rawData: Record<string, any> = {};

  try {
    const mdRaw = (await fs.readFile(mdPath, 'utf8')).replace(/^\uFEFF/, '');
    const fmMatch = mdRaw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
      rawData = (yaml.load(fmMatch[1]) as Record<string, any>) || {};
    }
  } catch {
    try {
      const yRaw = await fs.readFile(yamlPath, 'utf8');
      rawData = (yaml.load(yRaw) as Record<string, any>) || {};
    } catch {
      rawData = {};
    }
  }

  const siteTitle = nonEmptyString(rawData.siteTitle, SITE.title);
  const siteSubtitle = nonEmptyString(rawData.siteSubtitle, SITE.subtitle);
  const authorLabel = nonEmptyString(rawData.authorLabel, `${SITE.author} · Digital Garden`);
  const heading = nonEmptyString(rawData.heading, SITE.hero.heading);
  const description = nonEmptyString(rawData.description, SITE.hero.lead);
  const seoTitle = nonEmptyString(rawData.seoTitle, `${siteTitle} — ${siteSubtitle}`);
  const seoDescription = nonEmptyString(rawData.seoDescription, description || SITE.description);
  const featuredPhoto = nonEmptyString(rawData.featuredPhoto, SITE.media.heroImage);
  const featuredCaption = nonEmptyString(rawData.featuredCaption, SITE.media.heroCaption);
  const heroMedia = await resolveMedia(featuredPhoto);

  const showcaseRaw = Array.isArray(rawData.showcasePhotos)
    ? rawData.showcasePhotos.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
    : [];

  return {
    siteTitle,
    siteSubtitle,
    authorLabel,
    seoTitle,
    seoDescription,
    eyebrow: nonEmptyString(rawData.eyebrow, SITE.hero.eyebrow),
    showStatsInEyebrow: rawData.showStatsInEyebrow !== false,
    heading,
    description,
    primaryCta: {
      label: nonEmptyString(rawData.primaryCtaLabel, SITE.hero.primaryCta.label),
      href: nonEmptyString(rawData.primaryCtaHref, SITE.hero.primaryCta.href),
    },
    secondaryCta: {
      label: nonEmptyString(rawData.secondaryCtaLabel, SITE.hero.secondaryCta.label),
      href: nonEmptyString(rawData.secondaryCtaHref, SITE.hero.secondaryCta.href),
    },
    showSearchButton: rawData.showSearchButton !== false,
    showFeaturedPhoto: rawData.showFeaturedPhoto !== false,
    randomFeaturedPhoto: rawData.randomFeaturedPhoto !== false,
    featuredPhoto,
    featuredCaption,
    heroMedia,
    recentEyebrow: nonEmptyString(rawData.recentEyebrow, 'Recent Writing'),
    recentHeading: nonEmptyString(rawData.recentHeading, '最新文章与笔记'),
    galleryEyebrow: nonEmptyString(rawData.galleryEyebrow, 'Visual Archive'),
    galleryHeading: nonEmptyString(rawData.galleryHeading, '光影与色彩'),
    showcasePhotos: showcaseRaw.length > 0 ? showcaseRaw : DEFAULT_SHOWCASE_PHOTOS,
  };
}
