import { AnimatePresence, motion } from 'framer-motion';
import {
  forwardRef,
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Icon } from './icons';

/* ------------------------------- primitives ------------------------------ */

export function Card({
  children,
  className = '',
  padded = true,
  as: _as,
  ...rest
}: { children: ReactNode; className?: string; padded?: boolean; as?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl border border-hairline bg-surface shadow-card ${padded ? 'p-4' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger' | 'success' | 'outline';

const BTN: Record<ButtonVariant, string> = {
  primary: 'bg-navy-700 text-white hover:bg-navy-800 shadow-[0_10px_24px_-12px_rgba(30,58,95,0.9)] dark:bg-sky-accent dark:text-navy-950 dark:hover:bg-sky-accent/90',
  secondary: 'bg-teal-brand text-white hover:bg-teal-brand/90',
  soft: 'bg-surface-3 text-ink hover:bg-hairline',
  ghost: 'text-ink-soft hover:bg-surface-3',
  outline: 'border border-hairline text-ink hover:bg-surface-3',
  danger: 'bg-rose-brand text-white hover:bg-rose-brand/90',
  success: 'bg-emerald-brand text-white hover:bg-emerald-brand/90',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  block?: boolean;
}

export function Button({ variant = 'primary', size = 'md', icon, block, className = '', children, ...rest }: ButtonProps) {
  const sizes = {
    sm: 'h-9 px-3.5 text-[13px] rounded-xl gap-1.5',
    md: 'h-11 px-4 text-sm rounded-2xl gap-2',
    lg: 'h-13 px-5 text-[15px] rounded-2xl gap-2 py-3.5',
  }[size];
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-45 disabled:pointer-events-none ${sizes} ${BTN[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {icon ? <Icon name={icon} size={size === 'sm' ? 15 : 17} strokeWidth={2} /> : null}
      {children}
    </motion.button>
  );
}

export function IconButton({
  icon,
  label,
  tone = 'soft',
  size = 40,
  className = '',
  ...rest
}: { icon: string; label: string; tone?: 'soft' | 'plain' | 'glass' | 'danger'; size?: number } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const tones = {
    soft: 'bg-surface-3 text-ink hover:bg-hairline',
    plain: 'text-ink-soft hover:bg-surface-3',
    glass: 'bg-white/12 text-white hover:bg-white/20 backdrop-blur-md',
    danger: 'bg-rose-brand/12 text-rose-brand hover:bg-rose-brand/20',
  }[tone];
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`grid place-items-center rounded-2xl transition-colors ${tones} ${className}`}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      <Icon name={icon} size={Math.round(size * 0.45)} />
    </motion.button>
  );
}

export function Chip({
  active,
  children,
  onClick,
  color,
  className = '',
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  color?: string;
  className?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      type="button"
      onClick={onClick}
      style={active && color ? { backgroundColor: color, borderColor: color } : undefined}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
        active
          ? color
            ? 'text-white border-transparent'
            : 'bg-navy-700 text-white border-navy-700 dark:bg-sky-accent dark:text-navy-950 dark:border-sky-accent'
          : 'border-hairline bg-surface text-ink-soft hover:text-ink'
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function Badge({ children, tone = 'navy', className = '' }: { children: ReactNode; tone?: 'navy' | 'teal' | 'sky' | 'emerald' | 'amber' | 'rose' | 'mute'; className?: string }) {
  const tones = {
    navy: 'bg-navy-700/10 text-navy-700 dark:bg-navy-300/15 dark:text-navy-200',
    teal: 'bg-teal-brand/12 text-teal-brand dark:text-teal-soft',
    sky: 'bg-sky-accent/14 text-sky-600 dark:text-sky-accent',
    emerald: 'bg-emerald-brand/14 text-emerald-600 dark:text-emerald-brand',
    amber: 'bg-amber-brand/16 text-amber-600 dark:text-amber-brand',
    rose: 'bg-rose-brand/14 text-rose-600 dark:text-rose-brand',
    mute: 'bg-surface-3 text-ink-mute',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${tones} ${className}`}>
      {children}
    </span>
  );
}

/* --------------------------------- inputs -------------------------------- */

export function Field({ label, hint, children, className = '' }: { label?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">{label}</span> : null}
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] text-ink-mute">{hint}</span> : null}
    </label>
  );
}

const inputBase =
  'w-full rounded-2xl border border-hairline bg-surface-2 px-3.5 py-3 text-[14.5px] text-ink placeholder:text-ink-mute outline-none transition focus:border-sky-accent focus:bg-surface focus:ring-4 focus:ring-sky-accent/12';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = '', ...rest },
  ref,
) {
  return <input ref={ref} className={`${inputBase} ${className}`} {...rest} />;
});

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputBase} min-h-[96px] resize-y ${className}`} {...rest} />;
}

export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={`${inputBase} appearance-none pr-10 ${className}`} {...rest}>
        {children}
      </select>
      <Icon name="chevronDown" size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-teal-brand' : 'bg-hairline'}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 620, damping: 34 }}
        className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-md"
        style={{ left: checked ? 26 : 4 }}
      />
    </button>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className = '',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: string }[];
  className?: string;
}) {
  const id = useId();
  return (
    <div className={`flex rounded-2xl bg-surface-3 p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors ${
            value === o.value ? 'text-navy-700 dark:text-white' : 'text-ink-mute hover:text-ink-soft'
          }`}
        >
          {value === o.value ? (
            <motion.span
              layoutId={`seg-${id}`}
              transition={{ type: 'spring', stiffness: 480, damping: 38 }}
              className="absolute inset-0 rounded-xl bg-surface shadow-sm"
            />
          ) : null}
          <span className="relative z-10 flex items-center gap-1.5">
            {o.icon ? <Icon name={o.icon} size={15} /> : null}
            {o.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ overlays -------------------------------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy-950/55 backdrop-blur-[3px]"
          />
          <motion.div
            initial={{ y: '100%', opacity: 0.6, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0.4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => info.offset.y > 140 && onClose()}
            className={`relative z-10 flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-[28px] border border-hairline bg-surface shadow-float sm:rounded-[28px]`}
          >
            <div className="flex shrink-0 flex-col items-center pt-2.5 sm:hidden">
              <span className="h-1.5 w-10 rounded-full bg-hairline" />
            </div>
            {title ? (
              <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-3">
                <h3 className="text-[17px] font-bold text-ink">{title}</h3>
                <IconButton icon="x" label="Close" tone="plain" size={34} onClick={onClose} />
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
            {footer ? <div className="shrink-0 border-t border-hairline bg-surface-2 p-4 safe-bottom">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] grid place-items-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-navy-950/60 backdrop-blur-[3px]" />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="relative z-10 w-full max-w-sm rounded-3xl border border-hairline bg-surface p-5 shadow-float"
          >
            <div className={`mb-3 grid h-11 w-11 place-items-center rounded-2xl ${tone === 'danger' ? 'bg-rose-brand/12 text-rose-brand' : 'bg-sky-accent/14 text-sky-accent'}`}>
              <Icon name={tone === 'danger' ? 'alert' : 'info'} size={22} />
            </div>
            <h3 className="text-[17px] font-bold text-ink">{title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{message}</p>
            <div className="mt-5 flex gap-2.5">
              <Button variant="soft" block onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant={tone === 'danger' ? 'danger' : 'primary'}
                block
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------ states ---------------------------------- */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`hv-shimmer rounded-2xl ${className}`} />;
}

export function EmptyState({
  title,
  message,
  action,
  variant = 'box',
}: {
  title: string;
  message: string;
  action?: ReactNode;
  variant?: 'box' | 'search' | 'shield' | 'chart' | 'heart';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center px-6 py-12 text-center"
    >
      <HomeIllustration variant={variant} />
      <h3 className="mt-5 text-[17px] font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-xs text-[13.5px] leading-relaxed text-ink-soft">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  );
}

export function HomeIllustration({ variant = 'box', size = 168 }: { variant?: 'box' | 'search' | 'shield' | 'chart' | 'heart'; size?: number }) {
  const accents: Record<string, string> = { box: '#38BDF8', search: '#0F766E', shield: '#10B981', chart: '#F59E0B', heart: '#EC4899' };
  const accent = accents[variant] ?? '#38BDF8';
  return (
    <motion.svg
      width={size}
      height={size * 0.78}
      viewBox="0 0 220 172"
      fill="none"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <ellipse cx="110" cy="150" rx="82" ry="12" fill={accent} opacity="0.12" />
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M42 78 110 30l68 48v58a8 8 0 0 1-8 8H50a8 8 0 0 1-8-8z" fill="currentColor" className="text-surface-3" />
        <path d="M32 80 110 24l78 56" stroke="#1E3A5F" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-navy-200" />
        <rect x="92" y="104" width="36" height="40" rx="5" fill={accent} opacity="0.9" />
        <rect x="58" y="94" width="24" height="22" rx="5" fill="currentColor" className="text-surface" opacity="0.85" />
        <rect x="138" y="94" width="24" height="22" rx="5" fill="currentColor" className="text-surface" opacity="0.85" />
      </motion.g>
      <motion.circle cx="176" cy="44" r="9" fill={accent} animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.circle cx="40" cy="40" r="6" fill="#0F766E" animate={{ y: [0, 7, 0], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
      <motion.rect x="18" y="104" width="14" height="14" rx="4" fill="#38BDF8" opacity="0.55" animate={{ rotate: [0, 16, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
    </motion.svg>
  );
}

export function ProgressBar({ value, tone = '#0F766E' }: { value: number; tone?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        className="h-full rounded-full"
        style={{ background: tone }}
      />
    </div>
  );
}

export function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <div
      className="grid shrink-0 place-items-center rounded-2xl font-bold text-white"
      style={{ width: size, height: size, background: `linear-gradient(140deg, ${color}, #1E3A5F)`, fontSize: size * 0.36 }}
    >
      {letters || 'HV'}
    </div>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-3 flex items-end justify-between px-0.5">
      <h2 className="text-[16px] font-bold text-ink">{title}</h2>
      {action ? (
        <button onClick={onAction} className="flex items-center gap-0.5 text-[12.5px] font-semibold text-teal-brand dark:text-sky-accent">
          {action}
          <Icon name="chevronRight" size={14} />
        </button>
      ) : null}
    </div>
  );
}
