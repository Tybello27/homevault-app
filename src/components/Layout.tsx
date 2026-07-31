import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { Icon, Logo } from './icons';
import { IconButton, Sheet } from './ui';
import { useStore } from '@/store/AppStore';
import { InstallPopup, SidebarInstall, UpdateBanner } from './InstallPwa';
import { useOnlineStatus } from '@/hooks/usePwa';

export const NAV_PRIMARY = [
  { to: '/', label: 'Dashboard', icon: 'home' },
  { to: '/inventory', label: 'Inventory', icon: 'boxes' },
  { to: '/warranties', label: 'Warranty', icon: 'shield' },
  { to: '/analytics', label: 'Analytics', icon: 'chart' },
];

export const NAV_SECONDARY = [
  { to: '/search', label: 'Search', icon: 'search' },
  { to: '/categories', label: 'Categories', icon: 'layers' },
  { to: '/scan', label: 'Scan Code', icon: 'scan' },
  { to: '/favorites', label: 'Favourites', icon: 'heart' },
  { to: '/maintenance', label: 'Maintenance', icon: 'wrench' },
  { to: '/profile', label: 'Profile', icon: 'user' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  sticky = true,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  sticky?: boolean;
}) {
  return (
    <header className={`${sticky ? 'sticky top-0 z-30' : ''} hv-glass -mx-4 mb-4 border-b border-hairline px-4 py-3 safe-top lg:-mx-8 lg:px-8`}>
      <div className="flex items-center gap-3">
        {onBack ? <IconButton icon="chevronLeft" label="Back" tone="soft" size={38} onClick={onBack} /> : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[19px] font-extrabold leading-tight text-ink">{title}</h1>
          {subtitle ? <p className="truncate text-[12px] text-ink-mute">{subtitle}</p> : null}
        </div>
        {right}
      </div>
    </header>
  );
}

export function AppShell({
  route,
  navigate,
  children,
}: {
  route: string;
  navigate: (to: string) => void;
  children: ReactNode;
}) {
  const { toasts, dismissToast, data } = useStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const online = useOnlineStatus();
  const base = `/${route.split('/')[1] ?? ''}`;

  const isActive = (to: string) => (to === '/' ? route === '/' : base === to);

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-hairline bg-surface px-4 py-5 lg:flex">
        <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-3 px-1 text-left">
          <Logo size={42} rounded={15} />
          <div>
            <p className="font-display text-[17px] font-extrabold leading-none text-ink">HomeVault</p>
            <p className="mt-1 text-[11px] font-medium text-ink-mute">Home Inventory</p>
          </div>
        </button>

        <nav className="space-y-1">
          {NAV_PRIMARY.map((n) => (
            <SideLink key={n.to} {...n} active={isActive(n.to)} onClick={() => navigate(n.to)} />
          ))}
        </nav>
        <p className="mb-2 mt-6 px-3 text-[10.5px] font-bold uppercase tracking-widest text-ink-mute">Manage</p>
        <nav className="space-y-1">
          {NAV_SECONDARY.map((n) => (
            <SideLink key={n.to} {...n} active={isActive(n.to)} onClick={() => navigate(n.to)} />
          ))}
        </nav>

        <div className="mt-auto space-y-3 pt-6">
          <SidebarInstall />
          <div className="flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2.5">
            <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-brand' : 'bg-amber-brand'}`} />
            <span className="text-[11.5px] font-semibold text-ink-soft">{online ? 'Synced locally' : 'Offline mode'}</span>
          </div>
          <button
            onClick={() => navigate('/add')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-700 py-3 text-[13.5px] font-bold text-white transition hover:bg-navy-800 dark:bg-sky-accent dark:text-navy-950"
          >
            <Icon name="plus" size={17} strokeWidth={2.4} />
            Add item
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="relative min-w-0 flex-1">
        <main className="mx-auto w-full max-w-[560px] px-4 pb-32 lg:max-w-[1080px] lg:px-8 lg:pb-14 lg:pt-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
          <div className="mx-auto max-w-[560px] px-3 pb-3 safe-bottom">
            <div className="relative flex items-center justify-between rounded-[26px] border border-hairline bg-surface/95 px-2 py-2 shadow-float backdrop-blur-xl">
              <TabButton icon="home" label="Home" active={isActive('/')} onClick={() => navigate('/')} />
              <TabButton icon="boxes" label="Items" active={isActive('/inventory')} onClick={() => navigate('/inventory')} />
              <div className="w-14" />
              <TabButton icon="chart" label="Stats" active={isActive('/analytics')} onClick={() => navigate('/analytics')} />
              <TabButton icon="menu" label="More" active={moreOpen} onClick={() => setMoreOpen(true)} />

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/add')}
                aria-label="Add inventory item"
                className="absolute -top-6 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full text-white shadow-[0_14px_30px_-8px_rgba(30,58,95,0.75)]"
                style={{ background: 'linear-gradient(150deg,#1E3A5F,#0F766E)' }}
              >
                <Icon name="plus" size={26} strokeWidth={2.4} />
              </motion.button>
            </div>
          </div>
        </nav>

        <InstallPopup />
        <UpdateBanner />
      </div>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="grid grid-cols-3 gap-2.5 pb-2">
          {[...NAV_PRIMARY.slice(2), ...NAV_SECONDARY].map((n) => (
            <button
              key={n.to}
              onClick={() => {
                setMoreOpen(false);
                navigate(n.to);
              }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface-2 px-2 py-4 transition active:scale-95"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-700/8 text-navy-700 dark:bg-sky-accent/14 dark:text-sky-accent">
                <Icon name={n.icon} size={19} />
              </span>
              <span className="text-[11.5px] font-semibold text-ink">{n.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-2xl bg-surface-2 px-3.5 py-3">
          <Logo size={34} rounded={12} />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold text-ink">{data.items.length} items tracked</p>
            <p className="text-[11px] text-ink-mute">HomeVault v1.0 · Data stored on this device</p>
          </div>
        </div>
      </Sheet>

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex flex-col items-center gap-2 px-4 safe-top">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -22, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-2xl border border-hairline bg-surface px-3.5 py-3 shadow-float"
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                  t.tone === 'success'
                    ? 'bg-emerald-brand/14 text-emerald-brand'
                    : t.tone === 'danger'
                      ? 'bg-rose-brand/14 text-rose-brand'
                      : t.tone === 'warning'
                        ? 'bg-amber-brand/16 text-amber-brand'
                        : 'bg-sky-accent/14 text-sky-accent'
                }`}
              >
                <Icon name={t.tone === 'danger' ? 'alert' : t.tone === 'success' ? 'check' : 'info'} size={15} strokeWidth={2.2} />
              </span>
              <p className="min-w-0 flex-1 text-[13px] font-semibold text-ink">{t.message}</p>
              {t.action ? (
                <button
                  onClick={() => {
                    t.action?.run();
                    dismissToast(t.id);
                  }}
                  className="shrink-0 text-[12px] font-bold text-teal-brand dark:text-sky-accent"
                >
                  {t.action.label}
                </button>
              ) : null}
              <button aria-label="Dismiss" onClick={() => dismissToast(t.id)} className="shrink-0 text-ink-mute">
                <Icon name="x" size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SideLink({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[13.5px] font-semibold transition ${
        active ? 'text-navy-700 dark:text-white' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
      }`}
    >
      {active ? (
        <motion.span layoutId="side-active" transition={{ type: 'spring', stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-2xl bg-navy-700/8 dark:bg-sky-accent/14" />
      ) : null}
      <span className="relative z-10 flex items-center gap-3">
        <Icon name={icon} size={18} strokeWidth={active ? 2.1 : 1.7} />
        {label}
      </span>
    </button>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative flex w-[62px] flex-col items-center gap-0.5 py-1.5" aria-label={label}>
      <motion.span animate={{ y: active ? -1 : 0, scale: active ? 1.06 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 24 }}>
        <Icon
          name={icon}
          size={21}
          strokeWidth={active ? 2.2 : 1.7}
          className={active ? 'text-navy-700 dark:text-sky-accent' : 'text-ink-mute'}
        />
      </motion.span>
      <span className={`text-[10px] font-bold ${active ? 'text-navy-700 dark:text-sky-accent' : 'text-ink-mute'}`}>{label}</span>
      {active ? <motion.span layoutId="tab-dot" className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-teal-brand dark:bg-sky-accent" /> : null}
    </button>
  );
}
