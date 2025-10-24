# Bates Landscapes — Website

Live-ready React (Vite + TypeScript) site for Bates Landscapes.

## Features
- Instant quote estimator
- WhatsApp/email lead capture
- Auto gallery: add images to `src/assets/gallery/` and they appear automatically
- Editable pricing & brand via `public/config.json`

## How to use (GitHub + Netlify)
1. Create a GitHub repo (e.g. `bates-landscapes`) and upload this folder's contents.
2. On Netlify: **New site from Git** → choose the repo.
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Deploy. Netlify gives you a live URL.

## Editing
- **Photos:** upload JPG/PNG/WEBP into `src/assets/gallery/` (via GitHub web UI). Commit → Netlify redeploys → visible on site.
- **Prices & labels:** edit `public/config.json` and commit.
- **Contact details:** also in `public/config.json`.

## Local development (optional)
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Notes
- Images are imported with `import.meta.glob`, so any new files in `src/assets/gallery` will be displayed automatically.
- If `config.json` is missing, sensible defaults are used.
