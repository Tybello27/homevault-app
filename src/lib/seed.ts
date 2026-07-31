import type { AppData, Category, Condition, InventoryItem } from './types';
import { addMonths, uid } from './format';

export const PHOTO_TONES = [
  'linear-gradient(140deg,#1E3A5F 0%,#0F766E 100%)',
  'linear-gradient(140deg,#38BDF8 0%,#1E3A5F 100%)',
  'linear-gradient(140deg,#0F766E 0%,#14B8A6 100%)',
  'linear-gradient(140deg,#334155 0%,#0F2440 100%)',
  'linear-gradient(140deg,#F59E0B 0%,#B45309 100%)',
  'linear-gradient(140deg,#6366F1 0%,#1E3A5F 100%)',
  'linear-gradient(140deg,#10B981 0%,#0F766E 100%)',
  'linear-gradient(140deg,#EC4899 0%,#7C3AED 100%)',
];

export function photoBackground(token: string | undefined, fallbackIndex = 0): string {
  if (!token) return PHOTO_TONES[fallbackIndex % PHOTO_TONES.length];
  if (token.startsWith('tone:')) {
    const i = Number(token.slice(5));
    return PHOTO_TONES[(Number.isFinite(i) ? i : 0) % PHOTO_TONES.length];
  }
  return PHOTO_TONES[fallbackIndex % PHOTO_TONES.length];
}

export function isRealPhoto(token: string): boolean {
  return token.startsWith('data:') || token.startsWith('blob:') || token.startsWith('http');
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_electronics', name: 'Electronics', color: '#38BDF8', icon: 'tv' },
  { id: 'cat_furniture', name: 'Furniture', color: '#0F766E', icon: 'sofa' },
  { id: 'cat_appliances', name: 'Appliances', color: '#8B5CF6', icon: 'washer' },
  { id: 'cat_kitchen', name: 'Kitchen', color: '#F59E0B', icon: 'utensils' },
  { id: 'cat_bedroom', name: 'Bedroom', color: '#EC4899', icon: 'bed' },
  { id: 'cat_tools', name: 'Tools & Power', color: '#64748B', icon: 'tool' },
  { id: 'cat_fitness', name: 'Fitness', color: '#10B981', icon: 'dumbbell' },
  { id: 'cat_media', name: 'Books & Media', color: '#F97316', icon: 'book' },
];

export const DEFAULT_ROOMS = [
  'Living Room',
  'Master Bedroom',
  'Guest Room',
  'Kitchen',
  'Dining Room',
  'Home Office',
  'Bathroom',
  'Garage',
  'Balcony',
  'Store Room',
];

