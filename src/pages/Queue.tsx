import { Link } from 'react-router-dom';
import { useState } from 'react';
import { clearCompleted, useJobs } from '../store/jobs';
import JobCard from '../components/JobCard';
import type { JobStatus } from '../types';

const FILTERS: { key: JobStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'processing', label: 'Live' },
  { key: 'complete', label: 'Complete' },
  { key: 'failed', label: 'Failed' },
];

export default function Queue() {
  const jobs = useJobs();
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');

  const filtered = jobs.filter((j) => {
    if (filter === 'all') return true;
    if (filter === 'processing') {
      return j.status === 'queued' || j.status === 'syncing' || j.status === 'processing';
    }
    return j.status === filter;
  });

  const counts = {
    live: jobs.filter((j) => j.status === 'queued' || j.status === 'syncing' || j.status === 'processing').length,
    complete: jobs.filter((j) => j.status === 'complete').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-10 py-12 lg:py-16">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mb-2">
            Render queue
          </div>
          <h1 className="font-display text-4xl tracking-tightest">
            Your jobs
          </h1>
        </div>
        {jobs.some((j) => j.status === 'complete' || j.status === 'failed') && (
          <button
            onClick={clearCompleted}
            className="text-[12px] font-mono text-ink-500 hover:text-ink-200 transition-colors"
          >
            Clear finished
          </button>
        )}
      </div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-px bg-ink-800/80 border border-ink-800/80 rounded-xl overflow-hidden mb-8">
        <Counter label="In progress" value={counts.live} accent />
        <Counter label="Complete" value={counts.complete} />
        <Counter label="Failed" value={counts.failed} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 mb-6 border-b border-ink-800/80">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`relative px-3 py-2 text-[13px] tracking-tight transition-colors ${
              filter === f.key ? 'text-ink-100' : 'text-ink-500 hover:text-ink-300'
            }`}
          >
            {f.label}
            {filter === f.key && (
              <span className="absolute -bottom-px left-0 right-0 h-px bg-accent" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-3">
          {filtered.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}

function Counter({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-ink-950 px-5 py-5">
      <div className={`font-display text-3xl tracking-tight ${accent && value > 0 ? 'text-accent' : 'text-ink-100'}`}>
        {value}
      </div>
      <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mt-1">
        {label}
      </div>
    </div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="text-center py-16 rounded-xl border border-dashed border-ink-800 bg-ink-900/20">
      <div className="font-display text-lg mb-2">
        {filter === 'all' ? 'Nothing in the queue yet' : 'No jobs in this view'}
      </div>
      <p className="text-[13px] text-ink-500 mb-6">
        Drop an image into a workflow to kick off your first render.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-ink-950 text-[13px] font-medium hover:bg-accent-dim transition-colors"
      >
        Browse workflows
      </Link>
    </div>
  );
}
