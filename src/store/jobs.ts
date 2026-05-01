import { useEffect, useState } from 'react';
import type { Job, JobInputFile, ParamValue, WorkflowSlug } from '../types';

const STORAGE_KEY = 'rr-comfy-jobs-v4';
const BRIDGE_URL = (import.meta.env.VITE_BRIDGE_URL as string | undefined)?.replace(/\/$/, '') ?? null;
const POLL_INTERVAL_MS = 3000;

const listeners = new Set<() => void>();
let cache: Job[] | null = null;

const load = (): Job[] => {
  if (cache) return cache;
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Job[]) : [];
  } catch {
    cache = [];
  }
  return cache!;
};

const persist = (next: Job[]) => {
  cache = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((fn) => fn());
};

export const getJobs = (): Job[] => load();

export const subscribeJobs = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const createJob = (params: {
  workflow: WorkflowSlug;
  presetId: string | null;
  prompt: string | null;
  params: Record<string, ParamValue>;
  inputs: Record<string, JobInputFile>;
  etaSeconds: number;
}): Job => {
  const job: Job = {
    id: `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    workflow: params.workflow,
    presetId: params.presetId,
    prompt: params.prompt,
    params: params.params,
    inputs: params.inputs,
    submittedAt: Date.now(),
    status: 'queued',
    progress: 0,
    etaSeconds: params.etaSeconds,
    resultUrl: null,
    errorMessage: null,
  };
  persist([job, ...load()]);

  if (BRIDGE_URL) {
    submitToBridge(job).catch((err) => {
      console.error('[jobs] bridge submit failed', err);
      updateJob(job.id, {
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    });
  } else {
    simulateJob(job.id, params.etaSeconds);
  }

  return job;
};

export const updateJob = (id: string, patch: Partial<Job>) => {
  const next = load().map((j) => (j.id === id ? { ...j, ...patch } : j));
  persist(next);
};

export const deleteJob = (id: string) => {
  persist(load().filter((j) => j.id !== id));
};

export const clearCompleted = () => {
  persist(load().filter((j) => j.status !== 'complete' && j.status !== 'failed'));
};

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const resp = await fetch(dataUrl);
  return resp.blob();
};

async function submitToBridge(job: Job): Promise<void> {
  if (!BRIDGE_URL) return;

  const fd = new FormData();
  fd.append('workflow', job.workflow);
  fd.append('prompt', job.prompt ?? '');
  fd.append('params', JSON.stringify(job.params));
  if (job.presetId) fd.append('preset_id', job.presetId);

  for (const [slotId, input] of Object.entries(job.inputs)) {
    const blob = await dataUrlToBlob(input.dataUrl);
    fd.append(`image_${slotId}`, blob, input.fileName);
  }

  const resp = await fetch(`${BRIDGE_URL}/api/render`, { method: 'POST', body: fd });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`bridge ${resp.status}: ${text}`);
  }
  const data = (await resp.json()) as { job_id: string };
  pollBridge(job.id, data.job_id);
}

function pollBridge(localId: string, remoteId: string) {
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    try {
      const resp = await fetch(`${BRIDGE_URL}/api/job/${remoteId}/status`);
      if (resp.ok) {
        const status = (await resp.json()) as {
          status: Job['status'];
          progress?: number;
          eta_seconds?: number;
          error_message?: string;
          result_file?: string;
        };
        const patch: Partial<Job> = {
          status: status.status,
          progress: status.progress ?? 0,
          etaSeconds: status.eta_seconds ?? null,
        };
        if (status.status === 'complete') {
          patch.resultUrl = `${BRIDGE_URL}/api/job/${remoteId}/result`;
        }
        if (status.status === 'failed') {
          patch.errorMessage = status.error_message ?? 'Render failed';
        }
        updateJob(localId, patch);

        if (status.status === 'complete' || status.status === 'failed') {
          stopped = true;
          return;
        }
      }
    } catch (err) {
      console.warn('[jobs] poll error', err);
    }
    setTimeout(tick, POLL_INTERVAL_MS);
  };
  setTimeout(tick, 800);
}

const simulateJob = (id: string, totalSeconds: number) => {
  const startedAt = Date.now();
  const tick = () => {
    const job = load().find((j) => j.id === id);
    if (!job) return;
    const elapsed = (Date.now() - startedAt) / 1000;
    const ratio = Math.min(elapsed / totalSeconds, 1);

    if (job.status === 'queued' && elapsed > 1.2) {
      updateJob(id, { status: 'syncing' });
    }
    if (elapsed > 3 && job.status === 'syncing') {
      updateJob(id, { status: 'processing' });
    }

    if (ratio < 1) {
      updateJob(id, {
        progress: Math.round(ratio * 100),
        etaSeconds: Math.max(1, Math.round(totalSeconds - elapsed)),
      });
      setTimeout(tick, 350);
    } else {
      const current = load().find((j) => j.id === id);
      const mainInput = current?.inputs.main;
      updateJob(id, {
        progress: 100,
        status: 'complete',
        etaSeconds: 0,
        resultUrl: mainInput?.dataUrl ?? null,
      });
    }
  };
  setTimeout(tick, 400);
};

export const useJobs = (): Job[] => {
  const [snapshot, setSnapshot] = useState<Job[]>(() => load());
  useEffect(() => subscribeJobs(() => setSnapshot([...load()])), []);
  return snapshot;
};

export const useJob = (id: string | undefined): Job | undefined => {
  const jobs = useJobs();
  return id ? jobs.find((j) => j.id === id) : undefined;
};

export const isUsingBridge = (): boolean => BRIDGE_URL !== null;
export const getBridgeUrl = (): string | null => BRIDGE_URL;
