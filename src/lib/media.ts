import type { ImageMetadata } from 'astro';
import { SITE } from '@/config/site';

/**
 * Eagerly index all image assets inside `/content/assets` at build time.
 * Always serves original full-resolution assets (`meta.src`) without downscaling to thumbnails,
 * or resolves directly to `PUBLIC_MEDIA_BASE` when Cloudflare R2 hosting is configured.
 */
const assetModules = import.meta.glob<{ default: ImageMetadata }>(
  '/content/assets/**/*.{jpg,jpeg,png,webp,gif,avif,svg}',
  { eager: true }
);

export interface ResolvedMedia {
  thumbSrc: string;
  fullSrc: string;
  width: number;
  height: number;
  isOptimized: boolean;
}

function normalizeAssetPath(relPath: string): string {
  return relPath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^content\/assets\//, '');
}

export function getRawAssetMetadata(relPath: string): ImageMetadata | null {
  const clean = normalizeAssetPath(relPath);
  const key = `/content/assets/${clean}`;
  return assetModules[key]?.default ?? null;
}

export async function resolveMedia(
  relPath: string,
  _options: { thumbWidth?: number; fullWidth?: number } = {}
): Promise<ResolvedMedia> {
  const clean = normalizeAssetPath(relPath);

  if (SITE.media.baseUrl) {
    const base = SITE.media.baseUrl.replace(/\/+$/, '');
    const url = `${base}/assets/${clean}`;
    const meta = getRawAssetMetadata(clean);
    return {
      thumbSrc: url,
      fullSrc: url,
      width: meta?.width ?? 1600,
      height: meta?.height ?? 1066,
      isOptimized: false,
    };
  }

  const meta = getRawAssetMetadata(clean);
  if (!meta) {
    return {
      thumbSrc: `/assets/${clean}`,
      fullSrc: `/assets/${clean}`,
      width: 1200,
      height: 800,
      isOptimized: false,
    };
  }

  return {
    thumbSrc: meta.src,
    fullSrc: meta.src,
    width: meta.width,
    height: meta.height,
    isOptimized: false,
  };
}
