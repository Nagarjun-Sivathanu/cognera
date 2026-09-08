// Animated torch-lit dungeon corridor GIFs used as looping battle backgrounds.
// `position`/`size` override the default centered `cover` crop for sources whose
// art isn't centered in frame. torch-3's source image has a wide black stairwell
// void on its right ~35%; since the battlefield is much wider than the source
// image, plain `cover` maps the full image width 1:1 with no horizontal overflow
// to shift within, so a bigger `size` is needed to create overflow before
// anchoring `left` can push the void off-screen.
export const BACKGROUNDS: Record<string, { label: string; url: string; position?: string; size?: string }> = {
  'torch-1': { label: 'Cobwebbed Hall', url: '/sprites/backgrounds/fight/torch-1.gif' },
  'torch-2': { label: 'Column Corridor', url: '/sprites/backgrounds/fight/torch-2.gif' },
  'torch-3': {
    label: 'Cracked Passage',
    url: '/sprites/backgrounds/fight/torch-3.gif',
    position: 'left center',
    size: '160% auto',
  },
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
