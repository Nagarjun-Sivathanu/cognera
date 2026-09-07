import { create } from 'zustand'
import { BGM, playBgm, playSfx, SFX } from '../game/audio'
import {
  BAG_HEAL_FRACTION,
  DODGE_CHANCE,
  generateEncounters,
  POTIONS_PER_CLEAR,
  rollDamage,
  STAGGER_CHANCE,
  WINDUP_BONUS_MULTIPLIER,
  WINDUP_WRONG_MULTIPLIER,
  xpForEnemy,
} from '../game/combat'
import { dungeons } from '../game/dungeonLayout'
import { generateItem, lootRollsForTier, rollRarity, skillPointsForTier } from '../game/loot'
import { createNewPlayer, getAttackPower, getLootLuckPercent, getMaxHp, recordAnswer, skills } from '../game/player'
import { getQuestionForEnemy } from '../game/questions'
import { localSaveService } from '../services/saveService'
import type { DungeonDef, Item, ItemSlot, LastRunResult, PlayerState, Question, RunState } from '../types'

type Phase = 'question' | 'feedback' | 'result'
type Tone = 'good' | 'bad' | 'neutral'

interface Feedback {
  message: string
  tone: Tone
  target: 'enemy' | 'player' | 'none'
  enemyDefeated: boolean
}

interface GameStore {
  player: PlayerState
  run: RunState | null
  currentQuestion: Question | null
  feedback: Feedback | null
  lastResult: LastRunResult | null
  view: 'title' | 'hub' | 'subjects' | 'list' | 'run'
  phase: Phase
  windUpArmed: boolean
  selectedSubjectId: string | null

  enterHub: () => void
  enterMap: () => void
  selectSubject: (subjectId: string) => void
  backToSubjects: () => void
  setPlayerName: (name: string) => void
  startRun: (dungeonId: string) => void
  answerQuestion: (selectedIndex: number) => void
  armWindUp: () => void
  useBag: () => void
  useDodge: () => void
  useStagger: () => void
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

function cloneRun(run: RunState): RunState {
  return { ...run, encounters: run.encounters.map((enc) => enc.map((e) => ({ ...e }))) }
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: initialPlayer,
  run: null,
  currentQuestion: null,
  feedback: null,
  lastResult: null,
  view: 'title',
  phase: 'question',
  windUpArmed: false,
  selectedSubjectId: null,

  enterHub: () => {
    playSfx(SFX.menuClick)
    playBgm(BGM.menu)
    set({ view: 'hub' })
  },
  enterMap: () => {
    playSfx(SFX.menuClick)
    playBgm(BGM.menu)
    set({ view: 'subjects' })
  },
  selectSubject: (subjectId) => {
    playSfx(SFX.menuClick)
    playBgm(BGM.menu)
    set({ selectedSubjectId: subjectId, view: 'list' })
  },
  backToSubjects: () => {
    playSfx(SFX.menuClick)
    playBgm(BGM.menu)
    set({ view: 'subjects', selectedSubjectId: null })
  },

  setPlayerName: (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const newPlayer = { ...get().player, name: trimmed }
    set({ player: newPlayer })
    persist(newPlayer)
  },

  startRun: (dungeonId) => {
    playSfx(SFX.menuClick)
    playBgm(BGM.cave)
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
      enemyStunned: false,
      charged: false,
    }

    set({
      player: { ...player, currentHp: maxHp },
      run,
      currentQuestion: getQuestionForEnemy(dungeon, encounters[0][0].difficulty, []),
      feedback: null,
      lastResult: null,
      view: 'run',
      phase: 'question',
      windUpArmed: false,
    })
  },

