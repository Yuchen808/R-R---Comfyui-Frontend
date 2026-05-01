# R&R · ComfyUI Studio Frontend

Internal AI rendering frontend for the Allect studio, wrapping Zak's local ComfyUI stack so the whole studio can use it without writing prompts.

> Drop a plan, sketch, or working render. Pick a workflow. Get back a studio-grade output in minutes.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS for styling (custom dark + #80EF80 accent)
- React Router for client routing
- LocalStorage-backed job store (mock backend until the agent lands)

## Workflows (5)

1. **Plan → Render** — floor plan to atmospheric render
2. **Sketch → Render** — hand sketch to photoreal
3. **Material Swap** — replace finishes in place
4. **Detail Upscale** — print-ready at 4K+
5. **Reference Stylize** — match a moodboard (beta)

## Develop

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Build

```bash
npm run build
npm run preview
```

## Architecture (Phase 2 — direct connection)

```
[browser]
   │ upload
   ▼
[this frontend]
   │ HTTP (Tailscale)
   ▼
[Zak's workstation: agent + ComfyUI :8188]
   │ render
   ▼
[result back to browser]
```

Phase 1 (Egnyte folder watcher) ships first; this frontend swaps in once Tailscale is approved by IT.

## Status

`v0.1.0` — UI scaffold, mock job pipeline. Real backend wiring lands when the agent is up.
