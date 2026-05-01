import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-10 py-12 lg:py-20">
      <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mb-3">
        About
      </div>
      <h1 className="font-display text-4xl lg:text-5xl tracking-tightest text-balance mb-8">
        How the studio's AI rendering pipeline works.
      </h1>

      <div className="prose prose-invert prose-sm max-w-none space-y-8 text-ink-300 leading-relaxed">
        <section>
          <h2 className="font-display text-xl tracking-tight text-ink-100 mb-3">
            What this is
          </h2>
          <p>
            ComfyUI Studio is the Allect AI Lab's first internal product. It wraps Zak's
            local rendering stack so anyone in the studio can use it — no prompts, no model
            knowledge, no waiting in line for a render seat.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl tracking-tight text-ink-100 mb-3">
            Architecture
          </h2>
          <ul className="list-none space-y-3 pl-0">
            {[
              ['Frontend', 'This site. Hosted on the studio intranet.'],
              ['Sync', 'Egnyte shared folder mirrors uploads to Zak\'s workstation.'],
              ['Agent', 'Python agent watches the folder, queues jobs, talks to ComfyUI on localhost.'],
              ['Models', 'Zak\'s curated checkpoints, LoRAs, and custom nodes — same stack he uses by hand.'],
              ['Output', 'Result rendered, written back to the shared folder, surfaced here in your queue.'],
            ].map(([k, v]) => (
              <li key={k} className="flex gap-4 py-2 border-b border-ink-800/60 last:border-0">
                <span className="font-mono text-[12px] uppercase tracking-widest text-ink-500 w-24 flex-shrink-0">
                  {k}
                </span>
                <span className="text-[14px]">{v}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl tracking-tight text-ink-100 mb-3">
            What's coming
          </h2>
          <ul className="space-y-2 list-disc pl-5 marker:text-ink-600">
            <li>Direct upload (no Egnyte round-trip) via Tailscale.</li>
            <li>Project-level grouping — organize renders by site or client brief.</li>
            <li>Custom workflow uploads from the design lead pool.</li>
            <li>Lightweight handoff to InDesign / Figma boards.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl tracking-tight text-ink-100 mb-3">
            Credits
          </h2>
          <p className="text-[14px]">
            Built by the AI Lab. Rendering stack and model choices: Zak. Wrapper, agent, and
            this frontend: Yuchen. Issues, requests, ideas — drop them in
            the <code className="font-mono text-accent text-[12px] bg-ink-900 px-1.5 py-0.5 rounded border border-ink-800">#ai-lab</code> Teams
            channel.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-ink-800/80">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[13px] text-ink-300 hover:text-accent transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M10 6H2m3-3L2 6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to studio
        </Link>
      </div>
    </div>
  );
}
