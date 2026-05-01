import { useEffect, useState } from 'react';
import type { Job, WorkflowSlug } from '../types';

const STORAGE_KEY = 'rr-comfy-jobs-v2';
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
  file: File;
  thumbDataUrl: string;
  etaSeconds: number;
}): Job => {
  const job: Job = {
    id: `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    workflow: params.workflow,
    presetId: params.presetId,
    fileName: params.file.name,
    fileSize: params.file.size,
    submittedAt: Date.now(),
    status: 'queued',
    progress: 0,
    etaSeconds: params.etaSeconds,
    resultUrl: null,
    thumbDataUrl: params.thumbDataUrl,
    errorMessage: null,
  };
  persist([job, ...load()]);
  simulateJob(job.id, params.etaSeconds);
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
      updateJob(id, {
        progress: 100,
        status: 'complete',
        etaSeconds: 0,
        resultUrl: load().find((j) => j.id === id)?.thumbDataUrl ?? null,
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
