import type { AppData, Category, Filters, InventoryItem } from './types';
import { daysUntil, monthKey, monthLabel, warrantyStatus } from './format';

export interface DashboardStats {
  totalItems: number;
  totalUnits: number;
  totalValue: number;
  totalSpend: number;
  categories: number;
  rooms: number;
  activeWarranties: number;
  expiringWarranties: number;
  expiredWarranties: number;
  favorites: number;
  archived: number;
  maintenanceLogs: number;
  maintenanceSpend: number;
  addedThisMonth: number;
  spendThisMonth: number;
  spendLastMonth: number;
  valueDelta: number;
}

export function activeItems(data: AppData): InventoryItem[] {
  return data.items.filter((i) => !i.archived);
}

export function computeStats(data: AppData, leadDays = 45): DashboardStats {
  const items = activeItems(data);
  const thisMonth = monthKey(new Date().toISOString());
  const last = new Date();
  last.setMonth(last.getMonth() - 1);
  const lastMonth = monthKey(last.toISOString());

  let totalValue = 0;
  let totalSpend = 0;
  let totalUnits = 0;
  let active = 0;
  let expiring = 0;
  let expired = 0;
  let favorites = 0;
  let maintenanceLogs = 0;
  let maintenanceSpend = 0;
  let addedThisMonth = 0;
  let spendThisMonth = 0;
  let spendLastMonth = 0;
  const rooms = new Set<string>();
  const cats = new Set<string>();

  for (const i of items) {
    totalValue += i.currentValue * i.quantity;
    totalSpend += i.purchasePrice * i.quantity;
    totalUnits += i.quantity;
    rooms.add(i.room);
    cats.add(i.categoryId);
    if (i.favorite) favorites += 1;
    maintenanceLogs += i.maintenance.length;
    maintenanceSpend += i.maintenance.reduce((s, m) => s + (m.cost || 0), 0);
    const status = warrantyStatus(i, leadDays);
    if (status === 'active') active += 1;
    if (status === 'expiring') expiring += 1;
    if (status === 'expired') expired += 1;
    if (monthKey(i.createdAt) === thisMonth) addedThisMonth += 1;
    if (i.purchaseDate) {
      if (monthKey(i.purchaseDate) === thisMonth) spendThisMonth += i.purchasePrice * i.quantity;
      if (monthKey(i.purchaseDate) === lastMonth) spendLastMonth += i.purchasePrice * i.quantity;
    }
  }

  return {
    totalItems: items.length,
    totalUnits,
    totalValue,
    totalSpend,
    categories: cats.size,
    rooms: rooms.size,
    activeWarranties: active,
    expiringWarranties: expiring,
    expiredWarranties: expired,
    favorites,
    archived: data.items.length - items.length,
    maintenanceLogs,
    maintenanceSpend,
    addedThisMonth,
    spendThisMonth,
    spendLastMonth,
    valueDelta: totalSpend ? ((totalValue - totalSpend) / totalSpend) * 100 : 0,
  };
}

export function categoryDistribution(data: AppData): { category: Category; count: number; value: number }[] {
  const items = activeItems(data);
  return data.categories
    .map((category) => {
      const owned = items.filter((i) => i.categoryId === category.id);
      return {
        category,
        count: owned.length,
        value: owned.reduce((s, i) => s + i.currentValue * i.quantity, 0),
      };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.value - a.value);
}

export function roomDistribution(data: AppData): { room: string; count: number; value: number }[] {
  const items = activeItems(data);
  const map = new Map<string, { count: number; value: number }>();
  for (const i of items) {
    const cur = map.get(i.room) ?? { count: 0, value: 0 };
    cur.count += 1;
    cur.value += i.currentValue * i.quantity;
    map.set(i.room, cur);
  }
  return [...map.entries()].map(([room, v]) => ({ room, ...v })).sort((a, b) => b.value - a.value);
}

export function monthlySeries(data: AppData, months = 6): { key: string; label: string; spend: number; count: number }[] {
  const out: { key: string; label: string; spend: number; count: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    out.push({ key, label: monthLabel(key), spend: 0, count: 0 });
  }
  const index = new Map(out.map((o, i) => [o.key, i]));
  for (const item of activeItems(data)) {
    if (!item.purchaseDate) continue;
    const idx = index.get(monthKey(item.purchaseDate));
    if (idx === undefined) continue;
    out[idx].spend += item.purchasePrice * item.quantity;
    out[idx].count += 1;
  }
  return out;
}

export function cumulativeValueSeries(data: AppData, months = 6): { label: string; value: number }[] {
  const series = monthlySeries(data, months);
  let running = 0;
  const older = activeItems(data)
    .filter((i) => i.purchaseDate && i.purchaseDate < `${series[0]?.key ?? ''}-01`)
    .reduce((s, i) => s + i.currentValue * i.quantity, 0);
  running = older;
  return series.map((s) => {
    running += s.spend * 0.86;
    return { label: s.label, value: Math.round(running) };
  });
}

export function purchaseTimeline(data: AppData): { year: string; items: InventoryItem[]; total: number }[] {
  const groups = new Map<string, InventoryItem[]>();
  for (const item of activeItems(data)) {
    if (!item.purchaseDate) continue;
    const year = item.purchaseDate.slice(0, 4);
    groups.set(year, [...(groups.get(year) ?? []), item]);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, list]) => ({
      year,
      items: list.sort((a, b) => (b.purchaseDate ?? '').localeCompare(a.purchaseDate ?? '')),
      total: list.reduce((s, i) => s + i.purchasePrice * i.quantity, 0),
    }));
}

