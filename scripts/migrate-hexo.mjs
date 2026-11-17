/**
 * One-time migration script from Hexo (yuk1n0.gitlab.io) -> Astro + Obsidian Vault (Blog/content)
 *
 * Usage:
 *   node scripts/migrate-hexo.mjs
 *   node scripts/migrate-hexo.mjs --skip-download
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import yaml from 'js-yaml';

const OLD_ROOT = 'C:\\Users\\wxyua\\Documents\\yuk1n0.gitlab.io';
const NEW_ROOT = path.resolve(import.meta.dirname, '..');
const SKIP_DOWNLOAD = process.argv.includes('--skip-download');

const OLD_POSTS_DIR = path.join(OLD_ROOT, 'source', '_posts');
const OLD_IMG_DIR = path.join(OLD_ROOT, 'themes', 'Sakura', 'source', 'img');

const CONTENT_DIR = path.join(NEW_ROOT, 'content');
const NEW_POSTS_DIR = path.join(CONTENT_DIR, 'posts');
const NEW_ALBUMS_DIR = path.join(CONTENT_DIR, 'albums');
const NEW_PAGES_DIR = path.join(CONTENT_DIR, 'pages');
const NEW_ASSETS_DIR = path.join(CONTENT_DIR, 'assets');
const PUBLIC_DIR = path.join(NEW_ROOT, 'public');

const DEFAULT_AVATAR_URL = 'https://s2.ax1x.com/2020/02/10/14XAGd.jpg';

const report = {
  migratedPosts: 0,
  skippedFiles: [],
  downloadedImages: [],
  failedImages: [],
  extractedBase64: [],
  copiedLocalImages: 0,
  redirects: 0,
};

const downloadCache = new Map();

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function sanitizeSlug(text) {
  return String(text || 'untitled')
    .trim()
    .replace(/[<>:"/\\|?*#%&+~`!@^=()[\]{}.,，。！？：；（）「」『』【】、]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function formatDateYMD(dateVal) {
  const d = dateVal instanceof Date ? dateVal : new Date(String(dateVal).replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) {
    const m = String(dateVal).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) {
      return {
        year: m[1],
        month: m[2].padStart(2, '0'),
        day: m[3].padStart(2, '0'),
        ymd: `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`,
        iso: `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')} 00:00:00`,
      };
    }
    return { year: '2020', month: '01', day: '01', ymd: '2020-01-01', iso: '2020-01-01 00:00:00' };
  }
  // js-yaml parses unquoted YAML timestamps as UTC calendar values, so read UTC components to preserve exact author time.
  const year = String(d.getUTCFullYear());
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return {
    year,
    month,
    day,
    ymd: `${year}-${month}-${day}`,
    iso: `${year}-${month}-${day} ${hh}:${mm}:${ss}`,
  };
}

function detectSeries(title) {
  let m;
  if ((m = title.match(/^日语语法\s+(\d+)\.(\d+)/))) {
    return { series: '日语语法指南', seriesOrder: Number(m[1]) * 100 + Number(m[2]) };
  }
  if ((m = title.match(/^日语课总结（(\d+)）/))) {
    return { series: '日语语法指南', seriesOrder: 900 + Number(m[1]) };
  }
  if ((m = title.match(/^日语单词\s+N2\s+P(\d+)/i))) {
    return { series: 'JLPT N2 核心词汇', seriesOrder: Number(m[1]) };
  }
  if (/^CS224N/i.test(title)) {
    return { series: 'CS224N 深度学习笔记', seriesOrder: undefined };
  }
  if (/^如何理解\s+/.test(title)) {
    return { series: '深度学习核心模型', seriesOrder: undefined };
  }
  if ((m = title.match(/^语音和语言处理第三版\s+(\d+)\.(\d+)/))) {
    return { series: '语音与语言处理笔记', seriesOrder: Number(m[1]) * 100 + Number(m[2]) };
  }
  if (/^Python的/.test(title)) {
    return { series: 'Python 核心基础', seriesOrder: undefined };
  }
  if (/^文献阅读\s+/.test(title)) {
    return { series: 'NLP 论文精读', seriesOrder: undefined };
  }
  return { series: undefined, seriesOrder: undefined };
}

function guessExtension(contentType, url, buffer) {
  if (buffer && buffer.length >= 12) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return '.png';
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return '.jpg';
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return '.gif';
    if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return '.webp';
    const head = buffer.slice(0, 200).toString('utf8').trimStart();
    if (head.startsWith('<svg') || head.startsWith('<?xml')) return '.svg';
  }
  if (contentType) {
    if (contentType.includes('png')) return '.png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
    if (contentType.includes('gif')) return '.gif';
    if (contentType.includes('webp')) return '.webp';
    if (contentType.includes('svg')) return '.svg';
  }
  const cleanUrl = url.split('?')[0].toLowerCase();
  const ext = path.extname(cleanUrl);
  if (ext === '.jfif') return '.jpg';
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return ext;
  return '.png';
}

async function downloadExternalImage(rawUrl, targetDir, prefix = 'img') {
  if (SKIP_DOWNLOAD) return null;

  // Strip low-res thumbnail query params from images.openai.com
  let fetchUrl = rawUrl;
  if (rawUrl.includes('images.openai.com') && rawUrl.includes('?')) {
    fetchUrl = rawUrl.split('?')[0];
  }

  if (downloadCache.has(fetchUrl)) {
    return downloadCache.get(fetchUrl);
  }

  const hash = crypto.createHash('md5').update(fetchUrl).digest('hex').slice(0, 8);

  const attemptFetch = async (urlToTry) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(urlToTry, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          Referer: 'https://yuk1n0.gitlab.io/',
        },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get('content-type') || '';
      const arrBuf = await res.arrayBuffer();
      const buf = Buffer.from(arrBuf);
      // Reject HTML error pages disguised as 200
      const head = buf.slice(0, 120).toString('utf8').trimStart().toLowerCase();
      if (head.startsWith('<!doctype html') || head.startsWith('<html')) {
        throw new Error('Returned HTML instead of image');
      }
      if (buf.length < 32) {
        throw new Error('Empty or invalid image payload');
      }
      return { buf, contentType };
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  try {
    let result;
    try {
      result = await attemptFetch(fetchUrl);
    } catch (e) {
      if (fetchUrl !== rawUrl) {
        result = await attemptFetch(rawUrl);
      } else {
        throw e;
      }
    }
    const ext = guessExtension(result.contentType, fetchUrl, result.buf);
    await ensureDir(targetDir);
    const fileName = `${prefix}-${hash}${ext}`;
    const absOut = path.join(targetDir, fileName);
    await fs.writeFile(absOut, result.buf);
    downloadCache.set(fetchUrl, absOut);
    report.downloadedImages.push({ url: rawUrl, savedTo: path.relative(NEW_ROOT, absOut) });
    return absOut;
  } catch (err) {
    downloadCache.set(fetchUrl, null);
    report.failedImages.push({ url: rawUrl, reason: err.message });
    return null;
  }
}

async function copyDirWithNormalize(srcDir, destDir, convertJfif = false) {
  await ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirWithNormalize(srcPath, path.join(destDir, entry.name), convertJfif);
    } else {
      let outName = entry.name;
      if (convertJfif && outName.toLowerCase().endsWith('.jfif')) {
        outName = outName.slice(0, -5) + '.jpg';
      }
      const destPath = path.join(destDir, outName);
      await fs.copyFile(srcPath, destPath);
      report.copiedLocalImages++;
    }
  }
}

function normalizePhotoPath(imgPath, prefix) {
  let clean = imgPath.trim().replace(/\\/g, '/');
  clean = clean.replace(/^\/?img\/(photo|gallery)\//, '');
  if (clean.toLowerCase().endsWith('.jfif')) {
    clean = clean.slice(0, -5) + '.jpg';
  }
  return `${prefix}/${clean}`;
}

async function migratePhotosAndGallery() {
  await ensureDir(NEW_ALBUMS_DIR);

  // 1. Photos
  const photoRaw = await fs.readFile(path.join(OLD_ROOT, 'source', 'photo', 'index.md'), 'utf8');
  const photoBody = photoRaw.replace(/^---[\s\S]*?---\r?\n/, '');
  const photoSections = [];
  let current = null;

  for (const line of photoBody.split(/\r?\n/)) {
    const hMatch = line.match(/^#\s+(.+)$/);
    if (hMatch) {
      const title = hMatch[1].trim();
      if (/^\.+$/.test(title)) {
        current = null;
        continue;
      }
      current = {
        id: sanitizeSlug(title) || `region-${photoSections.length + 1}`,
        title,
        featured: null,
        items: [],
      };
      photoSections.push(current);
      continue;
    }
    if (!current) continue;

    const tagMatches = [...line.matchAll(/\{%\s*fb_img\s+([^\s%]+)(?:\s+([^%]*?))?\s*%\}/g)];
    for (const tm of tagMatches) {
      const src = normalizePhotoPath(tm[1], 'photos');
      const caption = (tm[2] || '').trim();
      const item = { src, caption };
      if (line.includes('<center>') && !current.featured) {
        current.featured = item;
      } else {
        current.items.push(item);
      }
    }
  }

  await fs.writeFile(
    path.join(NEW_ALBUMS_DIR, 'photos.yaml'),
    yaml.dump(
      {
        title: '相册',
        subtitle: 'Photography & Travel Memories',
        description: '旅途与日常瞬间，按地点整理归档。',
        sections: photoSections,
      },
      { lineWidth: -1 }
    ),
    'utf8'
  );

  // 2. Gallery
  const galleryRaw = await fs.readFile(path.join(OLD_ROOT, 'source', 'gallery', 'index.md'), 'utf8');
  const galleryBody = galleryRaw.replace(/^---[\s\S]*?---\r?\n/, '');
  const gallerySections = [];
  current = null;

  for (const line of galleryBody.split(/\r?\n/)) {
    const hMatch = line.match(/^#\s+(.+)$/);
    if (hMatch) {
      const title = hMatch[1].trim();
      current = {
        id: sanitizeSlug(title) || `artist-${gallerySections.length + 1}`,
        title,
        handle: '',
        sourceUrl: '',
        items: [],
      };
      gallerySections.push(current);
      continue;
    }
    if (!current) continue;

    const linkMatch = line.match(/\[\*\*(.+?)\*\*\]\((https?:\/\/[^)]+)\)/);
    if (linkMatch) {
      current.handle = linkMatch[1].trim();
      current.sourceUrl = linkMatch[2].trim();
      continue;
    }

    const tagMatches = [...line.matchAll(/\{%\s*fb_img\s+([^\s%]+)(?:\s+([^%]*?))?\s*%\}/g)];
    for (const tm of tagMatches) {
      const src = normalizePhotoPath(tm[1], 'gallery');
      const caption = (tm[2] || '').trim();
      current.items.push({ src, caption: caption || `${current.title} 插画作品` });
    }
  }

  await fs.writeFile(
    path.join(NEW_ALBUMS_DIR, 'gallery.yaml'),
    yaml.dump(
      {
        title: '美术馆',
        subtitle: 'Illustration Archive',
        notice: '美术馆内容均摘自画师的社交帐号，作品仅供个人欣赏，不得用于任何商业用途。',
        sections: gallerySections,
      },
      { lineWidth: -1 }
    ),
    'utf8'
  );
}

async function migratePosts() {
  await ensureDir(NEW_POSTS_DIR);
  const files = (await fs.readdir(OLD_POSTS_DIR)).filter((f) => f.endsWith('.md')).sort();

  const usedSlugs = new Set();
  const redirectLines = [];
  const legacyPathMap = new Map();
  const migratedItems = [];

  // First pass: parse frontmatter, assign unique slugs & legacy paths
  for (const file of files) {
    const fullPath = path.join(OLD_POSTS_DIR, file);
    const raw = (await fs.readFile(fullPath, 'utf8')).replace(/^\uFEFF/, '');
    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!fmMatch) {
      report.skippedFiles.push({ file, reason: 'missing frontmatter' });
      continue;
    }

    let fm = {};
    try {
      fm = yaml.load(fmMatch[1]) || {};
    } catch (e) {
      report.skippedFiles.push({ file, reason: `yaml parse error: ${e.message}` });
      continue;
    }

    const body = fmMatch[2] || '';
    const title = String(fm.title || '').trim();
    if (!title && !body.trim()) {
      report.skippedFiles.push({ file, reason: 'empty stub file' });
      continue;
    }

    const effectiveTitle = title || file.replace(/\.md$/i, '');
    const dateInfo = formatDateYMD(fm.date);
    const rawStem = file.replace(/\.md$/i, '');

    let baseSlug = `${dateInfo.ymd}-${sanitizeSlug(effectiveTitle)}`;
    if (!baseSlug || baseSlug === `${dateInfo.ymd}-`) {
      baseSlug = `${dateInfo.ymd}-${crypto.createHash('md5').update(rawStem).digest('hex').slice(0, 8)}`;
    }
    let slug = baseSlug;
    let counter = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    usedSlugs.add(slug);

    const legacyRaw = `/${dateInfo.year}/${dateInfo.month}/${dateInfo.day}/${rawStem}/`;
    const legacyEncoded = `/${dateInfo.year}/${dateInfo.month}/${dateInfo.day}/${encodeURIComponent(rawStem)}/`;
    legacyPathMap.set(legacyRaw, `/posts/${slug}/`);
    legacyPathMap.set(legacyEncoded, `/posts/${slug}/`);
    redirectLines.push(`${legacyEncoded} /posts/${encodeURIComponent(slug)}/ 301`);

    migratedItems.push({ file, fm, body, effectiveTitle, dateInfo, slug, legacyRaw });
  }

  // Second pass: transform bodies, extract base64, localize external images
  for (const item of migratedItems) {
    let { body } = item;
    const postAssetDir = path.join(NEW_ASSETS_DIR, 'posts', item.slug);
    const relAssetPrefix = `../assets/posts/${item.slug}`;

    // 1. Extract base64 reference definitions: [id]:data:image/png;base64,...
    const base64Defs = new Map();
    const lines = body.split(/\r?\n/);
    const keptLines = [];
    for (const line of lines) {
      const b64 = line.match(/^\[([^\]]+)\]:\s*data:image\/([a-zA-Z0-9+]+);base64,([A-Za-z0-9+/=]+)\s*$/);
      if (b64) {
        const refName = b64[1].trim();
        const ext = b64[2].toLowerCase() === 'jpeg' ? '.jpg' : `.${b64[2].toLowerCase()}`;
        const safeRef = sanitizeSlug(refName) || 'embedded';
        const outName = `${safeRef}${ext}`;
        await ensureDir(postAssetDir);
        await fs.writeFile(path.join(postAssetDir, outName), Buffer.from(b64[3], 'base64'));
        base64Defs.set(refName, `${relAssetPrefix}/${outName}`);
        report.extractedBase64.push({ post: item.slug, ref: refName, out: `${relAssetPrefix}/${outName}` });
      } else {
        keptLines.push(line);
      }
    }
    body = keptLines.join('\n');

    // Replace ![alt][ref] for extracted base64 images & unwrap inline-block divs around them
    if (base64Defs.size > 0) {
      body = body.replace(/!\[([^\]]*)\]\[([^\]]+)\]/g, (full, alt, ref) => {
        const mapped = base64Defs.get(ref.trim());
        if (!mapped) return full;
        const cleanAlt = alt === 'avatar' ? ref.trim() : alt;
        return `![${cleanAlt}](${mapped})`;
      });
      body = body.replace(
        /<div[^>]*text-align:\s*-webkit-center[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
        (_, inner) => inner.replace(/<\/?div[^>]*>/gi, '\n').trim()
      );
      body = body.replace(/<\/?div[^>]*>/gi, (tag) => (tag.includes('webkit-center') || tag.includes('inline-block') ? '' : tag));
    }

    // 2. Strip {% raw %} / {% endraw %}
    body = body.replace(/\{%\s*raw\s*%\}/g, '').replace(/\{%\s*endraw\s*%\}/g, '');

    // 3. Convert {% fb_img url caption %} (with or without spaces)
    body = body.replace(/\{%\s*fb_img\s+([^\s%]+)(?:\s+([^%]*?))?\s*%\}/g, (_, imgSrc, caption) => {
      const cleanSrc = imgSrc.trim().replace(/\\/g, '/');
      const alt = (caption || '').trim();
      return `![${alt}](${cleanSrc})`;
    });

    // 4. Fix broken [![alt](url)] from 数据扩增方法.md
    body = body.replace(/\[!\[([^\]]*)\]\(([^)]+)\)\](?!\()/g, '![$1]($2)');

    // 5. Unwrap <center>...</center> and stray <center> around images
    body = body.replace(/<center>\s*(!\[[^\]]*\]\([^)]+\))\s*(?:<\/center>)?/gi, '$1');
    body = body.replace(/<\/center>/gi, '');

    // 6. Map local /img/post/... references -> ../assets/posts/...
    body = body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt, rawTarget) => {
      let target = rawTarget.trim().replace(/\\/g, '/');
      if (target.startsWith('/img/post/') || target.startsWith('img/post/')) {
        const sub = target.replace(/^\/?img\/post\//, '');
        return `![${alt.trim()}](../assets/posts/${sub})`;
      }
      return full;
    });

    // 7. Rewrite internal legacy Hexo post links
    body = body.replace(/\]\((\/\d{4}\/\d{2}\/\d{2}\/[^)]+)\)/g, (full, oldHref) => {
      const normalized = oldHref.endsWith('/') ? oldHref : `${oldHref}/`;
      const decoded = (() => {
        try {
          return decodeURIComponent(normalized);
        } catch {
          return normalized;
        }
      })();
      const mapped = legacyPathMap.get(normalized) || legacyPathMap.get(decoded);
      return mapped ? `](${mapped})` : full;
    });

    // 8. Download external markdown images & wrap bare \begin{equation} outside fenced code blocks
    const segments = body.split(/(```[\s\S]*?```)/g);
    for (let i = 0; i < segments.length; i++) {
      if (i % 2 === 1) continue; // skip fenced code blocks
      const matches = [...segments[i].matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)];
      for (const m of matches) {
        const [full, alt, url] = m;
        const localAbs = await downloadExternalImage(url, postAssetDir, 'ext');
        if (localAbs) {
          const relFile = path.basename(localAbs);
          segments[i] = segments[i].replace(full, `![${alt.trim()}](${relAssetPrefix}/${relFile})`);
        }
      }

      // Wrap standalone \begin{equation|align|cases|gather}...\end{...} not already inside $$...$$ or $...$
      segments[i] = segments[i].replace(
        /(\$\$[\s\S]*?\$\$)|(\$[^\n$]*?\$)|(\\begin\{(?:equation\*?|align\*?|cases|gather\*?)\}[\s\S]*?\\end\{(?:equation\*?|align\*?|cases|gather\*?)\})/g,
        (full, blockMath, inlineMath, bareEnv) => {
          if (blockMath || inlineMath) return full;
          if (bareEnv) return `\n$$\n${bareEnv.trim()}\n$$\n`;
          return full;
        }
      );
    }
    body = segments.join('');

    // Build clean normalized YAML frontmatter
    let category = '未分类';
    if (Array.isArray(item.fm.categories) && item.fm.categories.length > 0) {
      category = String(item.fm.categories[0]).trim() || '未分类';
    } else if (typeof item.fm.categories === 'string' && item.fm.categories.trim()) {
      category = item.fm.categories.trim();
    } else if (item.effectiveTitle.startsWith('日语')) {
      category = '学习';
    }

    const tagsRaw = Array.isArray(item.fm.tags) ? item.fm.tags : item.fm.tags ? [item.fm.tags] : [];
    const tags = tagsRaw
      .map((t) => (t == null ? '' : String(t).trim()))
      .filter((t) => t.length > 0 && t !== '-');

    const { series, seriesOrder } = detectSeries(item.effectiveTitle);

    const newFm = {
      title: item.effectiveTitle,
      date: item.dateInfo.iso,
      category,
      tags,
      ...(series ? { series } : {}),
      ...(seriesOrder !== undefined ? { seriesOrder } : {}),
      ...(item.fm.description ? { summary: String(item.fm.description).trim() } : {}),
      draft: false,
    };

    const output = `---\n${yaml.dump(newFm, { lineWidth: -1 }).trim()}\n---\n\n${body.trimStart()}`;
    await fs.writeFile(path.join(NEW_POSTS_DIR, item.file), output, 'utf8');
    report.migratedPosts++;
  }

  await ensureDir(PUBLIC_DIR);
  await fs.writeFile(
    path.join(PUBLIC_DIR, '_redirects'),
    `# Legacy Hexo post URLs -> clean /posts/YYYY-MM-DD-title/ URLs\n${redirectLines.join('\n')}\n`,
    'utf8'
  );
  report.redirects = redirectLines.length;
}

async function main() {
  console.log('Starting Hexo -> Astro migration...');
  await ensureDir(CONTENT_DIR);

  // Copy local image assets
  await copyDirWithNormalize(path.join(OLD_IMG_DIR, 'photo'), path.join(NEW_ASSETS_DIR, 'photos'), true);
  await copyDirWithNormalize(path.join(OLD_IMG_DIR, 'gallery'), path.join(NEW_ASSETS_DIR, 'gallery'), true);
  await copyDirWithNormalize(path.join(OLD_IMG_DIR, 'post'), path.join(NEW_ASSETS_DIR, 'posts'), false);
  await copyDirWithNormalize(path.join(OLD_IMG_DIR, 'cover'), path.join(NEW_ASSETS_DIR, 'site', 'cover'), false);

  // Copy favicon
  await ensureDir(PUBLIC_DIR);
  try {
    await fs.copyFile(path.join(OLD_ROOT, 'themes', 'Sakura', 'source', 'favicon.ico'), path.join(PUBLIC_DIR, 'favicon.ico'));
  } catch {
    // ignore if missing
  }

  // Download avatar image locally
  const siteDir = path.join(NEW_ASSETS_DIR, 'site');
  const avatarSaved = await downloadExternalImage(DEFAULT_AVATAR_URL, siteDir, 'avatar');
  if (avatarSaved && path.basename(avatarSaved) !== 'avatar.jpg') {
    await fs.rename(avatarSaved, path.join(siteDir, 'avatar' + path.extname(avatarSaved)));
  }

  await migratePhotosAndGallery();
  await migratePosts();

  await fs.writeFile(path.join(NEW_ROOT, 'migration-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('Migration complete:', {
    migratedPosts: report.migratedPosts,
    skippedFiles: report.skippedFiles,
    copiedLocalImages: report.copiedLocalImages,
    extractedBase64: report.extractedBase64.length,
    downloadedImages: report.downloadedImages.length,
    failedImages: report.failedImages.length,
    redirects: report.redirects,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
