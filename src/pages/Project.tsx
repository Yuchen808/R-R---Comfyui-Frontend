import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PROJECTS } from '../data/projects';
import type { Project } from '../types';
import { useJobs, clearCompleted } from '../store/jobs';
import JobCard from '../components/JobCard';

type Filter = 'all' | 'active' | 'archived';

export default function ProjectPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const jobs = useJobs();

  const liveJobs = jobs.filter(
    (j) => j.status === 'queued' || j.status === 'syncing' || j.status === 'processing',
  );
  const recentJobs = jobs.slice(0, 6);

  const filtered =
    filter === 'all'
      ? PROJECTS
      : PROJECTS.filter((p) => p.status === filter);

  const counts = {
    all: PROJECTS.length,
    active: PROJECTS.filter((p) => p.status === 'active').length,
    archived: PROJECTS.filter((p) => p.status === 'archived').length,
  };

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-10 py-12 lg:py-16">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mb-3">
            Projects
          </div>
          <h1 className="text-4xl lg:text-5xl tracking-tightest">All projects</h1>
        </div>
      </div>

      {/* Active jobs */}
      {liveJobs.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-slow" />
            <h2 className="text-lg tracking-tight">In progress</h2>
            <span className="text-[11px] font-mono text-ink-500">
              {liveJobs.length} job{liveJobs.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="space-y-3">
            {liveJobs.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="flex items-center gap-1 mb-6 border-b border-ink-800/80">
        {(['all', 'active', 'archived'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`relative px-3 py-2 text-[13px] tracking-tight transition-colors capitalize ${
              filter === f ? 'text-ink-100' : 'text-ink-500 hover:text-ink-300'
            }`}
          >
            {f}
            <span className="ml-1.5 font-mono text-[11px] text-ink-600">
              {counts[f]}
            </span>
            {filter === f && (
              <span className="absolute -bottom-px left-0 right-0 h-px bg-accent" />
            )}
          </button>
        ))}
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-16">
        {filtered.map((p) => (
          <ProjectGridCard key={p.id} project={p} />
        ))}
      </div>

      {/* Recent activity */}
      {recentJobs.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-lg tracking-tight">Recent renders</h2>
            {jobs.some((j) => j.status === 'complete' || j.status === 'failed') && (
              <button
                onClick={clearCompleted}
                className="text-[12px] font-mono text-ink-500 hover:text-ink-200 transition-colors"
              >
                Clear finished
              </button>
            )}
          </div>
          <div className="space-y-3">
            {recentJobs.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProjectGridCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/project#${project.id}`}
      id={project.id}
      className="group block"
    >
      <div
        className="aspect-[4/3] rounded-xl border border-ink-800 overflow-hidden mb-3 relative transition-all duration-300 group-hover:border-ink-700 group-hover:-translate-y-0.5"
        style={{
          backgroundImage: `radial-gradient(at 30% 20%, hsla(${project.hue}, 60%, 35%, 0.45) 0, transparent 55%), linear-gradient(135deg, hsl(${project.hue}, 18%, 14%) 0%, hsl(${project.hue}, 12%, 7%) 100%)`,
        }}
      >
        <div className="absolute inset-0 grid-lines opacity-30" />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
          <span className="text-ink-300/80">{project.location}</span>
          <span className="text-ink-300/70">{project.status}</span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono">
          <span
            className="inline-flex items-center gap-1.5 text-ink-300/80"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: `hsl(${project.hue}, 70%, 60%)` }}
            />
            {project.client}
          </span>
          <span className="text-ink-300/70">{project.renderCount} renders</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] tracking-tight truncate text-ink-100 group-hover:text-accent transition-colors">
          {project.name}
        </span>
        <span className="text-[11px] font-mono text-ink-500 flex-shrink-0">
          {project.updatedAt}
        </span>
      </div>
    </Link>
  );
}
