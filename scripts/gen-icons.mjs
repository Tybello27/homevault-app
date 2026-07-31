/**
 * HomeVault PWA icon generator.
 * Generates all required PNG icons and favicon.ico at correct dimensions.
 * Run automatically as part of `npm run build`.
 */
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public');
fs.mkdirSync(OUT, { recursive: true });

/* ─── CRC / PNG encoder ─── */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n >>> 0;
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) >>> 0 : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = (CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typed = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed), 0);
  return Buffer.concat([len, typed, crc]);
}

function encodePNG(w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const phys = Buffer.alloc(9);
  phys.writeUInt32BE(2835, 0); phys.writeUInt32BE(2835, 4); phys[8] = 1;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('pHYs', phys),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ─── Rasterizer ─── */

const SS = 4;
const NAVY_HI = [30, 58, 95], NAVY_LO = [17, 39, 65];
const TEAL = [15, 118, 110], SKY = [56, 189, 248], WHITE = [255, 255, 255];

const rrHit = (x, y, x0, y0, x1, y1, r) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
const triHit = (px, py, a, b, c) => {
  const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  const d1 = s([px, py], a, b), d2 = s([px, py], b, c), d3 = s([px, py], c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};

function renderRGBA(size, mode) {
  const buf = Buffer.alloc(size * size * 4);
  const S = size * SS;
  const radius = mode === 'rounded' ? S * 0.225 : 0;
  const scale = mode === 'maskable' ? 0.44 : 0.62;
  const gw = S * scale, gx = (S - gw) / 2, gy = (S - gw) / 2 + S * 0.012;
  const detailed = size >= 128;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const X = px * SS + sx + 0.5, Y = py * SS + sy + 0.5;
          const inside = mode === 'rounded' ? rrHit(X, Y, 0, 0, S, S, radius) : true;
          if (!inside) continue;
          const t = Math.min(1, Math.max(0, (X / S) * 0.42 + (Y / S) * 0.58));
          const base = [NAVY_HI[0] + (NAVY_LO[0] - NAVY_HI[0]) * t, NAVY_HI[1] + (NAVY_LO[1] - NAVY_HI[1]) * t, NAVY_HI[2] + (NAVY_LO[2] - NAVY_HI[2]) * t];
          const mix = Math.pow(t, 1.6) * 0.62;
          let cr = base[0] * (1 - mix) + TEAL[0] * mix;
          let cg = base[1] * (1 - mix) + TEAL[1] * mix;
          let cb = base[2] * (1 - mix) + TEAL[2] * mix;
          const nx = (X - gx) / gw, ny = (Y - gy) / gw;
          if (nx >= -0.08 && nx <= 1.08 && ny >= -0.08 && ny <= 1.08) {
            const roof = triHit(nx, ny, [0.5, 0.04], [1.02, 0.47], [-0.02, 0.47]);
            const body = rrHit(nx, ny, 0.15, 0.43, 0.85, 0.95, 0.07);
            const door = rrHit(nx, ny, 0.395, 0.6, 0.605, 0.958, 0.055);
            const win = detailed && (rrHit(nx, ny, 0.235, 0.55, 0.345, 0.66, 0.025) || rrHit(nx, ny, 0.655, 0.55, 0.765, 0.66, 0.025));
            if (roof || body) { cr = WHITE[0]; cg = WHITE[1]; cb = WHITE[2]; }
            if (door || win) { cr = SKY[0]; cg = SKY[1]; cb = SKY[2]; }
          }
          r += cr; g += cg; b += cb; a += 1;
        }
      }
      const i = (py * size + px) * 4;
      if (a > 0) { buf[i] = Math.round(r / a); buf[i + 1] = Math.round(g / a); buf[i + 2] = Math.round(b / a); buf[i + 3] = Math.round((a / (SS * SS)) * 255); }
    }
  }
  return buf;
}

/* ─── BMP-encoded ICO ─── */

function encodeBmpForIco(size, rgba) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0); header.writeInt32LE(size, 4); header.writeInt32LE(size * 2, 8);
  header.writeUInt16LE(1, 12); header.writeUInt16LE(32, 14); header.writeUInt32LE(size * size * 4, 20);
  const xor = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    const src = (size - 1 - y) * size * 4;
    for (let x = 0; x < size; x++) {
      const s = src + x * 4, d = (y * size + x) * 4;
      xor[d] = rgba[s + 2]; xor[d + 1] = rgba[s + 1]; xor[d + 2] = rgba[s]; xor[d + 3] = rgba[s + 3];
    }
  }
  return Buffer.concat([header, xor, Buffer.alloc(Math.ceil(size / 32) * 4 * size)]);
}

function encodeICO(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(entries.length, 4);
  let offset = 6 + entries.length * 16;
  const dir = entries.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size; e[1] = size >= 256 ? 0 : size;
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8); e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...dir, ...entries.map(e => e.data)]);
}

/* ─── Generate all icons ─── */

const TARGETS = [
  ['favicon-16x16.png', 16, 'rounded'],
  ['favicon-32x32.png', 32, 'rounded'],
  ['favicon-48x48.png', 48, 'rounded'],
  ['apple-touch-icon.png', 180, 'square'],
  ['icon-192.png', 192, 'rounded'],
  ['icon-256.png', 256, 'rounded'],
  ['icon-384.png', 384, 'rounded'],
  ['icon-512.png', 512, 'rounded'],
  ['maskable-icon-192.png', 192, 'maskable'],
  ['maskable-icon-512.png', 512, 'maskable'],
];

let allOk = true;
for (const [name, size, mode] of TARGETS) {
  const outPath = path.join(OUT, name);
  const rgba = renderRGBA(size, mode);
  const png = encodePNG(size, size, rgba);
  fs.writeFileSync(outPath, png);
  // Validate
  const buf = fs.readFileSync(outPath);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const ok = w === size && h === size && buf[0] === 0x89 && buf[1] === 0x50;
  console.log(`  ${ok ? '✓' : '✗'} ${name.padEnd(26)} ${w}x${h}  ${buf.length} bytes`);
  if (!ok) allOk = false;
}

// favicon.ico
const icoPath = path.join(OUT, 'favicon.ico');
fs.writeFileSync(icoPath, encodeICO(
  [16, 32, 48].map(size => ({ size, data: encodeBmpForIco(size, renderRGBA(size, 'rounded')) }))
));
const icoBuf = fs.readFileSync(icoPath);
const icoOk = icoBuf[0] === 0 && icoBuf[1] === 0 && icoBuf[2] === 1 && icoBuf[3] === 0;
console.log(`  ${icoOk ? '✓' : '✗'} ${'favicon.ico'.padEnd(26)} ${icoBuf.length} bytes  entries=${icoBuf[4]}`);
if (!icoOk) allOk = false;

if (!allOk) { console.error('\n✗ Icon generation failed'); process.exit(1); }
console.log(`\n✓ All ${TARGETS.length + 1} icons generated and validated in public/`);
