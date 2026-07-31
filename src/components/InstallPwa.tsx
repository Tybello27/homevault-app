import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { usePwa } from '@/hooks/usePwa';
import { runInstallDiagnostics, type DiagnosticCheck } from '@/lib/pwa';
import { Button } from './ui';
import { Icon, Logo } from './icons';

/*
 * Install flow:
 *
 *   Android/Desktop Chrome/Edge:
 *     - `beforeinstallprompt` fires → we store the deferred event
 *     - A large, unmissable install popup appears automatically
 *     - User taps "Install HomeVault" → we call deferredPrompt.prompt()
 *     - Chrome's native install dialog opens → user confirms → app installs
 *     - `appinstalled` fires → UI shows "✓ HomeVault Installed"
 *
 *   iPhone Safari:
 *     - Show Add to Home Screen instructions (no beforeinstallprompt on iOS)
 *
 *   Already installed:
 *     - Show "✓ HomeVault Installed"
 */

/* ──────────── Big install popup — appears automatically on phones & desktop ──────────── */

export function InstallPopup() {
  const { canInstall, installed, iosSafari, installing, install } = usePwa();
  const [dismissed, setDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Show iOS guide after a short delay on first visit
  useEffect(() => {
    if (!iosSafari || installed) return;
    const shown = sessionStorage.getItem('hv_ios_shown');
    if (shown) return;
    const t = setTimeout(() => {
      setShowIosGuide(true);
      sessionStorage.setItem('hv_ios_shown', '1');
    }, 2000);
    return () => clearTimeout(t);
  }, [iosSafari, installed]);

  // Don't show if already installed
  if (installed) return null;

  // Show the big popup when beforeinstallprompt has fired
  const showInstall = canInstall && !dismissed;

  // Show iOS guide
  const showIos = iosSafari && showIosGuide && !dismissed;

  if (!showInstall && !showIos) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="install-popup"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setDismissed(true)}
          className="absolute inset-0 bg-navy-950/60 backdrop-blur-[4px]"
        />

        {/* Popup card */}
        <motion.div
          initial={{ y: 200, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 200, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          className="relative z-10 w-full max-w-sm mx-3 overflow-hidden rounded-[28px] border border-hairline bg-surface shadow-float sm:mx-0"
        >
          {/* Header with gradient */}
          <div className="hv-gradient-hero px-6 pb-6 pt-8 text-center text-white">
            <div className="mx-auto mb-4">
              <Logo size={64} rounded={20} />
            </div>
            <h2 className="font-display text-[22px] font-extrabold">Install HomeVault</h2>
            <p className="mt-1.5 text-[13.5px] text-white/75">
              Get the full app experience on your device
            </p>
          </div>

          <div className="px-6 pb-6 pt-5">
            {/* Benefits */}
            <div className="space-y-3 mb-6">
              {[
                { icon: 'sparkles', text: 'Opens full-screen like a native app' },
                { icon: 'globe', text: 'Works offline — no internet needed' },
                { icon: 'bell', text: 'Get warranty & maintenance reminders' },
                { icon: 'lock', text: 'Your data stays private on your device' },
              ].map((item) => (
                <div key={item.icon} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-teal-brand/12 text-teal-brand dark:text-teal-soft">
                    <Icon name={item.icon} size={16} strokeWidth={2} />
                  </span>
                  <span className="text-[13px] font-medium text-ink">{item.text}</span>
                </div>
              ))}
            </div>

            {showInstall ? (
              <>
                {/* THE install button — tapping this opens Chrome's native install dialog */}
                <Button
                  block
                  size="lg"
                  icon="download"
                  onClick={() => void install()}
                  disabled={installing}
                  className="!h-14 !text-[16px]"
                >
                  {installing ? 'Installing…' : 'Install HomeVault'}
                </Button>
                <button
                  onClick={() => setDismissed(true)}
                  className="mt-3 w-full py-2 text-center text-[13px] font-semibold text-ink-mute transition hover:text-ink"
                >
                  Not now
                </button>
              </>
            ) : showIos ? (
              <>
                <div className="rounded-2xl border border-hairline bg-surface-2 p-4">
                  <p className="text-[14px] font-bold text-ink mb-3">
                    Add to Home Screen
                  </p>
                  <ol className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-accent text-[12px] font-bold text-white">1</span>
                      <span className="text-[13px] text-ink-soft pt-0.5">
                        Tap the <strong className="text-ink">Share</strong> button
                        <span className="mx-1 inline-flex translate-y-0.5">
                          <Icon name="share" size={15} className="text-sky-accent" />
                        </span>
                        in Safari
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-accent text-[12px] font-bold text-white">2</span>
                      <span className="text-[13px] text-ink-soft pt-0.5">
                        Scroll and tap <strong className="text-ink">"Add to Home Screen"</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-accent text-[12px] font-bold text-white">3</span>
                      <span className="text-[13px] text-ink-soft pt-0.5">
                        Tap <strong className="text-ink">"Add"</strong> — HomeVault appears on your Home Screen
                      </span>
                    </li>
                  </ol>
                </div>
                <button
                  onClick={() => setDismissed(true)}
                  className="mt-3 w-full py-2 text-center text-[13px] font-semibold text-ink-mute"
                >
                  Got it
                </button>
              </>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ──────────── Compact installed badge ──────────── */

function InstalledBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-brand/12 px-4 py-3.5 text-[14.5px] font-bold text-emerald-600 dark:text-emerald-brand"
    >
      <Icon name="checkCircle" size={19} strokeWidth={2.3} />
      HomeVault Installed
    </motion.div>
  );
}

/* ──────────── Settings page card ──────────── */

export function InstallCard() {
  const { canInstall, installed, iosSafari, installing, install, offlineReady, swRegistered } = usePwa();

  return (
    <div className="overflow-hidden rounded-3xl border border-hairline bg-surface shadow-card">
      <div className="hv-gradient-hero p-5 text-white">
        <div className="flex items-center gap-3">
          <Logo size={46} rounded={16} />
          <div className="min-w-0">
            <p className="font-display text-[16px] font-extrabold">HomeVault App</p>
            <p className="flex items-center gap-1.5 text-[12.5px] text-white/70">
              {offlineReady ? (
                <><span className="h-1.5 w-1.5 rounded-full bg-emerald-brand" /> Offline ready</>
              ) : swRegistered ? (
                <><span className="h-1.5 w-1.5 rounded-full bg-amber-brand" /> Setting up…</>
              ) : (
                'Full app for your device'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {installed ? (
          <InstalledBadge />
        ) : canInstall ? (
          <Button block size="lg" icon="download" onClick={() => void install()} disabled={installing}>
            {installing ? 'Installing…' : 'Install HomeVault'}
          </Button>
        ) : iosSafari ? (
          <div className="rounded-2xl border border-hairline bg-surface-2 p-4">
            <p className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
              <Icon name="share" size={16} />
              Add to Home Screen
            </p>
            <p className="mt-1.5 text-[12.5px] text-ink-soft">
              Tap Share → Add to Home Screen in Safari.
            </p>
          </div>
        ) : (
          <p className="text-[12.5px] text-ink-mute text-center py-2">
            Open in Chrome or Edge to install as an app.
          </p>
        )}
      </div>
    </div>
  );
}

/* ──────────── Dashboard hero button ──────────── */

export function InstallHeroButton() {
  const { canInstall, installed, installing, install } = usePwa();

  if (installed || !canInstall) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => void install()}
      disabled={installing}
      className="relative mt-3 flex w-full items-center gap-3 rounded-2xl bg-white/14 px-3.5 py-3 text-left backdrop-blur-md transition hover:bg-white/22 disabled:opacity-60"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20">
        <Icon name="download" size={18} strokeWidth={2.1} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold">{installing ? 'Installing…' : 'Install HomeVault'}</span>
        <span className="block truncate text-[11.5px] text-white/70">Add to home screen · works offline</span>
      </span>
      <Icon name="chevronRight" size={17} className="shrink-0 text-white/70" />
    </motion.button>
  );
}

/* ──────────── Desktop sidebar ──────────── */

export function SidebarInstall() {
  const { canInstall, installed, installing, install } = usePwa();

  if (installed) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-brand/12 py-2.5 text-[12px] font-bold text-emerald-600 dark:text-emerald-brand">
        <Icon name="checkCircle" size={15} strokeWidth={2.3} />
        HomeVault Installed
      </div>
    );
  }

  if (!canInstall) return null;

  return (
    <button
      onClick={() => void install()}
      disabled={installing}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-700 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-navy-800 disabled:opacity-50 dark:bg-sky-accent dark:text-navy-950"
    >
      <Icon name="download" size={15} strokeWidth={2.1} />
      Install HomeVault
    </button>
  );
}

/* ──────────── Diagnostics (Settings page) ──────────── */

export function InstallDiagnostics() {
  const pwa = usePwa();
  const [checks, setChecks] = useState<DiagnosticCheck[] | null>(null);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    try { setChecks(await runInstallDiagnostics()); } finally { setRunning(false); }
  }, []);

  useEffect(() => { if (open && !checks && !running) void run(); }, [open, checks, running, run]);
  useEffect(() => { if (open) void run(); }, [pwa.canInstall, pwa.installed, pwa.offlineReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const failures = checks?.filter((c) => c.status === 'fail').length ?? 0;

  return (
    <div className="rounded-3xl border border-hairline bg-surface shadow-card">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-3 text-ink-soft">
          <Icon name="shield" size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-bold text-ink">Installability diagnostics</span>
          <span className="block truncate text-[11.5px] text-ink-mute">
            {checks ? (failures ? `${failures} issue${failures > 1 ? 's' : ''} found` : 'All requirements met ✓') : 'Tap to check'}
          </span>
        </span>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={17} className="shrink-0 text-ink-mute" />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-hairline p-4">
              <div className="mb-3 rounded-2xl bg-surface-2 p-3">
                <p className="text-[11.5px] font-semibold text-ink-soft">Live PWA state</p>
                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  {(['canInstall', 'installed', 'swRegistered', 'offlineReady', 'embedded', 'iosSafari'] as const).map(k => (
                    <><span key={`l-${k}`} className="text-ink-mute">{k}:</span><span key={`v-${k}`} className={`font-bold ${pwa[k] ? 'text-emerald-brand' : 'text-ink'}`}>{String(pwa[k])}</span></>
                  ))}
                </div>
              </div>
              {running && !checks ? (
                <p className="py-4 text-center text-[12.5px] text-ink-mute">Running checks…</p>
              ) : (
                <ul className="space-y-2">
                  {checks?.map((c) => (
                    <li key={c.id} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                        c.status === 'pass' ? 'bg-emerald-brand/15 text-emerald-brand' :
                        c.status === 'fail' ? 'bg-rose-brand/15 text-rose-brand' : 'bg-sky-accent/15 text-sky-accent'
                      }`}>
                        <Icon name={c.status === 'pass' ? 'check' : c.status === 'fail' ? 'x' : 'info'} size={11} strokeWidth={2.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-semibold text-ink">{c.label}</span>
                        <span className="block break-words text-[11px] text-ink-mute">{c.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="soft" size="sm" block className="mt-3" icon="refresh" onClick={() => void run()} disabled={running}>
                {running ? 'Checking…' : 'Re-run'}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ──────────── Update banner ──────────── */

export function UpdateBanner() {
  const { updateReady, update } = usePwa();
  const [applying, setApplying] = useState(false);
  return (
    <AnimatePresence>
      {updateReady ? (
        <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} className="fixed inset-x-3 top-3 z-[95] mx-auto max-w-md safe-top">
          <div className="flex items-center gap-3 rounded-3xl border border-hairline bg-surface p-3 shadow-float">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-sky-accent/14 text-sky-accent"><Icon name="refresh" size={17} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-ink">Update available</p>
              <p className="truncate text-[11.5px] text-ink-mute">Reload to get the newest HomeVault.</p>
            </div>
            <Button size="sm" onClick={() => { setApplying(true); void update(); }} disabled={applying}>{applying ? 'Updating…' : 'Reload'}</Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
