import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ActivityEntry, ActivityKind, AppData, AppSettings, Category, InventoryItem, MaintenanceEntry, Profile } from '@/lib/types';
import { createSeedData, DEFAULT_CATEGORIES, DEFAULT_LOCATIONS, DEFAULT_ROOMS } from '@/lib/seed';
import { uid } from '@/lib/format';

export const STORAGE_KEY = 'homevault.data.v1';
const THEME_KEY = 'homevault.theme.v1';

export interface Toast {
  id: string;
  message: string;
  tone: 'default' | 'success' | 'warning' | 'danger';
  action?: { label: string; run: () => void };
}

interface StoreValue {
  data: AppData;
  ready: boolean;
  toasts: Toast[];
  resolvedTheme: 'light' | 'dark';
  dismissToast: (id: string) => void;
  toast: (message: string, tone?: Toast['tone'], action?: Toast['action']) => void;
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => InventoryItem;
  updateItem: (id: string, patch: Partial<InventoryItem>, silent?: boolean) => void;
  deleteItem: (id: string) => void;
  duplicateItem: (id: string) => InventoryItem | undefined;
  toggleFavorite: (id: string) => void;
  setArchived: (id: string, archived: boolean) => void;
  addMaintenance: (id: string, entry: Omit<MaintenanceEntry, 'id'>) => void;
  removeMaintenance: (itemId: string, entryId: string) => void;
  upsertCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addRoom: (room: string) => void;
  addLocation: (location: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  pushActivity: (kind: ActivityKind, title: string, detail?: string, itemId?: string) => void;
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
  replaceAll: (next: AppData) => void;
  importItems: (items: InventoryItem[], mode: 'merge' | 'replace') => number;
  resetToDemo: () => void;
  clearInventory: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function normalize(raw: unknown): AppData | null {
  if (!raw || typeof raw !== 'object') return null;
  const seed = createSeedData();
  const d = raw as Partial<AppData>;
  if (!Array.isArray(d.items)) return null;
  return {
    version: 1,
    items: d.items.map((i) => ({
      ...i,
      tags: Array.isArray(i.tags) ? i.tags : [],
      photos: Array.isArray(i.photos) ? i.photos : [],
      maintenance: Array.isArray(i.maintenance) ? i.maintenance : [],
      quantity: Number(i.quantity) || 1,
      purchasePrice: Number(i.purchasePrice) || 0,
      currentValue: Number(i.currentValue) || 0,
      warrantyMonths: Number(i.warrantyMonths) || 0,
      favorite: Boolean(i.favorite),
      archived: Boolean(i.archived),
    })),
    categories: Array.isArray(d.categories) && d.categories.length ? d.categories : DEFAULT_CATEGORIES,
    rooms: Array.isArray(d.rooms) && d.rooms.length ? d.rooms : DEFAULT_ROOMS,
    locations: Array.isArray(d.locations) && d.locations.length ? d.locations : DEFAULT_LOCATIONS,
    activity: Array.isArray(d.activity) ? d.activity : [],
    settings: { ...seed.settings, ...(d.settings ?? {}) },
    profile: { ...seed.profile, ...(d.profile ?? {}) },
    recentSearches: Array.isArray(d.recentSearches) ? d.recentSearches : [],
  };
}

function loadInitial(): AppData {
  if (typeof window === 'undefined') return createSeedData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = normalize(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    /* corrupted payload — fall through to seed */
  }
  const seed = createSeedData();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {
    /* storage unavailable */
  }
  return seed;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadInitial());
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 520);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* quota exceeded */
    }
  }, [data]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    data.settings.theme === 'system' ? (systemDark ? 'dark' : 'light') : data.settings.theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    const meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute('content', resolvedTheme === 'dark' ? '#0B1B2E' : '#1E3A5F');
    try {
      window.localStorage.setItem(THEME_KEY, resolvedTheme);
    } catch {
      /* ignore */
    }
  }, [resolvedTheme]);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback<StoreValue['toast']>((message, tone = 'default', action) => {
    const id = uid('toast');
    setToasts((t) => [...t.slice(-2), { id, message, tone, action }]);
    timers.current[id] = window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const pushActivity = useCallback<StoreValue['pushActivity']>((kind, title, detail, itemId) => {
    const entry: ActivityEntry = { id: uid('act'), kind, title, detail, itemId, at: new Date().toISOString() };
    setData((d) => ({ ...d, activity: [entry, ...d.activity].slice(0, 80) }));
  }, []);

  const addItem = useCallback<StoreValue['addItem']>((item) => {
    const now = new Date().toISOString();
    const created: InventoryItem = { ...item, id: uid('itm'), createdAt: now, updatedAt: now };
    setData((d) => ({
      ...d,
      items: [created, ...d.items],
      rooms: d.rooms.includes(created.room) || !created.room ? d.rooms : [...d.rooms, created.room],
      locations: d.locations.includes(created.location) || !created.location ? d.locations : [...d.locations, created.location],
      activity: [
        { id: uid('act'), kind: 'created' as ActivityKind, title: `Added ${created.name}`, detail: created.room, itemId: created.id, at: now },
        ...d.activity,
      ].slice(0, 80),
    }));
    return created;
  }, []);

  const updateItem = useCallback<StoreValue['updateItem']>((id, patch, silent) => {
    const now = new Date().toISOString();
    setData((d) => {
      const target = d.items.find((i) => i.id === id);
      if (!target) return d;
      const next = { ...target, ...patch, updatedAt: now };
      return {
        ...d,
        items: d.items.map((i) => (i.id === id ? next : i)),
        rooms: d.rooms.includes(next.room) || !next.room ? d.rooms : [...d.rooms, next.room],
        locations: d.locations.includes(next.location) || !next.location ? d.locations : [...d.locations, next.location],
        activity: silent
          ? d.activity
          : [
              { id: uid('act'), kind: 'updated' as ActivityKind, title: `Updated ${next.name}`, itemId: id, at: now },
              ...d.activity,
            ].slice(0, 80),
      };
    });
  }, []);

  const deleteItem = useCallback<StoreValue['deleteItem']>((id) => {
    setData((d) => {
      const target = d.items.find((i) => i.id === id);
      return {
        ...d,
        items: d.items.filter((i) => i.id !== id),
        activity: [
          { id: uid('act'), kind: 'deleted' as ActivityKind, title: `Deleted ${target?.name ?? 'item'}`, at: new Date().toISOString() },
          ...d.activity,
        ].slice(0, 80),
      };
    });
  }, []);

  const duplicateItem = useCallback<StoreValue['duplicateItem']>((id) => {
    let copy: InventoryItem | undefined;
    setData((d) => {
      const target = d.items.find((i) => i.id === id);
      if (!target) return d;
      const now = new Date().toISOString();
      copy = { ...target, id: uid('itm'), name: `${target.name} (Copy)`, favorite: false, createdAt: now, updatedAt: now };
      return {
        ...d,
        items: [copy, ...d.items],
        activity: [
          { id: uid('act'), kind: 'duplicated' as ActivityKind, title: `Duplicated ${target.name}`, itemId: copy.id, at: now },
          ...d.activity,
        ].slice(0, 80),
      };
    });
    return copy;
  }, []);

  const toggleFavorite = useCallback<StoreValue['toggleFavorite']>((id) => {
    setData((d) => {
      const target = d.items.find((i) => i.id === id);
      if (!target) return d;
      const fav = !target.favorite;
      return {
        ...d,
        items: d.items.map((i) => (i.id === id ? { ...i, favorite: fav, updatedAt: new Date().toISOString() } : i)),
        activity: [
          {
            id: uid('act'),
            kind: 'favorite' as ActivityKind,
            title: `${fav ? 'Added' : 'Removed'} ${target.name} ${fav ? 'to' : 'from'} favourites`,
            itemId: id,
            at: new Date().toISOString(),
          },
          ...d.activity,
        ].slice(0, 80),
      };
    });
  }, []);

  const setArchived = useCallback<StoreValue['setArchived']>((id, archived) => {
    setData((d) => {
      const target = d.items.find((i) => i.id === id);
      if (!target) return d;
      return {
        ...d,
        items: d.items.map((i) => (i.id === id ? { ...i, archived, updatedAt: new Date().toISOString() } : i)),
        activity: [
          {
            id: uid('act'),
            kind: (archived ? 'archived' : 'restored') as ActivityKind,
            title: `${archived ? 'Archived' : 'Restored'} ${target.name}`,
            itemId: id,
            at: new Date().toISOString(),
          },
          ...d.activity,
        ].slice(0, 80),
      };
    });
  }, []);

  const addMaintenance = useCallback<StoreValue['addMaintenance']>((id, entry) => {
    setData((d) => {
      const target = d.items.find((i) => i.id === id);
      if (!target) return d;
      const record: MaintenanceEntry = { ...entry, id: uid('mnt') };
      return {
        ...d,
        items: d.items.map((i) =>
          i.id === id ? { ...i, maintenance: [record, ...i.maintenance], updatedAt: new Date().toISOString() } : i,
        ),
        activity: [
          {
            id: uid('act'),
            kind: 'maintenance' as ActivityKind,
            title: `Logged ${entry.type} for ${target.name}`,
            detail: entry.provider,
            itemId: id,
            at: new Date().toISOString(),
          },
          ...d.activity,
        ].slice(0, 80),
      };
    });
  }, []);

  const removeMaintenance = useCallback<StoreValue['removeMaintenance']>((itemId, entryId) => {
    setData((d) => ({
      ...d,
      items: d.items.map((i) => (i.id === itemId ? { ...i, maintenance: i.maintenance.filter((m) => m.id !== entryId) } : i)),
    }));
  }, []);

  const upsertCategory = useCallback<StoreValue['upsertCategory']>((category) => {
    setData((d) => {
      const exists = d.categories.some((c) => c.id === category.id);
      return {
        ...d,
        categories: exists ? d.categories.map((c) => (c.id === category.id ? category : c)) : [...d.categories, category],
        activity: [
          {
            id: uid('act'),
            kind: 'category' as ActivityKind,
            title: `${exists ? 'Updated' : 'Created'} category “${category.name}”`,
            at: new Date().toISOString(),
          },
          ...d.activity,
        ].slice(0, 80),
      };
    });
  }, []);

  const deleteCategory = useCallback<StoreValue['deleteCategory']>((id) => {
    setData((d) => {
      const fallback = d.categories.find((c) => c.id !== id)?.id ?? 'cat_electronics';
      return {
        ...d,
        categories: d.categories.filter((c) => c.id !== id),
        items: d.items.map((i) => (i.categoryId === id ? { ...i, categoryId: fallback } : i)),
      };
    });
  }, []);

  const addRoom = useCallback<StoreValue['addRoom']>((room) => {
    if (!room.trim()) return;
    setData((d) => (d.rooms.includes(room) ? d : { ...d, rooms: [...d.rooms, room.trim()] }));
  }, []);

  const addLocation = useCallback<StoreValue['addLocation']>((location) => {
    if (!location.trim()) return;
    setData((d) => (d.locations.includes(location) ? d : { ...d, locations: [...d.locations, location.trim()] }));
  }, []);

  const updateSettings = useCallback<StoreValue['updateSettings']>((patch) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const updateProfile = useCallback<StoreValue['updateProfile']>((patch) => {
    setData((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  }, []);

  const addRecentSearch = useCallback<StoreValue['addRecentSearch']>((term) => {
    const t = term.trim();
    if (t.length < 2) return;
    setData((d) => ({ ...d, recentSearches: [t, ...d.recentSearches.filter((s) => s.toLowerCase() !== t.toLowerCase())].slice(0, 8) }));
  }, []);

  const clearRecentSearches = useCallback(() => setData((d) => ({ ...d, recentSearches: [] })), []);

  const replaceAll = useCallback<StoreValue['replaceAll']>((next) => {
    const safe = normalize(next);
    if (safe) setData(safe);
  }, []);

  const importItems = useCallback<StoreValue['importItems']>((incoming, mode) => {
    let count = 0;
    setData((d) => {
      const now = new Date().toISOString();
      const prepared = incoming.map((i) => ({ ...i, id: i.id || uid('itm'), createdAt: i.createdAt || now, updatedAt: now }));
      count = prepared.length;
      const known = new Set(d.categories.map((c) => c.id));
      const extraCats: Category[] = [];
      for (const item of prepared) {
        if (!known.has(item.categoryId)) {
          known.add(item.categoryId);
          extraCats.push({ id: item.categoryId, name: item.categoryId.replace(/^cat_/, '').replace(/\b\w/g, (m) => m.toUpperCase()), color: '#38BDF8', icon: 'boxes' });
        }
      }
      const merged = mode === 'replace' ? prepared : [...prepared.filter((p) => !d.items.some((i) => i.id === p.id)), ...d.items];
      return {
        ...d,
        items: merged,
        categories: [...d.categories, ...extraCats],
        activity: [
          { id: uid('act'), kind: 'imported' as ActivityKind, title: `Imported ${prepared.length} items`, detail: mode === 'replace' ? 'Replaced library' : 'Merged into library', at: now },
          ...d.activity,
        ].slice(0, 80),
      };
    });
    return count;
  }, []);

  const resetToDemo = useCallback(() => setData(createSeedData()), []);

  const clearInventory = useCallback(() => {
    setData((d) => ({ ...d, items: [], activity: [{ id: uid('act'), kind: 'deleted', title: 'Cleared all inventory', at: new Date().toISOString() }] }));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      ready,
      toasts,
      resolvedTheme,
      dismissToast,
      toast,
      addItem,
      updateItem,
      deleteItem,
      duplicateItem,
      toggleFavorite,
      setArchived,
      addMaintenance,
      removeMaintenance,
      upsertCategory,
      deleteCategory,
      addRoom,
      addLocation,
      updateSettings,
      updateProfile,
      pushActivity,
      addRecentSearch,
      clearRecentSearches,
      replaceAll,
      importItems,
      resetToDemo,
      clearInventory,
    }),
    [
      data, ready, toasts, resolvedTheme, dismissToast, toast, addItem, updateItem, deleteItem, duplicateItem,
      toggleFavorite, setArchived, addMaintenance, removeMaintenance, upsertCategory, deleteCategory, addRoom,
      addLocation, updateSettings, updateProfile, pushActivity, addRecentSearch, clearRecentSearches, replaceAll,
      importItems, resetToDemo, clearInventory,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside AppStoreProvider');
  return ctx;
}

export function useCategories() {
  const { data } = useStore();
  return data.categories;
}

export function useCategoryMap() {
  const { data } = useStore();
  return useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);
}
