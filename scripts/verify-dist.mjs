/**
 * Post-build verification.
 * Ensures every PWA asset referenced by the manifest and HTML exists in dist/.
 * Fails the build if anything is missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const errors = [];
const checked = [];

function check(name, expectedInDist) {
  const full = path.join(DIST, expectedInDist);
  if (fs.existsSync(full)) {
    const size = fs.statSync(full).size;
    checked.push(`  ✓ ${expectedInDist.padEnd(28)} ${size.toLocaleString()} bytes`);
  } else {
    errors.push(`  ✗ ${expectedInDist} — MISSING from dist/`);
  }
}

// Required files
const REQUIRED = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-256.png',
  'icon-384.png',
  'icon-512.png',
  'maskable-icon-192.png',
  'maskable-icon-512.png',
];

for (const f of REQUIRED) check(f, f);

// Verify manifest icon paths resolve
const manifestPath = path.join(DIST, 'manifest.webmanifest');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const icon of manifest.icons || []) {
    const src = icon.src.replace(/^\//, '');
    if (!fs.existsSync(path.join(DIST, src))) {
      errors.push(`  ✗ manifest icon "${icon.src}" → dist/${src} MISSING`);
    }
  }
}

// Verify index.html link references
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const linkRefs = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m => m[1]);
for (const href of linkRefs) {
  if (href.startsWith('http') || href.startsWith('data:')) continue;
  const resolved = href.replace(/^\//, '');
  if (!fs.existsSync(path.join(DIST, resolved))) {
    errors.push(`  ✗ index.html href="${href}" → dist/${resolved} MISSING`);
  }
}

// Report
for (const line of checked) console.log(line);

if (errors.length) {
  console.error(`\n✗ Build verification FAILED (${errors.length} problems):`);
  for (const e of errors) console.error(e);
  process.exit(1);
}

console.log(`\n✓ All ${checked.length} required files verified in dist/`);
