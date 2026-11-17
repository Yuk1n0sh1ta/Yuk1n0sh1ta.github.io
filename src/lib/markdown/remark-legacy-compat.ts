import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { visit } from 'unist-util-visit';
import { computeBasePostSlug } from '../slug';

/**
 * Build a lookup map of post title / filename -> computed route slug so Obsidian [[WikiLinks]]
 * resolve cleanly to `/posts/YYYY-MM-DD-<slug>/` even when filenames omit date prefixes.
 */
function buildPostLinkMap(): Map<string, string> {
  const map = new Map<string, string>();
  const postsDir = path.resolve(process.cwd(), 'content', 'posts');
  if (!fs.existsSync(postsDir)) return map;

  const entries: Array<{ stem: string; title?: string; date: Date | string; explicitSlug?: string; draft?: boolean }> = [];
  for (const file of fs.readdirSync(postsDir)) {
    if (!file.endsWith('.md')) continue;
    const stem = file.replace(/\.md$/i, '');
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf8').replace(/^\uFEFF/, '');
    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    let fm: Record<string, any> = {};
    if (fmMatch) {
      try {
        fm = (yaml.load(fmMatch[1]) as Record<string, any>) || {};
      } catch {}
    }
    if (fm.draft) continue;
    entries.push({
      stem,
      title: typeof fm.title === 'string' ? fm.title : undefined,
      date: fm.date ?? '2020-01-01',
      explicitSlug: typeof fm.slug === 'string' ? fm.slug : undefined,
    });
  }

  entries.sort((a, b) => {
    const ta = new Date(String(a.date)).getTime() || 0;
    const tb = new Date(String(b.date)).getTime() || 0;
    return ta !== tb ? ta - tb : a.stem.localeCompare(b.stem);
  });

  const used = new Set<string>();
  for (const e of entries) {
    const base = computeBasePostSlug({
      id: e.stem,
      title: e.title,
      date: e.date,
      explicitSlug: e.explicitSlug,
    });
    let slug = base;
    let counter = 2;
    while (used.has(slug)) {
      slug = `${base}-${counter++}`;
    }
    used.add(slug);

    const href = `/posts/${encodeURIComponent(slug)}/`;
    map.set(e.stem.toLowerCase(), href);
    if (e.title?.trim()) {
      map.set(e.title.trim().toLowerCase(), href);
    }
  }
  return map;
}

const CALLOUT_LABELS: Record<string, string> = {
  note: '笔记 Note',
  info: '信息 Info',
  tip: '提示 Tip',
  hint: '提示 Hint',
  important: '重要 Important',
  warning: '注意 Warning',
  caution: '警示 Caution',
  danger: '危险 Danger',
  quote: '引用 Quote',
  example: '示例 Example',
};

