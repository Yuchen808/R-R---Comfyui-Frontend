import { Link } from 'react-router-dom';
import { WORKFLOWS } from '../data/workflows';
import WorkflowCard from '../components/WorkflowCard';
import ProjectLibrary from '../components/ProjectLibrary';

export default function Home() {
  return (
    <div>
      {/* Project Library */}
      <section className="border-b border-ink-800/80 pt-12 lg:pt-16 pb-14 lg:pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mb-3">
                Library
              </div>
              <h1 className="text-5xl lg:text-6xl tracking-tightest leading-[0.95]">
                Project Library
              </h1>
            </div>
            <Link
              to="/project"
              className="hidden md:inline-flex text-[12px] font-mono text-ink-400 hover:text-ink-100 transition-colors"
            >
              All projects →
            </Link>
          </div>
          <ProjectLibrary />
        </div>
      </section>

      {/* Workflows */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-14 lg:py-20">
        <div className="mb-8">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mb-3">
            Workflows
          </div>
          <h2 className="text-3xl lg:text-4xl tracking-tight">
            Pick a workflow
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WORKFLOWS.map((w) => (
            <WorkflowCard key={w.slug} w={w} />
          ))}
        </div>
      </section>
    </div>
  );
}
