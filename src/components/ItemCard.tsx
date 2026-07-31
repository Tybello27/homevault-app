import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { Category, InventoryItem } from '@/lib/types';
import { formatMoney, warrantyStatus } from '@/lib/format';
import { isRealPhoto, photoBackground } from '@/lib/seed';
import { Icon } from './icons';

export function ItemThumb({
  item,
  category,
  index = 0,
  className = '',
  radius = 'rounded-2xl',
  iconSize = 26,
}: {
  item: InventoryItem;
  category?: Category;
  index?: number;
  className?: string;
  radius?: string;
  iconSize?: number;
}) {
  const photo = item.photos[index];
  if (photo && isRealPhoto(photo)) {
    return <img src={photo} alt={item.name} loading="lazy" className={`object-cover ${radius} ${className}`} />;
  }
  return (
    <div
      className={`relative grid place-items-center overflow-hidden ${radius} ${className}`}
      style={{ background: photoBackground(photo, index + item.name.length) }}
    >
      <div className="absolute -right-4 -top-4 h-14 w-14 rounded-full bg-white/12" />
      <div className="absolute -bottom-6 -left-3 h-16 w-16 rounded-full bg-black/10" />
      <Icon name={category?.icon ?? 'boxes'} size={iconSize} className="relative text-white/95" strokeWidth={1.6} />
    </div>
  );
}

const WARRANTY_TONE = {
  active: { label: 'Active', cls: 'bg-emerald-brand/90 text-white' },
  expiring: { label: 'Expiring', cls: 'bg-amber-brand/95 text-white' },
  expired: { label: 'Expired', cls: 'bg-rose-brand/90 text-white' },
  none: { label: '', cls: '' },
};

export function ItemGridCard({
  item,
  category,
  currency,
  onOpen,
  onFavorite,
  delay = 0,
}: {
  item: InventoryItem;
  category?: Category;
  currency: string;
  onOpen: () => void;
  onFavorite: () => void;
  delay?: number;
}) {
  const status = warrantyStatus(item);
  const tone = WARRANTY_TONE[status];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 26 }}
      whileTap={{ scale: 0.975 }}
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-3xl border border-hairline bg-surface shadow-card"
    >
      <div className="relative">
        <ItemThumb item={item} category={category} className="h-28 w-full" radius="rounded-none" iconSize={32} />
        <span
          className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md"
          style={{ background: `${category?.color ?? '#1E3A5F'}E6` }}
        >
          <Icon name={category?.icon ?? 'boxes'} size={11} strokeWidth={2.2} />
          {category?.name ?? 'Item'}
        </span>
        <button
          aria-label="Toggle favourite"
          onClick={(e) => {
            e.stopPropagation();
            onFavorite();
          }}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/25 text-white backdrop-blur-md transition hover:bg-black/40"
        >
          <Icon name="heart" size={15} strokeWidth={2} className={item.favorite ? 'fill-rose-brand text-rose-brand' : ''} />
        </button>
        {status !== 'none' ? (
          <span className={`absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-[9.5px] font-bold ${tone.cls}`}>{tone.label}</span>
        ) : null}
      </div>
      <div className="p-3">
        <p className="truncate text-[13.5px] font-bold leading-tight text-ink">{item.name}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-ink-mute">
          <Icon name="mapPin" size={11} />
          {item.room}
        </p>
        <div className="mt-2.5 flex items-end justify-between">
          <span className="font-display text-[14.5px] font-extrabold text-navy-700 dark:text-sky-accent">
            {formatMoney(item.currentValue, currency, { compact: true })}
          </span>
          {item.quantity > 1 ? <span className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] font-bold text-ink-mute">×{item.quantity}</span> : null}
        </div>
      </div>
    </motion.div>
  );
}

export function ItemListCard({
  item,
  category,
  currency,
  onOpen,
  onFavorite,
  onArchive,
  onDelete,
  delay = 0,
}: {
  item: InventoryItem;
  category?: Category;
  currency: string;
  onOpen: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onDelete: () => void;
  delay?: number;
}) {
  const x = useMotionValue(0);
  const leftOpacity = useTransform(x, [0, 70], [0, 1]);
  const rightOpacity = useTransform(x, [-70, 0], [1, 0]);
  const status = warrantyStatus(item);
  const tone = WARRANTY_TONE[status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 26 }}
      className="relative overflow-hidden rounded-3xl"
    >
      <div className="absolute inset-0 flex items-center justify-between rounded-3xl bg-surface-3 px-5">
        <motion.span style={{ opacity: leftOpacity }} className="flex items-center gap-1.5 text-[12px] font-bold text-rose-brand">
          <Icon name="heart" size={17} />
          Favourite
        </motion.span>
        <motion.span style={{ opacity: rightOpacity }} className="flex items-center gap-1.5 text-[12px] font-bold text-amber-600 dark:text-amber-brand">
          Archive
          <Icon name="archive" size={17} />
        </motion.span>
      </div>
      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.28}
        onDragEnd={(_, info) => {
          if (info.offset.x > 110) onFavorite();
          else if (info.offset.x < -110) onArchive();
        }}
        onClick={onOpen}
        whileTap={{ scale: 0.99 }}
        className="relative flex cursor-pointer items-center gap-3 rounded-3xl border border-hairline bg-surface p-3 shadow-card"
      >
        <ItemThumb item={item} category={category} className="h-16 w-16 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[14px] font-bold text-ink">{item.name}</p>
            {item.favorite ? <Icon name="heart" size={12} className="shrink-0 fill-rose-brand text-rose-brand" /> : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={{ background: `${category?.color ?? '#1E3A5F'}1F`, color: category?.color ?? '#1E3A5F' }}
            >
              <Icon name={category?.icon ?? 'boxes'} size={10} strokeWidth={2.3} />
              {category?.name ?? 'Item'}
            </span>
            <span className="text-[10.5px] text-ink-mute">· {item.room}</span>
            {status !== 'none' ? <span className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-bold ${tone.cls}`}>{tone.label}</span> : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-[14px] font-extrabold text-navy-700 dark:text-sky-accent">
            {formatMoney(item.currentValue, currency, { compact: true })}
          </p>
          <button
            aria-label="Delete item"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="mt-1 grid h-7 w-7 place-items-center rounded-lg text-ink-mute transition hover:bg-rose-brand/10 hover:text-rose-brand"
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
