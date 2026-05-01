import type { JobStatus } from '../types';

const LABEL: Record<JobStatus, string> = {
  queued: 'Queued',
  syncing: 'Syncing',
  processing: 'Rendering',
  complete: 'Complete',
  failed: 'Failed',
};

const TONE: Record<JobStatus, string> = {
  queued: 'bg-ink-800 text-ink-300 border-ink-700',
  syncing: 'bg-ink-800 text-ink-200 border-ink-600',
  processing: 'bg-accent/10 text-accent border-accent/40',
  complete: 'bg-accent text-ink-950 border-accent',
  failed: 'bg-red-500/10 text-red-300 border-red-500/40',
};

export default function StatusPill({ status }: { status: JobStatus }) {
  const isLive = status === 'queued' || status === 'syncing' || status === 'processing';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-wider ${TONE[status]}`}
    >
      {isLive && <span className="h-1 w-1 rounded-full bg-current animate-pulse-slow" />}
      {LABEL[status]}
    </span>
  );
}
