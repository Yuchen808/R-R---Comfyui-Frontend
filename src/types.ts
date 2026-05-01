export type WorkflowSlug = 'image-to-video' | 'instruct-image';

export interface WorkflowPreset {
  id: string;
  name: string;
  description: string;
}

export interface ImageInputSlot {
  id: string;
  label: string;
  description?: string;
  required: boolean;
}

export interface Workflow {
  slug: WorkflowSlug;
  index: number;
  name: string;
  short: string;
  description: string;
  inputLabel: string;
  outputLabel: string;
  outputKind: 'image' | 'video';
  typicalTime: string;
  status: 'live' | 'beta' | 'soon';
  tags: string[];
  promptPlaceholder: string;
  imageInputs: ImageInputSlot[];
  presets?: WorkflowPreset[];
}

export type ParamValue = string | number | boolean;

export type ParamSpec =
  | {
      id: string;
      label: string;
      type: 'slider';
      min: number;
      max: number;
      step: number;
      default: number;
      unit?: string;
      hint?: string;
    }
  | {
      id: string;
      label: string;
      type: 'select';
      options: string[];
      default: string;
      hint?: string;
    }
  | {
      id: string;
      label: string;
      type: 'toggle';
      default: boolean;
      hint?: string;
    }
  | {
      id: string;
      label: string;
      type: 'text';
      default: string;
      placeholder?: string;
      hint?: string;
    };

export type JobStatus =
  | 'queued'
  | 'syncing'
  | 'processing'
  | 'complete'
  | 'failed';

export interface JobInputFile {
  fileName: string;
  fileSize: number;
  dataUrl: string;
}

export interface Job {
  id: string;
  workflow: WorkflowSlug;
  presetId: string | null;
  prompt: string | null;
  params: Record<string, ParamValue>;
  inputs: Record<string, JobInputFile>;
  submittedAt: number;
  status: JobStatus;
  progress: number;
  etaSeconds: number | null;
  resultUrl: string | null;
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
