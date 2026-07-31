import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  applyUpdate,
  getPwaState,
  getServerPwaState,
  promptInstall,
  subscribePwa,
  type PwaState,
} from '@/lib/pwa';

export { isEmbedded, isIosSafari, isStandalone, initPwa } from '@/lib/pwa';

export interface UsePwa extends PwaState {
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  update: () => Promise<void>;
}

/** Shared, real PWA state — identical across every component that reads it. */
export function usePwa(): UsePwa {
  const state = useSyncExternalStore(subscribePwa, getPwaState, getServerPwaState);
  return { ...state, install: promptInstall, update: applyUpdate };
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

export function useHashRoute(): [string, (to: string) => void] {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#/, '') || '/');
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace(/^#/, '') || '/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const navigate = useCallback((to: string) => {
    if (window.location.hash.replace(/^#/, '') === to) return;
    window.location.hash = to;
  }, []);
  return [route, navigate];
}
