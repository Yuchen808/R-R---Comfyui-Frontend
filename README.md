# R&R · ComfyUI Studio Frontend

Internal AI rendering frontend for Rigby & Rigby. Wraps the studio's local ComfyUI render box so anyone can use it without writing prompts.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS, Maison Neue typography (with Helvetica Neue fallback)
- React Router for client routing
- LocalStorage-backed job store (mock backend until the agent lands)

## Pages

- `/` Studio — Project Library (horizontal scroller) + workflow picker
- `/project` All projects, active jobs, recent renders
- `/w/:slug` Workflow detail with upload, preset selector, recent jobs

## Workflows

1. **Image to Video** — animate a still render or photograph
2. **Instruct Image** — edit by description; presets: `AI photoshop`, `Day to Night`

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Build

```bash
npm run build
npm run preview   # http://localhost:4173
```

## Fonts

Maison Neue is licensed and **not committed** to the repo. Drop the `.woff2` / `.woff` files into `public/fonts/` per the names listed in `public/fonts/README.md`. Without those files the site falls back to Helvetica Neue / Arial.

## Deployment plan

- **Phase 1** (current) — Egnyte folder watcher + agent on the studio render box
- **Phase 2** — this frontend live at `*.rigbyandrigby.com`, served via Cloudflare Pages, fronted by Cloudflare Access (Microsoft Entra SSO), backend reachable via Cloudflare Tunnel from the render box

## Status

`v0.2.0` — internal demo build. Mock job pipeline; real wiring lands when the agent is deployed.
