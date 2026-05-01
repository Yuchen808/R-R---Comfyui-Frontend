import type { Workflow } from '../types';

export const WORKFLOWS: Workflow[] = [
  {
    slug: 'image-to-video',
    index: 1,
    name: 'Image to Video',
    short: 'Animate a still render or photograph',
    description:
      'Drop a static render or photograph. Returns a short looping video clip — subtle camera movement, ambient motion, atmosphere. Use for client decks, reels, and presentation looping.',
    inputLabel: 'Still image',
    outputLabel: 'Looping video',
    outputKind: 'video',
    typicalTime: '~3 min',
    status: 'live',
    tags: ['video', 'pitch', 'reel'],
    promptPlaceholder:
      'Describe the motion. e.g. slow camera dolly forward through the room, daylight slowly shifting toward dusk, soft fabric drift on the curtains.',
    imageInputs: [
      {
        id: 'main',
        label: 'Image',
        description: 'Still render or photograph',
        required: true,
      },
    ],
  },
  {
    slug: 'instruct-image',
    index: 2,
    name: 'Instruct Image',
    short: 'Edit an image by instruction',
    description:
      'Tell the model what to change in plain English. Two studio-tuned presets: AI photoshop for in-place edits, Day to Night for time-of-day relighting.',
    inputLabel: 'Image + reference',
    outputLabel: 'Edited image',
    outputKind: 'image',
    typicalTime: '~90s',
    status: 'live',
    tags: ['edit', 'iteration'],
    promptPlaceholder:
      'Describe the change. e.g. swap the marble fireplace for travertine, relight as evening with warm lamps, remove the artwork above the sofa.',
    imageInputs: [
      {
        id: 'main',
        label: 'Image',
        description: 'The image you want to edit',
        required: true,
      },
      {
        id: 'reference',
        label: 'Reference',
        description: 'Style reference — palette, lighting, materiality',
        required: true,
      },
    ],
    presets: [
      {
        id: 'ai-photoshop',
        name: 'AI photoshop',
        description:
          'Targeted edits: swap a finish, remove an object, fix a small geometry issue without re-rendering.',
      },
      {
        id: 'day-to-night',
        name: 'Day to Night',
        description:
          'Relight a daylit interior into evening — warm tones, ambient lamp glow, exterior dusk.',
      },
    ],
  },
];

export const workflowBySlug = (slug: string): Workflow | undefined =>
  WORKFLOWS.find((w) => w.slug === slug);
