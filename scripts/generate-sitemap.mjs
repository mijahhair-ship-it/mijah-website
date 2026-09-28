import { execFileSync } from 'node:child_process';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const escapeXml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const today = () => new Date().toISOString().slice(0, 10);

function git(root, args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

// Last real content change: today if the file has uncommitted edits, else its last commit date.
async function lastModified(root, file) {
  const dirty = git(root, ['status', '--porcelain', '--', file]);
  if (!dirty) {
    const committed = git(root, ['log', '-1', '--format=%cs', '--', file]);
    if (committed) return committed;
  }
  if (dirty) return today();
  return (await stat(path.join(root, file))).mtime.toISOString().slice(0, 10);
}

/**
 * Builds sitemap.xml from the indexable root HTML pages: skips noindex pages,
 * uses each page's canonical URL, and attaches its og:image as an image entry.
 */
export async function generateSitemap(root, outputFile, excludeFiles = new Set()) {
  const files = (await readdir(root))
    .filter((name) => name.endsWith('.html') && !excludeFiles.has(name))
    .sort();
  const entries = [];

  for (const file of files) {
    const html = await readFile(path.join(root, file), 'utf8');
    const robots = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i)?.[1] ?? '';
    if (/noindex/i.test(robots)) continue;

    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
    if (!canonical) {
      console.warn(`sitemap: skipping ${file} (no canonical)`);
      continue;
    }
    const image = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1];
    entries.push({ loc: canonical, lastmod: await lastModified(root, file), image });
  }

  // Homepage first, then alphabetical by URL for stable diffs.
  entries.sort((a, b) => (a.loc === 'https://mijah.fr/' ? -1 : b.loc === 'https://mijah.fr/' ? 1 : a.loc.localeCompare(b.loc)));

  const body = entries
    .map(({ loc, lastmod, image }) => {
      const img = image ? `\n    <image:image><image:loc>${escapeXml(image)}</image:loc></image:image>` : '';
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>${img}\n  </url>`;
    })
    .join('\n');

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    `${body}\n</urlset>\n`;

  await writeFile(outputFile, xml);
  return entries.length;
}
