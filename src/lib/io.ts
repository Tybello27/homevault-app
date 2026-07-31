import * as XLSX from 'xlsx';
import type { AppData, Category, Condition, InventoryItem } from './types';
import { addMonths, formatDate, formatMoney, uid } from './format';

export const CSV_COLUMNS = [
  'Name',
  'Category',
  'Room',
  'Location',
  'Brand',
  'Model',
  'Serial Number',
  'Quantity',
  'Condition',
  'Purchase Date',
  'Purchase Price',
  'Current Value',
  'Retailer',
  'Warranty Months',
  'Warranty Expiry',
  'Tags',
  'Favourite',
  'Notes',
] as const;

export function download(filename: string, data: BlobPart, mime: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function catName(categories: Category[], id: string): string {
  return categories.find((c) => c.id === id)?.name ?? 'Uncategorised';
}

export function itemsToRows(items: InventoryItem[], categories: Category[]): (string | number)[][] {
  return items.map((i) => [
    i.name,
    catName(categories, i.categoryId),
    i.room,
    i.location,
    i.brand ?? '',
    i.model ?? '',
    i.serialNumber ?? '',
    i.quantity,
    i.condition,
    i.purchaseDate ?? '',
    i.purchasePrice,
    i.currentValue,
    i.retailer ?? '',
    i.warrantyMonths,
    i.warrantyExpiry ?? '',
    i.tags.join('; '),
    i.favorite ? 'Yes' : 'No',
    (i.notes ?? '').replace(/\s+/g, ' '),
  ]);
}

/* ---------------------------------- CSV ---------------------------------- */

function csvCell(value: string | number): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(items: InventoryItem[], categories: Category[]): string {
  const rows = itemsToRows(items, categories);
  return [CSV_COLUMNS.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
}

export function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const CONDITION_SET: Condition[] = ['New', 'Excellent', 'Good', 'Fair', 'Poor'];

function num(v: unknown): number {
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function rowsToItems(rows: string[][], categories: Category[]): InventoryItem[] {
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;
  const cName = idx(['name', 'item', 'item name', 'title']);
  const cCat = idx(['category']);
  const cRoom = idx(['room']);
  const cLoc = idx(['location', 'storage location']);
  const cBrand = idx(['brand']);
  const cModel = idx(['model']);
  const cSerial = idx(['serial number', 'serial']);
  const cQty = idx(['quantity', 'qty']);
  const cCond = idx(['condition']);
  const cDate = idx(['purchase date', 'date']);
  const cPrice = idx(['purchase price', 'price']);
  const cValue = idx(['current value', 'value', 'estimated value']);
  const cRetail = idx(['retailer', 'store', 'vendor']);
  const cWarrMonths = idx(['warranty months', 'warranty']);
  const cWarrExp = idx(['warranty expiry', 'warranty expiration']);
  const cTags = idx(['tags']);
  const cFav = idx(['favourite', 'favorite']);
  const cNotes = idx(['notes']);

  const now = new Date().toISOString();
  const byName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  return rows.slice(1).map((r) => {
    const get = (i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
    const categoryLabel = get(cCat) || 'Uncategorised';
    const categoryId = byName.get(categoryLabel.toLowerCase()) ?? `cat_${categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const purchaseDate = get(cDate) || undefined;
    const warrantyMonths = num(get(cWarrMonths));
    const condition = (CONDITION_SET.find((c) => c.toLowerCase() === get(cCond).toLowerCase()) ?? 'Good') as Condition;
    return {
      id: uid('itm'),
      name: get(cName) || 'Untitled item',
      description: '',
      categoryId,
      room: get(cRoom) || 'Unassigned',
      location: get(cLoc) || 'Unspecified',
      tags: get(cTags)
        .split(/[;,|]/)
        .map((t) => t.trim())
        .filter(Boolean),
      brand: get(cBrand) || undefined,
      model: get(cModel) || undefined,
      serialNumber: get(cSerial) || undefined,
      quantity: Math.max(1, num(get(cQty)) || 1),
      condition,
      purchaseDate,
      purchasePrice: num(get(cPrice)),
      currentValue: num(get(cValue)) || num(get(cPrice)),
      retailer: get(cRetail) || undefined,
      warrantyMonths,
      warrantyExpiry: get(cWarrExp) || (purchaseDate && warrantyMonths ? addMonths(purchaseDate, warrantyMonths) : undefined),
      photos: [`tone:${Math.floor(Math.random() * 8)}`],
      maintenance: [],
      notes: get(cNotes) || undefined,
      favorite: /^(yes|true|1)$/i.test(get(cFav)),
      archived: false,
      createdAt: now,
      updatedAt: now,
    } satisfies InventoryItem;
  });
}

/* --------------------------------- Excel --------------------------------- */

export function exportXLSX(items: InventoryItem[], categories: Category[], filename = `homevault-inventory-${stamp()}.xlsx`) {
  const rows = itemsToRows(items, categories);
  const sheet = XLSX.utils.aoa_to_sheet([[...CSV_COLUMNS], ...rows]);
  sheet['!cols'] = CSV_COLUMNS.map((c) => ({ wch: Math.max(12, Math.min(28, c.length + 8)) }));
  const summary = XLSX.utils.aoa_to_sheet([
    ['HomeVault Inventory Export'],
    ['Generated', new Date().toLocaleString('en-NG')],
    ['Currency', 'NGN (Nigerian Naira)'],
    ['Total items', items.length],
    ['Total value (NGN)', items.reduce((s, i) => s + i.currentValue * i.quantity, 0)],
    ['Total spend (NGN)', items.reduce((s, i) => s + i.purchasePrice * i.quantity, 0)],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summary, 'Summary');
  XLSX.utils.book_append_sheet(wb, sheet, 'Inventory');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  download(filename, out, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export async function readSpreadsheet(file: File): Promise<string[][]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames.find((n) => /inventory|items/i.test(n)) ?? wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '' });
  return aoa.map((r) => r.map((c) => String(c ?? '')));
}

/* ---------------------------------- PDF ---------------------------------- */

function pdfText(s: string): string {
  return String(s)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    // eslint-disable-next-line no-control-regex
    .replace(/[^\u0020-\u007E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Draws a naira amount: Helvetica has no ₦ glyph, so we stroke the two bars over an "N". */
function nairaOps(x: number, y: number, amount: number, size: number, bold = false): string {
  const digits = amount.toLocaleString('en-NG', { maximumFractionDigits: 0 });
  const font = bold ? '/F2' : '/F1';
  const nWidth = 0.722 * size;
  const ops = [
    `BT ${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (N${pdfText(digits)}) Tj ET`,
    `${(size * 0.07).toFixed(2)} w`,
    `${(x + size * 0.06).toFixed(2)} ${(y + size * 0.28).toFixed(2)} m ${(x + nWidth - size * 0.06).toFixed(2)} ${(y + size * 0.28).toFixed(2)} l S`,
    `${(x + size * 0.06).toFixed(2)} ${(y + size * 0.46).toFixed(2)} m ${(x + nWidth - size * 0.06).toFixed(2)} ${(y + size * 0.46).toFixed(2)} l S`,
  ];
  return ops.join('\n');
}

export function exportPDF(items: InventoryItem[], categories: Category[], meta: { household: string; totalValue: number; totalSpend: number }) {
  const W = 595.28;
  const H = 841.89;
  const margin = 36;
  const rowH = 22;
  const perPage = 26;
  const pages: string[] = [];
  const chunks: InventoryItem[][] = [];
  for (let i = 0; i < items.length; i += perPage) chunks.push(items.slice(i, i + perPage));
  if (!chunks.length) chunks.push([]);

  chunks.forEach((chunk, pageIndex) => {
    const ops: string[] = ['0.06 0.14 0.24 rg'];
    // header band
    ops.push(`0.118 0.227 0.373 rg ${margin} ${H - 96} ${W - margin * 2} 60 re f`);
    ops.push(`1 1 1 rg BT /F2 18 Tf 1 0 0 1 ${margin + 16} ${H - 62} Tm (HomeVault Inventory Report) Tj ET`);
    ops.push(`0.85 0.92 1 rg BT /F1 9.5 Tf 1 0 0 1 ${margin + 16} ${H - 78} Tm (${pdfText(meta.household)}  -  Generated ${pdfText(formatDate(new Date().toISOString(), 'long'))}) Tj ET`);

    if (pageIndex === 0) {
      ops.push(`0.95 0.97 0.99 rg ${margin} ${H - 158} ${W - margin * 2} 48 re f`);
      ops.push(`0.29 0.38 0.5 rg BT /F1 9 Tf 1 0 0 1 ${margin + 16} ${H - 124} Tm (TOTAL ITEMS) Tj ET`);
      ops.push(`0.06 0.14 0.24 rg BT /F2 14 Tf 1 0 0 1 ${margin + 16} ${H - 142} Tm (${items.length}) Tj ET`);
      ops.push(`0.29 0.38 0.5 rg BT /F1 9 Tf 1 0 0 1 ${margin + 176} ${H - 124} Tm (ESTIMATED VALUE) Tj ET`);
      ops.push('0.059 0.463 0.431 rg 0.059 0.463 0.431 RG');
      ops.push(nairaOps(margin + 176, H - 142, meta.totalValue, 14, true));
      ops.push(`0.29 0.38 0.5 rg BT /F1 9 Tf 1 0 0 1 ${margin + 356} ${H - 124} Tm (TOTAL SPEND) Tj ET`);
      ops.push('0.06 0.14 0.24 rg 0.06 0.14 0.24 RG');
      ops.push(nairaOps(margin + 356, H - 142, meta.totalSpend, 14, true));
    }

    let y = H - (pageIndex === 0 ? 190 : 130);
    // table head
    ops.push(`0.29 0.38 0.5 rg BT /F2 8.5 Tf 1 0 0 1 ${margin} ${y} Tm (ITEM) Tj ET`);
    ops.push(`BT /F2 8.5 Tf 1 0 0 1 ${margin + 190} ${y} Tm (CATEGORY) Tj ET`);
    ops.push(`BT /F2 8.5 Tf 1 0 0 1 ${margin + 285} ${y} Tm (ROOM) Tj ET`);
    ops.push(`BT /F2 8.5 Tf 1 0 0 1 ${margin + 375} ${y} Tm (VALUE) Tj ET`);
    ops.push(`BT /F2 8.5 Tf 1 0 0 1 ${margin + 460} ${y} Tm (WARRANTY) Tj ET`);
    y -= 8;
    ops.push(`0.85 0.89 0.94 RG 1 w ${margin} ${y} m ${W - margin} ${y} l S`);
    y -= 16;

    for (const item of chunk) {
      ops.push('0.06 0.14 0.24 rg');
      ops.push(`BT /F1 9.5 Tf 1 0 0 1 ${margin} ${y} Tm (${pdfText(truncate(item.name, 34))}) Tj ET`);
      ops.push('0.29 0.38 0.5 rg');
      ops.push(`BT /F1 9 Tf 1 0 0 1 ${margin + 190} ${y} Tm (${pdfText(truncate(catName(categories, item.categoryId), 16))}) Tj ET`);
      ops.push(`BT /F1 9 Tf 1 0 0 1 ${margin + 285} ${y} Tm (${pdfText(truncate(item.room, 16))}) Tj ET`);
      ops.push('0.06 0.14 0.24 rg 0.06 0.14 0.24 RG');
      ops.push(nairaOps(margin + 375, y, item.currentValue * item.quantity, 9.5));
      ops.push('0.29 0.38 0.5 rg');
      ops.push(`BT /F1 9 Tf 1 0 0 1 ${margin + 460} ${y} Tm (${pdfText(item.warrantyExpiry ? formatDate(item.warrantyExpiry) : 'None')}) Tj ET`);
      y -= rowH;
      ops.push(`0.93 0.95 0.97 RG 0.6 w ${margin} ${(y + 12).toFixed(2)} m ${W - margin} ${(y + 12).toFixed(2)} l S`);
    }

    ops.push(`0.55 0.62 0.7 rg BT /F1 8 Tf 1 0 0 1 ${margin} 28 Tm (HomeVault - all amounts in Nigerian Naira. Page ${pageIndex + 1} of ${chunks.length}) Tj ET`);
    pages.push(ops.join('\n'));
  });

  const objects: string[] = [];
  const pageCount = pages.length;
  const kids = pages.map((_, i) => `${4 + i * 2} 0 R`).join(' ');
  objects.push(`<< /Type /Catalog /Pages 2 0 R >>`);
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`);
  objects.push(`<< /Font << /F1 ${4 + pageCount * 2} 0 R /F2 ${5 + pageCount * 2} 0 R >> >>`);
  pages.forEach((content, i) => {
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources 3 0 R /Contents ${5 + i * 2} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  download(`homevault-inventory-${stamp()}.pdf`, pdf, 'application/pdf');
}

/* --------------------------------- JSON ---------------------------------- */

export function exportJSON(items: InventoryItem[], categories: Category[]) {
  const payload = {
    app: 'HomeVault',
    version: 1,
    exportedAt: new Date().toISOString(),
    currency: 'NGN',
    totals: {
      items: items.length,
      value: items.reduce((s, i) => s + i.currentValue * i.quantity, 0),
      valueFormatted: formatMoney(items.reduce((s, i) => s + i.currentValue * i.quantity, 0)),
    },
    categories,
    items,
  };
  download(`homevault-inventory-${stamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

export function exportBackup(data: AppData) {
  download(`homevault-backup-${stamp()}.json`, JSON.stringify({ app: 'HomeVault', kind: 'backup', version: 1, data }, null, 2), 'application/json');
}

export function exportCSVFile(items: InventoryItem[], categories: Category[]) {
  download(`homevault-inventory-${stamp()}.csv`, `\uFEFF${toCSV(items, categories)}`, 'text/csv;charset=utf-8');
}

export interface ParsedImport {
  items: InventoryItem[];
  backup?: AppData;
  source: string;
}

export async function parseImportFile(file: File, categories: Category[]): Promise<ParsedImport> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.json')) {
    const text = await file.text();
    const json = JSON.parse(text) as Record<string, unknown>;
    if (json && typeof json === 'object' && 'data' in json && (json as { kind?: string }).kind === 'backup') {
      return { items: [], backup: (json as { data: AppData }).data, source: 'HomeVault backup' };
    }
    const rawItems = Array.isArray(json) ? json : ((json.items as unknown[]) ?? []);
    const now = new Date().toISOString();
    const items = (rawItems as Partial<InventoryItem>[]).map((i) => ({
      id: i.id ?? uid('itm'),
      name: i.name ?? 'Untitled item',
      description: i.description ?? '',
      categoryId: i.categoryId ?? categories[0]?.id ?? 'cat_electronics',
      room: i.room ?? 'Unassigned',
      location: i.location ?? 'Unspecified',
      tags: Array.isArray(i.tags) ? i.tags : [],
      brand: i.brand,
      model: i.model,
      serialNumber: i.serialNumber,
      quantity: Number(i.quantity) || 1,
      condition: (i.condition ?? 'Good') as Condition,
      purchaseDate: i.purchaseDate,
      purchasePrice: Number(i.purchasePrice) || 0,
      currentValue: Number(i.currentValue) || Number(i.purchasePrice) || 0,
      retailer: i.retailer,
      warrantyMonths: Number(i.warrantyMonths) || 0,
      warrantyProvider: i.warrantyProvider,
      warrantyExpiry: i.warrantyExpiry,
      warrantyNotes: i.warrantyNotes,
      photos: Array.isArray(i.photos) ? i.photos : [`tone:${Math.floor(Math.random() * 8)}`],
      maintenance: Array.isArray(i.maintenance) ? i.maintenance : [],
      notes: i.notes,
      favorite: Boolean(i.favorite),
      archived: Boolean(i.archived),
      createdAt: i.createdAt ?? now,
      updatedAt: now,
    })) satisfies InventoryItem[];
    return { items, source: 'JSON' };
  }
  if (lower.endsWith('.csv')) {
    const text = await file.text();
    return { items: rowsToItems(parseCSVText(text.replace(/^\uFEFF/, '')), categories), source: 'CSV' };
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const rows = await readSpreadsheet(file);
    return { items: rowsToItems(rows, categories), source: 'Excel' };
  }
  throw new Error('Unsupported file. Use CSV, Excel (.xlsx) or JSON.');
}
