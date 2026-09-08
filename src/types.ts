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

/**
 * Rolling record of how a player performs on one chapter, used to spot both
 * persistent weak spots and genuine improvement over time.
 */
export interface TopicMastery {
  subject: Subject
  topic: string
  attempts: number
  correct: number
  /** Most recent results, newest last. Capped - only the tail matters. */
  recent: boolean[]
  /** True once accuracy has been genuinely poor, so improvement can be recognised. */
  everStruggled: boolean
  /** Set when a struggling topic has been turned around, so it's only celebrated once. */
  improvedAt?: number
}

/** A question answered incorrectly, kept so the run can be reviewed afterwards. */
export interface RunMistake {
  questionId: string
  subject: Subject
  topic: string
  difficulty: number
  question: string
  options: string[]
  chosenIndex: number
  correctIndex: number
  explanation?: string
  /** When it was missed. Present on logged mistakes, absent on in-run ones. */
  at?: number
  /** Set once the same question is later answered correctly. */
  resolvedAt?: number
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
  mistakes: RunMistake[]
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
  /** Per-chapter mastery, keyed "Subject::Topic". */
  topicStats: Record<string, TopicMastery>
  /** Every question missed, across all runs, newest first and capped. */
  mistakeLog: RunMistake[]
  /** Worked solutions produced for this player, keyed by question id. Written once, reused forever. */
  solutionCache: Record<string, { keyIdea: string; steps: string[] }>
  clearedRuns: number
  /** Set once the first-run walkthrough has been seen or skipped. */
  tourCompleted: boolean
}

export interface LastRunResult {
  outcome: 'cleared' | 'failed' | 'sandbox'
  dungeonName: string
  wavesSurvived?: number // sandbox only
  xpGained: number
  lootGained: Item[]
  skillPointsGained: number
  mistakes: RunMistake[]
  questionsAnswered: number
}
