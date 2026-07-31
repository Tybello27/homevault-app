import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useStore } from '@/store/AppStore';
import { maintenanceHistory, upcomingMaintenance, warrantyBuckets } from '@/lib/stats';
import { formatDate, formatMoney } from '@/lib/format';
import { Badge, Button, Card, EmptyState, ProgressBar, SegmentedControl, Skeleton } from '@/components/ui';
import { Icon } from '@/components/icons';
import { ScreenHeader } from '@/components/Layout';
import { ItemThumb } from '@/components/ItemCard';
import { useNotificationPermission, useReminders } from '@/hooks/useReminders';

type Bucket = 'expiring' | 'active' | 'expired';

export function Warranties({ navigate }: { navigate: (to: string) => void }) {
  const { data, ready, toast } = useStore();
  const [tab, setTab] = useState<Bucket>('expiring');
  const buckets = useMemo(() => warrantyBuckets(data, data.settings.reminderLeadDays), [data]);
  const catMap = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);
  const reminders = useReminders(data.items, data.settings);
  const { supported, permission, request } = useNotificationPermission();

  const rows = buckets[tab];
  const tone = { expiring: '#F59E0B', active: '#10B981', expired: '#EF4444' }[tab];

  if (!ready) {
    return (
      <div className="space-y-3 pt-4">
        <Skeleton className="h-12 rounded-2xl" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[96px] rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-1">
      <ScreenHeader title="Warranty Tracker" subtitle={`${reminders.length} reminder${reminders.length === 1 ? '' : 's'} within ${data.settings.reminderLeadDays} days`} />

      <div className="mb-4 grid grid-cols-3 gap-2.5">
        {(
          [
            { key: 'active', label: 'Active', count: buckets.active.length, color: '#10B981', icon: 'checkCircle' },
            { key: 'expiring', label: 'Expiring', count: buckets.expiring.length, color: '#F59E0B', icon: 'clock' },
            { key: 'expired', label: 'Expired', count: buckets.expired.length, color: '#EF4444', icon: 'xCircle' },
          ] as { key: Bucket; label: string; count: number; color: string; icon: string }[]
        ).map((b, i) => (
          <motion.button
            key={b.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setTab(b.key)}
            className={`relative overflow-hidden rounded-3xl border p-3.5 text-left transition ${
              tab === b.key ? 'border-transparent text-white shadow-float' : 'border-hairline bg-surface text-ink shadow-card'
            }`}
            style={tab === b.key ? { background: `linear-gradient(140deg, ${b.color}, ${b.color}CC)` } : undefined}
          >
            <Icon name={b.icon} size={17} className={tab === b.key ? 'text-white/90' : ''} style={tab === b.key ? undefined : { color: b.color }} />
            <p className="mt-2 font-display text-[21px] font-extrabold leading-none">{b.count}</p>
            <p className={`text-[11.5px] font-semibold ${tab === b.key ? 'text-white/85' : 'text-ink-mute'}`}>{b.label}</p>
          </motion.button>
        ))}
      </div>

      {supported && permission !== 'granted' ? (
        <Card className="mb-4 flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-accent/14 text-sky-accent">
            <Icon name="bell" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-ink">Enable warranty reminders</p>
            <p className="text-[11.5px] text-ink-mute">Local notifications on this device — nothing leaves your phone.</p>
          </div>
          <Button
            size="sm"
            onClick={async () => {
              const p = await request();
              toast(p === 'granted' ? 'Reminders enabled' : 'Notifications blocked in browser settings', p === 'granted' ? 'success' : 'warning');
            }}
          >
            Allow
          </Button>
        </Card>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2.5">
          {rows.length ? (
            rows.map(({ item, days }, i) => {
              const total = Math.max(1, item.warrantyMonths * 30);
              const pct = Math.max(0, Math.min(100, (days / total) * 100));
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  onClick={() => navigate(`/item/${item.id}`)}
                  className="w-full rounded-3xl border border-hairline bg-surface p-3.5 text-left shadow-card"
                >
                  <div className="flex items-center gap-3">
                    <ItemThumb item={item} category={catMap.get(item.categoryId)} className="h-14 w-14 shrink-0" iconSize={22} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold text-ink">{item.name}</p>
                      <p className="truncate text-[11.5px] text-ink-mute">
                        {item.warrantyProvider || 'Manufacturer'} · {formatDate(item.warrantyExpiry, 'long')}
                      </p>
                    </div>
                    <Badge tone={tab === 'active' ? 'emerald' : tab === 'expiring' ? 'amber' : 'rose'}>
                      {days >= 0 ? `${days}d left` : `${Math.abs(days)}d ago`}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={days >= 0 ? pct : 100} tone={tone} />
                  </div>
                </motion.button>
              );
            })
          ) : (
            <Card>
              <EmptyState
                variant="shield"
                title={tab === 'expiring' ? 'Nothing expiring soon' : tab === 'active' ? 'No active warranties' : 'No expired warranties'}
                message={
                  tab === 'expiring'
                    ? 'All of your cover is comfortably in date. HomeVault will alert you 45 days before anything expires.'
                    : tab === 'active'
                      ? 'Add warranty details to your items and they will appear here with a live countdown.'
                      : 'Great news — nothing in your vault has fallen out of warranty.'
                }
                action={<Button icon="plus" onClick={() => navigate('/add')}>Add item</Button>}
              />
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function Maintenance({ navigate }: { navigate: (to: string) => void }) {
  const { data, ready } = useStore();
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');
  const upcoming = useMemo(() => upcomingMaintenance(data), [data]);
  const history = useMemo(() => maintenanceHistory(data), [data]);
  const catMap = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);
  const currency = data.settings.currency;
  const totalSpend = history.reduce((s, h) => s + (h.entry.cost || 0), 0);

  if (!ready) {
    return (
      <div className="space-y-3 pt-4">
        <Skeleton className="h-12 rounded-2xl" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[88px] rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-1">
      <ScreenHeader title="Maintenance" subtitle={`${history.length} records · ${formatMoney(totalSpend, currency)} spent`} />

      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'upcoming', label: 'Upcoming', icon: 'clock' },
          { value: 'history', label: 'History', icon: 'wrench' },
        ]}
        className="mb-4"
      />

      {tab === 'upcoming' ? (
        upcoming.length ? (
          <div className="space-y-2.5">
            {upcoming.map(({ item, entry, days }, i) => (
              <motion.button
                key={entry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/item/${item.id}`)}
                className="flex w-full items-center gap-3 rounded-3xl border border-hairline bg-surface p-3.5 text-left shadow-card"
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${days < 0 ? 'bg-rose-brand/12 text-rose-brand' : 'bg-teal-brand/12 text-teal-brand dark:text-teal-soft'}`}>
                  <Icon name="wrench" size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-ink">{entry.type}</p>
                  <p className="truncate text-[11.5px] text-ink-mute">
                    {item.name} · {formatDate(entry.nextDueDate)}
                  </p>
                </div>
                <Badge tone={days < 0 ? 'rose' : days < 14 ? 'amber' : 'sky'}>{days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}</Badge>
              </motion.button>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState variant="shield" title="No scheduled maintenance" message="Open any item and log a service with a next-due date to build your maintenance calendar." action={<Button onClick={() => navigate('/inventory')}>Browse inventory</Button>} />
          </Card>
        )
      ) : history.length ? (
        <div className="relative space-y-3 pl-5">
          <span className="absolute left-1.5 top-2 bottom-2 w-px bg-hairline" />
          {history.map(({ item, entry }, i) => (
            <motion.button
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              onClick={() => navigate(`/item/${item.id}`)}
              className="relative flex w-full items-start gap-3 rounded-2xl border border-hairline bg-surface p-3 text-left shadow-card"
            >
              <span className="absolute -left-[15px] top-5 h-2.5 w-2.5 rounded-full ring-4 ring-canvas" style={{ background: catMap.get(item.categoryId)?.color ?? '#0F766E' }} />
              <ItemThumb item={item} category={catMap.get(item.categoryId)} className="h-11 w-11 shrink-0" iconSize={18} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-ink">{entry.type}</p>
                <p className="truncate text-[11.5px] text-ink-mute">
                  {item.name} · {formatDate(entry.date)}
                </p>
                {entry.notes ? <p className="mt-1 line-clamp-2 text-[11.5px] text-ink-soft">{entry.notes}</p> : null}
              </div>
              <span className="shrink-0 text-[12.5px] font-extrabold text-ink">{formatMoney(entry.cost, currency)}</span>
            </motion.button>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState variant="box" title="No maintenance history" message="Every repair, service and clean you log will appear here as a beautiful timeline." />
        </Card>
      )}
    </div>
  );
}
