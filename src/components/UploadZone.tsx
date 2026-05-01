import { useCallback, useRef, useState } from 'react';
import type { JobInputFile } from '../types';

interface Props {
  label?: string;
  description?: string;
  value: JobInputFile | null;
  onChange: (next: JobInputFile | null) => void;
  accept?: string;
  hint?: string;
  disabled?: boolean;
}

export default function UploadZone({
  label,
  description,
  value,
  onChange,
  accept = 'image/png,image/jpeg,image/webp',
  hint,
  disabled,
}: Props) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.type.startsWith('image/')) {
        setError('That file does not look like an image.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('Files must be under 50 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () =>
        onChange({
          fileName: file.name,
          fileSize: file.size,
          dataUrl: reader.result as string,
        });
      reader.onerror = () => setError('Could not read that file.');
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  if (value) {
    return (
      <div className="flex flex-col gap-2">
        {label && <ZoneLabel label={label} description={description} />}
        <div className="relative aspect-[4/3] rounded-xl border border-ink-800 overflow-hidden bg-ink-900/40 group">
          <img
            src={value.dataUrl}
            alt={value.fileName}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-ink-950/80 border border-ink-700 text-ink-200 hover:text-ink-100 hover:bg-ink-900 transition-colors flex items-center justify-center disabled:opacity-40"
            aria-label="Remove"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 text-[11px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="truncate text-ink-200">{value.fileName}</span>
            <span className="flex-shrink-0 text-ink-400">
              {formatSize(value.fileSize)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <ZoneLabel label={label} description={description} />}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDrag(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (disabled) return;
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative aspect-[4/3] rounded-xl border border-dashed transition-all flex items-center justify-center text-center grid-lines ${
          disabled
            ? 'border-ink-800 bg-ink-900/20 cursor-not-allowed opacity-50'
            : drag
              ? 'border-accent bg-accent/5 cursor-pointer'
              : 'border-ink-700 bg-ink-900/40 hover:border-ink-600 hover:bg-ink-900/70 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="px-6">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-ink-800/80 border border-ink-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" />
            </svg>
          </div>
          <div className="text-[14px] tracking-tight mb-1">
            {drag ? 'Drop here' : 'Drop image, or click'}
          </div>
          {hint && <div className="text-[11px] font-mono text-ink-500">{hint}</div>}

          {error && (
            <div className="mt-3 inline-block text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-2 py-1">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ZoneLabel({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] font-mono uppercase tracking-widest text-ink-400">
        {label}
      </span>
      {description && (
        <span className="text-[10px] font-mono text-ink-600 truncate text-right">
          {description}
        </span>
      )}
    </div>
  );
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
