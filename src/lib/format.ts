import type { Condition, InventoryItem, WarrantyStatus } from './types';

export const CURRENCIES: Record<string, { symbol: string; code: string; label: string; locale: string }> = {
  NGN: { symbol: '₦', code: 'NGN', label: 'Nigerian Naira', locale: 'en-NG' },
  GHS: { symbol: '₵', code: 'GHS', label: 'Ghanaian Cedi', locale: 'en-GH' },
  KES: { symbol: 'KSh', code: 'KES', label: 'Kenyan Shilling', locale: 'en-KE' },
  ZAR: { symbol: 'R', code: 'ZAR', label: 'South African Rand', locale: 'en-ZA' },
  GBP: { symbol: '£', code: 'GBP', label: 'British Pound', locale: 'en-GB' },
  EUR: { symbol: '€', code: 'EUR', label: 'Euro', locale: 'en-IE' },
};

export const LANGUAGES = [
  { code: 'en-NG', label: 'English (Nigeria)', flag: '🇳🇬' },
  { code: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { code: 'yo', label: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', label: 'Igbo', flag: '🇳🇬' },
  { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export function currencySymbol(code: string): string {
  return CURRENCIES[code]?.symbol ?? '₦';
}

export function formatMoney(value: number, code = 'NGN', opts: { compact?: boolean; decimals?: boolean } = {}): string {
  const symbol = currencySymbol(code);
  const n = Number.isFinite(value) ? value : 0;
  if (opts.compact && Math.abs(n) >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (opts.compact && Math.abs(n) >= 10_000) return `${symbol}${Math.round(n / 1000)}k`;
  return `${symbol}${n.toLocaleString('en-NG', {
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  })}`;
}

export function formatDate(iso?: string, style: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  if (style === 'short') return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  if (style === 'long') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return formatDate(iso, 'short');
}

export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86_400_000);
}

export function warrantyStatus(item: InventoryItem, leadDays = 45): WarrantyStatus {
  if (!item.warrantyExpiry) return 'none';
  const days = daysUntil(item.warrantyExpiry);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= leadDays) return 'expiring';
  return 'active';
}

export function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d.toISOString().slice(0, 10);
}

export const CONDITIONS: Condition[] = ['New', 'Excellent', 'Good', 'Fair', 'Poor'];

export const CONDITION_TONE: Record<Condition, string> = {
  New: 'text-emerald-brand bg-emerald-brand/12',
  Excellent: 'text-sky-accent bg-sky-accent/12',
  Good: 'text-teal-soft bg-teal-soft/12',
  Fair: 'text-amber-brand bg-amber-brand/14',
  Poor: 'text-rose-brand bg-rose-brand/12',
};

export function uid(prefix = 'id'): string {
  const rnd = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}_${rnd.replace(/-/g, '').slice(0, 12)}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-GB', { month: 'short' });
}

export function initials(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}
