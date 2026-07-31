import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/AppStore';
import { allTags, filterItems } from '@/lib/stats';
import { CONDITIONS, formatMoney } from '@/lib/format';
import { emptyFilters, type Condition, type Filters, type WarrantyStatus } from '@/lib/types';
import { Badge, Button, Card, Chip, ConfirmDialog, EmptyState, Field, Input, SegmentedControl, Select, Sheet, Skeleton, Toggle } from '@/components/ui';
import { Icon } from '@/components/icons';
import { ItemGridCard, ItemListCard } from '@/components/ItemCard';
import { ScreenHeader } from '@/components/Layout';

export function Inventory({
  navigate,
  mode = 'all',
}: {
  navigate: (to: string) => void;
  mode?: 'all' | 'favorites' | 'archived';
}) {
  const { data, ready, toggleFavorite, setArchived, deleteItem, toast } = useStore();
  const [filters, setFilters] = useState<Filters>({
    ...emptyFilters,
    favoritesOnly: mode === 'favorites',
    archived: mode === 'archived',
    sort: 'recent',
  });
  const [view, setView] = useState<'grid' | 'list'>(data.settings.defaultView);
  const [showFilters, setShowFilters] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    setFilters((f) => ({ ...f, favoritesOnly: mode === 'favorites', archived: mode === 'archived' }));
  }, [mode]);

  const catMap = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);
  const items = useMemo(() => filterItems(data, filters, data.settings.reminderLeadDays), [data, filters]);
  const totalValue = items.reduce((s, i) => s + i.currentValue * i.quantity, 0);
  const activeFilterCount =
    filters.categoryIds.length +
    filters.rooms.length +
    filters.conditions.length +
    filters.tags.length +
    (filters.warranty !== 'all' ? 1 : 0) +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
    (filters.purchasedFrom || filters.purchasedTo ? 1 : 0);

  const title = mode === 'favorites' ? 'Favourites' : mode === 'archived' ? 'Archive' : 'Inventory';

  return (
    <div className="pt-1">
      <ScreenHeader
        title={title}
        subtitle={`${items.length} items · ${formatMoney(totalValue, data.settings.currency, { compact: true })}`}
        right={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowFilters(true)}
              className="relative grid h-10 w-10 place-items-center rounded-2xl bg-surface-3 text-ink"
              aria-label="Filters"
            >
              <Icon name="sliders" size={18} />
              {activeFilterCount ? (
                <span className="absolute -right-1 -top-1 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-teal-brand px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-surface-3 text-ink"
              aria-label="Toggle view"
            >
              <Icon name={view === 'grid' ? 'list' : 'grid'} size={18} />
            </button>
          </div>
        }
      />

      <div className="relative mb-3">
        <Icon name="search" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
        <input
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          placeholder="Search inventory…"
          className="w-full rounded-2xl border border-hairline bg-surface py-3 pl-11 pr-10 text-[14px] text-ink placeholder:text-ink-mute outline-none focus:border-sky-accent focus:ring-4 focus:ring-sky-accent/12"
        />
        {filters.query ? (
          <button onClick={() => setFilters({ ...filters, query: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute" aria-label="Clear">
            <Icon name="x" size={16} />
          </button>
        ) : null}
      </div>

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={!filters.categoryIds.length} onClick={() => setFilters({ ...filters, categoryIds: [] })}>
          All
        </Chip>
        {data.categories.map((c) => (
          <Chip
            key={c.id}
            color={c.color}
            active={filters.categoryIds.includes(c.id)}
            onClick={() =>
              setFilters({
                ...filters,
                categoryIds: filters.categoryIds.includes(c.id) ? filters.categoryIds.filter((x) => x !== c.id) : [...filters.categoryIds, c.id],
              })
            }
          >
            {c.name}
          </Chip>
        ))}
      </div>

      {activeFilterCount ? (
        <div className="mb-3 flex items-center justify-between rounded-2xl bg-surface-2 px-3.5 py-2">
          <span className="text-[12px] font-semibold text-ink-soft">{activeFilterCount} filters applied</span>
          <button onClick={() => setFilters({ ...emptyFilters, query: filters.query, favoritesOnly: mode === 'favorites', archived: mode === 'archived' })} className="text-[12px] font-bold text-rose-brand">
            Clear all
          </button>
        </div>
      ) : null}

      {!ready ? (
        <div className={view === 'grid' ? 'grid grid-cols-2 gap-3 lg:grid-cols-4' : 'space-y-2.5'}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className={view === 'grid' ? 'h-[196px] rounded-3xl' : 'h-[88px] rounded-3xl'} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            variant={filters.query || activeFilterCount ? 'search' : mode === 'favorites' ? 'heart' : 'box'}
            title={filters.query || activeFilterCount ? 'No matching items' : mode === 'favorites' ? 'No favourites yet' : mode === 'archived' ? 'Archive is empty' : 'Your inventory is empty'}
            message={
              filters.query || activeFilterCount
                ? 'Try a different search term or relax your filters to see more of your home inventory.'
                : mode === 'favorites'
                  ? 'Tap the heart on any item — or swipe an item right — to pin it here for quick access.'
                  : mode === 'archived'
                    ? 'Items you archive stay safe here without cluttering your active inventory.'
                    : 'Add your belongings to track value, warranty cover and maintenance in one elegant place.'
            }
            action={
              filters.query || activeFilterCount ? (
                <Button variant="soft" icon="refresh" onClick={() => setFilters({ ...emptyFilters, favoritesOnly: mode === 'favorites', archived: mode === 'archived' })}>
                  Reset filters
                </Button>
              ) : (
                <Button icon="plus" onClick={() => navigate('/add')}>
                  Add item
                </Button>
              )
            }
          />
        </Card>
      ) : view === 'grid' ? (
        <motion.div layout className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <ItemGridCard
                key={item.id}
                item={item}
                category={catMap.get(item.categoryId)}
                currency={data.settings.currency}
                delay={Math.min(i * 0.03, 0.3)}
                onOpen={() => navigate(`/item/${item.id}`)}
                onFavorite={() => toggleFavorite(item.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div layout className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <ItemListCard
                key={item.id}
                item={item}
                category={catMap.get(item.categoryId)}
                currency={data.settings.currency}
                delay={Math.min(i * 0.03, 0.3)}
                onOpen={() => navigate(`/item/${item.id}`)}
                onFavorite={() => toggleFavorite(item.id)}
                onArchive={() => {
                  setArchived(item.id, !item.archived);
                  toast(item.archived ? 'Item restored' : 'Item archived', 'success');
                }}
                onDelete={() => setPendingDelete(item.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {items.length ? (
        <p className="mt-5 text-center text-[11.5px] text-ink-mute">
          Swipe an item right to favourite · left to archive
        </p>
      ) : null}

      <FilterSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onChange={setFilters}
        rooms={data.rooms}
        tags={allTags(data)}
        categories={data.categories}
        mode={mode}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this item?"
        message="This permanently removes the item and its maintenance history from your vault. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (pendingDelete) {
            deleteItem(pendingDelete);
            toast('Item deleted', 'danger');
          }
        }}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

function FilterSheet({
  open,
  onClose,
  filters,
  onChange,
  rooms,
  tags,
  categories,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (f: Filters) => void;
  rooms: string[];
  tags: string[];
  categories: { id: string; name: string; color: string }[];
  mode: 'all' | 'favorites' | 'archived';
}) {
  const toggle = <T,>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Advanced Filters"
      footer={
        <div className="flex gap-2.5">
          <Button variant="soft" block onClick={() => onChange({ ...emptyFilters, query: filters.query, favoritesOnly: mode === 'favorites', archived: mode === 'archived' })}>
            Reset
          </Button>
          <Button block onClick={onClose}>
            Show results
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pt-1">
        <div>
          <p className="mb-2 text-[12.5px] font-bold text-ink">Sort by</p>
          <Select value={filters.sort} onChange={(e) => onChange({ ...filters, sort: e.target.value as Filters['sort'] })}>
            <option value="recent">Recently added</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name (A–Z)</option>
            <option value="value-desc">Value: high to low</option>
            <option value="value-asc">Value: low to high</option>
          </Select>
        </div>

        <div>
          <p className="mb-2 text-[12.5px] font-bold text-ink">Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Chip key={c.id} color={c.color} active={filters.categoryIds.includes(c.id)} onClick={() => onChange({ ...filters, categoryIds: toggle(filters.categoryIds, c.id) })}>
                {c.name}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12.5px] font-bold text-ink">Room</p>
          <div className="flex flex-wrap gap-2">
            {rooms.map((r) => (
              <Chip key={r} active={filters.rooms.includes(r)} onClick={() => onChange({ ...filters, rooms: toggle(filters.rooms, r) })}>
                {r}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12.5px] font-bold text-ink">Warranty status</p>
          <SegmentedControl
            value={filters.warranty}
            onChange={(v) => onChange({ ...filters, warranty: v as WarrantyStatus | 'all' })}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'expiring', label: 'Expiring' },
              { value: 'expired', label: 'Expired' },
            ]}
          />
        </div>

        <div>
          <p className="mb-2 text-[12.5px] font-bold text-ink">Condition</p>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <Chip key={c} active={filters.conditions.includes(c)} onClick={() => onChange({ ...filters, conditions: toggle(filters.conditions, c as Condition) })}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Min value (₦)">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={filters.minPrice ?? ''}
              onChange={(e) => onChange({ ...filters, minPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </Field>
          <Field label="Max value (₦)">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Any"
              value={filters.maxPrice ?? ''}
              onChange={(e) => onChange({ ...filters, maxPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Purchased from">
            <Input type="date" value={filters.purchasedFrom ?? ''} onChange={(e) => onChange({ ...filters, purchasedFrom: e.target.value || undefined })} />
          </Field>
          <Field label="Purchased to">
            <Input type="date" value={filters.purchasedTo ?? ''} onChange={(e) => onChange({ ...filters, purchasedTo: e.target.value || undefined })} />
          </Field>
        </div>

        {tags.length ? (
          <div>
            <p className="mb-2 text-[12.5px] font-bold text-ink">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <Chip key={t} active={filters.tags.includes(t)} onClick={() => onChange({ ...filters, tags: toggle(filters.tags, t) })}>
                  #{t}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-3.5 py-3">
          <div>
            <p className="text-[13px] font-bold text-ink">Favourites only</p>
            <p className="text-[11.5px] text-ink-mute">Show pinned items</p>
          </div>
          <Toggle checked={filters.favoritesOnly} onChange={(v) => onChange({ ...filters, favoritesOnly: v })} label="Favourites only" />
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-3.5 py-3">
          <div>
            <p className="text-[13px] font-bold text-ink">Show archived</p>
            <p className="text-[11.5px] text-ink-mute">Browse the archive instead</p>
          </div>
          <Toggle checked={filters.archived} onChange={(v) => onChange({ ...filters, archived: v })} label="Show archived" />
        </div>

        <div className="flex items-center gap-2 pb-2">
          <Badge tone="mute">Tip</Badge>
          <p className="text-[11.5px] text-ink-mute">Filters combine — use price + warranty to find items worth insuring.</p>
        </div>
      </div>
    </Sheet>
  );
}
