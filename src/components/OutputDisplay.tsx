import type { Job, Workflow } from '../types';

interface Props {
  workflow: Workflow;
  job: Job | null;
}

export default function OutputDisplay({ workflow, job }: Props) {
  if (!job) {
    return (
      <div className="aspect-[16/10] rounded-xl border border-dashed border-ink-800 bg-ink-900/20 flex flex-col items-center justify-center text-center px-6">
        <div className="h-10 w-10 rounded-lg bg-ink-900 border border-ink-800 flex items-center justify-center mb-4 text-ink-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
        <div className="text-[14px] tracking-tight text-ink-300 mb-1">
          {workflow.outputLabel} appears here
        </div>
        <div className="text-[12px] font-mono text-ink-500">
          Drop {workflow.inputLabel.toLowerCase()} above to start
        </div>
      </div>
    );
  }

  if (job.status === 'failed') {
    return (
      <div className="aspect-[16/10] rounded-xl border border-red-500/30 bg-red-500/5 flex flex-col items-center justify-center text-center px-6">
        <div className="text-[14px] tracking-tight text-red-300 mb-1">
          Render failed
        </div>
        <div className="text-[12px] font-mono text-ink-500">
          {job.errorMessage ?? 'Check the agent log on the render box.'}
        </div>
      </div>
    );
  }

  const isLive = job.status === 'queued' || job.status === 'syncing' || job.status === 'processing';

  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900/40 overflow-hidden relative">
      <div className="aspect-[16/10] relative bg-ink-950">
        {job.thumbDataUrl && (
          <img
            src={job.resultUrl ?? job.thumbDataUrl}
            alt="Render output"
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
              isLive ? 'opacity-25' : 'opacity-100'
            }`}
          />
        )}
        {isLive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <div className="text-[11px] font-mono uppercase tracking-widest text-ink-300">
                {job.status === 'queued'
                  ? 'Queued'
                  : job.status === 'syncing'
                    ? 'Syncing'
                    : 'Rendering'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with metadata */}
      <div className="px-4 py-3 border-t border-ink-800/60 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2 text-ink-400 min-w-0">
          <span className="truncate">{job.fileName}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {job.prompt && (
            <span className="text-ink-500 truncate max-w-[280px] hidden md:inline" title={job.prompt}>
              "{job.prompt.length > 60 ? `${job.prompt.slice(0, 60)}…` : job.prompt}"
            </span>
          )}
          {job.status === 'complete' && job.resultUrl && (
            <a
              href={job.resultUrl}
              download={`${workflow.slug}-${job.id}.${workflow.outputKind === 'video' ? 'mp4' : 'png'}`}
              className="px-3 py-1 rounded-md bg-accent text-ink-950 font-medium tracking-tight hover:bg-accent-dim transition-colors"
            >
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
