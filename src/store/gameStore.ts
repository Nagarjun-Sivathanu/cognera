import { create } from 'zustand'
import dungeonsData from '../data/dungeons.json'
import { generateEncounters, rollDamage, xpForEnemy } from '../game/combat'
import { generateItem, lootRollsForTier, rollRarity, skillPointsForTier } from '../game/loot'
import { createNewPlayer, getAttackPower, getLootLuckPercent, getMaxHp, recordAnswer, skills } from '../game/player'
import { getQuestionForEnemy } from '../game/questions'
import { localSaveService } from '../services/saveService'
import type { DungeonDef, Item, ItemSlot, LastRunResult, PlayerState, Question, RunState } from '../types'

const dungeons = dungeonsData as DungeonDef[]

type Phase = 'question' | 'feedback' | 'result'

interface Feedback {
  correct: boolean
  damage: number
  target: 'enemy' | 'player'
  enemyDefeated: boolean
  encounterCleared: boolean
}

interface GameStore {
  player: PlayerState
  run: RunState | null
  currentQuestion: Question | null
  feedback: Feedback | null
  lastResult: LastRunResult | null
  view: 'list' | 'run'
  phase: Phase

  startRun: (dungeonId: string) => void
  answerQuestion: (selectedIndex: number) => void
  advance: () => void
  retreat: () => void
  acknowledgeResult: () => void
  spendSkillPoint: (skillId: string) => void
  equipItem: (item: Item) => void
  unequipItem: (slot: ItemSlot) => void
}

const initialSave = localSaveService.load()
const initialPlayer: PlayerState = initialSave?.player ?? createNewPlayer()

function persist(player: PlayerState) {
  localSaveService.save({ player })
}

