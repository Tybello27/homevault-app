import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { useStore } from '@/store/AppStore';
import { filterItems } from '@/lib/stats';
import { emptyFilters } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { Badge, Button, Card, Chip, EmptyState, Sheet } from '@/components/ui';
import { Icon } from '@/components/icons';
import { ScreenHeader } from '@/components/Layout';
import { ItemThumb } from '@/components/ItemCard';

/* --------------------------------- Search -------------------------------- */

export function SearchScreen({ navigate }: { navigate: (to: string) => void }) {
  const { data, addRecentSearch, clearRecentSearches } = useStore();
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const catMap = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 260);
    return () => window.clearTimeout(id);
  }, []);

  const results = useMemo(
    () =>
      query.trim() || activeCat
        ? filterItems(data, { ...emptyFilters, query, categoryIds: activeCat ? [activeCat] : [], sort: 'recent' })
        : [],
    [data, query, activeCat],
  );

  const commit = (term: string) => {
    setQuery(term);
    addRecentSearch(term);
  };

  return (
    <div className="pt-1">
      <ScreenHeader title="Search" subtitle={`Across ${data.items.length} items`} onBack={() => navigate('/')} />

      <div className="relative mb-4">
        <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => query.trim() && addRecentSearch(query)}
          placeholder="Search name, brand, serial, room…"
          className="w-full rounded-2xl border border-hairline bg-surface py-3.5 pl-12 pr-11 text-[14.5px] text-ink placeholder:text-ink-mute outline-none focus:border-sky-accent focus:ring-4 focus:ring-sky-accent/12"
        />
        {query ? (
          <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-mute" aria-label="Clear search">
            <Icon name="x" size={17} />
          </button>
        ) : null}
      </div>

      {!query && !activeCat ? (
        <div className="space-y-5">
          {data.recentSearches.length ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-bold text-ink">Recent searches</p>
                <button onClick={clearRecentSearches} className="text-[12px] font-semibold text-rose-brand">
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {data.recentSearches.map((s) => (
                  <button key={s} onClick={() => commit(s)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-surface-2">
                    <Icon name="clock" size={16} className="text-ink-mute" />
                    <span className="flex-1 text-[13.5px] text-ink-soft">{s}</span>
                    <Icon name="arrowRight" size={15} className="text-ink-mute" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-[13px] font-bold text-ink">Popular filters</p>
            <div className="flex flex-wrap gap-2">
              {['High value', 'Expiring warranty', 'Favourites', 'Recently added', 'Needs service'].map((f) => (
                <Chip
                  key={f}
                  onClick={() => {
                    if (f === 'Favourites') navigate('/favorites');
                    else if (f === 'Expiring warranty') navigate('/warranties');
                    else if (f === 'Needs service') navigate('/maintenance');
                    else navigate('/inventory');
                  }}
                >
                  {f}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-bold text-ink">Browse by category</p>
            <div className="grid grid-cols-2 gap-2.5">
              {data.categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className="flex items-center gap-2.5 rounded-2xl border border-hairline bg-surface p-3 text-left shadow-card"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ background: c.color }}>
                    <Icon name={c.icon} size={17} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-ink">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12.5px] font-semibold text-ink-soft">
              {results.length} result{results.length === 1 ? '' : 's'}
              {activeCat ? ` in ${catMap.get(activeCat)?.name}` : ''}
            </p>
            {activeCat ? (
              <button onClick={() => setActiveCat(null)} className="text-[12px] font-bold text-teal-brand dark:text-sky-accent">
                Clear category
              </button>
            ) : null}
          </div>
          {results.length ? (
            <div className="space-y-2.5">
              {results.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.25) }}
                  onClick={() => {
                    addRecentSearch(query || catMap.get(activeCat ?? '')?.name || '');
                    navigate(`/item/${item.id}`);
                  }}
                  className="flex w-full items-center gap-3 rounded-3xl border border-hairline bg-surface p-3 text-left shadow-card"
                >
                  <ItemThumb item={item} category={catMap.get(item.categoryId)} className="h-14 w-14 shrink-0" iconSize={22} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-ink">{item.name}</p>
                    <p className="truncate text-[11.5px] text-ink-mute">
                      {item.brand} · {item.room} · {item.location}
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] font-extrabold text-teal-brand dark:text-sky-accent">
                    {formatMoney(item.currentValue, data.settings.currency, { compact: true })}
                  </span>
                </motion.button>
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState variant="search" title="Nothing found" message={`No items match “${query}”. Try a brand, serial number, room or tag.`} action={<Button variant="soft" onClick={() => setQuery('')}>Clear search</Button>} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* -------------------------------- Scanner -------------------------------- */

interface DetectedBarcode {
  rawValue: string;
  format: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

export function Scanner({ navigate }: { navigate: (to: string) => void }) {
  const { data, toast } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ value: string; format: string } | null>(null);
  const [manual, setManual] = useState('');

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleValue = useCallback(
    (value: string, format: string) => {
      stop();
      setStatus('idle');
      setResult({ value, format });
    },
    [stop],
  );

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (detectorRef.current) {
      void detectorRef.current
        .detect(canvas)
        .then((codes) => {
          if (codes.length) handleValue(codes[0].rawValue, codes[0].format);
        })
        .catch(() => undefined);
    }
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
    if (code?.data) {
      handleValue(code.data, 'qr_code');
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [handleValue]);

  const start = useCallback(async () => {
    setStatus('starting');
    setError('');
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
      if (Ctor) {
        try {
          detectorRef.current = new Ctor({ formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'itf'] });
        } catch {
          detectorRef.current = null;
        }
      }
      setStatus('scanning');
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Camera unavailable');
    }
  }, [tick]);

  useEffect(() => () => stop(), [stop]);

  const match = useMemo(() => {
    if (!result) return null;
    let id: string | null = null;
    try {
      const parsed = JSON.parse(result.value) as { app?: string; id?: string };
      if (parsed?.id) id = parsed.id;
    } catch {
      /* plain barcode */
    }
    const byId = id ? data.items.find((i) => i.id === id) : undefined;
    if (byId) return byId;
    const term = result.value.trim().toLowerCase();
    return data.items.find((i) => (i.serialNumber ?? '').toLowerCase() === term || i.name.toLowerCase() === term) ?? null;
  }, [result, data.items]);

  return (
    <div className="pt-1">
      <ScreenHeader title="Scan Code" subtitle="QR codes and product barcodes" onBack={() => navigate('/')} />

      <Card padded={false} className="overflow-hidden">
        <div className="relative aspect-[4/5] w-full bg-navy-950">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {status === 'scanning' ? (
            <>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="relative h-56 w-56">
                  {[
                    'left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl',
                    'right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl',
                    'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-2xl',
                    'right-0 bottom-0 border-r-4 border-b-4 rounded-br-2xl',
                  ].map((cls) => (
                    <span key={cls} className={`absolute h-10 w-10 border-sky-accent ${cls}`} />
                  ))}
                  <motion.span
                    animate={{ y: [0, 208, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-sky-accent shadow-[0_0_18px_2px_rgba(56,189,248,0.7)]"
                  />
                </div>
              </div>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3.5 py-1.5 text-[12px] font-semibold text-white backdrop-blur">
                Point at a QR code or barcode
              </span>
            </>
          ) : null}

          {status !== 'scanning' ? (
            <div className="absolute inset-0 grid place-items-center bg-navy-950/85 p-6 text-center">
              <div>
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white/10 text-sky-accent">
                  <Icon name="scan" size={30} />
                </span>
                <p className="mt-4 text-[15px] font-bold text-white">
                  {status === 'error' ? 'Camera unavailable' : status === 'starting' ? 'Starting camera…' : 'Scan an item code'}
                </p>
                <p className="mx-auto mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-white/65">
                  {status === 'error'
                    ? error || 'Grant camera permission in your browser settings, or enter the code manually below.'
                    : 'HomeVault reads item QR codes and product barcodes using your device camera. Nothing is uploaded.'}
                </p>
                <Button className="mt-4" icon="camera" onClick={() => void start()} disabled={status === 'starting'}>
                  {status === 'error' ? 'Try again' : 'Start camera'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {status === 'scanning' ? (
        <Button variant="soft" block className="mt-3" icon="x" onClick={() => { stop(); setStatus('idle'); }}>
          Stop camera
        </Button>
      ) : null}

      <Card className="mt-4">
        <p className="mb-2 text-[13px] font-bold text-ink">Enter a code manually</p>
        <div className="flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Serial or barcode number"
            className="w-full rounded-2xl border border-hairline bg-surface-2 px-3.5 py-3 text-[14px] text-ink placeholder:text-ink-mute outline-none focus:border-sky-accent"
          />
          <Button
            variant="soft"
            onClick={() => {
              if (!manual.trim()) return;
              handleValue(manual.trim(), 'manual');
            }}
          >
            Find
          </Button>
        </div>
      </Card>

      <Sheet open={Boolean(result)} onClose={() => setResult(null)} title="Scan result">
        {result ? (
          <div className="pb-2">
            <div className="flex items-center gap-2">
              <Badge tone="sky">{result.format.replace(/_/g, ' ').toUpperCase()}</Badge>
              {match ? <Badge tone="emerald">Match found</Badge> : <Badge tone="amber">No match</Badge>}
            </div>
            <p className="mt-3 break-all rounded-2xl bg-surface-2 p-3 font-mono text-[12px] text-ink-soft">{result.value}</p>

            {match ? (
              <>
                <button
                  onClick={() => {
                    setResult(null);
                    navigate(`/item/${match.id}`);
                  }}
                  className="mt-4 flex w-full items-center gap-3 rounded-3xl border border-hairline bg-surface p-3 text-left shadow-card"
                >
                  <ItemThumb item={match} category={data.categories.find((c) => c.id === match.categoryId)} className="h-14 w-14 shrink-0" iconSize={22} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-ink">{match.name}</p>
                    <p className="truncate text-[11.5px] text-ink-mute">
                      {match.room} · {match.location}
                    </p>
                  </div>
                  <Icon name="chevronRight" size={18} className="text-ink-mute" />
                </button>
                <Button
                  block
                  className="mt-3"
                  onClick={() => {
                    setResult(null);
                    navigate(`/item/${match.id}`);
                  }}
                >
                  Open item
                </Button>
              </>
            ) : (
              <>
                <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">
                  No item in your vault uses this code yet. Create a new item and HomeVault will store the code as its serial number.
                </p>
                <Button
                  block
                  className="mt-4"
                  icon="plus"
                  onClick={() => {
                    toast('Code copied into a new item', 'success');
                    setResult(null);
                    navigate('/add');
                  }}
                >
                  Add new item
                </Button>
              </>
            )}
            <Button variant="soft" block className="mt-2.5" onClick={() => { setResult(null); void start(); }}>
              Scan again
            </Button>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
