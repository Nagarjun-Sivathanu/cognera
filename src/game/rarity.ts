import type { Rarity } from '../types'

/**
 * The equipment sprite layers and the armour icons each ship in a single colour,
 * so rarity is conveyed by tinting them. Weapons and shields get their colour from
 * the icon sheet's rarity rows instead and are left untinted.
 */
// `sepia` first normalises the art's blue-grey steel to a single warm hue, so the
// following hue-rotate lands on a predictable colour. Rotating the raw pixels
// instead gives muddy, hard-to-read results.
export const RARITY_TINT: Record<Rarity, string | undefined> = {
  Common: undefined, // plain steel
  Uncommon: 'sepia(1) saturate(1.8) hue-rotate(75deg) brightness(1.02)',
  Rare: 'sepia(1) saturate(2) hue-rotate(165deg) brightness(1.02)',
  Epic: 'sepia(1) saturate(2) hue-rotate(255deg) brightness(1.02)',
  Legendary: 'sepia(1) saturate(2.2) brightness(1.1)',
}

export const RARITY_TEXT: Record<Rarity, string> = {
  Common: 'text-stone-300',
  Uncommon: 'text-emerald-400',
  Rare: 'text-sky-400',
  Epic: 'text-fuchsia-400',
  Legendary: 'text-amber-400',
}

export const RARITY_BORDER: Record<Rarity, string> = {
  Common: 'border-stone-600',
  Uncommon: 'border-emerald-600',
  Rare: 'border-sky-600',
  Epic: 'border-fuchsia-600',
  Legendary: 'border-amber-500',
}

export const RARITY_GLOW: Record<Rarity, string> = {
  Common: '',
  Uncommon: 'shadow-[0_0_10px_rgba(16,185,129,0.35)]',
  Rare: 'shadow-[0_0_10px_rgba(14,165,233,0.4)]',
  Epic: 'shadow-[0_0_12px_rgba(217,70,239,0.45)]',
  Legendary: 'shadow-[0_0_14px_rgba(245,158,11,0.55)]',
}
