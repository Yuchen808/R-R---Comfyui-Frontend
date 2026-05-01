interface Props {
  disabled: boolean;
  busy: boolean;
  missingCount: number;
  onClick: () => void;
}

export default function RenderButton({ disabled, busy, missingCount, onClick }: Props) {
  const helper =
    busy
      ? 'Render in progress'
      : missingCount > 0
        ? `Add ${missingCount} more image${missingCount === 1 ? '' : 's'} to start`
        : 'Ready';

  return (
    <div className="flex flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`group relative w-full h-12 rounded-full font-medium tracking-tight text-[15px] transition-all flex items-center justify-center gap-2 ${
          disabled
            ? 'bg-ink-800 text-ink-600 cursor-not-allowed'
            : 'bg-accent text-ink-950 hover:bg-accent-dim active:scale-[0.99] shadow-[0_0_24px_-6px_rgba(128,239,128,0.5)]'
        }`}
      >
        {busy ? (
          <>
            <span className="h-3.5 w-3.5 rounded-full border-2 border-ink-600 border-t-transparent animate-spin" />
            <span>Rendering…</span>
          </>
        ) : (
          <>
            <span>Render</span>
            {!disabled && (
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="opacity-70 group-hover:translate-x-0.5 transition-transform">
                <path d="M2 6h8m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </>
        )}
      </button>
      <div className="flex items-center justify-center text-[10px] font-mono uppercase tracking-widest text-ink-500">
        <span>{helper}</span>
      </div>
    </div>
  );
}
