import { DEFAULT_CHARACTER_ID } from '../game/characters'
import { ALL_SLOTS, defaultIconFor } from '../game/loot'
import { getMaxHp } from '../game/player'
import type { Item, ItemSlot, PlayerState } from '../types'

export interface SaveData {
  player: PlayerState
}

export interface SaveService {
  load(): SaveData | null
  save(data: SaveData): void
  reset(): void
}

const STORAGE_KEY = 'cp0-save-v1'

// Equipment used to be three slots with no icons. Saves from that era are migrated
// rather than discarded so nobody loses their gear to an update.
const LEGACY_SLOT_MAP: Record<string, ItemSlot> = { armor: 'chest' }

function migrateItem(raw: Item): Item | null {
  const slot = LEGACY_SLOT_MAP[raw.slot] ?? raw.slot
  if (!ALL_SLOTS.includes(slot)) return null
  return {
    ...raw,
    slot,
    icon: typeof raw.icon === 'number' ? raw.icon : defaultIconFor(slot, raw.rarity),
  }
}

function migrate(data: SaveData): SaveData {
  const player = data.player
  const equipped: Partial<Record<ItemSlot, Item>> = {}
  for (const item of Object.values(player.equipped ?? {})) {
    if (!item) continue
    const migrated = migrateItem(item)
    // A remapped slot can collide (old armor + old chest); the extra falls to inventory.
    if (migrated && !equipped[migrated.slot]) equipped[migrated.slot] = migrated
  }

  const inventory = (player.inventory ?? [])
    .map(migrateItem)
    .filter((i): i is Item => i !== null)

  const migrated: PlayerState = {
    ...player,
    equipped,
    inventory,
    unlockedSkills: player.unlockedSkills ?? {},
    unlockedActiveSkills: player.unlockedActiveSkills ?? [],
    subjectStats: player.subjectStats ?? {},
    topicStats: player.topicStats ?? {},
    mistakeLog: player.mistakeLog ?? [],
    characterId: player.characterId ?? DEFAULT_CHARACTER_ID,
  }

  // Characters scale max HP, so a save made as a tankier body can carry more HP than
  // the current one allows. Clamp rather than showing 400/383.
  return { ...data, player: { ...migrated, currentHp: Math.min(migrated.currentHp, getMaxHp(migrated)) } }
}

// LocalStorage-backed for the hackathon MVP. Swap this implementation for one
// backed by a real account/database later; nothing outside this file needs to change.
export const localSaveService: SaveService = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return migrate(JSON.parse(raw) as SaveData)
    } catch {
      return null
    }
  },
  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },
  reset() {
    localStorage.removeItem(STORAGE_KEY)
  },
}