  answerQuestion: (selectedIndex) => {
    const { run, currentQuestion, player, windUpArmed } = get()
    if (!run || !currentQuestion || run.status !== 'active') return

    const correct = selectedIndex === currentQuestion.correctIndex
    const newPlayer: PlayerState = { ...player, subjectStats: { ...player.subjectStats } }
    recordAnswer(newPlayer, currentQuestion.subject, correct)

    const newRun = cloneRun(run)
    const enemy = newRun.encounters[newRun.encounterIndex][newRun.currentEnemyIndex]
    let message = ''
    let tone: Tone = 'neutral'
    let target: Feedback['target'] = 'none'
    let enemyDefeated = false

    if (correct) {
      let dmg = rollDamage(getAttackPower(newPlayer))
      if (newRun.charged) {
        dmg = Math.round(dmg * WINDUP_BONUS_MULTIPLIER)
        newRun.charged = false
        message = `Charged hit for ${dmg}!`
      } else {
        message = `Hit for ${dmg}!`
      }
      if (windUpArmed) {
        newRun.charged = true
        message += ' Charging next attack...'
      }
      enemy.currentHp = Math.max(0, enemy.currentHp - dmg)
      target = 'enemy'
      tone = 'good'
      playSfx(enemy.difficulty >= 5 ? SFX.bossGettingHit : SFX.mobGettingHit)

      if (enemy.currentHp <= 0) {
        enemyDefeated = true
        message += ' Defeated!'
        newRun.defeatedCount += 1
        newRun.xpAccumulated += xpForEnemy(enemy.difficulty)
        newRun.enemyStunned = false

        const encounter = newRun.encounters[newRun.encounterIndex]
        const nextEnemyIndex = newRun.currentEnemyIndex + 1
        if (nextEnemyIndex < encounter.length) {
          newRun.currentEnemyIndex = nextEnemyIndex
        } else {
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
      let dmg = rollDamage(enemy.damage)
      if (windUpArmed) dmg = Math.round(dmg * WINDUP_WRONG_MULTIPLIER)

      if (newRun.enemyStunned) {
        dmg = 0
        newRun.enemyStunned = false
        message = 'Enemy is stunned - no damage taken!'
        tone = 'neutral'
      } else {
        message = windUpArmed ? `Wind-up backfired! -${dmg} HP` : `Missed! -${dmg} HP`
        tone = 'bad'
      }
      newPlayer.currentHp = Math.max(0, player.currentHp - dmg)
      target = 'player'
      if (newPlayer.currentHp <= 0) {
        newRun.status = 'failed'
        playSfx(SFX.playerDeathblow)
      } else {
        playSfx(SFX.mobDoingDamage)
      }
    }

    set({
      run: newRun,
      player: newPlayer,
      feedback: { message, tone, target, enemyDefeated },
      phase: 'feedback',
      windUpArmed: false,
    })
  },

  armWindUp: () => {
    const { phase, run } = get()
    if (phase !== 'question' || !run || run.status !== 'active') return
    set((s) => ({ windUpArmed: !s.windUpArmed }))
  },

  useBag: () => {
    const { phase, run, player, currentQuestion } = get()
    if (phase !== 'question' || !run || run.status !== 'active') return
    if (player.potions <= 0) return

    const maxHp = getMaxHp(player)
    const healed = Math.min(maxHp - player.currentHp, Math.round(maxHp * BAG_HEAL_FRACTION))
    const newPlayer: PlayerState = { ...player, potions: player.potions - 1, currentHp: player.currentHp + healed }
    const newRun = currentQuestion ? { ...run, usedQuestionIds: [...run.usedQuestionIds, currentQuestion.id] } : run

    set({
      run: newRun,
      player: newPlayer,
      feedback: { message: `Drank a potion, healed ${healed} HP.`, tone: 'good', target: 'player', enemyDefeated: false },
      phase: 'feedback',
      windUpArmed: false,
    })
  },

  useDodge: () => {
    const { phase, run, player, currentQuestion } = get()
    if (phase !== 'question' || !run || run.status !== 'active') return

    const newRun = cloneRun(run)
    if (currentQuestion) newRun.usedQuestionIds = [...newRun.usedQuestionIds, currentQuestion.id]
    const enemy = newRun.encounters[newRun.encounterIndex][newRun.currentEnemyIndex]
    const success = Math.random() < DODGE_CHANCE
    let newPlayer = player
    let message: string
    let tone: Tone

    if (success) {
      message = 'Dodged the attack!'
      tone = 'good'
    } else {
      const dmg = rollDamage(enemy.damage)
      newPlayer = { ...player, currentHp: Math.max(0, player.currentHp - dmg) }
      message = `Failed to dodge! -${dmg} HP`
      tone = 'bad'
      if (newPlayer.currentHp <= 0) {
        newRun.status = 'failed'
        playSfx(SFX.playerDeathblow)
      } else {
        playSfx(SFX.mobDoingDamage)
      }
    }

    set({
      run: newRun,
      player: newPlayer,
      feedback: { message, tone, target: success ? 'none' : 'player', enemyDefeated: false },
      phase: 'feedback',
      windUpArmed: false,
    })
  },

  useStagger: () => {
    const { phase, run, currentQuestion } = get()
    if (phase !== 'question' || !run || run.status !== 'active') return

    const newRun = cloneRun(run)
    if (currentQuestion) newRun.usedQuestionIds = [...newRun.usedQuestionIds, currentQuestion.id]
    const success = Math.random() < STAGGER_CHANCE
    if (success) newRun.enemyStunned = true

    set({
      run: newRun,
      feedback: {
        message: success ? 'Staggered the enemy! Its next attack will whiff.' : 'Failed to stagger the enemy.',
        tone: success ? 'good' : 'neutral',
        target: 'none',
        enemyDefeated: false,
      },
      phase: 'feedback',
      windUpArmed: false,
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
    playSfx(SFX.menuClick)
    set({ run: { ...run, status: 'failed' } })
    finalizeRun(get, set)
  },

  acknowledgeResult: () => {
    playSfx(SFX.menuClick)
    playBgm(BGM.menu)
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
  let potionsGained = 0
  const lootGained: Item[] = []

  if (run.status === 'cleared') {
    skillPointsGained = skillPointsForTier(dungeon.tier)
    potionsGained = POTIONS_PER_CLEAR
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
    potions: player.potions + potionsGained,
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
