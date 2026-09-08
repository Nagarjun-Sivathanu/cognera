export type DifficultyTier = 'Easy' | 'Medium' | 'Moderate' | 'Hard'

export type Subject = string

export interface Question {
  id: string
  subject: Subject
  topic: string
  difficulty: number // 1-5
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
}

/** Bounding box of the drawn pixels inside a frame, in frame-local px. */
export interface ContentBox {
  x: number
  y: number
  w: number
  h: number
}

export interface SpriteSheetDef {
  src: string // path under /sprites
  frameWidth: number
  frameHeight: number
  frameCount: number // number of frames in this animation
  row?: number // which row of the sheet the animation starts on (0-indexed), default 0
  // Frames per row. Set when an animation wraps across several rows (common in the
  // VFX packs); omit for sheets that keep one animation per row.
  columns?: number
  // Sprites across the asset packs are anchored inconsistently in their frames
  // (small mobs float mid-frame, big ones sit on the frame's bottom edge) and are
  // drawn at wildly different intrinsic sizes. Rendering is aligned and scaled by
  // this box instead of the frame, so every sprite is fully visible and shares a
  // floor line. Measured by scripts/measure_sprites.py.
  content?: ContentBox
}

export interface EnemyDef {
  id: string
  name: string
  sprite: SpriteSheetDef
  flip?: boolean // mirror horizontally so the sprite faces the player
  difficulty: number // 1-5, used for encounter budget math
  displayHeight: number // rendered height of the sprite's content box, in px
  baseHp: number
  baseDamage: number
}

export interface DungeonDef {
  id: string
  name: string
  tier: DifficultyTier
  subjects: Subject[]
  topics: string[]
  encounterCount: number
  budgetRange: [min: number, max: number]
  backgrounds: string[] // background ids, see BACKGROUNDS in game/backgrounds.ts
  requiredLevel: number
}

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'
// Every slot except `trinket` maps to a sprite layer drawn over the character.
export type ItemSlot = 'weapon' | 'helmet' | 'chest' | 'legs' | 'boots' | 'gloves' | 'trinket'
export type StatKey = 'attack' | 'hp'

export interface Item {
  id: string
  name: string
  slot: ItemSlot
  rarity: Rarity
  stat: StatKey
  value: number
  icon: number // index into the 14x14 icon sheet at /sprites/ui/weapon-icons.png
}

export interface SkillNode {
  id: string
  name: string
  description: string
  maxRank: number
  cost: number // skill points per rank
  effect: { stat: StatKey | 'lootLuck'; perRank: number }
}

export interface EnemyInstance {
  instanceId: string
  defId: string
  name: string
  sprite: SpriteSheetDef
  flip?: boolean
  difficulty: number
  displayHeight: number
  maxHp: number
  currentHp: number
  damage: number
}

export interface RunState {
  // Held by value rather than by id because Sandbox runs use a synthetic dungeon
  // that isn't in the static dungeon list.
  dungeon: DungeonDef
  mode: 'dungeon' | 'sandbox'
  chapter: string | null // restrict questions to this chapter; null = total revision
  wave: number // sandbox: encounters cleared so far
  encounters: EnemyInstance[][]
  encounterIndex: number
  currentEnemyIndex: number
  backgroundIndex: number
  playerHpAtStart: number
  defeatedCount: number
  usedQuestionIds: string[]
  xpAccumulated: number
  status: 'active' | 'cleared' | 'failed'
  enemyStunned: boolean // current enemy's next counter-hit is negated
  charged: boolean // next successful hit deals bonus damage (from Wind Up)
  focus: number // 0-FOCUS_MAX, fills on correct answers, spent on active skills
  correctStreak: number // consecutive correct answers; a longer streak fills focus faster
  burn: number // turns of burn damage left on the current enemy
  attackBuffTurns: number // turns of the flame buff's attack bonus left
  swapCooldown: number // turns until the character can be swapped again
}

export interface PlayerState {
  name: string
  characterId: string // which base character sprite is in use; see game/characters.ts
  level: number
  xp: number
  currentHp: number
  baseAttack: number
  baseMaxHp: number
  gold: number
  potions: number
  skillPoints: number
  unlockedSkills: Record<string, number> // passive skillId -> rank
  unlockedActiveSkills: string[] // active (castable) skill ids
  equipped: Partial<Record<ItemSlot, Item>>
  inventory: Item[]
  subjectStats: Record<Subject, { correct: number; total: number }>
  clearedRuns: number
}

export interface LastRunResult {
  outcome: 'cleared' | 'failed' | 'sandbox'
  dungeonName: string
  wavesSurvived?: number // sandbox only
  xpGained: number
  lootGained: Item[]
  skillPointsGained: number
}
