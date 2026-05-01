import { Link } from 'react-router-dom';
import type { Workflow } from '../types';

const STATUS_LABEL: Record<Workflow['status'], string> = {
  live: 'Live',
  beta: 'Beta',
  soon: 'Soon',
};

export default function WorkflowCard({ w }: { w: Workflow }) {
  const isAvailable = w.status !== 'soon';
  const Wrapper: any = isAvailable ? Link : 'div';
  const wrapperProps = isAvailable ? { to: `/w/${w.slug}` } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`group relative flex flex-col p-7 rounded-xl border border-ink-800 bg-ink-900/60 overflow-hidden transition-all ${
        isAvailable
          ? 'hover:border-ink-700 hover:bg-ink-900 hover:-translate-y-0.5'
          : 'opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between mb-8">
        <span className="font-mono text-[11px] text-ink-500 tracking-widest">
          0{w.index}
        </span>
        <span
          className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            w.status === 'live'
              ? 'bg-accent/10 text-accent border-accent/30'
              : w.status === 'beta'
                ? 'bg-ink-800 text-ink-300 border-ink-700'
                : 'bg-ink-800/50 text-ink-500 border-ink-800'
          }`}
        >
          {STATUS_LABEL[w.status]}
        </span>
      </div>

      <h3 className="text-3xl tracking-tight text-balance mb-2">
        {w.name}
      </h3>
      <p className="text-[13px] text-ink-400 mb-5 text-balance leading-relaxed">
        {w.short}
      </p>

      {w.presets && w.presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {w.presets.map((p, i) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono text-ink-300 bg-ink-800/60 border border-ink-700 rounded"
            >
              <span className="text-ink-500">{i + 1}.</span>
              {p.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-5 border-t border-ink-800/80 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2 text-ink-500">
          <span>{w.inputLabel}</span>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{w.outputLabel}</span>
        </div>
        <span className="text-ink-400">{w.typicalTime}</span>
      </div>
    </Wrapper>
  );
}
