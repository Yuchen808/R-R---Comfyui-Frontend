import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { PROJECTS } from '../data/projects';

const FADE_MASK =
  'linear-gradient(to right, transparent 0, black 80px, black calc(100% - 80px), transparent 100%)';

export default function ProjectLibrary() {
  const active = PROJECTS.filter((p) => p.status === 'active');
  return (
    <div className="relative">
      <div
        className="overflow-x-auto scrollbar-clean -mx-6 lg:-mx-10"
        style={{
          maskImage: FADE_MASK,
          WebkitMaskImage: FADE_MASK,
        }}
      >
        <div className="flex gap-4 px-6 lg:px-10 py-1">
          {active.map((p) => (
            <ProjectTile key={p.id} project={p} />
          ))}
          <Link
            to="/project"
            className="flex-shrink-0 w-[260px] aspect-[4/5] rounded-xl border border-dashed border-ink-700 bg-ink-900/30 flex flex-col items-center justify-center gap-3 hover:border-ink-500 hover:bg-ink-900/60 transition-colors"
          >
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500">
              All projects
            </div>
            <div className="text-[28px] text-ink-300">→</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProjectTile({ project }: { project: Project }) {
  return (
    <Link
      to={`/project#${project.id}`}
      className="group flex-shrink-0 w-[260px]"
    >
      <div
        className="aspect-[4/5] rounded-xl border border-ink-800 overflow-hidden mb-3 relative transition-transform duration-300 group-hover:-translate-y-1 group-hover:border-ink-700"
        style={{
          backgroundImage: `radial-gradient(at 30% 20%, hsla(${project.hue}, 60%, 35%, 0.45) 0, transparent 55%), linear-gradient(135deg, hsl(${project.hue}, 18%, 14%) 0%, hsl(${project.hue}, 12%, 7%) 100%)`,
        }}
      >
        <div className="absolute inset-0 grid-lines opacity-30" />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-ink-300/80">
            {project.location}
          </span>
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: `hsl(${project.hue}, 70%, 60%)` }}
          />
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono">
          <span className="uppercase tracking-widest text-ink-300/70">
            {project.status}
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
