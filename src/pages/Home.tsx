import { Link } from 'react-router-dom';
import { WORKFLOWS } from '../data/workflows';
import WorkflowCard from '../components/WorkflowCard';
import { useJobs } from '../store/jobs';

export default function Home() {
  const jobs = useJobs();
  const recent = jobs.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative border-b border-ink-800/80 overflow-hidden">
        <div className="absolute inset-0 grid-lines opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-ink-800 bg-ink-900/60 text-[11px] font-mono text-ink-400">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Allect AI Lab · Internal release
            </div>
            <h1 className="font-display text-5xl lg:text-7xl tracking-tightest leading-[0.95] text-balance mb-6">
              Studio-grade rendering,
              <br />
              <span className="text-ink-500">without the prompt.</span>
            </h1>
            <p className="text-lg text-ink-300 text-balance max-w-xl mb-10 leading-relaxed">
              Drop your plan, sketch, or working render. Pick a workflow.
              The output lands back in your hands in minutes — same studio aesthetic, every time.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/w/plan-to-render"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-ink-950 font-medium text-[14px] hover:bg-accent-dim transition-colors"
              >
                Start a render
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-ink-700 text-ink-200 hover:border-ink-600 hover:bg-ink-900/60 text-[14px] transition-colors"
              >
                How it works
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-ink-800/80 border border-ink-800/80 rounded-xl overflow-hidden max-w-3xl">
            {[
              { k: '5', v: 'workflows live' },
              { k: '~90s', v: 'avg render time' },
              { k: '24/7', v: 'agent uptime' },
              { k: '0', v: 'prompts to write' },
            ].map((s) => (
              <div key={s.v} className="bg-ink-950 px-5 py-5">
                <div className="font-display text-2xl tracking-tight text-ink-100">{s.k}</div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mt-1">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflows */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mb-2">
              The five
            </div>
            <h2 className="font-display text-3xl lg:text-4xl tracking-tight">
              Pick a workflow
            </h2>
          </div>
          <Link
            to="/queue"
            className="text-[12px] font-mono text-ink-400 hover:text-ink-100 transition-colors"
          >
            View queue →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WORKFLOWS.map((w) => (
            <WorkflowCard key={w.slug} w={w} />
          ))}
        </div>
      </section>

      {/* Recent activity */}
      {recent.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-20">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-display text-2xl tracking-tight">
              Recent activity
            </h2>
            <Link
              to="/queue"
              className="text-[12px] font-mono text-ink-400 hover:text-ink-100 transition-colors"
            >
              All jobs →
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {recent.map((j) => (
              <RecentChip key={j.id} job={j} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import type { Job } from '../types';
import { workflowBySlug } from '../data/workflows';
import StatusPill from '../components/StatusPill';

function RecentChip({ job }: { job: Job }) {
  const w = workflowBySlug(job.workflow);
  return (
    <Link
      to="/queue"
      className="flex items-center gap-3 p-3 rounded-lg border border-ink-800 bg-ink-900/40 hover:bg-ink-900/70 transition-colors"
    >
      <div className="h-10 w-10 rounded-md bg-ink-800 overflow-hidden flex-shrink-0">
        {job.thumbDataUrl && (
          <img src={job.thumbDataUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] truncate">{w?.name}</div>
        <div className="text-[11px] font-mono text-ink-500 truncate">{job.fileName}</div>
      </div>
      <StatusPill status={job.status} />
    </Link>
  );
}
