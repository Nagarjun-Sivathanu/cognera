import enemiesData from '../data/enemies.json'
import type { DungeonDef, EnemyDef, EnemyInstance } from '../types'

const enemyPool = enemiesData as EnemyDef[]

let instanceCounter = 0
function nextInstanceId() {
  instanceCounter += 1
  return `enemy-${instanceCounter}-${Date.now()}`
}

function pickEnemyWithMaxDifficulty(maxDifficulty: number): EnemyDef {
  const candidates = enemyPool.filter((e) => e.difficulty <= maxDifficulty)
  const pool = candidates.length > 0 ? candidates : enemyPool.filter((e) => e.difficulty === 1)
  return pool[Math.floor(Math.random() * pool.length)]
}

function toInstance(def: EnemyDef): EnemyInstance {
  return {
    instanceId: nextInstanceId(),
    defId: def.id,
    name: def.name,
    sprite: def.sprite,
    flip: def.flip,
    difficulty: def.difficulty,
    displayHeight: def.displayHeight,
    maxHp: def.baseHp,
    currentHp: def.baseHp,
    damage: def.baseDamage,
  }
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Fills a difficulty budget with randomly chosen enemies whose difficulties sum to it. */
export function generateEncounter(budget: number): EnemyInstance[] {
  const encounter: EnemyInstance[] = []
  let remaining = budget
  // safety cap so a bad budget config can't loop forever
  let guard = 0
  while (remaining > 0 && guard < 20) {
    guard += 1
    const def = pickEnemyWithMaxDifficulty(remaining)
    encounter.push(toInstance(def))
    remaining -= def.difficulty
  }
  return encounter
}

export function generateEncounters(dungeon: DungeonDef): EnemyInstance[][] {
  const encounters: EnemyInstance[][] = []
  for (let i = 0; i < dungeon.encounterCount; i += 1) {
    const budget = randInt(dungeon.budgetRange[0], dungeon.budgetRange[1])
    encounters.push(generateEncounter(budget))
  }
  return encounters
}

/** Damage varies +/-15% around the base power so fights don't feel like flat math. */
export function rollDamage(power: number): number {
  const variance = 0.85 + Math.random() * 0.3
  return Math.max(1, Math.round(power * variance))
}

export function xpForEnemy(difficulty: number): number {
  return difficulty * 10
}

// Focus is the resource active skills spend. It fills only from correct answers, and
// a run of consecutive correct answers fills it faster - so playing well academically
// is what unlocks the flashy abilities.
export const FOCUS_MAX = 100
const FOCUS_PER_CORRECT = 18
const FOCUS_STREAK_BONUS = 6
const FOCUS_STREAK_CAP = 4

/** Focus gained for a correct answer, given the streak length *including* this answer. */
export function focusGain(streak: number): number {
  return FOCUS_PER_CORRECT + Math.min(Math.max(streak - 1, 0), FOCUS_STREAK_CAP) * FOCUS_STREAK_BONUS
}

/** Burn ticks for this fraction of the player's attack power each turn. */
export const BURN_POWER = 0.6

// Battle action tuning - adjust here if the balance feels off.
export const DODGE_CHANCE = 0.5
export const STAGGER_CHANCE = 0.5
export const WINDUP_BONUS_MULTIPLIER = 1.75
export const WINDUP_WRONG_MULTIPLIER = 1.6
export const BAG_HEAL_FRACTION = 0.4
export const POTIONS_PER_CLEAR = 1
