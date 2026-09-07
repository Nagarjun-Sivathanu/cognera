// Animated torch-lit dungeon corridor GIFs used as looping battle backgrounds.
export const BACKGROUNDS: Record<string, { label: string; url: string }> = {
  'torch-1': { label: 'Cobwebbed Hall', url: '/sprites/backgrounds/fight/torch-1.gif' },
  'torch-2': { label: 'Column Corridor', url: '/sprites/backgrounds/fight/torch-2.gif' },
  'torch-3': { label: 'Cracked Passage', url: '/sprites/backgrounds/fight/torch-3.gif' },
  'torch-4': { label: 'Barred Archway', url: '/sprites/backgrounds/fight/torch-4.gif' },
  'torch-5': { label: 'Torchlit Hall', url: '/sprites/backgrounds/fight/torch-5.gif' },
}

const BACKGROUND_IDS = Object.keys(BACKGROUNDS)

export function getBackground(id: string) {
  return BACKGROUNDS[id] ?? BACKGROUNDS['torch-1']
}

export function randomBackgroundId(): string {
  return BACKGROUND_IDS[Math.floor(Math.random() * BACKGROUND_IDS.length)]
}

export { BACKGROUND_IDS }
