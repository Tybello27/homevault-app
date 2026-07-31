export type Condition = 'New' | 'Excellent' | 'Good' | 'Fair' | 'Poor';

export type WarrantyStatus = 'active' | 'expiring' | 'expired' | 'none';

export interface MaintenanceEntry {
  id: string;
  date: string; // ISO yyyy-mm-dd
  type: string;
  provider?: string;
  cost: number;
  notes?: string;
  nextDueDate?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  room: string;
  location: string;
  tags: string[];
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity: number;
  condition: Condition;
  purchaseDate?: string;
  purchasePrice: number;
  currentValue: number;
  retailer?: string;
  warrantyMonths: number;
  warrantyProvider?: string;
  warrantyExpiry?: string;
  warrantyNotes?: string;
  photos: string[];
  maintenance: MaintenanceEntry[];
  notes?: string;
  favorite: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export type ActivityKind =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'archived'
  | 'restored'
  | 'duplicated'
  | 'favorite'
  | 'maintenance'
  | 'imported'
  | 'exported'
  | 'category';

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  itemId?: string;
  at: string;
}

export interface Profile {
  name: string;
  email: string;
  household: string;
  address: string;
  avatarColor: string;
  memberSince: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
  warrantyReminders: boolean;
  maintenanceReminders: boolean;
  reminderLeadDays: number;
  compactCards: boolean;
  defaultView: 'grid' | 'list';
  lastBackupAt?: string;
}

export interface AppData {
  version: 1;
  items: InventoryItem[];
  categories: Category[];
  rooms: string[];
  locations: string[];
  activity: ActivityEntry[];
  settings: AppSettings;
  profile: Profile;
  recentSearches: string[];
}

export interface Filters {
  query: string;
  categoryIds: string[];
  rooms: string[];
  conditions: Condition[];
  warranty: WarrantyStatus | 'all';
  favoritesOnly: boolean;
  archived: boolean;
  minPrice?: number;
  maxPrice?: number;
  purchasedFrom?: string;
  purchasedTo?: string;
  tags: string[];
  sort: 'recent' | 'name' | 'value-desc' | 'value-asc' | 'oldest';
}

export const emptyFilters: Filters = {
  query: '',
  categoryIds: [],
  rooms: [],
  conditions: [],
  warranty: 'all',
  favoritesOnly: false,
  archived: false,
  tags: [],
  sort: 'recent',
};
