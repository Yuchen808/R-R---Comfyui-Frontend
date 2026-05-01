import { useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { workflowBySlug, WORKFLOWS } from '../data/workflows';
import { WORKFLOW_PARAMS, defaultParamsFor } from '../data/workflowParams';
import UploadZone from '../components/UploadZone';
import PromptInput from '../components/PromptInput';
import ParameterControls from '../components/ParameterControls';
import ProgressBar from '../components/ProgressBar';
import OutputDisplay from '../components/OutputDisplay';
import { createJob, useJobs } from '../store/jobs';
import type { ParamValue } from '../types';

const ETA_MAP: Record<string, number> = {
  'image-to-video': 180,
  'instruct-image': 90,
};

export default function WorkflowDetail() {
  const { slug } = useParams();
  const w = slug ? workflowBySlug(slug) : undefined;
  const allJobs = useJobs();

  const [presetId, setPresetId] = useState<string | null>(
    w?.presets?.[0]?.id ?? null,
  );
  const [prompt, setPrompt] = useState('');
  const [paramValues, setParamValues] = useState<Record<string, ParamValue>>(
    () => (w ? defaultParamsFor(w.slug) : {}),
  );
  const [latestJobId, setLatestJobId] = useState<string | null>(null);

  const activeJob = useMemo(() => {
    if (!w) return null;
    if (latestJobId) {
      return allJobs.find((j) => j.id === latestJobId) ?? null;
    }
    return allJobs.find((j) => j.workflow === w.slug) ?? null;
  }, [allJobs, latestJobId, w]);

  if (!w) {
    return (
      <div className="mx-auto max-w-3xl px-6 lg:px-10 py-32 text-center">
        <h1 className="text-3xl mb-3">Workflow not found</h1>
        <Link to="/" className="text-accent hover:underline">
          Back
        </Link>
      </div>
    );
  }

  const handleFile = (file: File, dataUrl: string) => {
    const job = createJob({
      workflow: w.slug,
      presetId,
      prompt: prompt.trim() || null,
      params: paramValues,
      file,
      thumbDataUrl: dataUrl,
      etaSeconds: ETA_MAP[w.slug] ?? 90,
    });
    setLatestJobId(job.id);
  };

  const activePreset = w.presets?.find((p) => p.id === presetId);

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
        {/* Left: input → progress → output */}
        <div className="lg:col-span-8 space-y-8">
          <header>
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

            <h1 className="text-4xl lg:text-5xl tracking-tightest text-balance mb-4">
              {w.name}
            </h1>
            <p className="text-[15px] text-ink-300 max-w-2xl text-balance leading-relaxed">
              {w.description}
            </p>
          </header>

          {w.presets && w.presets.length > 0 && (
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mb-3">
                Preset
              </div>
              <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-ink-800 bg-ink-900/60">
                {w.presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPresetId(p.id)}
                    className={`px-4 py-1.5 text-[13px] tracking-tight rounded-md transition-colors ${
                      presetId === p.id
                        ? 'bg-ink-800 text-ink-100'
                        : 'text-ink-400 hover:text-ink-100'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              {activePreset && (
                <p className="text-[12px] text-ink-500 mt-3 max-w-2xl">
                  {activePreset.description}
                </p>
              )}
            </div>
          )}

          {/* Input */}
          <section>
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mb-3">
              Input
            </div>
            <UploadZone
              onFile={handleFile}
              hint={`${w.inputLabel} · typical render ${w.typicalTime}`}
            />
          </section>

          {/* Progress */}
          <section>
            <ProgressBar job={activeJob} />
          </section>

          {/* Output */}
          <section>
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500 mb-3">
              Output
            </div>
            <OutputDisplay workflow={w} job={activeJob} />
          </section>
        </div>

        {/* Right: prompt + parameters */}
        <aside className="lg:col-span-4 space-y-6">
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            placeholder={w.promptPlaceholder}
          />

          <ParameterControls
            workflowName={w.name}
            workflowIndex={w.index}
            specs={WORKFLOW_PARAMS[w.slug]}
            values={paramValues}
            onChange={(id, value) =>
              setParamValues((prev) => ({ ...prev, [id]: value }))
            }
          />
        </aside>
      </div>
    </div>
  );
}
