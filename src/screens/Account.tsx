import { motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { useStore } from '@/store/AppStore';
import { computeStats } from '@/lib/stats';
import { CURRENCIES, formatDate, formatMoney, LANGUAGES } from '@/lib/format';
import type { AppData } from '@/lib/types';
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, SegmentedControl, Select, Sheet, Toggle } from '@/components/ui';
import { Icon, Logo } from '@/components/icons';
import { ScreenHeader } from '@/components/Layout';
import { InstallCard, InstallDiagnostics } from '@/components/InstallPwa';
import { exportBackup, exportCSVFile, exportJSON, exportPDF, exportXLSX, parseImportFile } from '@/lib/io';
import { useNotificationPermission } from '@/hooks/useReminders';
import { usePwa } from '@/hooks/usePwa';

/* -------------------------------- Profile -------------------------------- */

export function Profile({ navigate }: { navigate: (to: string) => void }) {
  const { data, updateProfile, toast } = useStore();
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(data.profile);
  const stats = useMemo(() => computeStats(data, data.settings.reminderLeadDays), [data]);
  const currency = data.settings.currency;

  return (
    <div className="pt-1">
      <ScreenHeader title="Profile" subtitle="Your household and vault summary" />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hv-gradient-hero relative overflow-hidden rounded-[28px] p-5 text-white shadow-float">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/8" />
        <div className="relative flex items-center gap-4">
          <Avatar name={data.profile.name} color={data.profile.avatarColor} size={64} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[19px] font-extrabold">{data.profile.household}</p>
            <p className="truncate text-[12.5px] text-white/70">{data.profile.email}</p>
            <p className="mt-1 flex items-center gap-1 text-[11.5px] text-white/60">
              <Icon name="mapPin" size={12} />
              {data.profile.address}
            </p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2.5">
          {[
            { label: 'Items', value: String(stats.totalItems) },
            { label: 'Value', value: formatMoney(stats.totalValue, currency, { compact: true }) },
            { label: 'Rooms', value: String(stats.rooms) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/10 p-2.5 text-center backdrop-blur-md">
              <p className="font-display text-[16px] font-extrabold">{s.value}</p>
              <p className="text-[10.5px] text-white/65">{s.label}</p>
            </div>
          ))}
        </div>
        <Button variant="soft" size="sm" className="relative mt-4 bg-white/15 text-white hover:bg-white/25" icon="edit" onClick={() => { setDraft(data.profile); setEdit(true); }}>
          Edit profile
        </Button>
      </motion.div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          { label: 'Favourites', value: stats.favorites, icon: 'heart', tone: '#EC4899', to: '/favorites' },
          { label: 'Archived', value: stats.archived, icon: 'archive', tone: '#64748B', to: '/archive' },
          { label: 'Warranties', value: stats.activeWarranties, icon: 'shield', tone: '#10B981', to: '/warranties' },
          { label: 'Services', value: stats.maintenanceLogs, icon: 'wrench', tone: '#F59E0B', to: '/maintenance' },
        ].map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(s.to)}
            className="flex items-center gap-3 rounded-3xl border border-hairline bg-surface p-3.5 text-left shadow-card"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl" style={{ background: `${s.tone}1F`, color: s.tone }}>
              <Icon name={s.icon} size={18} />
            </span>
            <div>
              <p className="font-display text-[17px] font-extrabold leading-none text-ink">{s.value}</p>
              <p className="text-[11.5px] text-ink-mute">{s.label}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <Card className="mt-4">
        <p className="mb-3 text-[13px] font-bold text-ink">Household details</p>
        <div className="space-y-2.5">
          <DetailRow icon="user" label="Account holder" value={data.profile.name} />
          <DetailRow icon="home" label="Household" value={data.profile.household} />
          <DetailRow icon="mapPin" label="Address" value={data.profile.address} />
          <DetailRow icon="calendar" label="Vault created" value={formatDate(data.profile.memberSince, 'long')} />
          <DetailRow icon="wallet" label="Primary currency" value={`${CURRENCIES[currency]?.label ?? 'Nigerian Naira'} (${CURRENCIES[currency]?.symbol ?? '₦'})`} />
        </div>
      </Card>

      <Card className="mt-4">
        <p className="mb-3 text-[13px] font-bold text-ink">Shortcuts</p>
        <div className="space-y-1">
          {[
            { icon: 'settings', label: 'Settings & preferences', to: '/settings' },
            { icon: 'layers', label: 'Categories & rooms', to: '/categories' },
            { icon: 'chart', label: 'Analytics', to: '/analytics' },
            { icon: 'scan', label: 'Scan a code', to: '/scan' },
          ].map((s) => (
            <button key={s.to} onClick={() => navigate(s.to)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-surface-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-3 text-ink-soft">
                <Icon name={s.icon} size={17} />
              </span>
              <span className="flex-1 text-[13.5px] font-semibold text-ink">{s.label}</span>
              <Icon name="chevronRight" size={16} className="text-ink-mute" />
            </button>
          ))}
        </div>
      </Card>

      <Sheet
        open={edit}
        onClose={() => setEdit(false)}
        title="Edit profile"
        footer={
          <Button
            block
            size="lg"
            icon="check"
            onClick={() => {
              updateProfile(draft);
              toast('Profile updated', 'success');
              setEdit(false);
            }}
          >
            Save profile
          </Button>
        }
      >
        <div className="space-y-3.5 pt-1">
          <Field label="Account holder">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="Household name">
            <Input value={draft.household} onChange={(e) => setDraft({ ...draft, household: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </Field>
          <Field label="Address">
            <Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
          </Field>
          <div>
            <p className="mb-2 text-[12.5px] font-semibold text-ink-soft">Avatar colour</p>
            <div className="flex flex-wrap gap-2.5">
              {['#0F766E', '#1E3A5F', '#38BDF8', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'].map((c) => (
                <button
                  key={c}
                  onClick={() => setDraft({ ...draft, avatarColor: c })}
                  className={`h-9 w-9 rounded-2xl ${draft.avatarColor === c ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''}`}
                  style={{ background: c }}
                  aria-label={`Colour ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-hairline pb-2.5 last:border-0 last:pb-0">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface-3 text-ink-soft">
        <Icon name={icon} size={15} />
      </span>
      <span className="flex-1 text-[12.5px] text-ink-soft">{label}</span>
      <span className="max-w-[52%] truncate text-[12.5px] font-bold text-ink">{value}</span>
    </div>
  );
}

/* -------------------------------- Settings ------------------------------- */

export function Settings({ navigate }: { navigate: (to: string) => void }) {
  const { data, updateSettings, replaceAll, importItems, resetToDemo, clearInventory, toast, pushActivity } = useStore();
  const settings = data.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [preview, setPreview] = useState<{ count: number; source: string; sample: string[] } | null>(null);
  const { supported, permission, request } = useNotificationPermission();
  const { embedded, installed } = usePwa();

  const activeItems = data.items.filter((i) => !i.archived);
  const totalValue = activeItems.reduce((s, i) => s + i.currentValue * i.quantity, 0);

  const handleFile = async (file: File) => {
    try {
      const parsed = await parseImportFile(file, data.categories);
      if (parsed.backup) {
        replaceAll(parsed.backup as AppData);
        toast('Backup restored successfully', 'success');
        return;
      }
      if (!parsed.items.length) {
        toast('No rows found in that file', 'warning');
        return;
      }
      const count = importItems(parsed.items, importMode);
      setPreview({
        count,
        source: parsed.source,
        sample: parsed.items.slice(0, 4).map((i) => `${i.name} — ${formatMoney(i.currentValue, settings.currency)}`),
      });
      toast(`Imported ${count} items from ${parsed.source}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not read that file', 'danger');
    }
  };

  return (
    <div className="pt-1">
      <ScreenHeader title="Settings" subtitle="Theme, currency, backups and data" />

      <div className="space-y-4">
        <InstallCard />
        <InstallDiagnostics />

        {embedded && !installed ? (
          <Card className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sky-accent/14 text-sky-accent">
              <Icon name="share" size={18} />
            </span>
            <p className="min-w-0 flex-1 text-[13px] font-bold text-ink">Open HomeVault in a browser tab</p>
            <Button size="sm" variant="soft" onClick={() => window.open(window.location.href, '_blank', 'noopener')}>
              Open
            </Button>
          </Card>
        ) : null}

        {/* Appearance */}
        <Card>
          <p className="mb-3 text-[13px] font-bold text-ink">Appearance</p>
          <SegmentedControl
            value={settings.theme}
            onChange={(v) => updateSettings({ theme: v })}
            options={[
              { value: 'light', label: 'Light', icon: 'sun' },
              { value: 'dark', label: 'Dark', icon: 'moon' },
              { value: 'system', label: 'System', icon: 'monitor' },
            ]}
          />
          <div className="mt-3 space-y-1">
            <SettingToggle
              icon="grid"
              label="Compact cards"
              hint="Denser inventory layout"
              checked={settings.compactCards}
              onChange={(v) => updateSettings({ compactCards: v })}
            />
            <div className="flex items-center justify-between rounded-2xl px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-3 text-ink-soft">
                  <Icon name="list" size={17} />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold text-ink">Default view</p>
                  <p className="text-[11.5px] text-ink-mute">How inventory opens</p>
                </div>
              </div>
              <SegmentedControl
                value={settings.defaultView}
                onChange={(v) => updateSettings({ defaultView: v })}
                options={[
                  { value: 'grid', label: 'Grid' },
                  { value: 'list', label: 'List' },
                ]}
                className="w-[150px]"
              />
            </div>
          </div>
        </Card>

        {/* Regional */}
        <Card className="space-y-3.5">
          <p className="text-[13px] font-bold text-ink">Regional</p>
          <Field label="Currency" hint="HomeVault is tuned for Nigeria — Naira is the default.">
            <Select value={settings.currency} onChange={(e) => updateSettings({ currency: e.target.value })}>
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} — {c.label} ({c.code})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Language">
            <Select value={settings.language} onChange={(e) => updateSettings({ language: e.target.value })}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="rounded-2xl bg-surface-2 p-3">
            <p className="text-[11.5px] text-ink-mute">Preview</p>
            <p className="font-display text-[18px] font-extrabold text-ink">{formatMoney(1_250_000, settings.currency)}</p>
          </div>
        </Card>

        {/* Reminders */}
        <Card>
          <p className="mb-3 text-[13px] font-bold text-ink">Reminders & notifications</p>
          <div className="space-y-1">
            <SettingToggle icon="shield" label="Warranty reminders" hint="Alert before cover expires" checked={settings.warrantyReminders} onChange={(v) => updateSettings({ warrantyReminders: v })} />
            <SettingToggle icon="wrench" label="Maintenance reminders" hint="Alert when a service is due" checked={settings.maintenanceReminders} onChange={(v) => updateSettings({ maintenanceReminders: v })} />
          </div>
          <Field label="Remind me this many days ahead" className="mt-3">
            <Select value={String(settings.reminderLeadDays)} onChange={(e) => updateSettings({ reminderLeadDays: Number(e.target.value) })}>
              {[7, 14, 30, 45, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </Select>
          </Field>
          {supported ? (
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-surface-2 px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-ink">Device notifications</p>
                <p className="text-[11.5px] text-ink-mute">Permission: {permission}</p>
              </div>
              {permission === 'granted' ? (
                <Badge tone="emerald">Enabled</Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={async () => {
                    const p = await request();
                    toast(p === 'granted' ? 'Notifications enabled' : 'Permission not granted', p === 'granted' ? 'success' : 'warning');
                  }}
                >
                  Enable
                </Button>
              )}
            </div>
          ) : null}
        </Card>

        {/* Export */}
        <Card>
          <p className="mb-1 text-[13px] font-bold text-ink">Export inventory</p>
          <p className="mb-3 text-[11.5px] text-ink-mute">
            {activeItems.length} items · {formatMoney(totalValue, settings.currency)} total value
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'CSV', icon: 'fileText', run: () => { exportCSVFile(activeItems, data.categories); pushActivity('exported', 'Exported inventory to CSV'); } },
              { label: 'Excel', icon: 'grid', run: () => { exportXLSX(activeItems, data.categories); pushActivity('exported', 'Exported inventory to Excel'); } },
              {
                label: 'PDF',
                icon: 'printer',
                run: () => {
                  exportPDF(activeItems, data.categories, {
                    household: data.profile.household,
                    totalValue,
                    totalSpend: activeItems.reduce((s, i) => s + i.purchasePrice * i.quantity, 0),
                  });
                  pushActivity('exported', 'Exported inventory report to PDF');
                },
              },
              { label: 'JSON', icon: 'database', run: () => { exportJSON(activeItems, data.categories); pushActivity('exported', 'Exported inventory to JSON'); } },
            ].map((e) => (
              <button
                key={e.label}
                onClick={() => {
                  e.run();
                  toast(`${e.label} export ready`, 'success');
                }}
                className="flex items-center gap-2.5 rounded-2xl border border-hairline bg-surface-2 px-3.5 py-3 text-left transition active:scale-95"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy-700/8 text-navy-700 dark:bg-sky-accent/14 dark:text-sky-accent">
                  <Icon name={e.icon} size={17} />
                </span>
                <span className="text-[13px] font-bold text-ink">{e.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Import */}
        <Card>
          <p className="mb-1 text-[13px] font-bold text-ink">Import inventory</p>
          <p className="mb-3 text-[11.5px] text-ink-mute">Bring items in from CSV, Excel (.xlsx) or a HomeVault JSON file.</p>
          <SegmentedControl
            value={importMode}
            onChange={setImportMode}
            options={[
              { value: 'merge', label: 'Merge' },
              { value: 'replace', label: 'Replace' },
            ]}
            className="mb-3"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-hairline py-7 text-ink-mute transition hover:border-sky-accent hover:text-sky-accent"
          >
            <Icon name="upload" size={24} />
            <span className="text-[13px] font-bold">Choose a file</span>
            <span className="text-[11px]">CSV · XLSX · JSON</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json,text/csv,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = '';
            }}
          />
          {preview ? (
            <div className="mt-3 rounded-2xl bg-surface-2 p-3">
              <p className="text-[12.5px] font-bold text-ink">
                {preview.count} items imported from {preview.source}
              </p>
              <ul className="mt-1.5 space-y-1">
                {preview.sample.map((s) => (
                  <li key={s} className="truncate text-[11.5px] text-ink-soft">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        {/* Backup */}
        <Card>
          <p className="mb-1 text-[13px] font-bold text-ink">Backup & restore</p>
          <p className="mb-3 text-[11.5px] text-ink-mute">
            Everything lives on this device only. Download a full backup regularly and restore it on any device.
          </p>
          <div className="flex gap-2.5">
            <Button
              variant="soft"
              block
              icon="download"
              onClick={() => {
                exportBackup(data);
                updateSettings({ lastBackupAt: new Date().toISOString() });
                toast('Backup downloaded', 'success');
              }}
            >
              Backup
            </Button>
            <Button variant="soft" block icon="upload" onClick={() => fileRef.current?.click()}>
              Restore
            </Button>
          </div>
          <p className="mt-2.5 text-center text-[11px] text-ink-mute">
            Last backup: {settings.lastBackupAt ? formatDate(settings.lastBackupAt, 'long') : 'never'}
          </p>
        </Card>

        {/* Data */}
        <Card>
          <p className="mb-3 text-[13px] font-bold text-ink">Data</p>
          <div className="space-y-1">
            <button onClick={() => setConfirmReset(true)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-surface-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-3 text-ink-soft">
                <Icon name="refresh" size={17} />
              </span>
              <div className="flex-1">
                <p className="text-[13.5px] font-semibold text-ink">Reload sample inventory</p>
                <p className="text-[11.5px] text-ink-mute">Restore the demo Nigerian home inventory</p>
              </div>
            </button>
            <button onClick={() => setConfirmClear(true)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-rose-brand transition hover:bg-rose-brand/8">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-brand/12">
                <Icon name="trash" size={17} />
              </span>
              <div className="flex-1">
                <p className="text-[13.5px] font-semibold">Delete all items</p>
                <p className="text-[11.5px] opacity-70">Clears your entire vault</p>
              </div>
            </button>
          </div>
        </Card>

        {/* About */}
        <Card className="text-center">
          <Logo size={52} rounded={18} />
          <p className="mt-3 font-display text-[17px] font-extrabold text-ink">HomeVault</p>
          <p className="text-[12px] text-ink-mute">Version 1.0.0 · Offline-first PWA</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Badge tone="teal">Local storage only</Badge>
            <Badge tone="sky">No account required</Badge>
            <Badge tone="emerald">Works offline</Badge>
          </div>
          <p className="mx-auto mt-3 max-w-xs text-[11.5px] leading-relaxed text-ink-mute">
            Built for Nigerian homes. All amounts are shown in Naira (₦) and all data is stored privately in your browser
            under the key <span className="font-mono">homevault.data.v1</span>.
          </p>
          <Button variant="soft" size="sm" className="mt-3" icon="boxes" onClick={() => navigate('/inventory')}>
            Back to inventory
          </Button>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReset}
        tone="primary"
        title="Reload sample inventory?"
        message="This replaces your current vault with the HomeVault demo data. Download a backup first if you want to keep your items."
        confirmLabel="Reload demo"
        onConfirm={() => {
          resetToDemo();
          toast('Sample inventory restored', 'success');
        }}
        onClose={() => setConfirmReset(false)}
      />
      <ConfirmDialog
        open={confirmClear}
        title="Delete every item?"
        message="Your entire inventory, including photos and maintenance history, will be permanently removed from this device."
        confirmLabel="Delete all"
        onConfirm={() => {
          clearInventory();
          toast('All items deleted', 'danger');
        }}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}

function SettingToggle({
  icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-3 text-ink-soft">
          <Icon name={icon} size={17} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold text-ink">{label}</p>
          <p className="truncate text-[11.5px] text-ink-mute">{hint}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

/* -------------------------------- Not found ------------------------------- */

export function NotFound({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="pt-16">
      <EmptyState
        variant="search"
        title="Page not found"
        message="That screen does not exist in HomeVault. Head back to your dashboard."
        action={<Button icon="home" onClick={() => navigate('/')}>Go to dashboard</Button>}
      />
    </div>
  );
}
