import type { ParamSpec, ParamValue } from '../types';

interface Props {
  workflowName: string;
  workflowIndex: number;
  specs: ParamSpec[];
  values: Record<string, ParamValue>;
  onChange: (id: string, value: ParamValue) => void;
}

export default function ParameterControls({
  workflowName,
  workflowIndex,
  specs,
  values,
  onChange,
}: Props) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-ink-800/60">
        <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500">
          Parameters
        </div>
      </div>
      <div className="px-4 py-3 border-b border-ink-800/60 flex items-center justify-between">
        <span className="text-[13px] tracking-tight text-ink-100">{workflowName}</span>
        <span className="font-mono text-[11px] text-ink-500">
          0{workflowIndex}
        </span>
      </div>

      <div className="p-4 space-y-5">
        {specs.map((spec) => (
          <ParamRow
            key={spec.id}
            spec={spec}
            value={values[spec.id]}
            onChange={(v) => onChange(spec.id, v)}
          />
        ))}
      </div>
    </div>
  );
}

function ParamRow({
  spec,
  value,
  onChange,
}: {
  spec: ParamSpec;
  value: ParamValue;
  onChange: (v: ParamValue) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-[12px]">
        <label className="text-ink-300 tracking-tight">{spec.label}</label>
        <span className="font-mono text-[11px] text-ink-400">
          {renderValue(spec, value)}
        </span>
      </div>

      {spec.type === 'slider' && (
        <input
          type="range"
          min={spec.min}
          max={spec.max}
          step={spec.step}
          value={Number(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 appearance-none cursor-pointer rounded-full bg-ink-800 accent-accent
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-accent
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-ink-950
            [&::-moz-range-thumb]:h-3
            [&::-moz-range-thumb]:w-3
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-accent
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-ink-950"
          style={{
            background: `linear-gradient(to right, #80EF80 0%, #80EF80 ${
              ((Number(value) - spec.min) / (spec.max - spec.min)) * 100
            }%, #1A1A1A ${
              ((Number(value) - spec.min) / (spec.max - spec.min)) * 100
            }%, #1A1A1A 100%)`,
          }}
        />
      )}

      {spec.type === 'select' && (
        <div className="inline-flex items-center gap-1 p-0.5 rounded-md border border-ink-800 bg-ink-900">
          {spec.options.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                value === opt
                  ? 'bg-ink-700 text-ink-100'
                  : 'text-ink-400 hover:text-ink-100'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {spec.type === 'toggle' && (
        <button
          onClick={() => onChange(!value)}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            value ? 'bg-accent' : 'bg-ink-700'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink-950 transition-transform ${
              value ? 'translate-x-[18px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      )}

      {spec.type === 'text' && (
        <input
          type="text"
          value={String(value)}
          placeholder={spec.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-md bg-ink-900 border border-ink-800 text-[12px] font-mono text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-ink-600"
        />
      )}

      {spec.hint && (
        <div className="text-[10px] font-mono text-ink-600 mt-1.5 leading-snug">
          {spec.hint}
        </div>
      )}
    </div>
  );
}

function renderValue(spec: ParamSpec, value: ParamValue): string {
  if (spec.type === 'slider') {
    return `${value}${spec.unit ?? ''}`;
  }
  if (spec.type === 'toggle') {
    return value ? 'on' : 'off';
  }
  return String(value);
}
