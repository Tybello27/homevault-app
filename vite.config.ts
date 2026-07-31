import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { existsSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const PUBLIC_DIR = fileURLToPath(new URL('./public', import.meta.url));

/**
 * Health endpoint for the hosting preview.
 *
 * Served by Vite itself (dev + preview) so the project stays a pure static
 * Vite app. A standalone `node server.mjs` entrypoint would make Vercel
 * classify the repo as a Node.js server instead of a Vite site.
 */
function healthCheck(): Plugin {
  const handle = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if ((req.url ?? '').split('?')[0] !== '/api/health') return next();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ status: 'ok', app: 'HomeVault', time: new Date().toISOString() }));
  };
  return {
    name: 'homevault:health',
    configureServer: (server) => void server.middlewares.use(handle),
    configurePreviewServer: (server) => void server.middlewares.use(handle),
  };
}

/**
 * PWA shell integrity.
 *
 * `vite-plugin-singlefile` forces `base: './'` so its bundle is portable. That
 * also rewrites the shell links to `./manifest.webmanifest`, `./icon-192.png`…
 * HomeVault is an SPA, so the document can be served at any path depth — the
 * browser then resolves those against that path (`/dashboard/icon-192.png`)
 * and they 404, which makes Chrome refuse to install the app.
 *
 * This plugin runs after singlefile to:
 *   1. restore root-absolute shell paths, and
 *   2. fail the build if any referenced icon/manifest is missing from public/.
 */
function pwaShell(): Plugin {
  return {
    name: 'homevault:pwa-shell',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const missing: string[] = [];
      const seen = new Set<string>();

      const require = (ref: string) => {
        if (!ref.startsWith('/') || seen.has(ref)) return;
        seen.add(ref);
        if (!existsSync(path.join(PUBLIC_DIR, ref.slice(1)))) missing.push(ref);
      };

      const SHELL_LINK = /<link\b[^>]*\brel="(?:manifest|icon|apple-touch-icon)"[^>]*\bhref="([^"]+)"/g;

      for (const asset of Object.values(bundle)) {
        if (asset.type !== 'asset' || !asset.fileName.endsWith('.html')) continue;
        const html = String(asset.source).replace(
          /(<link\b[^>]*\brel="(?:manifest|icon|apple-touch-icon)"[^>]*\bhref=")\.\/([^"]+")/g,
          '$1/$2',
        );
        asset.source = html;
        for (const match of html.matchAll(SHELL_LINK)) require(match[1]);
      }

      const manifestFile = path.join(PUBLIC_DIR, 'manifest.webmanifest');
      if (!existsSync(manifestFile)) {
        missing.push('/manifest.webmanifest');
      } else {
        const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as { icons?: { src: string }[] };
        for (const icon of manifest.icons ?? []) require(icon.src);
      }

      if (missing.length) {
        this.error(`PWA shell assets referenced but missing from public/: ${missing.join(', ')}`);
      }
    },
  };
}

const PORT = Number(process.env.PORT ?? 3000);

// HomeVault — pure client-side SPA.
// No backend, no database, no server framework: all state lives in localStorage.
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile({ removeViteModuleLoader: true }),
    pwaShell(),
    healthCheck(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 8000,
    reportCompressedSize: false,
  },
  server: {
    host: '0.0.0.0',
    port: PORT,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: PORT,
    // Fail loudly on a busy port instead of silently serving on another one,
    // which would make the host's health check hit nothing.
    strictPort: true,
    allowedHosts: true,
  },
});
