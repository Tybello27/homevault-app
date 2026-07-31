import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useStore } from '@/store/AppStore';
import { categoryDistribution } from '@/lib/stats';
import { formatMoney, uid } from '@/lib/format';
import type { Category } from '@/lib/types';
import { Button, Card, ConfirmDialog, EmptyState, Field, Input, Sheet } from '@/components/ui';
import { Icon } from '@/components/icons';
import { ScreenHeader } from '@/components/Layout';

const COLORS = ['#1E3A5F', '#0F766E', '#38BDF8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B', '#F97316', '#14B8A6', '#6366F1'];
const ICONS = ['tv', 'sofa', 'washer', 'utensils', 'bed', 'tool', 'dumbbell', 'book', 'laptop', 'car', 'music', 'shirt', 'bath', 'leaf', 'gift', 'cpu', 'camera', 'boxes'];

export function Categories({ navigate }: { navigate: (to: string) => void }) {
  const { data, upsertCategory, deleteCategory, addRoom, toast } = useStore();
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState('');
  const dist = useMemo(() => categoryDistribution(data), [data]);
  const currency = data.settings.currency;

  const counts = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    for (const i of data.items.filter((x) => !x.archived)) {
      const cur = map.get(i.categoryId) ?? { count: 0, value: 0 };
      cur.count += 1;
      cur.value += i.currentValue * i.quantity;
      map.set(i.categoryId, cur);
    }
    return map;
  }, [data.items]);

  const startNew = () => {
    setEditing({ id: uid('cat'), name: '', color: COLORS[Math.floor(Math.random() * COLORS.length)], icon: 'boxes' });
    setOpen(true);
  };

  return (
    <div className="pt-1">
      <ScreenHeader
        title="Categories"
        subtitle={`${data.categories.length} categories · ${data.rooms.length} rooms`}
        right={
          <Button size="sm" icon="plus" onClick={startNew}>
            New
          </Button>
        }
      />

      {data.categories.length ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {data.categories.map((c, i) => {
            const stat = counts.get(c.id) ?? { count: 0, value: 0 };
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="relative overflow-hidden rounded-3xl border border-hairline bg-surface p-4 shadow-card"
              >
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-10" style={{ background: c.color }} />
                <span className="relative grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: c.color }}>
                  <Icon name={c.icon} size={21} />
                </span>
                <p className="relative mt-3 truncate text-[14px] font-bold text-ink">{c.name}</p>
                <p className="relative text-[11.5px] text-ink-mute">{stat.count} items</p>
                <p className="relative mt-1.5 text-[13px] font-extrabold text-teal-brand dark:text-sky-accent">{formatMoney(stat.value, currency, { compact: true })}</p>
                <div className="relative mt-3 flex gap-1.5">
                  <button
                    onClick={() => {
                      setEditing(c);
                      setOpen(true);
                    }}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-surface-3 py-1.5 text-[11.5px] font-bold text-ink-soft"
                  >
                    <Icon name="edit" size={13} />
                    Edit
                  </button>
                  <button onClick={() => setConfirm(c.id)} className="grid h-7 w-8 place-items-center rounded-xl bg-rose-brand/10 text-rose-brand" aria-label="Delete category">
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState title="No categories" message="Create colourful categories to organise everything you own." action={<Button icon="plus" onClick={startNew}>Create category</Button>} />
        </Card>
      )}

      <Card className="mt-5">
        <p className="mb-1 text-[13px] font-bold text-ink">Rooms</p>
        <p className="mb-3 text-[11.5px] text-ink-mute">Rooms help you find items fast and power room-level analytics.</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {data.rooms.map((r) => (
            <span key={r} className="flex items-center gap-1.5 rounded-full bg-surface-3 px-3 py-1.5 text-[12px] font-semibold text-ink-soft">
              <Icon name="mapPin" size={12} />
              {r}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="Add a room, e.g. Study" />
          <Button
            variant="soft"
            icon="plus"
            onClick={() => {
              if (!newRoom.trim()) return;
              addRoom(newRoom.trim());
              toast(`Room “${newRoom.trim()}” added`, 'success');
              setNewRoom('');
            }}
          >
            Add
          </Button>
        </div>
      </Card>

      {dist.length ? (
        <Card className="mt-4">
          <p className="mb-3 text-[13px] font-bold text-ink">Where your value sits</p>
          <div className="space-y-2">
            {dist.map((d) => (
              <button key={d.category.id} onClick={() => navigate('/inventory')} className="flex w-full items-center gap-2.5 text-left">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.category.color }} />
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink-soft">{d.category.name}</span>
                <span className="text-[12px] font-bold text-ink">{formatMoney(d.value, currency, { compact: true })}</span>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      <CategorySheet
        key={editing?.id ?? 'new'}
        open={open}
        category={editing}
        onClose={() => setOpen(false)}
        onSave={(c) => {
          if (!c.name.trim()) return;
          upsertCategory({ ...c, name: c.name.trim() });
          toast('Category saved', 'success');
          setOpen(false);
        }}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete category?"
        message="Items in this category will be moved to your first remaining category. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirm) {
            deleteCategory(confirm);
            toast('Category deleted', 'danger');
          }
        }}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

function CategorySheet({
  open,
  category,
  onClose,
  onSave,
}: {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSave: (c: Category) => void;
}) {
  const [current, setDraft] = useState<Category>(category ?? { id: uid('cat'), name: '', color: COLORS[0], icon: 'boxes' });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={category?.name ? 'Edit category' : 'New category'}
      footer={
        <Button block size="lg" icon="check" onClick={() => onSave(current)}>
          Save category
        </Button>
      }
    >
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3.5">
          <span className="grid h-14 w-14 place-items-center rounded-2xl text-white" style={{ background: current.color }}>
            <Icon name={current.icon} size={26} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-ink">{current.name || 'Category name'}</p>
            <p className="text-[11.5px] text-ink-mute">Preview</p>
          </div>
        </div>

        <Field label="Name">
          <Input value={current.name} onChange={(e) => setDraft({ ...current, name: e.target.value })} placeholder="e.g. Home Office" />
        </Field>

        <div>
          <p className="mb-2 text-[12.5px] font-semibold text-ink-soft">Colour</p>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setDraft({ ...current, color: c })}
                className={`h-9 w-9 rounded-2xl transition ${current.color === c ? 'ring-2 ring-offset-2 ring-offset-surface ring-ink' : ''}`}
                style={{ background: c }}
                aria-label={`Colour ${c}`}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12.5px] font-semibold text-ink-soft">Icon</p>
          <div className="grid grid-cols-6 gap-2">
            {ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setDraft({ ...current, icon: ic })}
                className={`grid h-11 place-items-center rounded-2xl border transition ${
                  current.icon === ic ? 'border-transparent text-white' : 'border-hairline bg-surface-2 text-ink-soft'
                }`}
                style={current.icon === ic ? { background: current.color } : undefined}
                aria-label={ic}
              >
                <Icon name={ic} size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
