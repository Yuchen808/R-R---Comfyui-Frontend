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
    typicalTime: '~3 min',
    status: 'live',
    tags: ['video', 'pitch', 'reel'],
  },
  {
    slug: 'instruct-image',
    index: 2,
    name: 'Instruct Image',
    short: 'Edit an image by instruction',
    description:
      'Tell the model what to change in plain English. Two studio-tuned presets: AI photoshop for in-place edits, Day to Night for time-of-day relighting.',
    inputLabel: 'Image + instruction',
    outputLabel: 'Edited image',
    typicalTime: '~90s',
    status: 'live',
    tags: ['edit', 'iteration'],
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
