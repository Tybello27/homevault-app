import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useStore } from '@/store/AppStore';
import { categoryDistribution, computeStats, cumulativeValueSeries, monthlySeries, purchaseTimeline, roomDistribution } from '@/lib/stats';
import { formatDate, formatMoney } from '@/lib/format';
import { AreaChart, BarChart, DonutChart } from '@/components/charts';
import { Badge, Card, EmptyState, ProgressBar, SegmentedControl, Skeleton } from '@/components/ui';
import { Icon } from '@/components/icons';
import { ScreenHeader } from '@/components/Layout';

type Tab = 'overview' | 'category' | 'history';

export function Analytics({ navigate }: { navigate: (to: string) => void }) {
  const { data, ready } = useStore();
  const [tab, setTab] = useState<Tab>('overview');
  const currency = data.settings.currency;

  const stats = useMemo(() => computeStats(data, data.settings.reminderLeadDays), [data]);
  const dist = useMemo(() => categoryDistribution(data), [data]);
  const rooms = useMemo(() => roomDistribution(data), [data]);
  const spend = useMemo(() => monthlySeries(data, 6), [data]);
  const value = useMemo(() => cumulativeValueSeries(data, 6), [data]);
  const timeline = useMemo(() => purchaseTimeline(data), [data]);
  const catMap = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);

  if (!ready) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-[220px] rounded-3xl" />
        <Skeleton className="h-[260px] rounded-3xl" />
      </div>
    );
  }

  const topItems = [...data.items].filter((i) => !i.archived).sort((a, b) => b.currentValue * b.quantity - a.currentValue * a.quantity).slice(0, 6);
  const maxSpendMonth = spend.reduce((a, b) => (b.spend > a.spend ? b : a), spend[0] ?? { label: '—', spend: 0, key: '', count: 0 });

  return (
    <div className="pt-1">
      <ScreenHeader title="Analytics" subtitle="Inventory value, spending and category insights" />

      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'overview', label: 'Overview', icon: 'chart' },
          { value: 'category', label: 'Category', icon: 'layers' },
          { value: 'history', label: 'History', icon: 'clock' },
        ]}
        className="mb-4"
      />

      {tab === 'overview' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Total value" value={formatMoney(stats.totalValue, currency, { compact: true })} caption={`${stats.totalItems} items`} icon="wallet" tone="#0F766E" />
            <MetricCard label="Total spend" value={formatMoney(stats.totalSpend, currency, { compact: true })} caption="Lifetime purchases" icon="trendingUp" tone="#38BDF8" />
            <MetricCard label="Maintenance" value={formatMoney(stats.maintenanceSpend, currency, { compact: true })} caption={`${stats.maintenanceLogs} services`} icon="wrench" tone="#F59E0B" />
            <MetricCard
              label="Value retained"
              value={`${(100 + stats.valueDelta).toFixed(0)}%`}
              caption={stats.valueDelta >= 0 ? 'Above purchase price' : 'Normal depreciation'}
              icon="shield"
              tone="#10B981"
            />
          </div>

          <Card>
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="text-[12.5px] font-semibold text-ink-mute">Inventory value trend</p>
                <p className="font-display text-[21px] font-extrabold text-ink">{formatMoney(stats.totalValue, currency)}</p>
              </div>
              <Badge tone="sky">6 months</Badge>
            </div>
            <AreaChart points={value.map((v) => v.value)} labels={value.map((v) => v.label)} color="#38BDF8" format={(n) => formatMoney(n, currency, { compact: true })} />
          </Card>

          <Card>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-[12.5px] font-semibold text-ink-mute">Monthly spending</p>
                <p className="font-display text-[19px] font-extrabold text-ink">{formatMoney(spend.reduce((s, m) => s + m.spend, 0), currency)}</p>
              </div>
              <Badge tone="teal">Peak {maxSpendMonth.label}</Badge>
            </div>
            <BarChart data={spend.map((m) => ({ label: m.label, value: m.spend }))} format={(n) => formatMoney(n, currency, { compact: true })} />
          </Card>

          <Card>
            <p className="mb-3 text-[13px] font-bold text-ink">Value by room</p>
            {rooms.length ? (
              <div className="space-y-3">
                {rooms.slice(0, 6).map((r, i) => (
                  <motion.div key={r.room} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[12.5px] font-semibold text-ink">{r.room}</span>
                      <span className="text-[12px] font-bold text-ink-soft">{formatMoney(r.value, currency, { compact: true })}</span>
                    </div>
                    <ProgressBar value={(r.value / (rooms[0]?.value || 1)) * 100} tone={i % 2 ? '#38BDF8' : '#0F766E'} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState title="No room data" message="Assign rooms to your items to unlock room-level value analytics." variant="chart" />
            )}
          </Card>

          <Card>
            <p className="mb-3 text-[13px] font-bold text-ink">Most valuable items</p>
            <div className="space-y-2.5">
              {topItems.map((item, i) => (
                <button key={item.id} onClick={() => navigate(`/item/${item.id}`)} className="flex w-full items-center gap-3 text-left">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface-3 text-[12px] font-extrabold text-ink-soft">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-ink">{item.name}</p>
                    <p className="truncate text-[11px] text-ink-mute">{catMap.get(item.categoryId)?.name}</p>
                  </div>
                  <span className="shrink-0 text-[13px] font-extrabold text-teal-brand dark:text-sky-accent">
                    {formatMoney(item.currentValue * item.quantity, currency, { compact: true })}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'category' ? (
        <div className="space-y-4">
          <Card>
            <p className="mb-3 text-[13px] font-bold text-ink">Category distribution by value</p>
            {dist.length ? (
              <div className="flex flex-col items-center gap-5 sm:flex-row">
                <DonutChart
                  data={dist.map((d) => ({ label: d.category.name, value: d.value, color: d.category.color }))}
                  centerValue={formatMoney(stats.totalValue, currency, { compact: true })}
                  centerLabel="Total"
                  size={190}
                />
                <div className="w-full flex-1 space-y-2.5">
                  {dist.map((d) => (
                    <div key={d.category.id}>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.category.color }} />
                        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink">{d.category.name}</span>
                        <span className="text-[11.5px] font-bold text-ink-soft">{((d.value / (stats.totalValue || 1)) * 100).toFixed(0)}%</span>
                      </div>
                      <ProgressBar value={(d.value / (dist[0]?.value || 1)) * 100} tone={d.category.color} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Nothing to chart yet" message="Add items across categories to see how your home value is distributed." variant="chart" />
            )}
          </Card>

          <Card>
            <p className="mb-3 text-[13px] font-bold text-ink">Items per category</p>
            <BarChart
              data={dist.map((d) => ({ label: d.category.name.slice(0, 4), value: d.count, color: d.category.color }))}
              height={140}
              format={(n) => `${n} items`}
            />
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {dist.map((d, i) => (
              <motion.button
                key={d.category.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate('/inventory')}
                className="flex items-center gap-3 rounded-3xl border border-hairline bg-surface p-3.5 text-left shadow-card"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: d.category.color }}>
                  <Icon name={d.category.icon} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-ink">{d.category.name}</p>
                  <p className="text-[11.5px] text-ink-mute">{d.count} items</p>
                </div>
                <span className="shrink-0 text-[13px] font-extrabold text-ink">{formatMoney(d.value, currency, { compact: true })}</span>
              </motion.button>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'history' ? (
        <div className="space-y-4">
          <Card>
            <p className="mb-1 text-[13px] font-bold text-ink">Purchase history timeline</p>
            <p className="mb-4 text-[11.5px] text-ink-mute">Every purchase recorded in HomeVault, newest first.</p>
            {timeline.length ? (
              <div className="space-y-6">
                {timeline.map((group) => (
                  <div key={group.year}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded-full bg-navy-700 px-3 py-1 text-[12px] font-extrabold text-white dark:bg-sky-accent dark:text-navy-950">{group.year}</span>
                      <span className="text-[11.5px] font-semibold text-ink-mute">
                        {group.items.length} purchases · {formatMoney(group.total, currency, { compact: true })}
                      </span>
                    </div>
                    <div className="relative space-y-3 pl-5">
                      <span className="absolute left-1.5 top-2 bottom-2 w-px bg-hairline" />
                      {group.items.map((item, i) => (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i * 0.03, 0.3) }}
                          onClick={() => navigate(`/item/${item.id}`)}
                          className="relative flex w-full items-center gap-3 rounded-2xl bg-surface-2 p-3 text-left"
                        >
                          <span className="absolute -left-[15px] h-2.5 w-2.5 rounded-full ring-4 ring-surface" style={{ background: catMap.get(item.categoryId)?.color ?? '#38BDF8' }} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold text-ink">{item.name}</p>
                            <p className="truncate text-[11.5px] text-ink-mute">
                              {formatDate(item.purchaseDate, 'long')} · {item.retailer || 'Unknown store'}
                            </p>
                          </div>
                          <span className="shrink-0 text-[12.5px] font-extrabold text-ink">{formatMoney(item.purchasePrice * item.quantity, currency, { compact: true })}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No purchase history" message="Record purchase dates on your items to build a beautiful spending timeline." variant="chart" />
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value, caption, icon, tone }: { label: string; value: string; caption: string; icon: string; tone: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-hairline bg-surface p-3.5 shadow-card">
      <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${tone}1F`, color: tone }}>
        <Icon name={icon} size={17} />
      </span>
      <p className="mt-2.5 font-display text-[19px] font-extrabold leading-none text-ink">{value}</p>
      <p className="mt-1 text-[12px] font-semibold text-ink-soft">{label}</p>
      <p className="text-[10.5px] text-ink-mute">{caption}</p>
    </motion.div>
  );
}
