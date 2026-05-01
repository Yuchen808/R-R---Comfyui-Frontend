export type WorkflowSlug =
  | 'plan-to-render'
  | 'sketch-to-render'
  | 'material-swap'
  | 'detail-upscale'
  | 'reference-stylize';

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
