import type { ReactNode, SVGProps } from 'react';

const P: Record<string, ReactNode> = {
  home: <><path d="M3.2 10.6 12 3.5l8.8 7.1" /><path d="M5.4 9.6V19a1.6 1.6 0 0 0 1.6 1.6h10a1.6 1.6 0 0 0 1.6-1.6V9.6" /><path d="M9.6 20.6v-5.4h4.8v5.4" /></>,
  boxes: <><path d="M3.5 7.6 12 3.4l8.5 4.2-8.5 4.2z" /><path d="M3.5 7.6v8.8L12 20.6l8.5-4.2V7.6" /><path d="M12 11.8v8.8" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  search: <><circle cx="11" cy="11" r="6.4" /><path d="m20 20-3.6-3.6" /></>,
  chart: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M21 20H3" /></>,
  settings: <><circle cx="12" cy="12" r="3.1" /><path d="M19.4 14.5a1.6 1.6 0 0 0 .33 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-2.72 1.14V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.79-1.07l-.06.06A2 2 0 1 1 4.5 17.1l.06-.06A1.6 1.6 0 0 0 3.4 14.3H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.2 7.5l-.06-.06A2 2 0 1 1 6.97 4.6l.06.06a1.6 1.6 0 0 0 1.77.33H8.9a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.72 1.14l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.33 1.77v.08a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.47 1z" /></>,
  user: <><circle cx="12" cy="8.2" r="3.8" /><path d="M4.6 20.4a7.6 7.6 0 0 1 14.8 0" /></>,
  users: <><circle cx="9" cy="8.4" r="3.4" /><path d="M2.8 20a6.4 6.4 0 0 1 12.4 0" /><path d="M16.2 5.4a3.4 3.4 0 0 1 0 6.4" /><path d="M17.6 14.4A6.4 6.4 0 0 1 21.4 20" /></>,
  bell: <><path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.4-2 6.4h16S18 14 18 9" /><path d="M13.7 19.2a2 2 0 0 1-3.4 0" /></>,
  heart: <path d="M12 20.4S3.6 15.6 3.6 9.8A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 8.4 2.2c0 5.8-8.4 10.6-8.4 10.6" />,
  star: <path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z" />,
  tag: <><path d="M20.4 12.6 12.7 20.3a1.8 1.8 0 0 1-2.55 0l-6.4-6.4A1.8 1.8 0 0 1 3.2 12.6V5.4a1.8 1.8 0 0 1 1.8-1.8h7.2a1.8 1.8 0 0 1 1.27.53l6.93 6.9a1.8 1.8 0 0 1 0 2.55" /><circle cx="8.1" cy="8.1" r="1.2" /></>,
  camera: <><path d="M4 8.4h3l1.4-2.2h7.2L17 8.4h3a1.6 1.6 0 0 1 1.6 1.6v8a1.6 1.6 0 0 1-1.6 1.6H4A1.6 1.6 0 0 1 2.4 18v-8A1.6 1.6 0 0 1 4 8.4" /><circle cx="12" cy="13.6" r="3.4" /></>,
  qr: <><rect x="3.4" y="3.4" width="7" height="7" rx="1.6" /><rect x="13.6" y="3.4" width="7" height="7" rx="1.6" /><rect x="3.4" y="13.6" width="7" height="7" rx="1.6" /><path d="M13.6 13.6h3v3h-3zM20.6 13.6v3M17.6 20.6h3M13.6 20.6h1" /></>,
  scan: <><path d="M3.4 8V5.4a2 2 0 0 1 2-2H8" /><path d="M16 3.4h2.6a2 2 0 0 1 2 2V8" /><path d="M20.6 16v2.6a2 2 0 0 1-2 2H16" /><path d="M8 20.6H5.4a2 2 0 0 1-2-2V16" /><path d="M3.4 12h17.2" /></>,
  calendar: <><rect x="3.4" y="5" width="17.2" height="15.6" rx="2.4" /><path d="M8 3v4M16 3v4M3.4 10h17.2" /></>,
  shield: <><path d="M12 3.2 5 6v5.6c0 4.4 3 8.1 7 9.2 4-1.1 7-4.8 7-9.2V6z" /><path d="m9.3 12.2 1.9 1.9 3.6-3.7" /></>,
  wrench: <path d="M20 6.3a5 5 0 0 1-6.6 6.6L6 20.3a2.1 2.1 0 0 1-3-3l7.4-7.4A5 5 0 0 1 17 3.3l-3 3 .9 2.8 2.8.9z" />,
  trash: <><path d="M4.4 6.8h15.2" /><path d="M9.4 6.8V5.2a1.6 1.6 0 0 1 1.6-1.6h2a1.6 1.6 0 0 1 1.6 1.6v1.6" /><path d="M6.6 6.8 7.5 19a1.8 1.8 0 0 0 1.8 1.6h5.4A1.8 1.8 0 0 0 16.5 19l.9-12.2" /><path d="M10.4 10.6v6M13.6 10.6v6" /></>,
  edit: <><path d="M12.6 5.6H6a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h10.4a2 2 0 0 0 2-2v-6.6" /><path d="M17.2 3.9a2 2 0 0 1 2.9 2.8L12.7 14 9 15l1-3.7z" /></>,
  copy: <><rect x="8.4" y="8.4" width="12.2" height="12.2" rx="2.4" /><path d="M15.6 5.6V5a2 2 0 0 0-2-2H5.4a2 2 0 0 0-2 2v8.2a2 2 0 0 0 2 2H6" /></>,
  archive: <><rect x="3.2" y="4" width="17.6" height="4.4" rx="1.4" /><path d="M5 8.4V19a1.6 1.6 0 0 0 1.6 1.6h10.8A1.6 1.6 0 0 0 19 19V8.4" /><path d="M10 12.4h4" /></>,
  filter: <path d="M3.6 5.4h16.8l-6.5 7.6v5.6l-3.8 2v-7.6z" />,
  sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2.2" /><circle cx="8" cy="17" r="2.2" /></>,
  chevronLeft: <path d="m14.5 5.5-6.4 6.5 6.4 6.5" />,
  chevronRight: <path d="m9.5 5.5 6.4 6.5-6.4 6.5" />,
  chevronDown: <path d="m5.5 9.5 6.5 6.4 6.5-6.4" />,
  chevronUp: <path d="m5.5 14.5 6.5-6.4 6.5 6.4" />,
  x: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  check: <path d="m4.8 12.6 4.6 4.6 9.8-10" />,
  checkCircle: <><circle cx="12" cy="12" r="8.6" /><path d="m8.2 12.3 2.6 2.6 5-5.2" /></>,
  xCircle: <><circle cx="12" cy="12" r="8.6" /><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" /></>,
  alert: <><circle cx="12" cy="12" r="8.6" /><path d="M12 7.8v5M12 16.1h.01" /></>,
  info: <><circle cx="12" cy="12" r="8.6" /><path d="M12 11.4v4.8M12 8.1h.01" /></>,
  download: <><path d="M12 3.6v11.2" /><path d="m7.6 10.6 4.4 4.4 4.4-4.4" /><path d="M4.4 19.4h15.2" /></>,
  upload: <><path d="M12 15.4V4.2" /><path d="m7.6 8.6 4.4-4.4 4.4 4.4" /><path d="M4.4 19.4h15.2" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.6v2.2M12 19.2v2.2M4.3 4.3l1.6 1.6M18.1 18.1l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.3 19.7l1.6-1.6M18.1 5.9l1.6-1.6" /></>,
  moon: <path d="M20.4 14.2A8.6 8.6 0 0 1 9.8 3.6a8.6 8.6 0 1 0 10.6 10.6" />,
  monitor: <><rect x="2.8" y="4" width="18.4" height="12.6" rx="2.2" /><path d="M8.6 20.4h6.8M12 16.6v3.8" /></>,
  globe: <><circle cx="12" cy="12" r="8.6" /><path d="M3.6 12h16.8" /><path d="M12 3.4a13 13 0 0 1 0 17.2 13 13 0 0 1 0-17.2" /></>,
  grid: <><rect x="3.4" y="3.4" width="7.2" height="7.2" rx="2" /><rect x="13.4" y="3.4" width="7.2" height="7.2" rx="2" /><rect x="3.4" y="13.4" width="7.2" height="7.2" rx="2" /><rect x="13.4" y="13.4" width="7.2" height="7.2" rx="2" /></>,
  list: <><path d="M8.4 6.4h12M8.4 12h12M8.4 17.6h12" /><path d="M4 6.4h.01M4 12h.01M4 17.6h.01" /></>,
  sparkles: <><path d="m12 3.4 1.7 4.4 4.4 1.7-4.4 1.7L12 15.6l-1.7-4.4-4.4-1.7 4.4-1.7z" /><path d="M18.6 15.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></>,
  sofa: <><path d="M4.4 11V8.2a2.2 2.2 0 0 1 2.2-2.2h10.8a2.2 2.2 0 0 1 2.2 2.2V11" /><path d="M3 13.2a2 2 0 0 1 4 0v2.4h10v-2.4a2 2 0 0 1 4 0v4.2a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.4z" /></>,
  tv: <><rect x="2.8" y="5" width="18.4" height="12" rx="2.2" /><path d="m8.5 20.4 3.5-3.4 3.5 3.4" /></>,
  laptop: <><rect x="4.4" y="5" width="15.2" height="10" rx="1.8" /><path d="M2.6 18.6h18.8" /></>,
  utensils: <><path d="M6.4 3.4v7a2.6 2.6 0 0 0 5.2 0v-7" /><path d="M9 10.4v10.2" /><path d="M17.4 3.4c-1.6 1.4-2.2 3-2.2 5.2v3.6h3.2v8.4" /></>,
  bed: <><path d="M3.4 19.4V6.6" /><path d="M3.4 11.6h17.2a2 2 0 0 1 2 2v5.8" /><path d="M3.4 15.6h19.2" /><circle cx="7.6" cy="8.6" r="1.8" /></>,
  bath: <><path d="M3.4 12.4h17.2v2.4a4.2 4.2 0 0 1-4.2 4.2H7.6a4.2 4.2 0 0 1-4.2-4.2z" /><path d="M6.4 12.4V6.2a2 2 0 0 1 3.5-1.3" /><path d="M6.6 19.6 5.4 21.4M17.4 19.6l1.2 1.8" /></>,
  leaf: <><path d="M20 4.4c0 8-5 12.2-11.2 12.2A4.8 4.8 0 0 1 4 11.8C4 6.6 10.4 4 20 4.4" /><path d="M4.6 20.2C7 15.4 11 12 15.8 10" /></>,
  tool: <><path d="M3.6 20.4 9 15l-1.5-1.5 2.8-2.8a4.4 4.4 0 0 1 5.9-5.9l-2.6 2.6 2.1 2.1L18.3 6.9a4.4 4.4 0 0 1-5.9 5.9L9.6 15.6" /></>,
  book: <><path d="M4.4 4.4h11a3 3 0 0 1 3 3v13H7.4a3 3 0 0 1-3-3z" /><path d="M4.4 17.4a3 3 0 0 1 3-3h11" /></>,
  shirt: <path d="M8.4 3.6 4 6.2l1.8 3.6 1.8-.9v11.5h8.8V8.9l1.8.9L20 6.2l-4.4-2.6a3.7 3.7 0 0 1-7.2 0" />,
  dumbbell: <><path d="M4 9.6v4.8M7 7.4v9.2M17 7.4v9.2M20 9.6v4.8" /><path d="M7 12h10" /></>,
  car: <><path d="M4.6 16.4V19a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2.6" /><path d="M22 16.4V19a1 1 0 0 1-1 1h-.6a1 1 0 0 1-1-1v-2.6" /><path d="M3.2 16.4h17.6v-4l-1.9-4.6a2 2 0 0 0-1.85-1.2H6.95a2 2 0 0 0-1.85 1.2L3.2 12.4z" /><path d="M6.6 14.4h.01M17.4 14.4h.01" /></>,
  music: <><path d="M9 18.4V5.6l10-2v12.6" /><circle cx="6.6" cy="18.4" r="2.4" /><circle cx="16.6" cy="16.2" r="2.4" /></>,
  clock: <><circle cx="12" cy="12" r="8.6" /><path d="M12 7.4V12l3 1.8" /></>,
  mapPin: <><path d="M19.2 10.4c0 5.4-7.2 10.2-7.2 10.2S4.8 15.8 4.8 10.4a7.2 7.2 0 0 1 14.4 0" /><circle cx="12" cy="10.2" r="2.6" /></>,
  layers: <><path d="m12 3.4 8.6 4.4L12 12.2 3.4 7.8z" /><path d="m3.4 12 8.6 4.4L20.6 12" /><path d="m3.4 16.2 8.6 4.4 8.6-4.4" /></>,
  trendingUp: <><path d="m3.6 16.4 5.2-5.2 3.4 3.4 6.6-6.8" /><path d="M14.6 7.8h4.6v4.6" /></>,
  trendingDown: <><path d="m3.6 7.6 5.2 5.2 3.4-3.4 6.6 6.8" /><path d="M14.6 16.2h4.6v-4.6" /></>,
  wallet: <><path d="M3.4 8.4A2.4 2.4 0 0 1 5.8 6h11.6a2.4 2.4 0 0 1 2.4 2.4" /><rect x="3.4" y="8.4" width="17.2" height="11.2" rx="2.4" /><path d="M16.4 14h1.6" /></>,
  fileText: <><path d="M13.4 3.4H7a2 2 0 0 0-2 2v13.2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" /><path d="M13.4 3.4V9H19" /><path d="M8.6 13h6.8M8.6 16.6h4.8" /></>,
  printer: <><path d="M7 9V3.6h10V9" /><rect x="3.6" y="9" width="16.8" height="7" rx="2" /><path d="M7 14h10v6.4H7z" /></>,
  database: <><ellipse cx="12" cy="6" rx="7.6" ry="3" /><path d="M4.4 6v12c0 1.65 3.4 3 7.6 3s7.6-1.35 7.6-3V6" /><path d="M4.4 12c0 1.65 3.4 3 7.6 3s7.6-1.35 7.6-3" /></>,
  palette: <><path d="M12 3.4a8.6 8.6 0 0 0 0 17.2c1.2 0 1.9-.8 1.9-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.8-1.7h1.5a4.4 4.4 0 0 0 4.4-4.4c0-3.9-3.9-7-8.6-7" /><circle cx="7.6" cy="11" r="1.1" /><circle cx="11" cy="7.6" r="1.1" /><circle cx="15.6" cy="9.4" r="1.1" /></>,
  refresh: <><path d="M20.4 11.6A8.4 8.4 0 0 0 6 6.6L3.6 9" /><path d="M3.6 4.4V9h4.6" /><path d="M3.6 12.4a8.4 8.4 0 0 0 14.4 5l2.4-2.4" /><path d="M20.4 19.6V15h-4.6" /></>,
  dots: <><circle cx="12" cy="5.4" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="18.6" r="1.4" /></>,
  arrowRight: <><path d="M4.4 12h15" /><path d="m13.4 6 6 6-6 6" /></>,
  arrowLeft: <><path d="M19.6 12h-15" /><path d="m10.6 6-6 6 6 6" /></>,
  share: <><path d="M12 15.4V3.8" /><path d="m8 7.6 4-3.8 4 3.8" /><path d="M5 13.6v5.2a1.8 1.8 0 0 0 1.8 1.8h10.4a1.8 1.8 0 0 0 1.8-1.8v-5.2" /></>,
  image: <><rect x="3.4" y="4.4" width="17.2" height="15.2" rx="2.4" /><circle cx="8.6" cy="9.6" r="1.7" /><path d="m4.2 17.4 4.9-4.6 4 3.6 3-2.6 4.4 4" /></>,
  folder: <path d="M3.4 6.6a2 2 0 0 1 2-2h3.5l2 2.6h7.7a2 2 0 0 1 2 2v8.2a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2z" />,
  lock: <><rect x="4.6" y="10.4" width="14.8" height="10" rx="2.4" /><path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6" /></>,
  logout: <><path d="M9.4 20.4H6a2 2 0 0 1-2-2V5.6a2 2 0 0 1 2-2h3.4" /><path d="M15.4 16.4 19.8 12l-4.4-4.4" /><path d="M19.8 12H9.6" /></>,
  gift: <><rect x="3.4" y="8.4" width="17.2" height="4.2" rx="1.2" /><path d="M5 12.6v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /><path d="M12 8.4v12.2" /><path d="M12 8.4S10.4 3.4 8 3.4a2.4 2.4 0 0 0 0 5M12 8.4s1.6-5 4-5a2.4 2.4 0 0 1 0 5" /></>,
  cpu: <><rect x="6.4" y="6.4" width="11.2" height="11.2" rx="2.2" /><path d="M9.8 3.4v3M14.2 3.4v3M9.8 17.6v3M14.2 17.6v3M3.4 9.8h3M3.4 14.2h3M17.6 9.8h3M17.6 14.2h3" /></>,
  washer: <><rect x="4.4" y="3.4" width="15.2" height="17.2" rx="2.6" /><circle cx="12" cy="13.6" r="4.2" /><path d="M8 7h.01M11 7h.01" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  eye: <><path d="M2.6 12S6 5.6 12 5.6 21.4 12 21.4 12 18 18.4 12 18.4 2.6 12 2.6 12" /><circle cx="12" cy="12" r="3.1" /></>,
  flame: <><path d="M12 21c3.6 0 6.4-2.6 6.4-6 0-4.6-4.6-6-4.6-10.6C11 6 9.4 8 9.4 10.4c0 1-1 1.6-1.6 1s-1.2-1.6-1.2-1.6A7.7 7.7 0 0 0 5.6 15c0 3.4 2.8 6 6.4 6" /></>,
};

export type IconName = keyof typeof P;

export const ICON_NAMES: string[] = Object.keys(P);

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: string;
  size?: number;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, strokeWidth = 1.7, ...rest }: IconProps) {
  const d = P[name] ?? P.boxes;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {d}
    </svg>
  );
}

export function Logo({ size = 40, rounded = 14 }: { size?: number; rounded?: number }) {
  return (
    <div
      className="grid place-items-center shadow-[0_10px_24px_-10px_rgba(15,36,64,0.65)]"
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: 'linear-gradient(150deg, #1E3A5F 0%, #16304F 55%, #0F766E 100%)',
      }}
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.2 10.6 12 3.5l8.8 7.1" />
        <path d="M5.4 9.6V19a1.6 1.6 0 0 0 1.6 1.6h10a1.6 1.6 0 0 0 1.6-1.6V9.6" />
        <path d="M9.6 20.6v-5.4h4.8v5.4" stroke="#38BDF8" />
      </svg>
    </div>
  );
}
