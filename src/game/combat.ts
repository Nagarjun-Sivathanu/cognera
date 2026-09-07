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
    difficulty: def.difficulty,
    maxHp: def.baseHp,
    currentHp: def.baseHp,
    damage: def.baseDamage,
  }
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Fills a difficulty budget with randomly chosen enemies whose difficulties sum to it. */
function generateEncounter(budget: number): EnemyInstance[] {
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