function getDungeon(id: string): DungeonDef {
  const dungeon = dungeons.find((d) => d.id === id)
  if (!dungeon) throw new Error(`Unknown dungeon: ${id}`)
  return dungeon
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: initialPlayer,
  run: null,
  currentQuestion: null,
  feedback: null,
  lastResult: null,
  view: 'list',
  phase: 'question',

  startRun: (dungeonId) => {
    const dungeon = getDungeon(dungeonId)
    const player = get().player
    const maxHp = getMaxHp(player)
    const encounters = generateEncounters(dungeon)

    const run: RunState = {
      dungeonId,
      encounters,
      encounterIndex: 0,
      currentEnemyIndex: 0,
      backgroundIndex: 0,
      playerHpAtStart: maxHp,
      defeatedCount: 0,
      usedQuestionIds: [],
      xpAccumulated: 0,
      status: 'active',
    }

    set({
      player: { ...player, currentHp: maxHp },
      run,
      currentQuestion: getQuestionForEnemy(dungeon, encounters[0][0].difficulty, []),
      feedback: null,
      lastResult: null,
      view: 'run',
      phase: 'question',
    })
  },

  answerQuestion: (selectedIndex) => {
    const { run, currentQuestion, player } = get()
    if (!run || !currentQuestion || run.status !== 'active') return

    const correct = selectedIndex === currentQuestion.correctIndex
    const newPlayer: PlayerState = { ...player, subjectStats: { ...player.subjectStats } }
    recordAnswer(newPlayer, currentQuestion.subject, correct)

    const newRun: RunState = {
      ...run,
      usedQuestionIds: [...run.usedQuestionIds, currentQuestion.id],
      encounters: run.encounters.map((enc) => enc.map((e) => ({ ...e }))),
    }

    const enemy = newRun.encounters[newRun.encounterIndex][newRun.currentEnemyIndex]
    let damage = 0
    let enemyDefeated = false
    let encounterCleared = false

    if (correct) {
      damage = rollDamage(getAttackPower(newPlayer))
      enemy.currentHp = Math.max(0, enemy.currentHp - damage)

      if (enemy.currentHp <= 0) {
        enemyDefeated = true
        newRun.defeatedCount += 1
        newRun.xpAccumulated += xpForEnemy(enemy.difficulty)

        const encounter = newRun.encounters[newRun.encounterIndex]
        const nextEnemyIndex = newRun.currentEnemyIndex + 1
        if (nextEnemyIndex < encounter.length) {
          newRun.currentEnemyIndex = nextEnemyIndex
        } else {
          encounterCleared = true
          const nextEncounterIndex = newRun.encounterIndex + 1
          if (nextEncounterIndex < newRun.encounters.length) {
            newRun.encounterIndex = nextEncounterIndex
            newRun.currentEnemyIndex = 0
            newRun.backgroundIndex += 1
          } else {
            newRun.status = 'cleared'
          }
        }
      }
    } else {
      damage = rollDamage(enemy.damage)
      newPlayer.currentHp = Math.max(0, player.currentHp - damage)
      if (newPlayer.currentHp <= 0) {
        newRun.status = 'failed'
      }
    }

    set({
      run: newRun,
      player: newPlayer,
      feedback: { correct, damage, target: correct ? 'enemy' : 'player', enemyDefeated, encounterCleared },
      phase: 'feedback',
    })
  },

  advance: () => {
    const { run } = get()
    if (!run) return

    if (run.status !== 'active') {
      finalizeRun(get, set)
      return
    }

    const dungeon = getDungeon(run.dungeonId)
    const enemy = run.encounters[run.encounterIndex][run.currentEnemyIndex]
    const nextQuestion = getQuestionForEnemy(dungeon, enemy.difficulty, run.usedQuestionIds)
    set({ currentQuestion: nextQuestion, feedback: null, phase: 'question' })
  },

  retreat: () => {
    const { run } = get()
    if (!run || run.status !== 'active') return
    set({ run: { ...run, status: 'failed' } })
    finalizeRun(get, set)
  },

  acknowledgeResult: () => {
    set({ view: 'list', run: null, currentQuestion: null, feedback: null, lastResult: null, phase: 'question' })
  },

  spendSkillPoint: (skillId) => {
    const player = get().player
    const skill = skills.find((s) => s.id === skillId)
    if (!skill) return
    const currentRank = player.unlockedSkills[skillId] ?? 0
    if (currentRank >= skill.maxRank || player.skillPoints < skill.cost) return

    const newPlayer: PlayerState = {
      ...player,
      skillPoints: player.skillPoints - skill.cost,
      unlockedSkills: { ...player.unlockedSkills, [skillId]: currentRank + 1 },
    }
    set({ player: newPlayer })
    persist(newPlayer)
  },

  equipItem: (item) => {
    const player = get().player
    const newPlayer: PlayerState = {
      ...player,
      equipped: { ...player.equipped, [item.slot]: item },
      inventory: player.inventory.filter((i) => i.id !== item.id),
    }
    if (player.equipped[item.slot]) {
      newPlayer.inventory = [...newPlayer.inventory, player.equipped[item.slot]!]
    }
    set({ player: newPlayer })
    persist(newPlayer)
  },

  unequipItem: (slot) => {
    const player = get().player
    const equippedItem = player.equipped[slot]
    if (!equippedItem) return
    const newEquipped = { ...player.equipped }
    delete newEquipped[slot]
    const newPlayer: PlayerState = {
      ...player,
      equipped: newEquipped,
      inventory: [...player.inventory, equippedItem],
    }
    set({ player: newPlayer })
    persist(newPlayer)
  },
}))

function finalizeRun(get: () => GameStore, set: (partial: Partial<GameStore>) => void) {
  const { run, player } = get()
  if (!run) return
  const dungeon = getDungeon(run.dungeonId)

  const xpGained = run.xpAccumulated
  let skillPointsGained = 0
  const lootGained: Item[] = []

  if (run.status === 'cleared') {
    skillPointsGained = skillPointsForTier(dungeon.tier)
    const rolls = lootRollsForTier(dungeon.tier)
    const luck = getLootLuckPercent(player)
    for (let i = 0; i < rolls; i += 1) {
      lootGained.push(generateItem(rollRarity(dungeon.tier, luck)))
    }
  }

  const newPlayer: PlayerState = {
    ...player,
    xp: player.xp + xpGained,
    skillPoints: player.skillPoints + skillPointsGained,
    inventory: [...player.inventory, ...lootGained],
    clearedRuns: player.clearedRuns + (run.status === 'cleared' ? 1 : 0),
  }

  const lastResult: LastRunResult = {
    outcome: run.status === 'cleared' ? 'cleared' : 'failed',
    dungeonName: dungeon.name,
    xpGained,
    lootGained,
    skillPointsGained,
  }

  persist(newPlayer)
  set({ player: newPlayer, lastResult, phase: 'result' })
}
