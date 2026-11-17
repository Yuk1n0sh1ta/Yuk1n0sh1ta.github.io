import fs from 'node:fs/promises';
import path from 'node:path';

const POSTS_DIR = path.resolve(import.meta.dirname, '..', 'content', 'posts');

function normalizeKey(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[\s/\-_（）()「」『』【】、，。：:,.!?？]+/g, '')
    .trim();
}

async function cleanPosts() {
  const files = (await fs.readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
  const postLookup = new Map();

  // Build title/slug lookup for rewriting any remaining legacy /YYYY/MM/DD/Title/ links
  for (const file of files) {
    const raw = await fs.readFile(path.join(POSTS_DIR, file), 'utf8');
    const titleMatch = raw.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
    const slugMatch = raw.match(/^slug:\s*['"]?(.+?)['"]?\s*$/m);
    const slug = slugMatch ? slugMatch[1].trim() : file.replace(/\.md$/i, '');
    const targetUrl = `/posts/${slug}/`;

    if (titleMatch) {
      postLookup.set(normalizeKey(titleMatch[1]), targetUrl);
    }
    postLookup.set(normalizeKey(slug.replace(/^\d{4}-\d{2}-\d{2}-/, '')), targetUrl);
  }

  let updatedCount = 0;

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const original = await fs.readFile(filePath, 'utf8');
    let next = original;

    const segments = next.split(/(```[\s\S]*?```)/g);
    for (let i = 0; i < segments.length; i++) {
      if (i % 2 === 1) continue;
      let seg = segments[i];

      // 1. Remove dead NetEase <meting-js> wrapper blocks from lyric translations
      seg = seg.replace(/<div[^>]*>\s*<meting-js[\s\S]*?<\/meting-js>\s*<\/div>/gi, '');
      seg = seg.replace(/<meting-js[\s\S]*?<\/meting-js>/gi, '');
      seg = seg.replace(/<\/div><\/meting-js>/gi, '');

      // 2. Unwrap <center><div style="width: ...">![alt](url)</div> -> ![alt](url)
      seg = seg.replace(/<center>\s*<div[^>]*>\s*(!\[[^\]]*\]\([^)]+\))\s*<\/div>\s*(?:<\/center>)?/gi, '$1');

      // 3. Convert <center><img src = "url" ...> -> ![](url)
      seg = seg.replace(/<center>\s*<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>\s*(?:<\/center>)?/gi, '![]($1)');

      // 4. Convert single-line <center>$...$ -> $$...$$
      seg = seg.replace(/^<center>\s*\$([^\n$]+?)\$\s*(?:<\/center>)?\s*$/gm, (_, expr) => `$$\n${expr.trim()}\n$$`);

      // 5. Strip all remaining <center> / </center> tags
      seg = seg.replace(/<\/?center>/gi, '');

      // 6. Rewrite ALL remaining legacy internal Hexo links: (/YYYY/MM/DD/title/#anchor)
      seg = seg.replace(/\]\(\/\d{4}\/\d{2}\/\d{2}\/([^)#\s]+?)\/?(#[^)\s]*)?\)/g, (full, encodedStem, hash) => {
        let decoded = encodedStem;
        try {
          decoded = decodeURIComponent(encodedStem);
        } catch {}
        const mapped = postLookup.get(normalizeKey(decoded));
        if (!mapped) return full;
        return `](${mapped}${hash ?? ''})`;
      });

      // 7. Fix CJK immediately before bold link: 出自**[...](...)** -> 出自 **[...](...)**
      seg = seg.replace(/([\u4e00-\u9fff\u3040-\u30ff])\*\*(\[[^\]]+\]\([^)]+\))\*\*/g, '$1 **$2**');

      // 8. Fix broken [![alt](url)] without target link
      seg = seg.replace(/\[!\[([^\]]*)\]\(([^)]+)\)\](?!\()/g, '![$1]($2)');

      // 9. Clean orphaned `<div>\n</div>` pairs
      seg = seg.replace(/<div>\s*<\/div>/g, '');

      segments[i] = seg;
    }

    next = segments.join('');
    if (next !== original) {
      await fs.writeFile(filePath, next, 'utf8');
      updatedCount++;
    }
  }

  console.log(`Cleaned ${updatedCount} post files.`);
}

cleanPosts().catch((err) => {
  console.error(err);
  process.exit(1);
});
