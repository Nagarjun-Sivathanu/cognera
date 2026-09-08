import type { Item, ItemSlot } from '../types'
import type { SpriteLayer } from '../components/Sprite'
import { RARITY_TINT } from './rarity'

/**
 * Which equipment art each slot drives. The pack ships one design per layer, so
 * rarity is conveyed by tint (see RARITY_TINT) rather than by different artwork.
 * Trinkets have no layer - they're a stat-only slot.
 */
const SLOT_LAYER: Partial<Record<ItemSlot, string>> = {
  legs: 'leggings',
  boots: 'boots',
  chest: 'chestplate',
  gloves: 'gloves',
  helmet: 'hat',
  weapon: 'sword',
}

// Painted back-to-front; hair sits under the hat, the weapon in front of everything.
const LAYER_ORDER = ['leggings', 'boots', 'chestplate', 'gloves', 'hair', 'hat', 'sword']

/**
 * Builds the stacked sprite layers for a player's current gear.
 * `anim` selects which animation's art to use; layers are frame-aligned with the base.
 */
export function equipmentLayers(
  equipped: Partial<Record<ItemSlot, Item>>,
  anim: 'idle' | 'attack' | 'move',
): SpriteLayer[] {
  const byPart = new Map<string, SpriteLayer>()

  // Hair is cosmetic and always drawn - the bare base sprite is bald.
  byPart.set('hair', { src: `/sprites/player/equipment/${anim}-hair.png` })

  for (const [slot, part] of Object.entries(SLOT_LAYER) as [ItemSlot, string][]) {
    const item = equipped[slot]
    if (!item) continue
    byPart.set(part, {
      src: `/sprites/player/equipment/${anim}-${part}.png`,
      filter: RARITY_TINT[item.rarity],
    })
  }

  return LAYER_ORDER.map((part) => byPart.get(part)).filter((l): l is SpriteLayer => l !== undefined)
}

/** The swing/impact effect that plays over the attack animation. */
export const ATTACK_FX_LAYER: SpriteLayer = { src: '/sprites/player/equipment/attack-fx.png' }
