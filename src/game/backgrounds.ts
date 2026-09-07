// Placeholder gradients standing in for the user's owned corridor background art.
// Swap `gradient` for a `url(...)` background-image once real assets are dropped in.
export const BACKGROUNDS: Record<string, { label: string; gradient: string }> = {
  'corridor-1': {
    label: 'Torchlit Corridor',
    gradient: 'radial-gradient(circle at 50% 30%, #4a3423 0%, #241a12 55%, #0d0a07 100%)',
  },
  'corridor-2': {
    label: 'Mossy Passage',
    gradient: 'radial-gradient(circle at 50% 30%, #2f3b2a 0%, #1a2116 55%, #0a0d08 100%)',
  },
  'corridor-3': {
    label: 'Blood-lit Hall',
    gradient: 'radial-gradient(circle at 50% 30%, #4a1f1f 0%, #241010 55%, #0d0505 100%)',
  },
}

export function getBackground(id: string) {
  return BACKGROUNDS[id] ?? BACKGROUNDS['corridor-1']
}