export const DEFAULT_LOCATIONS = [
  'TV Console',
  'Wardrobe',
  'Upper Cabinet',
  'Lower Cabinet',
  'Desk Drawer',
  'Shelf A',
  'Shelf B',
  'Storage Box 1',
  'Under Bed',
  'Wall Mounted',
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function iso(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString();
}

interface SeedSpec {
  name: string;
  brand: string;
  model: string;
  cat: string;
  room: string;
  loc: string;
  price: number;
  value: number;
  qty?: number;
  cond: Condition;
  bought: number; // days ago
  warrantyMonths: number;
  expiry?: string;
  fav?: boolean;
  tags: string[];
  serial: string;
  retailer: string;
  notes?: string;
  tones: number[];
}

const SPECS: SeedSpec[] = [
  { name: 'LG OLED 55" Smart TV', brand: 'LG', model: 'OLED55C3', cat: 'cat_electronics', room: 'Living Room', loc: 'Wall Mounted', price: 1_250_000, value: 1_050_000, cond: 'Excellent', bought: 210, warrantyMonths: 24, fav: true, tags: ['entertainment', 'insured'], serial: 'LG-OLED-8842190', retailer: 'Slot Systems, Ikeja', notes: 'Wall bracket installed by vendor. Remote + magic pointer in TV drawer.', tones: [1, 3, 0] },
  { name: 'MacBook Pro 14" M3', brand: 'Apple', model: 'MRX33LL/A', cat: 'cat_electronics', room: 'Home Office', loc: 'Desk Drawer', price: 3_200_000, value: 2_850_000, cond: 'Excellent', bought: 130, warrantyMonths: 12, fav: true, tags: ['work', 'high-value', 'insured'], serial: 'C02XK1TQMD6T', retailer: 'iStore Lagos', notes: 'AppleCare receipt saved in Documents folder.', tones: [3, 0] },
  { name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', model: 'SM-S928B', cat: 'cat_electronics', room: 'Master Bedroom', loc: 'Wardrobe', price: 1_850_000, value: 1_420_000, cond: 'Excellent', bought: 95, warrantyMonths: 12, expiry: inDays(22), tags: ['mobile', 'high-value'], serial: 'RF8W71KQ2AB', retailer: 'Pointek, Victoria Island', tones: [5, 1] },
  { name: 'Hisense 1.5HP Inverter AC', brand: 'Hisense', model: 'AS-12TW4RM', cat: 'cat_appliances', room: 'Master Bedroom', loc: 'Wall Mounted', price: 520_000, value: 455_000, cond: 'Good', bought: 320, warrantyMonths: 36, tags: ['cooling'], serial: 'HS-AC-773211', retailer: 'Justrite, Lekki', notes: 'Serviced every 4 months. Filter cleaning done in-house.', tones: [2, 6] },
  { name: 'LG 2-Door Refrigerator 375L', brand: 'LG', model: 'GL-B372RQBB', cat: 'cat_appliances', room: 'Kitchen', loc: 'Kitchen Corner', price: 685_000, value: 590_000, cond: 'Excellent', bought: 400, warrantyMonths: 24, expiry: inDays(38), tags: ['essential'], serial: 'LG-REF-559012', retailer: 'Konga', tones: [0, 2] },
  { name: 'Haier Thermocool Washer 8kg', brand: 'Haier Thermocool', model: 'HWM80-1269S', cat: 'cat_appliances', room: 'Balcony', loc: 'Laundry Nook', price: 430_000, value: 350_000, cond: 'Good', bought: 520, warrantyMonths: 12, tags: ['laundry'], serial: 'HT-WM-220984', retailer: 'Jumia', tones: [6] },
  { name: '3-Seater Fabric Sofa (Teal)', brand: 'Vitafoam Living', model: 'Nordic 3S', cat: 'cat_furniture', room: 'Living Room', loc: 'Main Lounge', price: 385_000, value: 320_000, cond: 'Excellent', bought: 250, warrantyMonths: 12, fav: true, tags: ['lounge'], serial: 'VF-SOFA-1104', retailer: 'Vitafoam Showroom, Ikeja', notes: 'Fabric protector applied. Professional cleaning every 6 months.', tones: [2, 0, 6] },
  { name: '6-Seater Dining Set (Oak)', brand: 'Woodlane', model: 'Ashwood-6', cat: 'cat_furniture', room: 'Dining Room', loc: 'Dining Area', price: 450_000, value: 400_000, cond: 'Excellent', bought: 180, warrantyMonths: 6, tags: ['dining'], serial: 'WL-DN-88213', retailer: 'Woodlane Furniture', tones: [4, 3] },
  { name: 'King Orthopedic Mattress', brand: 'Mouka', model: 'Regina Ortho 7"', cat: 'cat_bedroom', room: 'Master Bedroom', loc: 'Bed Frame', price: 295_000, value: 240_000, cond: 'Good', bought: 610, warrantyMonths: 60, tags: ['sleep'], serial: 'MK-ORT-77120', retailer: 'Mouka Store, Surulere', tones: [7] },
  { name: 'Executive Office Chair', brand: 'Ergomax', model: 'EM-940', cat: 'cat_furniture', room: 'Home Office', loc: 'Workstation', price: 145_000, value: 118_000, cond: 'Good', bought: 300, warrantyMonths: 24, tags: ['work'], serial: 'EM-CH-3399', retailer: 'Office Mart', tones: [3] },
  { name: 'Binatone Microwave 20L', brand: 'Binatone', model: 'MWO-2018', cat: 'cat_kitchen', room: 'Kitchen', loc: 'Upper Cabinet', price: 85_000, value: 62_000, cond: 'Good', bought: 430, warrantyMonths: 12, tags: ['cooking'], serial: 'BN-MW-55110', retailer: 'Shoprite Ikeja City Mall', tones: [4] },
  { name: 'Kenwood Blender 500W', brand: 'Kenwood', model: 'BLP31.A0WH', cat: 'cat_kitchen', room: 'Kitchen', loc: 'Lower Cabinet', price: 45_000, value: 32_000, qty: 2, cond: 'Good', bought: 260, warrantyMonths: 12, expiry: inDays(-40), tags: ['cooking'], serial: 'KW-BL-90233', retailer: 'Jumia', tones: [4, 6] },
  { name: 'Elepaq 3.5KVA Generator', brand: 'Elepaq', model: 'SV6800E2', cat: 'cat_tools', room: 'Garage', loc: 'Generator House', price: 380_000, value: 310_000, cond: 'Good', bought: 470, warrantyMonths: 12, tags: ['power', 'essential'], serial: 'EP-GEN-11284', retailer: 'Ojota Power Market', notes: 'Oil changed every 100 running hours. Uses 20W-50.', tones: [3, 4] },
  { name: 'Luminous 1.5KVA Inverter + Batteries', brand: 'Luminous', model: 'Eco Volt 1550', cat: 'cat_tools', room: 'Store Room', loc: 'Wall Mounted', price: 720_000, value: 640_000, cond: 'Excellent', bought: 150, warrantyMonths: 24, fav: true, tags: ['power', 'essential', 'high-value'], serial: 'LM-INV-44902', retailer: 'Sunlight Energy, Lekki', notes: 'Two 220AH tubular batteries. Top up distilled water quarterly.', tones: [0, 5] },
  { name: 'Canon EOS R50 Camera Kit', brand: 'Canon', model: 'EOS R50 + 18-45mm', cat: 'cat_electronics', room: 'Home Office', loc: 'Shelf A', price: 1_150_000, value: 990_000, cond: 'Excellent', bought: 70, warrantyMonths: 12, expiry: inDays(295), tags: ['creative', 'high-value'], serial: 'CN-R50-778120', retailer: 'Camera Hub NG', tones: [3, 1] },
  { name: 'JBL PartyBox 110', brand: 'JBL', model: 'PARTYBOX110', cat: 'cat_electronics', room: 'Living Room', loc: 'TV Console', price: 620_000, value: 520_000, cond: 'Excellent', bought: 110, warrantyMonths: 12, expiry: inDays(12), tags: ['audio', 'entertainment'], serial: 'JBL-PB-330219', retailer: 'Slot Systems', tones: [5, 3] },
  { name: 'Bosch Cordless Drill Set', brand: 'Bosch', model: 'GSB 18V-50', cat: 'cat_tools', room: 'Garage', loc: 'Storage Box 1', price: 95_000, value: 80_000, cond: 'Good', bought: 340, warrantyMonths: 24, tags: ['diy'], serial: 'BS-DR-66120', retailer: 'Tool Depot', tones: [3] },
  { name: 'Treadmill T-19 Motorised', brand: 'American Fitness', model: 'T-19', cat: 'cat_fitness', room: 'Balcony', loc: 'Gym Corner', price: 560_000, value: 430_000, cond: 'Good', bought: 560, warrantyMonths: 12, tags: ['health'], serial: 'AF-TM-55231', retailer: 'Fitness World NG', notes: 'Belt lubricated every 3 months.', tones: [6, 2] },
  { name: 'Wooden Bookshelf 5-Tier', brand: 'Woodlane', model: 'Shelf-5T', cat: 'cat_media', room: 'Home Office', loc: 'Shelf B', price: 78_000, value: 65_000, cond: 'Excellent', bought: 200, warrantyMonths: 0, tags: ['storage'], serial: 'WL-BS-1290', retailer: 'Woodlane Furniture', tones: [4] },
  { name: 'Hikvision 4-Camera CCTV Kit', brand: 'Hikvision', model: 'DS-7104HQHI', cat: 'cat_electronics', room: 'Garage', loc: 'Control Panel', price: 340_000, value: 300_000, cond: 'Excellent', bought: 60, warrantyMonths: 24, tags: ['security', 'essential'], serial: 'HK-CCTV-99201', retailer: 'SecureTech Lagos', tones: [0, 3] },
  { name: 'Scanfrost 4-Burner Gas Cooker', brand: 'Scanfrost', model: 'SFC6402', cat: 'cat_kitchen', room: 'Kitchen', loc: 'Kitchen Corner', price: 265_000, value: 220_000, cond: 'Good', bought: 380, warrantyMonths: 18, tags: ['cooking', 'essential'], serial: 'SF-GC-22190', retailer: 'Justrite, Lekki', tones: [4, 0] },
  { name: 'Midea Water Dispenser', brand: 'Midea', model: 'YL1633S', cat: 'cat_appliances', room: 'Dining Room', loc: 'Dining Area', price: 125_000, value: 98_000, cond: 'Good', bought: 240, warrantyMonths: 12, expiry: inDays(-15), tags: ['essential'], serial: 'MD-WD-70112', retailer: 'Shoprite', tones: [2] },
];

const MAINT: Record<string, { type: string; cost: number; daysAgo: number; provider: string; notes: string; next?: number }[]> = {
  'Hisense 1.5HP Inverter AC': [
    { type: 'Full servicing', cost: 18_000, daysAgo: 40, provider: 'CoolCare Technicians', notes: 'Gas top-up and coil wash.', next: 80 },
    { type: 'Filter cleaning', cost: 0, daysAgo: 150, provider: 'Self', notes: 'Cleaned both filters.' },
  ],
  'Elepaq 3.5KVA Generator': [
    { type: 'Oil & filter change', cost: 12_500, daysAgo: 25, provider: 'Ojota Gen Works', notes: '20W-50 oil, new air filter.', next: 65 },
    { type: 'Carburettor cleaning', cost: 8_000, daysAgo: 190, provider: 'Ojota Gen Works', notes: 'Fixed hard-start issue.' },
  ],
  'Treadmill T-19 Motorised': [
    { type: 'Belt lubrication', cost: 6_000, daysAgo: 55, provider: 'Fitness World NG', notes: 'Silicone lubricant applied.', next: 35 },
  ],
  '3-Seater Fabric Sofa (Teal)': [
    { type: 'Deep cleaning', cost: 25_000, daysAgo: 70, provider: 'Sparkle Home Care', notes: 'Steam cleaned, stain removed.', next: 110 },
  ],
  'LG 2-Door Refrigerator 375L': [
    { type: 'Compressor check', cost: 15_000, daysAgo: 120, provider: 'LG Service Centre', notes: 'All good, gasket replaced.' },
  ],
};

export function buildSeedItems(): InventoryItem[] {
  return SPECS.map((s, index) => {
    const purchaseDate = daysAgo(s.bought);
    const expiry = s.warrantyMonths > 0 ? (s.expiry ?? addMonths(purchaseDate, s.warrantyMonths)) : undefined;
    const maintenance = (MAINT[s.name] ?? []).map((m) => ({
      id: uid('mnt'),
      date: daysAgo(m.daysAgo),
      type: m.type,
      provider: m.provider,
      cost: m.cost,
      notes: m.notes,
      nextDueDate: m.next ? inDays(m.next) : undefined,
    }));
    return {
      id: `itm_seed_${index + 1}`,
      name: s.name,
      description: `${s.brand} ${s.model} kept in the ${s.room.toLowerCase()}.`,
      categoryId: s.cat,
      room: s.room,
      location: s.loc,
      tags: s.tags,
      brand: s.brand,
      model: s.model,
      serialNumber: s.serial,
      quantity: s.qty ?? 1,
      condition: s.cond,
      purchaseDate,
      purchasePrice: s.price,
      currentValue: s.value,
      retailer: s.retailer,
      warrantyMonths: s.warrantyMonths,
      warrantyProvider: s.warrantyMonths > 0 ? s.retailer : undefined,
      warrantyExpiry: expiry,
      warrantyNotes: s.warrantyMonths > 0 ? `${s.warrantyMonths} months manufacturer warranty. Receipt required for claims.` : undefined,
      photos: s.tones.map((t) => `tone:${t}`),
      maintenance,
      notes: s.notes,
      favorite: Boolean(s.fav),
      archived: false,
      createdAt: iso(s.bought),
      updatedAt: iso(Math.max(0, s.bought - 5)),
    } satisfies InventoryItem;
  });
}

export function createSeedData(): AppData {
  const items = buildSeedItems();
  const recent = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  return {
    version: 1,
    items,
    categories: DEFAULT_CATEGORIES,
    rooms: DEFAULT_ROOMS,
    locations: DEFAULT_LOCATIONS,
    activity: [
      { id: uid('act'), kind: 'created', title: `Added ${recent[0]?.name ?? 'a new item'}`, detail: 'Electronics · Garage', itemId: recent[0]?.id, at: iso(1) },
      { id: uid('act'), kind: 'maintenance', title: 'Logged servicing for Elepaq 3.5KVA Generator', detail: '₦12,500 · Ojota Gen Works', at: iso(2) },
      { id: uid('act'), kind: 'favorite', title: 'Marked Luminous 1.5KVA Inverter as favourite', at: iso(3) },
      { id: uid('act'), kind: 'updated', title: 'Updated warranty for JBL PartyBox 110', detail: 'Expires soon', at: iso(4) },
      { id: uid('act'), kind: 'category', title: 'Created category “Tools & Power”', at: iso(6) },
      { id: uid('act'), kind: 'exported', title: 'Exported inventory backup', detail: 'JSON · 22 items', at: iso(8) },
    ],
    settings: {
      theme: 'system',
      currency: 'NGN',
      language: 'en-NG',
      warrantyReminders: true,
      maintenanceReminders: true,
      reminderLeadDays: 45,
      compactCards: false,
      defaultView: 'grid',
    },
    profile: {
      name: 'David Adeyemi',
      email: 'david@homevault.app',
      household: 'The Adeyemi Residence',
      address: 'Lekki Phase 1, Lagos, Nigeria',
      avatarColor: '#0F766E',
      memberSince: iso(720),
    },
    recentSearches: ['Generator', 'Warranty expiring', 'Kitchen', 'MacBook'],
  };
}
