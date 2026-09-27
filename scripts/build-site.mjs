import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateMetaCatalog } from './generate-meta-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');

if (path.dirname(output) !== root || path.basename(output) !== 'dist') {
  throw new Error(`Refusing to clean unexpected output path: ${output}`);
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const rootFiles = await readdir(root, { withFileTypes: true });
const allowedExtensions = new Set(['.html']);
const allowedFiles = new Set([
  '_redirects',
  'BingSiteAuth.xml',
  'cart.js',
  'supabase-client.js',
  'favicon.png',
  'lang.js',
  'llms.txt',
  'output.css',
  'robots.txt',
  'sitemap.xml',
]);

for (const entry of rootFiles) {
  if (!entry.isFile()) continue;
  if (!allowedFiles.has(entry.name) && !allowedExtensions.has(path.extname(entry.name))) continue;
  await cp(path.join(root, entry.name), path.join(output, entry.name));
}

await cp(path.join(root, 'photosAndvideos'), path.join(output, 'photosAndvideos'), {
  recursive: true,
});

await generateMetaCatalog(root, path.join(output, 'meta-catalog.csv'));

console.log('Built public site in dist/');
