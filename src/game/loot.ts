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

// The icon sheet (/sprites/ui/weapon-icons.png) is a 14x14 grid of 32px cells laid
// out as: columns = item type, rows = colour tier. So weapons and shields can take
// their rarity colour straight from the art instead of being tinted.
export const ICON_SHEET_COLS = 14
const RARITY_ICON_ROW: Record<Rarity, number> = {
  Common: 0, // wood/brown
  Uncommon: 9, // green
  Rare: 7, // blue
  Epic: 11, // magenta
  Legendary: 5, // gold
}

// Column -> weapon type. Column 5 is blank on several rows, so it's unused.
const WEAPON_COLUMNS: { col: number; names: string[] }[] = [
  { col: 0, names: ['Blade', 'Sword', 'Longsword'] },
  { col: 1, names: ['Spear', 'Pike', 'Glaive'] },
  { col: 2, names: ['Staff', 'Scepter', 'Rod'] },
  { col: 3, names: ['Bow', 'Longbow', 'Shortbow'] },
  { col: 6, names: ['Axe', 'Cleaver', 'Hatchet'] },
]
const SHIELD_COLUMN = 4

// The armour and trinket icons only exist in one colour, so those are tinted by
// rarity at render time instead (see RARITY_TINT).
const FIXED_ICONS: Partial<Record<ItemSlot, number>> = {
  helmet: 2 * ICON_SHEET_COLS + 7,
  chest: 2 * ICON_SHEET_COLS + 8,
  legs: 2 * ICON_SHEET_COLS + 9,
  boots: 2 * ICON_SHEET_COLS + 10,
  trinket: 13 * ICON_SHEET_COLS + 7,
}

/** Slots whose icon colour comes from the sheet rather than a CSS tint. */
export const ICON_IS_RARITY_COLOURED: Record<ItemSlot, boolean> = {
  weapon: true,
  gloves: true,
  helmet: false,
  chest: false,
  legs: false,
  boots: false,
  trinket: false,
}

export const SLOT_LABEL: Record<ItemSlot, string> = {
  weapon: 'Weapon',
  helmet: 'Helmet',
  chest: 'Chest',
  legs: 'Legs',
  boots: 'Boots',
  gloves: 'Hands',
  trinket: 'Trinket',
}

export const ALL_SLOTS: ItemSlot[] = ['weapon', 'helmet', 'chest', 'legs', 'gloves', 'boots', 'trinket']

const NAME_POOLS: Record<ItemSlot, string[]> = {
  weapon: [], // taken from the weapon column that was rolled
  helmet: ['Helm', 'Casque', 'Coif'],
  chest: ['Plate', 'Cuirass', 'Hauberk'],
  legs: ['Greaves', 'Legguards', 'Chausses'],
  boots: ['Boots', 'Sabatons', 'Treads'],
  gloves: ['Bulwark', 'Aegis', 'Guard'],
  trinket: ['Amulet', 'Sigil', 'Charm'],
}

const STAT_BY_SLOT: Record<ItemSlot, StatKey[]> = {
  weapon: ['attack'],
  helmet: ['hp'],
  chest: ['hp'],
  legs: ['hp'],
  boots: ['hp', 'attack'],
  gloves: ['hp'],
  trinket: ['attack', 'hp'],
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
export function generateItem(rarity: Rarity, forcedSlot?: ItemSlot): Item {
  itemCounter += 1
  const slot = forcedSlot ?? pick(ALL_SLOTS)
  const stat = pick(STAT_BY_SLOT[slot])
  const [min, max] = STAT_RANGES[rarity]
  const rarityRow = RARITY_ICON_ROW[rarity]

  let icon: number
  let baseName: string
  if (slot === 'weapon') {
    const column = pick(WEAPON_COLUMNS)
    icon = rarityRow * ICON_SHEET_COLS + column.col
    baseName = pick(column.names)
  } else if (slot === 'gloves') {
    icon = rarityRow * ICON_SHEET_COLS + SHIELD_COLUMN
    baseName = pick(NAME_POOLS.gloves)
  } else {
    icon = FIXED_ICONS[slot]!
    baseName = pick(NAME_POOLS[slot])
  }

  return {
    id: `item-${itemCounter}-${Date.now()}`,
    name: `${rarity} ${baseName}`,
    slot,
    rarity,
    stat,
    value: randInt(min, max),
    icon,
  }
}

/** Icon for an item that predates the icon system, or was built outside generateItem. */
export function defaultIconFor(slot: ItemSlot, rarity: Rarity): number {
  const rarityRow = RARITY_ICON_ROW[rarity]
  if (slot === 'weapon') return rarityRow * ICON_SHEET_COLS + WEAPON_COLUMNS[0].col
  if (slot === 'gloves') return rarityRow * ICON_SHEET_COLS + SHIELD_COLUMN
  return FIXED_ICONS[slot] ?? FIXED_ICONS.trinket!
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
