/**
 * HomeVault PWA runtime.
 *
 * A single module-level store shared by every install surface, seeded from the
 * `window.__hvPwa` bridge in index.html so a `beforeinstallprompt` that fires
 * before React mounts is never lost.
 */

export interface PwaState {
  /** True only after a real `beforeinstallprompt` event has been captured. */
  canInstall: boolean;
  /** True once the app runs standalone or `appinstalled` has fired. */
  installed: boolean;
  installing: boolean;
  iosSafari: boolean;
  embedded: boolean;
  swRegistered: boolean;
  /** True once a service worker controls this page (offline is ready). */
  offlineReady: boolean;
  /** True when a new service worker is waiting to take over. */
  updateReady: boolean;
}

type Listener = () => void;

interface PwaBridge {
  deferred: BeforeInstallPromptEvent | null;
  installed: boolean;
}

const listeners = new Set<Listener>();

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let started = false;
let updateAccepted = false;
let reloading = false;

let state: PwaState = {
  canInstall: false,
  installed: false,
  installing: false,
  iosSafari: false,
  embedded: false,
  swRegistered: false,
  offlineReady: false,
  updateReady: false,
};

const serverState: PwaState = { ...state };

function set(patch: Partial<PwaState>) {
  let changed = false;
  for (const key of Object.keys(patch) as (keyof PwaState)[]) {
    if (state[key] !== patch[key]) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...patch };
  console.log('[HomeVault PWA]', JSON.stringify(state));
  listeners.forEach((listener) => listener());
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** iPhone/iPad Safari only — the one engine without `beforeinstallprompt`. */
export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!iOS) return false;
  const isWebKit = /WebKit/.test(ua);
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|Brave/.test(ua);
  return isWebKit && !isOtherBrowser;
}

function markInstalled() {
  deferredPrompt = null;
  set({ installed: true, canInstall: false, installing: false });
}

/**
 * Resolves an app asset from the origin root.
 * The app is served at `/` and uses hash routing, but SPA rewrites can deliver
 * the document at any path depth — resolving against the document would then
 * produce URLs like `/dashboard/icon-192.png`, which 404.
 */
export function assetUrl(path: string): string {
  return new URL(path.startsWith('/') ? path : `/${path}`, window.location.origin).href;
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const run = async () => {
    try {
      const registration = await navigator.serviceWorker.register(assetUrl('/sw.js'), {
        scope: assetUrl('/'),
        // Always revalidate the worker script itself so updates are never masked by HTTP cache.
        updateViaCache: 'none',
      });
      set({ swRegistered: true });

      if (navigator.serviceWorker.controller) set({ offlineReady: true });
      if (registration.waiting && navigator.serviceWorker.controller) set({ updateReady: true });

      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            set({ updateReady: true });
          }
          if (installingWorker.state === 'activated') set({ offlineReady: true });
        });
      });

      await navigator.serviceWorker.ready;
      set({ offlineReady: true });

      // Check for a new release once an hour while the tab stays open.
      window.setInterval(() => void registration.update().catch(() => undefined), 60 * 60 * 1000);
    } catch {
      /* registration blocked (private mode / unsupported) — app still works online */
    }
  };

  // When the SW takes control for the first time (first visit), Chrome needs
  // to see a controlled page before it evaluates installability. A soft reload
  // after the SW claims gives Chrome exactly that — `beforeinstallprompt` then
  // fires on the reloaded page.
  const hadController = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    set({ offlineReady: true });

    if (updateAccepted && !reloading) {
      reloading = true;
      window.location.reload();
      return;
    }

    // First-time SW activation: reload so Chrome sees a controlled page
    // and evaluates installability. Only do this once.
    if (!hadController && !reloading && !state.canInstall) {
      const alreadyReloaded = sessionStorage.getItem('hv_sw_reload');
      if (!alreadyReloaded) {
        sessionStorage.setItem('hv_sw_reload', '1');
        reloading = true;
        console.log('[HomeVault PWA] SW took control for the first time — reloading for installability check');
        window.location.reload();
      }
    }
  });

  // Register immediately. Chrome evaluates installability once a fetch-handling
  // service worker is registered, so deferring this to `load` delays the prompt.
  void run();
}

