import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { useStore } from '@/store/AppStore';
import { CONDITION_TONE, daysUntil, formatDate, formatMoney, relativeTime, todayISO, warrantyStatus } from '@/lib/format';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, IconButton, Input, Sheet, Textarea } from '@/components/ui';
import { Icon } from '@/components/icons';
import { isRealPhoto, photoBackground } from '@/lib/seed';
import { RadialGauge } from '@/components/charts';

export function ItemDetail({ navigate, itemId }: { navigate: (to: string) => void; itemId: string }) {
  const { data, toggleFavorite, setArchived, deleteItem, duplicateItem, addMaintenance, removeMaintenance, toast } = useStore();
  const item = data.items.find((i) => i.id === itemId);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [showMaint, setShowMaint] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const qrWrap = useRef<HTMLDivElement>(null);
  const currency = data.settings.currency;

  const category = useMemo(() => data.categories.find((c) => c.id === item?.categoryId), [data.categories, item]);

  if (!item) {
    return (
      <div className="pt-10">
        <EmptyState title="Item not found" message="This item may have been deleted or restored from a different backup." action={<Button onClick={() => navigate('/inventory')}>Back to inventory</Button>} />
      </div>
    );
  }

  const status = warrantyStatus(item, data.settings.reminderLeadDays);
  const daysLeft = daysUntil(item.warrantyExpiry);
  const totalMaintenance = item.maintenance.reduce((s, m) => s + (m.cost || 0), 0);
  const depreciation = item.purchasePrice ? ((item.currentValue - item.purchasePrice) / item.purchasePrice) * 100 : 0;
  const qrPayload = JSON.stringify({ app: 'HomeVault', id: item.id, name: item.name, serial: item.serialNumber ?? '', room: item.room });

  const downloadQR = () => {
    const canvas = qrWrap.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `homevault-qr-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('QR code saved to your device', 'success');
  };

  return (
    <div className="pb-6">
      {/* Gallery header */}
      <div className="relative -mx-4 lg:mx-0 lg:mt-4 lg:overflow-hidden lg:rounded-3xl">
        <div className="relative h-[280px] w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={photoIndex}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0"
            >
              {item.photos[photoIndex] && isRealPhoto(item.photos[photoIndex]) ? (
                <img src={item.photos[photoIndex]} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center" style={{ background: photoBackground(item.photos[photoIndex], photoIndex) }}>
                  <Icon name={category?.icon ?? 'boxes'} size={78} className="text-white/85" strokeWidth={1.1} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4 safe-top">
            <IconButton icon="chevronLeft" label="Back" tone="glass" onClick={() => navigate('/inventory')} />
            <div className="flex gap-2">
              <IconButton icon="heart" label="Favourite" tone="glass" onClick={() => toggleFavorite(item.id)} className={item.favorite ? 'text-rose-brand!' : ''} />
              <IconButton icon="qr" label="QR code" tone="glass" onClick={() => setShowQR(true)} />
              <IconButton icon="dots" label="More actions" tone="glass" onClick={() => setShowActions(true)} />
            </div>
          </div>
          {item.photos.length > 1 ? (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {item.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === photoIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {item.photos.length > 1 ? (
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {item.photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setPhotoIndex(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-2 transition ${i === photoIndex ? 'ring-sky-accent' : 'ring-transparent'}`}
            >
              {isRealPhoto(p) ? (
                <img src={p} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center" style={{ background: photoBackground(p, i) }}>
                  <Icon name={category?.icon ?? 'boxes'} size={17} className="text-white/90" />
                </div>
              )}
            </button>
          ))}
        </div>
      ) : null}

      {/* Title block */}
      <div className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
              style={{ background: category?.color ?? '#1E3A5F' }}
            >
              <Icon name={category?.icon ?? 'boxes'} size={12} strokeWidth={2.2} />
              {category?.name}
            </span>
            <h1 className="mt-2 font-display text-[23px] font-extrabold leading-tight text-ink">{item.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-soft">
              <Icon name="mapPin" size={13} />
              {item.room} · {item.location}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-[21px] font-extrabold text-teal-brand dark:text-sky-accent">{formatMoney(item.currentValue, currency)}</p>
            <p className="text-[11px] text-ink-mute">est. value{item.quantity > 1 ? ` · ×${item.quantity}` : ''}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${CONDITION_TONE[item.condition]}`}>{item.condition}</span>
          {item.tags.map((t) => (
            <Badge key={t} tone="mute">
              #{t}
            </Badge>
          ))}
          {item.archived ? <Badge tone="amber">Archived</Badge> : null}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { icon: 'edit', label: 'Edit', run: () => navigate(`/edit/${item.id}`) },
          { icon: 'copy', label: 'Duplicate', run: () => { const c = duplicateItem(item.id); if (c) { toast('Item duplicated', 'success'); navigate(`/item/${c.id}`); } } },
          { icon: 'wrench', label: 'Service', run: () => setShowMaint(true) },
          { icon: 'qr', label: 'QR Code', run: () => setShowQR(true) },
        ].map((a) => (
          <motion.button
            key={a.label}
            whileTap={{ scale: 0.94 }}
            onClick={a.run}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-hairline bg-surface py-3 shadow-card"
          >
            <Icon name={a.icon} size={18} className="text-navy-700 dark:text-sky-accent" />
            <span className="text-[11px] font-bold text-ink">{a.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Warranty */}
      <Card className="mt-4">
        <div className="flex items-center gap-4">
          <RadialGauge
            value={Math.max(0, daysLeft ?? 0)}
            max={Math.max(1, item.warrantyMonths * 30)}
            color={status === 'active' ? '#10B981' : status === 'expiring' ? '#F59E0B' : '#EF4444'}
            label="days"
            size={82}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-bold text-ink">Warranty</p>
              <Badge tone={status === 'active' ? 'emerald' : status === 'expiring' ? 'amber' : status === 'expired' ? 'rose' : 'mute'}>
                {status === 'none' ? 'No cover' : status.toUpperCase()}
              </Badge>
            </div>
            {item.warrantyExpiry ? (
              <>
                <p className="mt-1 text-[12.5px] text-ink-soft">
                  {daysLeft !== null && daysLeft >= 0 ? `${daysLeft} days remaining` : `Expired ${Math.abs(daysLeft ?? 0)} days ago`}
                </p>
                <p className="text-[11.5px] text-ink-mute">
                  {item.warrantyProvider || 'Manufacturer'} · expires {formatDate(item.warrantyExpiry, 'long')}
                </p>
              </>
            ) : (
              <p className="mt-1 text-[12.5px] text-ink-mute">No warranty recorded for this item.</p>
            )}
          </div>
        </div>
        {item.warrantyNotes ? <p className="mt-3 rounded-2xl bg-surface-2 p-3 text-[12.5px] leading-relaxed text-ink-soft">{item.warrantyNotes}</p> : null}
      </Card>

      {/* Specs */}
      <Card className="mt-4">
        <p className="mb-3 text-[13px] font-bold text-ink">Specifications</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Spec label="Brand" value={item.brand || '—'} icon="tag" />
          <Spec label="Model" value={item.model || '—'} icon="cpu" />
          <Spec label="Serial number" value={item.serialNumber || '—'} icon="qr" mono />
          <Spec label="Quantity" value={String(item.quantity)} icon="boxes" />
          <Spec label="Condition" value={item.condition} icon="sparkles" />
          <Spec label="Storage" value={item.location || '—'} icon="folder" />
        </div>
      </Card>

      {/* Purchase */}
      <Card className="mt-4">
        <p className="mb-3 text-[13px] font-bold text-ink">Purchase information</p>
        <div className="space-y-2.5">
          <Row label="Purchase price" value={formatMoney(item.purchasePrice, currency)} />
          <Row label="Current value" value={formatMoney(item.currentValue, currency)} accent />
          <Row
            label="Change in value"
            value={`${depreciation >= 0 ? '+' : ''}${depreciation.toFixed(1)}%`}
            tone={depreciation >= 0 ? 'text-emerald-brand' : 'text-rose-brand'}
          />
          <Row label="Purchased" value={formatDate(item.purchaseDate, 'long')} />
          <Row label="Retailer" value={item.retailer || '—'} />
          <Row label="Total worth" value={formatMoney(item.currentValue * item.quantity, currency)} accent />
        </div>
      </Card>

      {/* Maintenance */}
      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-ink">Maintenance history</p>
            <p className="text-[11.5px] text-ink-mute">
              {item.maintenance.length} record{item.maintenance.length === 1 ? '' : 's'} · {formatMoney(totalMaintenance, currency)} spent
            </p>
          </div>
          <Button size="sm" variant="soft" icon="plus" onClick={() => setShowMaint(true)}>
            Log
          </Button>
        </div>
        {item.maintenance.length ? (
          <div className="relative space-y-3 pl-5">
            <span className="absolute left-1.5 top-2 bottom-2 w-px bg-hairline" />
            {item.maintenance.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative">
                <span className="absolute -left-[15px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal-brand ring-4 ring-surface" />
                <div className="rounded-2xl bg-surface-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-ink">{m.type}</p>
                      <p className="text-[11.5px] text-ink-mute">
                        {formatDate(m.date)} {m.provider ? `· ${m.provider}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-[12.5px] font-extrabold text-ink">{formatMoney(m.cost, currency)}</span>
                  </div>
                  {m.notes ? <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">{m.notes}</p> : null}
                  <div className="mt-2 flex items-center justify-between">
                    {m.nextDueDate ? (
                      <Badge tone={(daysUntil(m.nextDueDate) ?? 0) < 0 ? 'rose' : 'sky'}>
                        <Icon name="clock" size={11} />
                        Next {formatDate(m.nextDueDate)}
                      </Badge>
                    ) : (
                      <span />
                    )}
                    <button onClick={() => removeMaintenance(item.id, m.id)} className="text-[11.5px] font-semibold text-ink-mute hover:text-rose-brand">
                      Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-hairline py-7 text-center">
            <Icon name="wrench" size={26} className="mx-auto text-ink-mute" />
            <p className="mt-2 text-[13px] font-semibold text-ink">No maintenance logged</p>
            <p className="mt-0.5 text-[11.5px] text-ink-mute">Keep servicing records to protect resale value.</p>
          </div>
        )}
      </Card>

      {/* Notes */}
      {item.notes || item.description ? (
        <Card className="mt-4">
          <p className="mb-2 text-[13px] font-bold text-ink">Notes</p>
          <p className="text-[13px] leading-relaxed text-ink-soft">{item.notes || item.description}</p>
        </Card>
      ) : null}

      <p className="mt-4 text-center text-[11px] text-ink-mute">
        Added {relativeTime(item.createdAt)} · Updated {relativeTime(item.updatedAt)}
      </p>

      {/* QR sheet */}
      <Sheet open={showQR} onClose={() => setShowQR(false)} title="Item QR Code">
        <div ref={qrWrap} className="flex flex-col items-center pb-2">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-3xl bg-white p-5 shadow-card">
            <QRCodeSVG value={qrPayload} size={196} level="M" fgColor="#0F2440" bgColor="#FFFFFF" />
          </motion.div>
          <div className="hidden">
            <QRCodeCanvas value={qrPayload} size={640} level="M" fgColor="#0F2440" bgColor="#FFFFFF" includeMargin />
          </div>
          <p className="mt-4 text-center text-[13px] font-bold text-ink">{item.name}</p>
          <p className="text-center text-[11.5px] text-ink-mute">{item.serialNumber || item.id}</p>
          <p className="mt-3 max-w-xs text-center text-[12px] leading-relaxed text-ink-soft">
            Print this code and stick it on the item or its storage box. Scanning it in HomeVault opens this record instantly.
          </p>
          <div className="mt-4 flex w-full gap-2.5">
            <Button variant="soft" block icon="download" onClick={downloadQR}>
              Save PNG
            </Button>
            <Button block icon="scan" onClick={() => { setShowQR(false); navigate('/scan'); }}>
              Open scanner
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Maintenance sheet */}
      <MaintenanceSheet
        open={showMaint}
        onClose={() => setShowMaint(false)}
        onSave={(entry) => {
          addMaintenance(item.id, entry);
          toast('Maintenance logged', 'success');
        }}
      />

      {/* Actions sheet */}
      <Sheet open={showActions} onClose={() => setShowActions(false)} title="Item actions">
        <div className="space-y-1.5 pb-2">
          {[
            { icon: 'edit', label: 'Edit item', run: () => navigate(`/edit/${item.id}`) },
            { icon: 'copy', label: 'Duplicate item', run: () => { const c = duplicateItem(item.id); if (c) navigate(`/item/${c.id}`); } },
            { icon: 'heart', label: item.favorite ? 'Remove from favourites' : 'Add to favourites', run: () => toggleFavorite(item.id) },
            { icon: 'archive', label: item.archived ? 'Restore from archive' : 'Archive item', run: () => { setArchived(item.id, !item.archived); toast(item.archived ? 'Restored' : 'Archived', 'success'); } },
            { icon: 'qr', label: 'Show QR code', run: () => setShowQR(true) },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => {
                setShowActions(false);
                a.run();
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition hover:bg-surface-2"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-3 text-ink-soft">
                <Icon name={a.icon} size={17} />
              </span>
              <span className="text-[13.5px] font-semibold text-ink">{a.label}</span>
            </button>
          ))}
          <button
            onClick={() => {
              setShowActions(false);
              setConfirmDelete(true);
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-rose-brand transition hover:bg-rose-brand/8"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-brand/12">
              <Icon name="trash" size={17} />
            </span>
            <span className="text-[13.5px] font-semibold">Delete item</span>
          </button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${item.name}?`}
        message="This permanently removes the item, its photos and maintenance history from HomeVault."
        confirmLabel="Delete"
        onConfirm={() => {
          deleteItem(item.id);
          toast('Item deleted', 'danger');
          navigate('/inventory');
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function Spec({ label, value, icon, mono }: { label: string; value: string; icon: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface-3 text-ink-soft">
        <Icon name={icon} size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">{label}</p>
        <p className={`truncate text-[13px] font-bold text-ink ${mono ? 'font-mono text-[12px]' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

function Row({ label, value, accent, tone }: { label: string; value: string; accent?: boolean; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline pb-2.5 last:border-0 last:pb-0">
      <span className="text-[12.5px] text-ink-soft">{label}</span>
      <span className={`text-[13px] font-bold ${tone ?? (accent ? 'text-teal-brand dark:text-sky-accent' : 'text-ink')}`}>{value}</span>
    </div>
  );
}

function MaintenanceSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (entry: { date: string; type: string; provider?: string; cost: number; notes?: string; nextDueDate?: string }) => void;
}) {
  const [type, setType] = useState('Servicing');
  const [date, setDate] = useState(todayISO());
  const [provider, setProvider] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [next, setNext] = useState('');

  const save = () => {
    if (!type.trim()) return;
    onSave({ type: type.trim(), date, provider: provider.trim() || undefined, cost: Number(cost) || 0, notes: notes.trim() || undefined, nextDueDate: next || undefined });
    setType('Servicing');
    setProvider('');
    setCost('');
    setNotes('');
    setNext('');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log maintenance"
      footer={
        <Button block size="lg" icon="check" onClick={save}>
          Save record
        </Button>
      }
    >
      <div className="space-y-3.5 pt-1">
        <div className="flex flex-wrap gap-2">
          {['Servicing', 'Repair', 'Cleaning', 'Inspection', 'Parts replaced'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
                type === t ? 'border-teal-brand bg-teal-brand text-white' : 'border-hairline bg-surface text-ink-soft'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Field label="Type">
          <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Full servicing" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Cost (₦)">
            <Input type="number" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <Field label="Service provider">
          <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="CoolCare Technicians" />
        </Field>
        <Field label="Next service due" hint="We will remind you before this date.">
          <Input type="date" value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was done?" className="min-h-[72px]" />
        </Field>
      </div>
    </Sheet>
  );
}
