import type { DifficultyTier, Item, ItemSlot, Rarity, StatKey } from '../types'

const BASE_RARITY_WEIGHTS: Record<DifficultyTier, Record<Rarity, number>> = {
  Easy: { Common: 70, Uncommon: 25, Rare: 5, Epic: 0, Legendary: 0 },
  Medium: { Common: 50, Uncommon: 30, Rare: 15, Epic: 5, Legendary: 0 },
  Moderate: { Common: 30, Uncommon: 30, Rare: 25, Epic: 12, Legendary: 3 },
  Hard: { Common: 10, Uncommon: 20, Rare: 30, Epic: 25, Legendary: 15 },
}

const STAT_RANGES: Record<Rarity, [number, number]> = {
  Common: [1, 2],
  Uncommon: [3, 5],
  Rare: [6, 9],
  Epic: [10, 14],
  Legendary: [15, 20],
}

const SLOTS: ItemSlot[] = ['weapon', 'armor', 'trinket']
const STATS: StatKey[] = ['attack', 'hp']
const NAME_POOLS: Record<ItemSlot, string[]> = {
  weapon: ['Blade', 'Sword', 'Dagger', 'Axe', 'Mace'],
  armor: ['Plate', 'Shield', 'Cloak', 'Gauntlets', 'Greaves'],
  trinket: ['Amulet', 'Ring', 'Charm', 'Sigil', 'Talisman'],
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function rollRarity(tier: DifficultyTier, lootLuckPercent: number): Rarity {
  const base = BASE_RARITY_WEIGHTS[tier]
  const luckMultiplier = 1 + lootLuckPercent / 100
  const weights: Record<Rarity, number> = {
    Common: base.Common,
    Uncommon: base.Uncommon * luckMultiplier,
    Rare: base.Rare * luckMultiplier,
    Epic: base.Epic * luckMultiplier,
    Legendary: base.Legendary * luckMultiplier,
  }
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (const rarity of Object.keys(weights) as Rarity[]) {
    roll -= weights[rarity]
    if (roll <= 0) return rarity
  }
  return 'Common'
}

let itemCounter = 0
export function generateItem(rarity: Rarity): Item {
  itemCounter += 1
  const slot = pick(SLOTS)
  const stat = pick(STATS)
  const [min, max] = STAT_RANGES[rarity]
  return {
    id: `item-${itemCounter}-${Date.now()}`,
    name: `${rarity} ${pick(NAME_POOLS[slot])}`,
    slot,
    rarity,
    stat,
    value: randInt(min, max),
  }
}

/** Number of guaranteed + bonus-chance loot rolls for clearing a dungeon of this tier. */
export function lootRollsForTier(tier: DifficultyTier): number {
  switch (tier) {
    case 'Easy':
      return 1
    case 'Medium':
      return 1
    case 'Moderate':
      return 2
    case 'Hard':
      return 2
  }
}

export function skillPointsForTier(tier: DifficultyTier): number {
  switch (tier) {
    case 'Easy':
      return 1
    case 'Medium':
      return 1
    case 'Moderate':
      return 2
    case 'Hard':
      return 3
  }
}
