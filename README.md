# HomeVault

Premium, offline-first **home inventory PWA**. Track everything you own — value, warranties,
maintenance and storage locations — with all amounts in **Nigerian Naira (₦)**.

## Tech stack

| Layer     | Choice                                |
| --------- | ------------------------------------- |
| UI        | React 19 + TypeScript                 |
| Build     | Vite 7                                |
| Styling   | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Animation | Framer Motion                         |
| Bundling  | `vite-plugin-singlefile`              |
| Storage   | `localStorage` (`homevault.data.v1`)  |

**No backend. No database. No authentication. No APIs.**

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # generate icons → vite build → verify dist
npm run preview    # preview the production build
npm run typecheck  # tsc --noEmit
npm run icons      # regenerate PWA icons
npm run verify     # verify dist/ has all required PWA assets
npm start          # serve dist/ (preview sandbox only)
```

## PWA

Installable, offline-capable Progressive Web App.

- `public/manifest.webmanifest` — standalone, portrait, all required icon sizes
- `public/sw.js` — offline-first service worker with fetch handler
- Icons are **generated at build time** by `scripts/gen-icons.mjs`
- Build verification in `scripts/verify-dist.mjs` ensures nothing is missing
- `beforeinstallprompt` captured in `index.html` before the React bundle loads

## Deploy to Vercel

1. Push the repo to GitHub
2. Import in Vercel — it auto-detects Vite via `vercel.json`
3. Deploy — no extra configuration needed

`vercel.json` pins `"framework": "vite"` with explicit build/output settings.

> If Vercel shows "Node.js" instead of "Vite" in project settings, go to
> **Settings → Build & Deployment → Framework Preset → Vite** and redeploy.

## Project layout

```
index.html             app shell + beforeinstallprompt capture
vite.config.ts         Vite config + PWA shell integrity plugin
vercel.json            Vercel deployment configuration
tsconfig.json          TypeScript configuration
server.mjs             static host for preview sandbox (not used on Vercel)
scripts/
  gen-icons.mjs        generates all PWA icons at build time
  verify-dist.mjs      post-build verification of dist/
public/
  manifest.webmanifest PWA manifest
  sw.js                service worker
  *.png, favicon.ico   PWA icons (generated)
src/
  main.tsx             app entry point
  App.tsx              router
  components/          UI kit, icons, charts, layout, install surfaces
  hooks/               PWA state, reminders
  lib/                 types, formatting, stats, import/export, pwa runtime
  screens/             dashboard, inventory, detail, analytics, settings
  store/               localStorage-backed app store
```
