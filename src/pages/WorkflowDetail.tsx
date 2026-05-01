import { useNavigate, useParams, Link } from 'react-router-dom';
import { workflowBySlug, WORKFLOWS } from '../data/workflows';
import UploadZone from '../components/UploadZone';
import { createJob, useJobs } from '../store/jobs';
import JobCard from '../components/JobCard';

const ETA_MAP: Record<string, number> = {
  'plan-to-render': 90,
  'sketch-to-render': 120,
  'material-swap': 180,
  'detail-upscale': 45,
  'reference-stylize': 120,
};

export default function WorkflowDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const w = slug ? workflowBySlug(slug) : undefined;
  const allJobs = useJobs();
  const jobsForFlow = allJobs.filter((j) => j.workflow === slug).slice(0, 5);

  if (!w) {
    return (
      <div className="mx-auto max-w-3xl px-6 lg:px-10 py-32 text-center">
        <h1 className="font-display text-3xl mb-3">Workflow not found</h1>
        <Link to="/" className="text-accent hover:underline">
          Back to studio
        </Link>
      </div>
    );
  }

  const handleFile = (file: File, dataUrl: string) => {
    createJob({
      workflow: w.slug,
      file,
      thumbDataUrl: dataUrl,
      etaSeconds: ETA_MAP[w.slug] ?? 90,
    });
    navigate('/queue');
  };

  const otherFlows = WORKFLOWS.filter((x) => x.slug !== w.slug && x.status !== 'soon').slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-10 py-12 lg:py-16">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[12px] font-mono text-ink-500 hover:text-ink-200 transition-colors mb-8"
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M10 6H2m3-3L2 6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Studio
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: header + upload */}
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[11px] text-ink-500 tracking-widest">
              0{w.index} / {WORKFLOWS.length}
            </span>
            <span
              className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                w.status === 'live'
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'bg-ink-800 text-ink-300 border-ink-700'
              }`}
            >
              {w.status}
            </span>
          </div>

          <h1 className="font-display text-4xl lg:text-5xl tracking-tightest text-balance mb-4">
            {w.name}
          </h1>
          <p className="text-[15px] text-ink-300 max-w-2xl text-balance leading-relaxed mb-10">
            {w.description}
          </p>

          <UploadZone
            onFile={handleFile}
            hint={`${w.inputLabel} · typical render ${w.typicalTime}`}
          />

          {jobsForFlow.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-lg tracking-tight mb-4">
                Recent in this workflow
              </h2>
              <div className="space-y-3">
                {jobsForFlow.map((j) => (
                  <JobCard key={j.id} job={j} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: meta */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-5">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mb-3">
              How it works
            </div>
            <ol className="space-y-3 text-[13px] text-ink-300">
              <li className="flex gap-3">
                <span className="font-mono text-ink-500 w-4">1</span>
                <span>You drop {w.inputLabel.toLowerCase()} above.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-ink-500 w-4">2</span>
                <span>The agent picks it up and runs the workflow on Zak's local stack.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-ink-500 w-4">3</span>
                <span>The {w.outputLabel.toLowerCase()} appears in your queue, ready to download.</span>
              </li>
            </ol>
          </div>

          <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-5">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mb-3">
              Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {w.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-[11px] font-mono text-ink-300 bg-ink-800/80 border border-ink-700 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {otherFlows.length > 0 && (
            <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mb-3">
                Other workflows
              </div>
              <div className="space-y-2">
                {otherFlows.map((f) => (
                  <Link
                    key={f.slug}
                    to={`/w/${f.slug}`}
                    className="flex items-center justify-between py-2 border-b border-ink-800/60 last:border-0 hover:text-accent transition-colors text-[13px]"
                  >
                    <span>{f.name}</span>
                    <span className="font-mono text-[11px] text-ink-500">0{f.index}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
