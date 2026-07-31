import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';

export interface Slice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ data, size = 190, thickness = 24, centerLabel, centerValue }: { data: Slice[]; size?: number; thickness?: number; centerLabel?: string; centerValue?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className="stroke-surface-3" />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * c;
          const offset = acc * c;
          acc += frac;
          return (
            <motion.circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(dash - 3, 0)} ${c}`}
              initial={{ strokeDashoffset: -offset, opacity: 0, scale: 0.9 }}
              animate={{ strokeDashoffset: -offset, opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'center' }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="font-display text-[20px] font-extrabold text-ink">
          {centerValue}
        </motion.p>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{centerLabel}</p>
      </div>
    </div>
  );
}

export function BarChart({
  data,
  height = 168,
  format,
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <button
            key={`${d.label}-${i}`}
            type="button"
            onClick={() => setActive(active === i ? null : i)}
            className="group flex h-full flex-1 flex-col justify-end gap-1.5"
          >
            {active === i ? (
              <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-bold text-ink">
                {format ? format(d.value) : d.value}
              </motion.span>
            ) : null}
            <motion.span
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
              transition={{ delay: i * 0.045, type: 'spring', stiffness: 120, damping: 18 }}
              className="w-full rounded-t-lg rounded-b-sm"
              style={{
                background: d.color ?? (active === i ? '#0F766E' : 'linear-gradient(180deg,#38BDF8,#1E3A5F)'),
                opacity: active === null || active === i ? 1 : 0.42,
              }}
            />
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <span key={`${d.label}-lbl-${i}`} className="flex-1 text-center text-[10px] font-semibold text-ink-mute">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AreaChart({
  points,
  labels,
  height = 170,
  color = '#38BDF8',
  format,
}: {
  points: number[];
  labels: string[];
  height?: number;
  color?: string;
  format?: (n: number) => string;
}) {
  const w = 320;
  const h = height;
  const pad = 14;
  const max = Math.max(1, ...points);
  const min = Math.min(0, ...points);
  const coords = useMemo(
    () =>
      points.map((p, i) => {
        const x = pad + (i * (w - pad * 2)) / Math.max(1, points.length - 1);
        const y = h - pad - ((p - min) / (max - min || 1)) * (h - pad * 2);
        return [x, y] as const;
      }),
    [points, max, min, h],
  );

  const line = coords
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px, py] = coords[i - 1];
      const cx = (px + x) / 2;
      return `C ${cx} ${py} ${cx} ${y} ${x} ${y}`;
    })
    .join(' ');
  const area = `${line} L ${coords[coords.length - 1]?.[0] ?? pad} ${h - pad} L ${pad} ${h - pad} Z`;
  const peak = points.indexOf(Math.max(...points));

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={pad} x2={w - pad} y1={pad + g * (h - pad * 2)} y2={pad + g * (h - pad * 2)} className="stroke-hairline" strokeWidth="1" strokeDasharray="4 6" />
        ))}
        <motion.path d={area} fill={`url(#grad-${color.replace('#', '')})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.25 }} />
        <motion.path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2.6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        />
        {coords[peak] ? (
          <motion.circle
            cx={coords[peak][0]}
            cy={coords[peak][1]}
            r="5"
            fill={color}
            stroke="#fff"
            strokeWidth="2.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.05, type: 'spring', stiffness: 400 }}
          />
        ) : null}
      </svg>
      <div className="mt-1 flex justify-between px-1">
        {labels.map((l, i) => (
          <span key={`${l}-${i}`} className="text-[10px] font-semibold text-ink-mute">
            {l}
          </span>
        ))}
      </div>
      {format ? <p className="mt-1 text-right text-[11px] font-semibold text-ink-mute">Peak {format(Math.max(...points))}</p> : null}
    </div>
  );
}

export function Sparkline({ points, color = '#0F766E', width = 84, height = 30 }: { points: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(1, ...points);
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * width) / Math.max(1, points.length - 1)} ${height - (p / max) * (height - 4) - 2}`)
    .join(' ');
  return (
    <svg width={width} height={height}>
      <motion.path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />
    </svg>
  );
}

export function RadialGauge({ value, max, color = '#10B981', size = 76, label }: { value: number; max: number; color?: string; size?: number; label?: string }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / (max || 1));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="7" className="stroke-surface-3" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute grid place-items-center text-center">
        <span className="font-display text-[15px] font-extrabold text-ink">{value}</span>
        {label ? <span className="text-[9px] font-semibold uppercase text-ink-mute">{label}</span> : null}
      </div>
    </div>
  );
}
