import type { Job } from '../types';

interface Props {
  job: Job | null;
}

export default function ProgressBar({ job }: Props) {
  const status = job?.status ?? 'idle';
  const progress = job?.progress ?? 0;

  const tone =
    status === 'failed'
      ? 'bg-red-500'
      : status === 'complete'
        ? 'bg-accent'
        : 'bg-accent';

  const label =
    status === 'idle'
      ? 'Ready'
      : status === 'queued'
        ? 'Queued'
        : status === 'syncing'
          ? 'Syncing to render box'
          : status === 'processing'
            ? 'Rendering'
            : status === 'complete'
              ? 'Complete'
              : 'Failed';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
        <span className="text-ink-500 flex items-center gap-2">
          {(status === 'queued' || status === 'syncing' || status === 'processing') && (
            <span className="h-1 w-1 rounded-full bg-accent animate-pulse-slow" />
          )}
          {label}
        </span>
        <span className="text-ink-400">
          {status === 'idle' ? '—' : `${progress}%`}
          {job?.etaSeconds != null && job.status !== 'complete' && job.status !== 'failed' && job.etaSeconds > 0 ? (
            <span className="text-ink-600 ml-2">{job.etaSeconds}s left</span>
          ) : null}
        </span>
      </div>
      <div className="h-1 rounded-full bg-ink-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${tone}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
