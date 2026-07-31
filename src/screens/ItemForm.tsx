import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { useStore } from '@/store/AppStore';
import { addMonths, CONDITIONS, formatMoney, todayISO } from '@/lib/format';
import type { Condition, InventoryItem } from '@/lib/types';
import { Button, Card, Chip, Field, Input, Select, Textarea, Toggle } from '@/components/ui';
import { Icon } from '@/components/icons';
import { ScreenHeader } from '@/components/Layout';
import { isRealPhoto, photoBackground, PHOTO_TONES } from '@/lib/seed';

type Draft = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>;

function blank(categoryId: string): Draft {
  return {
    name: '',
    description: '',
    categoryId,
    room: '',
    location: '',
    tags: [],
    brand: '',
    model: '',
    serialNumber: '',
    quantity: 1,
    condition: 'New',
    purchaseDate: todayISO(),
    purchasePrice: 0,
    currentValue: 0,
    retailer: '',
    warrantyMonths: 12,
    warrantyProvider: '',
    warrantyExpiry: addMonths(todayISO(), 12),
    warrantyNotes: '',
    photos: [`tone:${Math.floor(Math.random() * PHOTO_TONES.length)}`],
    maintenance: [],
    notes: '',
    favorite: false,
    archived: false,
  };
}

export function ItemForm({ navigate, itemId }: { navigate: (to: string) => void; itemId?: string }) {
  const { data, addItem, updateItem, toast, addRoom, addLocation } = useStore();
  const existing = itemId ? data.items.find((i) => i.id === itemId) : undefined;
  const [draft, setDraft] = useState<Draft>(() => (existing ? { ...existing } : blank(data.categories[0]?.id ?? 'cat_electronics')));
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasWarranty, setHasWarranty] = useState(Boolean(existing ? existing.warrantyMonths : true));
  const fileRef = useRef<HTMLInputElement>(null);
  const currency = data.settings.currency;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const category = useMemo(() => data.categories.find((c) => c.id === draft.categoryId), [data.categories, draft.categoryId]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 6);
    const encoded = await Promise.all(
      list.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(file);
          }),
      ),
    );
    setDraft((d) => ({ ...d, photos: [...encoded, ...d.photos].slice(0, 8) }));
    toast(`${encoded.length} photo${encoded.length > 1 ? 's' : ''} attached`, 'success');
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = 'Give this item a name';
    if (!draft.room.trim()) next.room = 'Select or type a room';
    if (draft.purchasePrice < 0) next.purchasePrice = 'Price cannot be negative';
    setErrors(next);
    if (Object.keys(next).length) {
      toast('Please complete the highlighted fields', 'warning');
      return;
    }
    const payload: Draft = {
      ...draft,
      name: draft.name.trim(),
      currentValue: draft.currentValue || draft.purchasePrice,
      warrantyMonths: hasWarranty ? draft.warrantyMonths : 0,
      warrantyExpiry: hasWarranty ? draft.warrantyExpiry : undefined,
      location: draft.location.trim() || 'Unspecified',
    };
    addRoom(payload.room);
    if (payload.location) addLocation(payload.location);
    if (existing && itemId) {
      updateItem(itemId, payload);
      toast('Item updated', 'success');
      navigate(`/item/${itemId}`);
    } else {
      const created = addItem(payload);
      toast('Item added to your vault', 'success');
      navigate(`/item/${created.id}`);
    }
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (!t) return;
    if (!draft.tags.includes(t)) set('tags', [...draft.tags, t]);
    setTagInput('');
  };

  return (
    <div className="pt-1 pb-6">
      <ScreenHeader
        title={existing ? 'Edit Item' : 'Add Item'}
        subtitle={existing ? existing.name : 'Capture every detail once'}
        onBack={() => navigate(existing ? `/item/${itemId}` : '/inventory')}
        right={
          <Button size="sm" icon="check" onClick={submit}>
            Save
          </Button>
        }
      />

      <div className="space-y-4">
        {/* Photos */}
        <Card>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[13px] font-bold text-ink">Photos</p>
            <span className="text-[11.5px] text-ink-mute">{draft.photos.length}/8</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => fileRef.current?.click()}
              className="grid h-20 w-20 shrink-0 place-items-center gap-1 rounded-2xl border-2 border-dashed border-hairline text-ink-mute transition hover:border-sky-accent hover:text-sky-accent"
            >
              <Icon name="camera" size={20} />
              <span className="text-[10px] font-bold">Upload</span>
            </button>
            <AnimatePresence>
              {draft.photos.map((p, i) => (
                <motion.div
                  key={`${p.slice(0, 24)}-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl"
                >
                  {isRealPhoto(p) ? (
                    <img src={p} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center" style={{ background: photoBackground(p, i) }}>
                      <Icon name={category?.icon ?? 'boxes'} size={22} className="text-white/90" />
                    </div>
                  )}
                  <button
                    onClick={() => set('photos', draft.photos.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/45 text-white backdrop-blur"
                    aria-label="Remove photo"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void onFiles(e.target.files)} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PHOTO_TONES.map((tone, i) => (
              <button
                key={tone}
                onClick={() => set('photos', [...draft.photos, `tone:${i}`].slice(0, 8))}
                className="h-6 w-6 rounded-lg ring-1 ring-black/5"
                style={{ background: tone }}
                aria-label={`Add colour tile ${i + 1}`}
              />
            ))}
            <span className="ml-1 self-center text-[11px] text-ink-mute">Add a colour tile</span>
          </div>
        </Card>

        {/* Basics */}
        <Card className="space-y-3.5">
          <p className="text-[13px] font-bold text-ink">Item details</p>
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. LG OLED 55&quot; Smart TV" className={errors.name ? 'border-rose-brand' : ''} />
          </Field>
          {errors.name ? <p className="-mt-2 text-[11.5px] font-semibold text-rose-brand">{errors.name}</p> : null}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand">
              <Input value={draft.brand ?? ''} onChange={(e) => set('brand', e.target.value)} placeholder="LG" />
            </Field>
            <Field label="Model">
              <Input value={draft.model ?? ''} onChange={(e) => set('model', e.target.value)} placeholder="OLED55C3" />
            </Field>
          </div>

          <Field label="Category">
            <Select value={draft.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Room">
              <Input list="hv-rooms" value={draft.room} onChange={(e) => set('room', e.target.value)} placeholder="Living Room" className={errors.room ? 'border-rose-brand' : ''} />
              <datalist id="hv-rooms">
                {data.rooms.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </Field>
            <Field label="Storage location">
              <Input list="hv-locations" value={draft.location} onChange={(e) => set('location', e.target.value)} placeholder="TV Console" />
              <datalist id="hv-locations">
                {data.locations.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <Input type="number" min={1} value={draft.quantity} onChange={(e) => set('quantity', Math.max(1, Number(e.target.value) || 1))} />
            </Field>
            <Field label="Condition">
              <Select value={draft.condition} onChange={(e) => set('condition', e.target.value as Condition)}>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Serial number">
            <div className="flex gap-2">
              <Input value={draft.serialNumber ?? ''} onChange={(e) => set('serialNumber', e.target.value)} placeholder="Scan or type" />
              <Button variant="soft" icon="scan" onClick={() => navigate('/scan')}>
                Scan
              </Button>
            </div>
          </Field>
        </Card>

        {/* Purchase */}
        <Card className="space-y-3.5">
          <p className="text-[13px] font-bold text-ink">Purchase information</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Purchase price (${currency === 'NGN' ? '₦' : currency})`}>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.purchasePrice || ''}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0;
                  setDraft((d) => ({ ...d, purchasePrice: v, currentValue: d.currentValue || v }));
                }}
                placeholder="0"
              />
            </Field>
            <Field label="Estimated value">
              <Input type="number" inputMode="numeric" min={0} value={draft.currentValue || ''} onChange={(e) => set('currentValue', Number(e.target.value) || 0)} placeholder="0" />
            </Field>
          </div>
          <p className="-mt-1 text-[11.5px] text-ink-mute">
            Total worth: <span className="font-bold text-teal-brand dark:text-sky-accent">{formatMoney((draft.currentValue || draft.purchasePrice) * draft.quantity, currency)}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase date">
              <Input
                type="date"
                value={draft.purchaseDate ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraft((d) => ({ ...d, purchaseDate: v, warrantyExpiry: hasWarranty && v ? addMonths(v, d.warrantyMonths) : d.warrantyExpiry }));
                }}
              />
            </Field>
            <Field label="Retailer / store">
              <Input value={draft.retailer ?? ''} onChange={(e) => set('retailer', e.target.value)} placeholder="Slot Systems, Ikeja" />
            </Field>
          </div>
        </Card>

        {/* Warranty */}
        <Card className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-ink">Warranty</p>
              <p className="text-[11.5px] text-ink-mute">Track cover and get reminders</p>
            </div>
            <Toggle checked={hasWarranty} onChange={setHasWarranty} label="Warranty" />
          </div>
          <AnimatePresence initial={false}>
            {hasWarranty ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3.5 overflow-hidden">
                <div className="flex flex-wrap gap-2">
                  {[6, 12, 24, 36, 60].map((m) => (
                    <Chip
                      key={m}
                      active={draft.warrantyMonths === m}
                      onClick={() =>
                        setDraft((d) => ({ ...d, warrantyMonths: m, warrantyExpiry: d.purchaseDate ? addMonths(d.purchaseDate, m) : d.warrantyExpiry }))
                      }
                    >
                      {m} months
                    </Chip>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Provider">
                    <Input value={draft.warrantyProvider ?? ''} onChange={(e) => set('warrantyProvider', e.target.value)} placeholder="Manufacturer" />
                  </Field>
                  <Field label="Expires on">
                    <Input type="date" value={draft.warrantyExpiry ?? ''} onChange={(e) => set('warrantyExpiry', e.target.value)} />
                  </Field>
                </div>
                <Field label="Warranty notes">
                  <Textarea value={draft.warrantyNotes ?? ''} onChange={(e) => set('warrantyNotes', e.target.value)} placeholder="Receipt location, claim process…" className="min-h-[72px]" />
                </Field>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Card>

        {/* Tags & notes */}
        <Card className="space-y-3.5">
          <p className="text-[13px] font-bold text-ink">Tags & notes</p>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag and press Enter"
            />
            <Button variant="soft" icon="plus" onClick={addTag}>
              Add
            </Button>
          </div>
          {draft.tags.length ? (
            <div className="flex flex-wrap gap-2">
              {draft.tags.map((t) => (
                <button
                  key={t}
                  onClick={() => set('tags', draft.tags.filter((x) => x !== t))}
                  className="flex items-center gap-1 rounded-full bg-teal-brand/12 px-3 py-1.5 text-[12px] font-semibold text-teal-brand dark:text-teal-soft"
                >
                  #{t}
                  <Icon name="x" size={12} />
                </button>
              ))}
            </div>
          ) : null}
          <Field label="Notes">
            <Textarea value={draft.notes ?? ''} onChange={(e) => set('notes', e.target.value)} placeholder="Anything worth remembering about this item…" />
          </Field>
          <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <Icon name="heart" size={16} className={draft.favorite ? 'fill-rose-brand text-rose-brand' : 'text-ink-mute'} />
              <span className="text-[13px] font-bold text-ink">Mark as favourite</span>
            </div>
            <Toggle checked={draft.favorite} onChange={(v) => set('favorite', v)} label="Favourite" />
          </div>
        </Card>

        <div className="flex gap-2.5">
          <Button variant="soft" block onClick={() => navigate(existing ? `/item/${itemId}` : '/inventory')}>
            Cancel
          </Button>
          <Button block size="lg" icon="check" onClick={submit}>
            {existing ? 'Save changes' : 'Add to vault'}
          </Button>
        </div>
      </div>
    </div>
  );
}
