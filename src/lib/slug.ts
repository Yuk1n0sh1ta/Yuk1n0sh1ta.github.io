/**
 * Shared slug & date helpers used identically by:
 * - Astro runtime collections (`src/lib/posts.ts`)
 * - Remark WikiLink resolver (`src/lib/markdown/remark-legacy-compat.ts`)
 * - Migration tools (`scripts/migrate-hexo.mjs`)
 */

export function sanitizeSlug(text: string): string {
  return String(text || 'untitled')
    .trim()
    .replace(/[<>:"/\\|?*#%&+~`!@^=()[\]{}.,，。！？：；（）「」『』【】、]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function formatDateUtcYmd(dateVal: Date | string): string {
  const d = dateVal instanceof Date ? dateVal : new Date(String(dateVal).replace(' ', 'T') + 'Z');
  if (!Number.isNaN(d.getTime())) {
    const y = String(d.getUTCFullYear());
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const m = String(dateVal || '').match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  return '2020-01-01';
}

export function stripLeadingDatePrefix(stem: string): string {
  return stem.replace(/^\d{4}-\d{2}-\d{2}-/, '').trim();
}

export function computeBasePostSlug(input: {
  id: string;
  title?: string;
  date: Date | string;
  explicitSlug?: string;
}): string {
  if (input.explicitSlug && input.explicitSlug.trim()) {
    return input.explicitSlug.trim();
  }
  const stem = input.id.replace(/\.md$/i, '');
  const cleanTitle = (input.title || '').trim() || stripLeadingDatePrefix(stem);
  const ymd = formatDateUtcYmd(input.date);
  const part = sanitizeSlug(cleanTitle);
  if (part) {
    return `${ymd}-${part}`;
  }
  // Fallback when title has only punctuation/symbols
  const fallback = sanitizeSlug(stem) || 'post';
  return `${ymd}-${fallback}`;
}
