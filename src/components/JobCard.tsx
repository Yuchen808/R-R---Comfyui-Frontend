import { Link } from 'react-router-dom';
import type { Job } from '../types';
import { workflowBySlug } from '../data/workflows';
import { deleteJob } from '../store/jobs';
import StatusPill from './StatusPill';

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function JobCard({ job }: { job: Job }) {
  const w = workflowBySlug(job.workflow);
  const main = job.inputs.main;
  return (
    <div className="group relative flex gap-4 p-4 rounded-xl border border-ink-800 bg-ink-900/40 hover:bg-ink-900/70 transition-colors">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-ink-800 border border-ink-700">
        {main?.dataUrl && (
          <img
            src={main.dataUrl}
            alt=""
            className={`h-full w-full object-cover transition-all ${
              job.status === 'complete' ? '' : 'opacity-40'
            }`}
          />
        )}
        {(job.status === 'queued' || job.status === 'syncing' || job.status === 'processing') && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-1">
          <Link
            to={`/w/${job.workflow}`}
            className="text-[15px] tracking-tight text-ink-100 hover:text-accent transition-colors"
          >
            {w?.name ?? job.workflow}
          </Link>
          <StatusPill status={job.status} />
        </div>

        <div className="flex items-center gap-2 text-[12px] font-mono text-ink-500 mb-3 truncate">
          <span className="truncate">{main?.fileName ?? '—'}</span>
          {main && (
            <>
              <span className="text-ink-700">·</span>
              <span>{formatSize(main.fileSize)}</span>
            </>
          )}
          <span className="text-ink-700">·</span>
          <span>{formatTime(job.submittedAt)}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 rounded-full bg-ink-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                job.status === 'failed' ? 'bg-red-500' : 'bg-accent'
              }`}
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <div className="text-[11px] font-mono text-ink-500 w-20 text-right">
            {job.status === 'complete'
              ? 'Done'
              : job.status === 'failed'
                ? 'Failed'
                : job.etaSeconds !== null
                  ? `${job.etaSeconds}s left`
                  : '—'}
          </div>
        </div>
      </div>

      <button
        onClick={() => deleteJob(job.id)}
        className="self-start text-ink-600 hover:text-ink-300 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Remove"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
