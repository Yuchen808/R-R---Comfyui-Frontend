export type WorkflowSlug = 'image-to-video' | 'instruct-image';

export interface WorkflowPreset {
  id: string;
  name: string;
  description: string;
}

export interface Workflow {
  slug: WorkflowSlug;
  index: number;
  name: string;
  short: string;
  description: string;
  inputLabel: string;
  outputLabel: string;
  typicalTime: string;
  status: 'live' | 'beta' | 'soon';
  tags: string[];
  presets?: WorkflowPreset[];
}

export type JobStatus =
  | 'queued'
  | 'syncing'
  | 'processing'
  | 'complete'
  | 'failed';

export interface Job {
  id: string;
  workflow: WorkflowSlug;
  presetId: string | null;
  fileName: string;
  fileSize: number;
  submittedAt: number;
  status: JobStatus;
  progress: number;
  etaSeconds: number | null;
  resultUrl: string | null;
  thumbDataUrl: string | null;
  errorMessage: string | null;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  status: 'active' | 'archived';
  hue: number;
  renderCount: number;
  updatedAt: string;
}
