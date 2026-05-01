import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <div className="font-mono text-[11px] uppercase tracking-widest text-ink-500 mb-4">
        404 / not found
      </div>
      <h1 className="font-display text-5xl tracking-tightest mb-4">
        That page doesn't exist.
      </h1>
      <p className="text-ink-400 mb-8">
        It might have been a workflow that was retired, or a link that drifted.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-ink-950 font-medium text-[14px] hover:bg-accent-dim transition-colors"
      >
        Back to studio
      </Link>
    </div>
  );
}
