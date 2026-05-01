import type { Workflow } from '../types';

export const WORKFLOWS: Workflow[] = [
  {
    slug: 'plan-to-render',
    index: 1,
    name: 'Plan → Render',
    short: 'Floor plan to atmospheric render',
    description:
      'Drop a 2D floor plan or top-down model snapshot. Get back a styled, atmospheric perspective in the studio house aesthetic.',
    inputLabel: 'Plan / top-down view',
    outputLabel: 'Atmospheric render',
    typicalTime: '~90s',
    status: 'live',
    tags: ['interior', 'concept', 'overnight'],
  },
  {
    slug: 'sketch-to-render',
    index: 2,
    name: 'Sketch → Render',
    short: 'Hand sketch to photoreal',
    description:
      'Pencil, marker, or napkin sketch in — photoreal interior elevation out. Preserves composition and lighting intent.',
    inputLabel: 'Sketch (any quality)',
    outputLabel: 'Photoreal interior',
    typicalTime: '~2 min',
    status: 'live',
    tags: ['concept', 'client-facing'],
  },
  {
    slug: 'material-swap',
    index: 3,
    name: 'Material Swap',
    short: 'Replace finishes in place',
    description:
      'Upload a render and a target material reference. Returns the same view with the material swapped — geometry and lighting intact.',
    inputLabel: 'Render + reference',
    outputLabel: 'Re-finished render',
    typicalTime: '~3 min',
    status: 'live',
    tags: ['materials', 'iteration'],
  },
  {
    slug: 'detail-upscale',
    index: 4,
    name: 'Detail Upscale',
    short: 'Print-ready at 4K+',
    description:
      'Upscale any 1K render or photo to print resolution with structure preservation. For pitch decks, presentation boards, large prints.',
    inputLabel: 'Low-res image',
    outputLabel: '4K+ image',
    typicalTime: '~45s',
    status: 'live',
    tags: ['print', 'pitch'],
  },
  {
    slug: 'reference-stylize',
    index: 5,
    name: 'Reference Stylize',
    short: 'Match a moodboard',
    description:
      'Upload a working render plus 1–3 reference photos. Returns a render that absorbs the palette, lighting, and grain of the references.',
    inputLabel: 'Render + 1–3 refs',
    outputLabel: 'Stylized render',
    typicalTime: '~2 min',
    status: 'beta',
    tags: ['mood', 'palette'],
  },
];

export const workflowBySlug = (slug: string): Workflow | undefined =>
  WORKFLOWS.find((w) => w.slug === slug);
