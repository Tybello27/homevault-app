import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useStore } from '@/store/AppStore';
import { computeStats, categoryDistribution, cumulativeValueSeries, monthlySeries } from '@/lib/stats';
import { formatMoney, greeting, relativeTime, warrantyStatus } from '@/lib/format';
import { Badge, Card, EmptyState, Skeleton, SectionHeader, Button } from '@/components/ui';
import { Icon, Logo } from '@/components/icons';
import { AreaChart, DonutChart } from '@/components/charts';
import { ItemThumb } from '@/components/ItemCard';
import { useReminders } from '@/hooks/useReminders';
import { InstallHeroButton } from '@/components/InstallPwa';

const ACTIVITY_ICON: Record<string, string> = {
  created: 'plus',
  updated: 'edit',
  deleted: 'trash',
  archived: 'archive',
  restored: 'refresh',
  duplicated: 'copy',
  favorite: 'heart',
  maintenance: 'wrench',
  imported: 'upload',
  exported: 'download',
  category: 'layers',
};

export function Dashboard({ navigate }: { navigate: (to: string) => void }) {
  const { data, ready } = useStore();
  const currency = data.settings.currency;
  const stats = useMemo(() => computeStats(data, data.settings.reminderLeadDays), [data]);
  const dist = useMemo(() => categoryDistribution(data), [data]);
  const series = useMemo(() => cumulativeValueSeries(data, 6), [data]);
  const spend = useMemo(() => monthlySeries(data, 6), [data]);
  const reminders = useReminders(data.items, data.settings);
  const catMap = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);

  const recent = useMemo(
    () => data.items.filter((i) => !i.archived).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [data.items],
  );

  if (!ready) return <DashboardSkeleton />;

  return (
    <div className="pt-3">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="hv-gradient-hero relative overflow-hidden rounded-[28px] p-5 text-white shadow-float"
      >
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/8" />
        <div className="absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-sky-accent/12" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-white/70">{greeting()} David 🏠</p>
            <h1 className="mt-0.5 font-display text-[22px] font-extrabold leading-tight">Welcome Back</h1>
            <p className="mt-1 text-[12px] text-white/65">{data.profile.household}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => navigate('/warranties')}
              className="relative grid h-10 w-10 place-items-center rounded-2xl bg-white/12 backdrop-blur-md transition hover:bg-white/20"
              aria-label="Reminders"
            >
              <Icon name="bell" size={18} />
              {reminders.length ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-brand px-1 text-[10px] font-bold text-navy-950">
                  {reminders.length}
                </span>
              ) : null}
            </button>
            <button onClick={() => navigate('/profile')} aria-label="Profile">
              <Logo size={40} rounded={14} />
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate('/search')}
          className="relative mt-4 flex w-full items-center gap-2.5 rounded-2xl bg-white/12 px-3.5 py-3 text-left backdrop-blur-md transition hover:bg-white/18"
        >
          <Icon name="search" size={17} className="text-white/80" />
          <span className="text-[13.5px] text-white/70">Search items, brands, rooms…</span>
        </button>

        <InstallHeroButton />

        <div className="relative mt-4 grid grid-cols-2 gap-2.5">
          <HeroStat label="Total Inventory" value={String(stats.totalItems)} sub={`${stats.totalUnits} units`} icon="boxes" />
          <HeroStat label="Inventory Value" value={formatMoney(stats.totalValue, currency, { compact: true })} sub={`${stats.categories} categories`} icon="wallet" />
        </div>
      </motion.section>

      {/* Stat grid */}
      <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Categories" value={String(stats.categories)} icon="layers" tone="#38BDF8" caption={`${stats.rooms} rooms`} delay={0.02} onClick={() => navigate('/categories')} />
        <StatTile label="Active Warranties" value={String(stats.activeWarranties)} icon="shield" tone="#10B981" caption="Under cover" delay={0.06} onClick={() => navigate('/warranties')} />
        <StatTile label="Expiring Soon" value={String(stats.expiringWarranties)} icon="clock" tone="#F59E0B" caption={`Next ${data.settings.reminderLeadDays} days`} delay={0.1} onClick={() => navigate('/warranties')} />
        <StatTile label="Favourites" value={String(stats.favorites)} icon="heart" tone="#EC4899" caption="Quick access" delay={0.14} onClick={() => navigate('/favorites')} />
      </section>

      {/* Alerts */}
      {reminders.length ? (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/warranties')}
          className="mt-4 flex w-full items-center gap-3 rounded-3xl border border-amber-brand/30 bg-amber-brand/10 p-3.5 text-left"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-brand/20 text-amber-600 dark:text-amber-brand">
            <Icon name="alert" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-bold text-ink">{reminders.length} reminder{reminders.length > 1 ? 's' : ''} need attention</p>
            <p className="truncate text-[12px] text-ink-soft">{reminders[0].title}</p>
          </div>
          <Icon name="chevronRight" size={17} className="shrink-0 text-ink-mute" />
        </motion.button>
      ) : null}

      {/* Quick actions */}
      <section className="mt-5">
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { icon: 'plus', label: 'Add', to: '/add', color: '#1E3A5F' },
            { icon: 'scan', label: 'Scan', to: '/scan', color: '#0F766E' },
            { icon: 'shield', label: 'Warranty', to: '/warranties', color: '#38BDF8' },
            { icon: 'download', label: 'Export', to: '/settings', color: '#F59E0B' },
          ].map((a, i) => (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              whileTap={{ scale: 0.94 }}
              onClick={() => navigate(a.to)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface py-3.5 shadow-card"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: a.color }}>
                <Icon name={a.icon} size={19} strokeWidth={2.1} />
              </span>
              <span className="text-[11.5px] font-bold text-ink">{a.label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* Value trend */}
        <Card>
          <div className="mb-1 flex items-start justify-between">
            <div>
              <p className="text-[12.5px] font-semibold text-ink-mute">Inventory Value</p>
              <p className="font-display text-[22px] font-extrabold text-ink">{formatMoney(stats.totalValue, currency)}</p>
            </div>
            <Badge tone={stats.valueDelta >= 0 ? 'emerald' : 'rose'}>
              <Icon name={stats.valueDelta >= 0 ? 'trendingUp' : 'trendingDown'} size={12} strokeWidth={2.4} />
              {Math.abs(stats.valueDelta).toFixed(1)}%
            </Badge>
          </div>
          <AreaChart points={series.map((s) => s.value)} labels={series.map((s) => s.label)} color="#38BDF8" />
        </Card>

        {/* Category distribution */}
        <Card>
          <SectionHeader title="Category Distribution" action="Manage" onAction={() => navigate('/categories')} />
          {dist.length ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <DonutChart
                data={dist.slice(0, 6).map((d) => ({ label: d.category.name, value: d.value, color: d.category.color }))}
                centerValue={formatMoney(stats.totalValue, currency, { compact: true })}
                centerLabel="Total value"
                size={168}
                thickness={22}
              />
              <div className="w-full flex-1 space-y-2">
                {dist.slice(0, 5).map((d) => (
                  <div key={d.category.id} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.category.color }} />
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink-soft">{d.category.name}</span>
                    <span className="shrink-0 text-[12px] font-bold text-ink">{formatMoney(d.value, currency, { compact: true })}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="No categories yet" message="Add your first item to see the value split across categories." variant="chart" />
          )}
        </Card>
      </div>

      {/* Monthly spending */}
      <Card className="mt-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-[12.5px] font-semibold text-ink-mute">Monthly Spending</p>
            <p className="font-display text-[19px] font-extrabold text-ink">{formatMoney(stats.spendThisMonth, currency)}</p>
          </div>
          <Badge tone="sky">Last 6 months</Badge>
        </div>
        <div className="flex items-end gap-1.5" style={{ height: 120 }}>
          {spend.map((m, i) => {
            const max = Math.max(1, ...spend.map((s) => s.spend));
            return (
              <div key={m.key} className="flex h-full flex-1 flex-col justify-end gap-1.5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (m.spend / max) * 100)}%` }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 120, damping: 18 }}
                  className="w-full rounded-t-lg"
                  style={{ background: i === spend.length - 1 ? 'linear-gradient(180deg,#0F766E,#14B8A6)' : 'linear-gradient(180deg,#38BDF8,#1E3A5F)' }}
                />
                <span className="text-center text-[10px] font-semibold text-ink-mute">{m.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recently added */}
      <section className="mt-6">
        <SectionHeader title="Recently Added" action="See all" onAction={() => navigate('/inventory')} />
        {recent.length ? (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {recent.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/item/${item.id}`)}
                className="w-[150px] shrink-0 overflow-hidden rounded-3xl border border-hairline bg-surface text-left shadow-card"
              >
                <ItemThumb item={item} category={catMap.get(item.categoryId)} className="h-24 w-full" radius="rounded-none" iconSize={28} />
                <div className="p-2.5">
                  <p className="truncate text-[12.5px] font-bold text-ink">{item.name}</p>
                  <p className="mt-0.5 truncate text-[10.5px] text-ink-mute">{relativeTime(item.createdAt)}</p>
                  <p className="mt-1.5 text-[12.5px] font-extrabold text-teal-brand dark:text-sky-accent">
                    {formatMoney(item.currentValue, currency, { compact: true })}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              title="Your vault is empty"
              message="Start building your home inventory — add your first item and HomeVault keeps track of value, warranty and maintenance."
              action={<Button icon="plus" onClick={() => navigate('/add')}>Add first item</Button>}
            />
          </Card>
        )}
      </section>

      {/* Warranty snapshot */}
      <section className="mt-6">
        <SectionHeader title="Warranty Snapshot" action="Open" onAction={() => navigate('/warranties')} />
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Active', value: stats.activeWarranties, color: '#10B981', icon: 'checkCircle' },
            { label: 'Expiring', value: stats.expiringWarranties, color: '#F59E0B', icon: 'clock' },
            { label: 'Expired', value: stats.expiredWarranties, color: '#EF4444', icon: 'xCircle' },
          ].map((w, i) => (
            <motion.div
              key={w.label}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-hairline bg-surface p-3 text-center shadow-card"
            >
              <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${w.color}1F`, color: w.color }}>
                <Icon name={w.icon} size={17} />
              </span>
              <p className="mt-2 font-display text-[19px] font-extrabold text-ink">{w.value}</p>
              <p className="text-[11px] font-semibold text-ink-mute">{w.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="mt-6">
        <SectionHeader title="Recent Activity" />
        <Card padded={false} className="divide-y divide-hairline overflow-hidden">
          {data.activity.slice(0, 7).map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => a.itemId && navigate(`/item/${a.itemId}`)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-3 text-ink-soft">
                <Icon name={ACTIVITY_ICON[a.kind] ?? 'info'} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{a.title}</p>
                {a.detail ? <p className="truncate text-[11.5px] text-ink-mute">{a.detail}</p> : null}
              </div>
              <span className="shrink-0 text-[11px] font-semibold text-ink-mute">{relativeTime(a.at)}</span>
            </motion.button>
          ))}
          {!data.activity.length ? <div className="px-4 py-8 text-center text-[13px] text-ink-mute">No activity yet.</div> : null}
        </Card>
      </section>

      {/* Highest value */}
      <section className="mt-6">
        <SectionHeader title="Top Value Items" action="Analytics" onAction={() => navigate('/analytics')} />
        <div className="space-y-2.5">
          {[...data.items]
            .filter((i) => !i.archived)
            .sort((a, b) => b.currentValue * b.quantity - a.currentValue * a.quantity)
            .slice(0, 4)
            .map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/item/${item.id}`)}
                className="flex w-full items-center gap-3 rounded-2xl border border-hairline bg-surface p-2.5 text-left shadow-card"
              >
                <ItemThumb item={item} category={catMap.get(item.categoryId)} className="h-12 w-12" iconSize={20} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink">{item.name}</p>
                  <p className="truncate text-[11px] text-ink-mute">
                    {catMap.get(item.categoryId)?.name} · {item.room}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-extrabold text-ink">{formatMoney(item.currentValue * item.quantity, currency, { compact: true })}</p>
                  <p className="text-[10px] font-semibold uppercase text-ink-mute">{warrantyStatus(item)}</p>
                </div>
              </motion.button>
            ))}
        </div>
      </section>
    </div>
  );
}

function HeroStat({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-white/70">
        <Icon name={icon} size={13} />
        <span className="text-[10.5px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 font-display text-[19px] font-extrabold leading-tight">{value}</p>
      <p className="text-[10.5px] text-white/60">{sub}</p>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone,
  caption,
  delay = 0,
  onClick,
}: {
  label: string;
  value: string;
  icon: string;
  tone: string;
  caption: string;
  delay?: number;
  onClick?: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="rounded-3xl border border-hairline bg-surface p-3.5 text-left shadow-card"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${tone}1F`, color: tone }}>
        <Icon name={icon} size={17} strokeWidth={2} />
      </span>
      <p className="mt-2.5 font-display text-[20px] font-extrabold leading-none text-ink">{value}</p>
      <p className="mt-1 text-[12px] font-semibold text-ink-soft">{label}</p>
      <p className="text-[10.5px] text-ink-mute">{caption}</p>
    </motion.button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 pt-3">
      <Skeleton className="h-[248px] rounded-[28px]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[118px] rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-[92px] rounded-3xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[220px] rounded-3xl" />
        <Skeleton className="h-[220px] rounded-3xl" />
      </div>
      <Skeleton className="h-[190px] rounded-3xl" />
      <div className="flex gap-3">
        <Skeleton className="h-[170px] w-[150px] shrink-0 rounded-3xl" />
        <Skeleton className="h-[170px] w-[150px] shrink-0 rounded-3xl" />
        <Skeleton className="h-[170px] w-[150px] shrink-0 rounded-3xl" />
      </div>
    </div>
  );
}
