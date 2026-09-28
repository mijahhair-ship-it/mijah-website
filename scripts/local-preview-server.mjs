import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(projectRoot, 'dist');
const port = Number(process.env.PORT || 8765);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
};

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  const requested = pathname === '/' ? '/index.html' : pathname;
  const candidates = [requested];
  if (!path.extname(requested)) candidates.push(`${requested}.html`);

  let filePath;
  for (const candidate of candidates) {
    const resolved = path.resolve(distRoot, `.${candidate}`);
    if (!resolved.startsWith(`${distRoot}${path.sep}`) && resolved !== distRoot) continue;
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      filePath = resolved;
      break;
    }
  }

  if (!filePath) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('File not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Mijah local preview: http://127.0.0.1:${port}/`);
});
