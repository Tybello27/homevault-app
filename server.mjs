/**
 * Static file host for the built HomeVault PWA.
 *
 * This exists only so the hosting preview has a plain Node entrypoint with a
 * /api/health endpoint. It contains no application logic — HomeVault is a
 * client-side SPA and all of its data lives in localStorage.
 *
 * It is NOT used on Vercel: `vercel.json` pins the Vite preset, so Vercel runs
 * `vite build` and serves `dist/` as static files.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

http
  .createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);

    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify({ status: 'ok', app: 'HomeVault', time: new Date().toISOString() }));
    }

    const file = path.join(DIST, pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, ''));

    if (file.startsWith(DIST) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.png' || ext === '.ico' ? 'public, max-age=604800' : 'no-cache',
        ...(path.basename(file) === 'sw.js' ? { 'Service-Worker-Allowed': '/' } : {}),
      });
      return res.end(fs.readFileSync(file));
    }

    const index = path.join(DIST, 'index.html');
    if (fs.existsSync(index)) {
      res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
      return res.end(fs.readFileSync(index));
    }

    res.writeHead(404, { 'Content-Type': MIME['.txt'] });
    res.end('Not found');
  })
  .listen(PORT, HOST, () => console.log(`HomeVault static server ready on http://${HOST}:${PORT}`));
