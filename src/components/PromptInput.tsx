interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function PromptInput({
  value,
  onChange,
  placeholder,
  disabled,
}: Props) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-ink-800/60">
        <div className="text-[11px] font-mono uppercase tracking-widest text-ink-500">
          Prompt
        </div>
        <div className="text-[10px] font-mono text-ink-600">
          {value.length} / 500
        </div>
      </div>
      <textarea
        value={value}
        maxLength={500}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Describe what you want…'}
        rows={6}
        className="w-full px-4 py-3 bg-transparent text-[13px] text-ink-100 placeholder:text-ink-600 focus:outline-none resize-none scrollbar-clean disabled:opacity-50"
      />
      <div className="flex items-center justify-between px-4 py-2 border-t border-ink-800/60 text-[10px] font-mono text-ink-500">
        <span>Plain English. Specific verbs work best.</span>
        {value.length > 0 && (
          <button
            onClick={() => onChange('')}
            className="text-ink-500 hover:text-ink-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