function sanitizeMathExpression(raw: string, isInline: boolean): string {
  let expr = raw.trim();
  // Convert GFM table escaped pipe `&#124;` back to LaTeX `\mid`
  expr = expr.replace(/&#124;/g, '\\mid ');
  // Strip `\begin{equation}` / `\end{equation}` inside inline math (KaTeX rejects equation env in inline mode)
  if (isInline) {
    expr = expr.replace(/\\begin\{equation\*?\}/g, '').replace(/\\end\{equation\*?\}/g, '').trim();
  }
  return expr;
}

function makeInlineMathNode(raw: string) {
  const value = sanitizeMathExpression(raw, true);
  return {
    type: 'inlineMath',
    value,
    data: {
      hName: 'code',
      hProperties: { className: ['language-math', 'math-inline'] },
      hChildren: [{ type: 'text', value }],
    },
  };
}

function makeBlockMathNode(raw: string) {
  const value = sanitizeMathExpression(raw, false);
  return {
    type: 'math',
    value,
    data: {
      hName: 'pre',
      hChildren: [
        {
          type: 'element',
          tagName: 'code',
          properties: { className: ['language-math', 'math-display'] },
          children: [{ type: 'text', value }],
        },
      ],
    },
  };
}

/**
 * Custom Remark plugin:
 * 1. Normalizes existing `math` / `inlineMath` nodes (`&#124;`, inline `\begin{equation}`)
 * 2. Rescues legacy `$ x^{T}x $` (spaces inside dollar signs) and standalone `\begin{equation}...\end{equation}`
 * 3. Supports Obsidian `![[image.png]]`, `[[WikiLink]]`, `==highlight==`, and `> [!callout]`
 */
export function remarkLegacyCompat() {
  const postLinkMap = buildPostLinkMap();

  return (tree: any) => {
    // 1. Clean already-parsed math / inlineMath nodes
    visit(tree, (node: any) => {
      if (node.type === 'inlineMath' && typeof node.value === 'string') {
        const cleaned = sanitizeMathExpression(node.value, true);
        node.value = cleaned;
        if (node.data?.hChildren?.[0]) {
          node.data.hChildren[0].value = cleaned;
        }
      } else if (node.type === 'math' && typeof node.value === 'string') {
        const cleaned = sanitizeMathExpression(node.value, false);
        node.value = cleaned;
        if (node.data?.hChildren?.[0]) {
          node.data.hChildren[0].value = cleaned;
        }
      }
    });

    // 2. Transform Obsidian Callouts on blockquotes
    visit(tree, 'blockquote', (node: any) => {
      const firstPara = node.children?.[0];
      if (!firstPara || firstPara.type !== 'paragraph' || !firstPara.children?.length) return;
      const firstText = firstPara.children[0];
      if (!firstText || firstText.type !== 'text') return;

      const match = firstText.value.match(/^\[!([a-zA-Z]+)\][+-]?\s*(.*)(?:\r?\n([\s\S]*))?$/);
      if (!match) return;

      const kind = match[1].toLowerCase();
      const customTitle = match[2]?.trim() || CALLOUT_LABELS[kind] || kind.toUpperCase();
      const rest = match[3] || '';

      node.data = node.data || {};
      node.data.hProperties = {
        ...(node.data.hProperties || {}),
        className: ['callout', `callout-${kind}`],
        'data-callout': kind,
      };

      const titleNode = {
        type: 'paragraph',
        data: {
          hName: 'div',
          hProperties: { className: ['callout-title'] },
        },
        children: [{ type: 'text', value: customTitle }],
      };

      if (rest) {
        firstText.value = rest;
        node.children.unshift(titleNode);
      } else if (firstPara.children.length > 1) {
        firstPara.children.shift();
        node.children.unshift(titleNode);
      } else {
        node.children[0] = titleNode;
      }
    });

    // 3. Rescue standalone `\begin{equation}...\end{equation}` & legacy `$ ... $` & Obsidian embeds/links/highlights
    visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      if (!parent || index === undefined) return;
      if (['code', 'inlineCode', 'math', 'inlineMath'].includes(parent.type)) return;

      const val: string = node.value;
      if (
        !val.includes('$') &&
        !val.includes('\\begin{') &&
        !val.includes('[[') &&
        !val.includes('==')
      ) {
        return;
      }

      // Combined token matcher (ordered carefully)
      const tokenRegex =
        /(\\begin\{(?:equation\*?|align\*?|cases|gather\*?)\}[\s\S]*?\\end\{(?:equation\*?|align\*?|cases|gather\*?)\})|(!\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\])|(\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\])|(==([^=\n]+?)==)|((?<!\\)\$([^\n$]+?)(?<!\\)\$)/g;

      const replacements: any[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = tokenRegex.exec(val)) !== null) {
        if (match.index > lastIndex) {
          replacements.push({ type: 'text', value: val.slice(lastIndex, match.index) });
        }

        if (match[1]) {
          // Standalone \begin{equation}...\end{equation}
          replacements.push(makeBlockMathNode(match[1]));
        } else if (match[2]) {
          // Obsidian ![[image.png|alt]]
          const target = match[3].trim();
          const alt = match[4]?.trim() || target;
          const imgPath = target.includes('/') ? target : `../assets/attachments/${target}`;
          replacements.push({ type: 'image', url: imgPath, alt });
        } else if (match[5]) {
          // Obsidian [[Note Title|Alias]]
          const target = match[6].trim().replace(/\.md$/i, '');
          const label = match[7]?.trim() || target;
          const href = postLinkMap.get(target.toLowerCase());
          if (href) {
            replacements.push({
              type: 'link',
              url: href,
              children: [{ type: 'text', value: label }],
            });
          } else {
            replacements.push({ type: 'text', value: label });
          }
        } else if (match[8]) {
          // ==highlight==
          replacements.push({
            type: 'html',
            value: `<mark class="obsidian-mark">${match[9]}</mark>`,
          });
        } else if (match[10]) {
          // Rescued inline $ ... $ (e.g. `$ x^{T}x $` with spaces)
          const inner = match[11];
          // Guard against accidental currency pairs like "$50 and $100":
          // treat as math if trimmed inner is non-empty and not pure whitespace, and doesn't start/end like prose currency
          const looksLikeCurrency = /^\d[\d,.]*(?:\s|$)/.test(inner) && !/[\\^_{}=+\-*/|()]/.test(inner);
          if (!looksLikeCurrency && inner.trim().length > 0) {
            replacements.push(makeInlineMathNode(inner));
          } else {
            replacements.push({ type: 'text', value: match[0] });
          }
        }

        lastIndex = tokenRegex.lastIndex;
      }

      if (replacements.length === 0) return;

      if (lastIndex < val.length) {
        replacements.push({ type: 'text', value: val.slice(lastIndex) });
      }

      parent.children.splice(index, 1, ...replacements);
      return index + replacements.length;
    });
  };
}