/* ------------------------------ diagnostics ------------------------------ */

export interface DiagnosticCheck {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'info';
  detail: string;
}

async function fetchOk(url: string): Promise<{ ok: boolean; status: number; type: string }> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    return { ok: res.ok, status: res.status, type: res.headers.get('content-type') ?? '' };
  } catch {
    return { ok: false, status: 0, type: '' };
  }
}

/**
 * Measures every Chromium installability requirement against the live page.
 * Purely a debugging report — it never renders an install control.
 */
export async function runInstallDiagnostics(): Promise<DiagnosticCheck[]> {
  const checks: DiagnosticCheck[] = [];
  const add = (id: string, label: string, status: DiagnosticCheck['status'], detail: string) =>
    checks.push({ id, label, status, detail });

  add(
    'https',
    'Secure context (HTTPS)',
    window.isSecureContext ? 'pass' : 'fail',
    window.location.protocol === 'https:' || window.location.hostname === 'localhost'
      ? window.location.origin
      : `${window.location.protocol}// is not installable`,
  );

  const embedded = isEmbedded();
  add(
    'frame',
    'Top-level browsing context',
    embedded ? 'fail' : 'pass',
    embedded ? 'Running inside an iframe — Chrome never fires the prompt here' : 'Not embedded',
  );

  const ua = navigator.userAgent;
  const chromium = /Chrome|Chromium|Edg|CriOS/.test(ua) && !/OPR|Firefox/.test(ua);
  add(
    'engine',
    'Browser supports installation',
    chromium ? 'pass' : 'info',
    chromium
      ? 'Chromium-based browser'
      : isIosSafari()
        ? 'iOS Safari — installs via Share ▸ Add to Home Screen'
        : 'This browser does not implement beforeinstallprompt',
  );

  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  add('manifest-link', 'Manifest is linked', link ? 'pass' : 'fail', link?.getAttribute('href') ?? 'missing <link rel="manifest">');

  let manifest: Record<string, unknown> | null = null;
  if (link) {
    const href = link.href;
    const res = await fetchOk(href);
    add('manifest-fetch', 'Manifest loads', res.ok ? 'pass' : 'fail', res.ok ? `HTTP ${res.status}` : `HTTP ${res.status || 'network error'}`);
    if (res.ok) {
      try {
        manifest = (await (await fetch(href, { cache: 'no-store' })).json()) as Record<string, unknown>;
        add('manifest-parse', 'Manifest is valid JSON', 'pass', String(manifest.name ?? ''));
      } catch (err) {
        add('manifest-parse', 'Manifest is valid JSON', 'fail', err instanceof Error ? err.message : 'parse error');
      }
    }
  }

  if (manifest) {
    const required = ['name', 'short_name', 'start_url', 'display', 'icons'] as const;
    const missing = required.filter((field) => manifest?.[field] === undefined);
    add('manifest-fields', 'Required manifest fields', missing.length ? 'fail' : 'pass', missing.length ? `missing: ${missing.join(', ')}` : 'all present');

    const display = String(manifest.display ?? '');
    add(
      'manifest-display',
      'Display mode is installable',
      ['standalone', 'fullscreen', 'minimal-ui'].includes(display) ? 'pass' : 'fail',
      display || 'not set',
    );

    const icons = Array.isArray(manifest.icons) ? (manifest.icons as { src: string; sizes?: string; purpose?: string }[]) : [];
    const need = ['192x192', '512x512'];
    for (const size of need) {
      const icon = icons.find((i) => (i.sizes ?? '').split(' ').includes(size) && (!i.purpose || i.purpose.includes('any')));
      if (!icon) {
        add(`icon-${size}`, `Icon ${size}`, 'fail', 'not declared in manifest');
        continue;
      }
      const url = new URL(icon.src, window.location.origin).href;
      const res = await fetchOk(url);
      add(
        `icon-${size}`,
        `Icon ${size}`,
        res.ok && res.type.includes('image/png') ? 'pass' : 'fail',
        res.ok ? `${icon.src} · ${res.type}` : `${icon.src} · HTTP ${res.status || 'unreachable'}`,
      );
    }

    const startUrl = new URL(String(manifest.start_url ?? '/'), window.location.origin).href;
    const start = await fetchOk(startUrl);
    add('start-url', 'start_url responds', start.ok ? 'pass' : 'fail', `HTTP ${start.status || 'unreachable'}`);
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    add('sw-register', 'Service worker registered', registration ? 'pass' : 'fail', registration ? `scope ${registration.scope}` : 'no registration found');
    add(
      'sw-control',
      'Service worker controls this page',
      navigator.serviceWorker.controller ? 'pass' : 'info',
      navigator.serviceWorker.controller ? 'Offline ready' : 'Activates on next load',
    );
    const sw = await fetchOk(assetUrl('sw.js'));
    add('sw-file', 'Service worker script served', sw.ok ? 'pass' : 'fail', sw.ok ? sw.type || 'ok' : `HTTP ${sw.status || 'unreachable'}`);
  } else {
    add('sw-register', 'Service worker registered', 'fail', 'serviceWorker unsupported in this browser');
  }

  const standalone = isStandalone();
  add('standalone', 'Already installed', standalone ? 'info' : 'pass', standalone ? 'Running in standalone mode' : 'Running in a browser tab');

  add(
    'prompt',
    'Install prompt received',
    state.canInstall ? 'pass' : 'info',
    state.canInstall ? 'beforeinstallprompt captured' : standalone ? 'Not applicable — already installed' : 'Not received from the browser yet',
  );

  return checks;
}

