// Real cave art (base scene + a rocky vignette layer), tinted per id for cheap
// variety during background rotation without needing separate art per corridor.
export const BACKGROUNDS: Record<string, { label: string; base: string; vignette: string; filter: string }> = {
  'corridor-1': {
    label: 'Torchlit Corridor',
    base: '/sprites/backgrounds/cave/0.png',
    vignette: '/sprites/backgrounds/cave/1.png',
    filter: 'none',
  },
  'corridor-2': {
    label: 'Mossy Passage',
    base: '/sprites/backgrounds/cave/0.png',
    vignette: '/sprites/backgrounds/cave/1.png',
    filter: 'hue-rotate(60deg) saturate(1.2)',
  },
  'corridor-3': {
    label: 'Blood-lit Hall',
    base: '/sprites/backgrounds/cave/0.png',
    vignette: '/sprites/backgrounds/cave/1.png',
    filter: 'hue-rotate(-30deg) saturate(1.3) brightness(0.95)',
  },
}

export function getBackground(id: string) {
  return BACKGROUNDS[id] ?? BACKGROUNDS['corridor-1']
}
