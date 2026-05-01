import { useCallback, useRef, useState } from 'react';

interface Props {
  onFile: (file: File, dataUrl: string) => void;
  accept?: string;
  hint?: string;
}

export default function UploadZone({
  onFile,
  accept = 'image/png,image/jpeg,image/webp',
  hint = 'PNG, JPG, or WEBP · up to 50 MB',
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
      reader.onload = () => onFile(file, reader.result as string);
      reader.onerror = () => setError('Could not read that file.');
      reader.readAsDataURL(file);
    },
    [onFile],
  );

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-xl border border-dashed transition-all px-8 py-16 text-center grid-lines ${
        drag
          ? 'border-accent bg-accent/5'
          : 'border-ink-700 bg-ink-900/40 hover:border-ink-600 hover:bg-ink-900/70'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-ink-800/80 border border-ink-700">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" />
        </svg>
      </div>
      <div className="font-display text-lg tracking-tight mb-1">
        {drag ? 'Drop to start render' : 'Drop image, or click to browse'}
      </div>
      <div className="text-[12px] font-mono text-ink-500">{hint}</div>

      {error && (
        <div className="mt-4 inline-block text-[12px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-1">
          {error}
        </div>
      )}
    </div>
  );
}
