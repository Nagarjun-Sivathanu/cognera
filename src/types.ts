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

export interface SpriteSheetDef {
  src: string // path under /sprites
  frameSize: number // square frame width/height in px
  frameCount: number // columns to cycle through for this animation
  row?: number // which row of the sheet (0-indexed), default 0
}

export interface EnemyDef {
  id: string
  name: string
  sprite: SpriteSheetDef
  flip?: boolean // mirror horizontally so the sprite faces the player
  difficulty: number // 1-5, used for encounter budget math
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
export type ItemSlot = 'weapon' | 'armor' | 'trinket'
export type StatKey = 'attack' | 'hp'

export interface Item {
  id: string
  name: string
  slot: ItemSlot
  rarity: Rarity
  stat: StatKey
  value: number
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
  maxHp: number
  currentHp: number
  damage: number
}

export interface RunState {
  dungeonId: string
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
}

export interface PlayerState {
  name: string
  level: number
  xp: number
  currentHp: number
  baseAttack: number
  baseMaxHp: number
  gold: number
  potions: number
  skillPoints: number
  unlockedSkills: Record<string, number> // skillId -> rank
  equipped: Partial<Record<ItemSlot, Item>>
  inventory: Item[]
  subjectStats: Record<Subject, { correct: number; total: number }>
  clearedRuns: number
}

export interface LastRunResult {
  outcome: 'cleared' | 'failed'
  dungeonName: string
  xpGained: number
  lootGained: Item[]
  skillPointsGained: number
}
