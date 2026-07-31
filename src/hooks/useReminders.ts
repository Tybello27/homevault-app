import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppSettings, InventoryItem } from '@/lib/types';
import { daysUntil, formatDate } from '@/lib/format';
import { assetUrl } from '@/lib/pwa';

const SENT_KEY = 'homevault.reminders.v1';

export interface Reminder {
  id: string;
  kind: 'warranty' | 'maintenance';
  itemId: string;
  itemName: string;
  date: string;
  daysLeft: number;
  title: string;
  body: string;
}

function readSent(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

export function buildReminders(items: InventoryItem[], settings: AppSettings): Reminder[] {
  const out: Reminder[] = [];
  for (const item of items) {
    if (item.archived) continue;
    if (settings.warrantyReminders && item.warrantyExpiry) {
      const left = daysUntil(item.warrantyExpiry);
      if (left !== null && left <= settings.reminderLeadDays) {
        out.push({
          id: `w_${item.id}_${item.warrantyExpiry}`,
          kind: 'warranty',
          itemId: item.id,
          itemName: item.name,
          date: item.warrantyExpiry,
          daysLeft: left,
          title: left < 0 ? `Warranty expired: ${item.name}` : `Warranty expiring: ${item.name}`,
          body:
            left < 0
              ? `Cover ended ${formatDate(item.warrantyExpiry)} — consider an extended plan.`
              : `Only ${left} day${left === 1 ? '' : 's'} left (${formatDate(item.warrantyExpiry)}).`,
        });
      }
    }
    if (settings.maintenanceReminders) {
      for (const m of item.maintenance) {
        if (!m.nextDueDate) continue;
        const left = daysUntil(m.nextDueDate);
        if (left !== null && left <= settings.reminderLeadDays) {
          out.push({
            id: `m_${m.id}`,
            kind: 'maintenance',
            itemId: item.id,
            itemName: item.name,
            date: m.nextDueDate,
            daysLeft: left,
            title: `${m.type} due: ${item.name}`,
            body: left < 0 ? `Overdue since ${formatDate(m.nextDueDate)}.` : `Scheduled for ${formatDate(m.nextDueDate)}.`,
          });
        }
      }
    }
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function useNotificationPermission() {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    supported ? Notification.permission : 'denied',
  );
  const request = useCallback(async () => {
    if (!supported) return 'denied' as NotificationPermission;
    const p = await Notification.requestPermission();
    setPermission(p);
    return p;
  }, [supported]);
  return { supported, permission, request };
}

export function useReminders(items: InventoryItem[], settings: AppSettings) {
  const reminders = useMemo(() => buildReminders(items, settings), [items, settings]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!settings.warrantyReminders && !settings.maintenanceReminders) return;

    const sent = readSent();
    const now = Date.now();
    const dueSoon = reminders.filter((r) => r.daysLeft <= settings.reminderLeadDays);
    let changed = false;

    const fire = async () => {
      for (const r of dueSoon.slice(0, 3)) {
        const last = sent[r.id] ?? 0;
        if (now - last < 20 * 60 * 60 * 1000) continue;
        sent[r.id] = now;
        changed = true;
        try {
          const reg = await navigator.serviceWorker?.getRegistration();
          const options: NotificationOptions = {
            body: r.body,
            icon: assetUrl('icon-192.png'),
            badge: assetUrl('favicon-32x32.png'),
            tag: r.id,
            data: { url: assetUrl(`#/item/${r.itemId}`) },
          };
          if (reg) await reg.showNotification(r.title, options);
          else new Notification(r.title, options);
        } catch {
          /* notifications blocked */
        }
      }
      if (changed) localStorage.setItem(SENT_KEY, JSON.stringify(sent));
    };

    const timer = window.setTimeout(() => void fire(), 2500);
    return () => window.clearTimeout(timer);
  }, [reminders, settings]);

  return reminders;
}
