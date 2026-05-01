import type { ParamSpec, ParamValue, WorkflowSlug } from '../types';

export const WORKFLOW_PARAMS: Record<WorkflowSlug, ParamSpec[]> = {
  'image-to-video': [
    {
      id: 'duration',
      label: 'Duration',
      type: 'slider',
      min: 2,
      max: 8,
      step: 1,
      default: 4,
      unit: 's',
    },
    {
      id: 'motion',
      label: 'Motion strength',
      type: 'slider',
      min: 0,
      max: 100,
      step: 5,
      default: 55,
      unit: '%',
    },
    {
      id: 'fps',
      label: 'FPS',
      type: 'select',
      options: ['24', '30'],
      default: '24',
    },
    {
      id: 'loop',
      label: 'Seamless loop',
      type: 'toggle',
      default: true,
    },
  ],
  'instruct-image': [
    {
      id: 'strength',
      label: 'Edit strength',
      type: 'slider',
      min: 0,
      max: 100,
      step: 5,
      default: 60,
      unit: '%',
      hint: 'How much of the image is allowed to change. Higher = more aggressive.',
    },
    {
      id: 'guidance',
      label: 'Guidance',
      type: 'slider',
      min: 1,
      max: 20,
      step: 1,
      default: 7,
      hint: 'How tightly the model follows the prompt vs. the input.',
    },
    {
      id: 'quality',
      label: 'Quality',
      type: 'select',
      options: ['draft', 'standard', 'high'],
      default: 'standard',
    },
    {
      id: 'seed',
      label: 'Seed',
      type: 'text',
      default: 'random',
      placeholder: 'random or a number',
    },
  ],
};

export const defaultParamsFor = (slug: WorkflowSlug): Record<string, ParamValue> =>
  Object.fromEntries(WORKFLOW_PARAMS[slug].map((p) => [p.id, p.default]));