export function allTags(data: AppData): string[] {
  const set = new Set<string>();
  for (const i of data.items) i.tags.forEach((t) => set.add(t));
  return [...set].sort();
}

export function filterItems(data: AppData, filters: Filters, leadDays = 45): InventoryItem[] {
  const q = filters.query.trim().toLowerCase();
  const catMap = new Map(data.categories.map((c) => [c.id, c.name.toLowerCase()]));

  const result = data.items.filter((item) => {
    if (filters.archived !== Boolean(item.archived)) return false;
    if (filters.favoritesOnly && !item.favorite) return false;
    if (filters.categoryIds.length && !filters.categoryIds.includes(item.categoryId)) return false;
    if (filters.rooms.length && !filters.rooms.includes(item.room)) return false;
    if (filters.conditions.length && !filters.conditions.includes(item.condition)) return false;
    if (filters.tags.length && !filters.tags.some((t) => item.tags.includes(t))) return false;
    if (filters.warranty !== 'all' && warrantyStatus(item, leadDays) !== filters.warranty) return false;
    if (filters.minPrice !== undefined && item.currentValue < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && item.currentValue > filters.maxPrice) return false;
    if (filters.purchasedFrom && (item.purchaseDate ?? '') < filters.purchasedFrom) return false;
    if (filters.purchasedTo && (item.purchaseDate ?? '') > filters.purchasedTo) return false;
    if (q) {
      const hay = [
        item.name,
        item.brand,
        item.model,
        item.serialNumber,
        item.room,
        item.location,
        item.notes,
        item.description,
        item.retailer,
        catMap.get(item.categoryId),
        ...item.tags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorters: Record<Filters['sort'], (a: InventoryItem, b: InventoryItem) => number> = {
    recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
    oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
    name: (a, b) => a.name.localeCompare(b.name),
    'value-desc': (a, b) => b.currentValue - a.currentValue,
    'value-asc': (a, b) => a.currentValue - b.currentValue,
  };
  return result.sort(sorters[filters.sort]);
}

export function warrantyBuckets(data: AppData, leadDays = 45) {
  const items = activeItems(data).filter((i) => i.warrantyExpiry);
  const withDays = items.map((i) => ({ item: i, days: daysUntil(i.warrantyExpiry) ?? 0 }));
  return {
    active: withDays.filter((w) => w.days > leadDays).sort((a, b) => a.days - b.days),
    expiring: withDays.filter((w) => w.days >= 0 && w.days <= leadDays).sort((a, b) => a.days - b.days),
    expired: withDays.filter((w) => w.days < 0).sort((a, b) => b.days - a.days),
  };
}

export function upcomingMaintenance(data: AppData) {
  const out: { item: InventoryItem; entry: InventoryItem['maintenance'][number]; days: number }[] = [];
  for (const item of activeItems(data)) {
    for (const entry of item.maintenance) {
      if (!entry.nextDueDate) continue;
      out.push({ item, entry, days: daysUntil(entry.nextDueDate) ?? 0 });
    }
  }
  return out.sort((a, b) => a.days - b.days);
}

export function maintenanceHistory(data: AppData) {
  const out: { item: InventoryItem; entry: InventoryItem['maintenance'][number] }[] = [];
  for (const item of data.items) for (const entry of item.maintenance) out.push({ item, entry });
  return out.sort((a, b) => b.entry.date.localeCompare(a.entry.date));
}