export function initPwa() {
  if (started || typeof window === 'undefined') return;
  started = true;

  const bridge = (window as unknown as { __hvPwa?: PwaBridge }).__hvPwa;
  deferredPrompt = bridge?.deferred ?? null;
  const standalone = isStandalone();

  const embedded = isEmbedded();
  console.log('[HomeVault PWA] initPwa: standalone=%s, embedded=%s, bridgeDeferred=%s, iosSafari=%s',
    standalone, embedded, Boolean(bridge?.deferred), isIosSafari());

  set({
    installed: standalone || Boolean(bridge?.installed),
    canInstall: Boolean(deferredPrompt) && !standalone,
    iosSafari: isIosSafari(),
    embedded,
  });

  const onBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    console.log('[HomeVault PWA] beforeinstallprompt fired!');
    if (!isStandalone()) set({ canInstall: true, installed: false });
  };

  const onBridgeInstallable = () => {
    const current = (window as unknown as { __hvPwa?: PwaBridge }).__hvPwa;
    deferredPrompt = current?.deferred ?? deferredPrompt;
    if (deferredPrompt && !isStandalone()) set({ canInstall: true });
  };

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('hv:installable', onBridgeInstallable);
  window.addEventListener('appinstalled', markInstalled);
  window.addEventListener('hv:installed', markInstalled);

  const displayQuery = window.matchMedia('(display-mode: standalone)');
  displayQuery.addEventListener('change', (event) => {
    if (event.matches) markInstalled();
  });

  registerServiceWorker();
}

/** Fires the browser's native install dialog. Returns the user's real choice. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  set({ installing: true });
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (choice.outcome === 'accepted') {
      // `appinstalled` confirms it, but reflect the choice immediately.
      set({ installed: true, canInstall: false, installing: false });
    } else {
      set({ canInstall: false, installing: false });
    }
    return choice.outcome;
  } catch {
    deferredPrompt = null;
    set({ canInstall: false, installing: false });
    return 'unavailable';
  }
}

export async function applyUpdate() {
  if (!('serviceWorker' in navigator)) return;
  updateAccepted = true;
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  } else if (!reloading) {
    reloading = true;
    window.location.reload();
  }
}

export function subscribePwa(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPwaState(): PwaState {
  return state;
}

export function getServerPwaState(): PwaState {
  return serverState;
}
