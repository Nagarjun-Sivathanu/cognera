import { create } from 'zustand'
import { BUFF_ATTACK_MULTIPLIER, getActiveSkill } from '../game/activeSkills'
import { BGM, playBgm, playSfx, SFX } from '../game/audio'
import type { CharacterAnim } from '../game/characters'
import {
  BAG_HEAL_FRACTION,
  BURN_POWER,
  DODGE_CHANCE,
  FOCUS_MAX,
  focusGain,
  generateEncounter,
  generateEncounters,
  POTIONS_PER_CLEAR,
  rollDamage,
  STAGGER_CHANCE,
  WINDUP_BONUS_MULTIPLIER,
  WINDUP_WRONG_MULTIPLIER,
  xpForEnemy,
} from '../game/combat'
import { createSandboxDungeon, dungeons, sandboxBudgetForWave } from '../game/dungeonLayout'
import { generateItem, lootRollsForTier, rollRarity, skillPointsForTier } from '../game/loot'
import { createNewPlayer, getAttackPower, getLootLuckPercent, getMaxHp, recordAnswer, skills } from '../game/player'
import { getQuestionForEnemy } from '../game/questions'
import { localSaveService } from '../services/saveService'
import type {
  DifficultyTier,
  DungeonDef,
  Item,
  ItemSlot,
  LastRunResult,
  PlayerState,
  Question,
  RunState,
} from '../types'

type Phase = 'question' | 'feedback' | 'result'
type Tone = 'good' | 'bad' | 'neutral'

interface Feedback {
  message: string
  tone: Tone
  target: 'enemy' | 'player' | 'none'
  enemyDefeated: boolean
  /** Which of the player character's animations this action should play. */
  anim: CharacterAnim
}

interface GameStore {
  player: PlayerState
  run: RunState | null
  currentQuestion: Question | null
  feedback: Feedback | null
  lastResult: LastRunResult | null
  view: 'title' | 'hub' | 'subjects' | 'chapters' | 'list' | 'sandbox' | 'run'
  phase: Phase
  windUpArmed: boolean
  selectedSubjectId: string | null
  selectedChapter: string | null // null = total revision (all chapters)
  vfx: { skillId: string; key: number } | null // effect currently playing over the battlefield

  enterHub: () => void
  enterMap: () => void
  enterSandbox: () => void
  selectSubject: (subjectId: string) => void
  selectChapter: (chapter: string | null) => void
  backToSubjects: () => void
  backToChapters: () => void
  setPlayerName: (name: string) => void
  setCharacter: (characterId: string) => void
  startRun: (dungeonId: string) => void
  startSandbox: (subjectId: string | null) => void
  answerQuestion: (selectedIndex: number) => void
  armWindUp: () => void
  useBag: () => void
  useDodge: () => void
  useStagger: () => void
  castSkill: (skillId: string) => void
  unlockActiveSkill: (skillId: string) => void
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

function currentEnemy(run: RunState) {
  return run.encounters[run.encounterIndex][run.currentEnemyIndex]
}

/** Banks the current enemy's XP and moves to the next enemy, encounter, or the end. */
function advancePastDefeated(run: RunState) {
  run.defeatedCount += 1
  run.xpAccumulated += xpForEnemy(currentEnemy(run).difficulty)
  run.enemyStunned = false
  run.burn = 0 // burn is tied to the enemy that was set alight

  const encounter = run.encounters[run.encounterIndex]
  const nextEnemyIndex = run.currentEnemyIndex + 1
  if (nextEnemyIndex < encounter.length) {
    run.currentEnemyIndex = nextEnemyIndex
    return
  }

  // Encounter cleared.
  run.wave += 1
  if (run.mode === 'sandbox') {
    // Endless: the next wave is generated on demand, a little harder each time.
    run.encounters.push(generateEncounter(sandboxBudgetForWave(run.wave)))
  }

  const nextEncounterIndex = run.encounterIndex + 1
  if (nextEncounterIndex < run.encounters.length) {
    run.encounterIndex = nextEncounterIndex
    run.currentEnemyIndex = 0
    run.backgroundIndex += 1
  } else {
    run.status = 'cleared'
  }
}

/** Walks past any enemies already at 0 HP (an area attack can drop several at once). */
function skipDefeated(run: RunState) {
  let guard = 0
  while (run.status === 'active' && currentEnemy(run).currentHp <= 0 && guard < 32) {
    guard += 1
    advancePastDefeated(run)
  }
}

/** Player's attack power for this run, including the Ember Guard buff. */
function runAttackPower(player: PlayerState, run: RunState): number {
  const base = getAttackPower(player)
  return run.attackBuffTurns > 0 ? Math.round(base * BUFF_ATTACK_MULTIPLIER) : base
}

/**
 * End-of-turn upkeep: burn damage on the current enemy, then buff/burn countdowns.
 * Returns text to append to the turn's feedback message.
 */
function tickEffects(run: RunState, attackPower: number): string {
  if (run.attackBuffTurns > 0) run.attackBuffTurns -= 1
  if (run.burn <= 0 || run.status !== 'active') return ''

  const enemy = currentEnemy(run)
  const dmg = Math.max(1, Math.round(attackPower * BURN_POWER))
  enemy.currentHp = Math.max(0, enemy.currentHp - dmg)
  run.burn -= 1
  const defeated = enemy.currentHp <= 0
  if (defeated) advancePastDefeated(run)
  return ` Burn dealt ${dmg}.${defeated ? ' Burned to ash!' : ''}`
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
  selectedChapter: null,
  vfx: null,

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
  enterSandbox: () => {
    playSfx(SFX.menuClick)
    playBgm(BGM.menu)
    set({ view: 'sandbox' })
  },
  selectSubject: (subjectId) => {
    playSfx(SFX.menuClick)
    playBgm(BGM.menu)
    set({ selectedSubjectId: subjectId, selectedChapter: null, view: 'chapters' })
  },
  selectChapter: (chapter) => {
    playSfx(SFX.menuClick)
    playBgm(BGM.menu)
    set({ selectedChapter: chapter, view: 'list' })
  },
  backToSubjects: () => {
    playSfx(SFX.menuClick)
    playBgm(BGM.menu)
    set({ view: 'subjects', selectedSubjectId: null, selectedChapter: null })
  },
  backToChapters: () => {
    playSfx(SFX.menuClick)
    playBgm(BGM.menu)
    set({ view: 'chapters', selectedChapter: null })
  },

  setPlayerName: (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const newPlayer = { ...get().player, name: trimmed }
    set({ player: newPlayer })
    persist(newPlayer)
  },

  setCharacter: (characterId) => {
    playSfx(SFX.menuClick)
    const newPlayer = { ...get().player, characterId }
    set({ player: newPlayer })
    persist(newPlayer)
  },

  startRun: (dungeonId) => {
    playSfx(SFX.menuClick)
    playBgm(BGM.cave)
    const dungeon = getDungeon(dungeonId)
    const { player, selectedChapter } = get()
    const maxHp = getMaxHp(player)
    const encounters = generateEncounters(dungeon)

    const run: RunState = {
      dungeon,
      mode: 'dungeon',
      chapter: selectedChapter,
      wave: 0,
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
      focus: 0,
      correctStreak: 0,
      burn: 0,
      attackBuffTurns: 0,
    }

    set({
      player: { ...player, currentHp: maxHp },
      run,
      currentQuestion: getQuestionForEnemy(dungeon, encounters[0][0].difficulty, [], selectedChapter),
      feedback: null,
      lastResult: null,
      view: 'run',
      phase: 'question',
      windUpArmed: false,
      vfx: null,
    })
  },

  startSandbox: (subjectId) => {
    playSfx(SFX.menuClick)
    playBgm(BGM.cave)
    const dungeon = createSandboxDungeon(subjectId)
    const player = get().player
    const maxHp = getMaxHp(player)
    const encounters = [generateEncounter(sandboxBudgetForWave(0))]

    const run: RunState = {
      dungeon,
      mode: 'sandbox',
      chapter: null, // sandbox draws from every chapter of its subject(s)
      wave: 0,
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
      focus: 0,
      correctStreak: 0,
      burn: 0,
      attackBuffTurns: 0,
    }

    set({
      player: { ...player, currentHp: maxHp },
      run,
      currentQuestion: getQuestionForEnemy(dungeon, encounters[0][0].difficulty, [], null),
      feedback: null,
      lastResult: null,
      view: 'run',
      phase: 'question',
      windUpArmed: false,
      vfx: null,
    })
  },

  answerQuestion: (selectedIndex) => {
    const { run, currentQuestion, player, windUpArmed } = get()
    if (!run || !currentQuestion || run.status !== 'active') return

    const correct = selectedIndex === currentQuestion.correctIndex
    const newPlayer: PlayerState = { ...player, subjectStats: { ...player.subjectStats } }
    recordAnswer(newPlayer, currentQuestion.subject, correct)

    const newRun = cloneRun(run)
    newRun.usedQuestionIds = [...newRun.usedQuestionIds, currentQuestion.id]
    const enemy = newRun.encounters[newRun.encounterIndex][newRun.currentEnemyIndex]
    let message = ''
    let tone: Tone = 'neutral'
    let target: Feedback['target'] = 'none'
    let enemyDefeated = false

    if (correct) {
      const attackPower = runAttackPower(newPlayer, newRun)
      let dmg = rollDamage(attackPower)
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

      // Correct answers are the only source of focus, and a streak fills it faster.
      newRun.correctStreak += 1
      newRun.focus = Math.min(FOCUS_MAX, newRun.focus + focusGain(newRun.correctStreak))

      if (enemy.currentHp <= 0) {
        enemyDefeated = true
        message += ' Defeated!'
        advancePastDefeated(newRun)
      }
      message += tickEffects(newRun, attackPower)
    } else {
      newRun.correctStreak = 0
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
      feedback: {
        message,
        tone,
        target,
        enemyDefeated,
        anim: newPlayer.currentHp <= 0 ? 'death' : correct ? 'attack' : 'hurt',
      },
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
      feedback: {
        message: `Drank a potion, healed ${healed} HP.`,
        tone: 'good',
        target: 'player',
        enemyDefeated: false,
        anim: 'defend',
      },
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
      feedback: {
        message,
        tone,
        target: success ? 'none' : 'player',
        enemyDefeated: false,
        anim: success ? 'defend' : newPlayer.currentHp <= 0 ? 'death' : 'hurt',
      },
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
        anim: 'attack',
      },
      phase: 'feedback',
      windUpArmed: false,
    })
  },

  castSkill: (skillId) => {
    const { phase, run, player, currentQuestion } = get()
    if (phase !== 'question' || !run || run.status !== 'active') return
    const skill = getActiveSkill(skillId)
    if (!skill || !player.unlockedActiveSkills.includes(skillId)) return
    if (run.focus < skill.cost) return

    const newRun = cloneRun(run)
    newRun.focus -= skill.cost
    // Casting uses up the turn, so the question on screen is retired with it.
    if (currentQuestion) newRun.usedQuestionIds = [...newRun.usedQuestionIds, currentQuestion.id]

    let newPlayer = player
    const attackPower = runAttackPower(player, newRun)
    const enemy = currentEnemy(newRun)
    let message: string
    let target: Feedback['target'] = 'enemy'

    if (skill.kind === 'damage') {
      const dmg = Math.round(attackPower * skill.power)
      enemy.currentHp = Math.max(0, enemy.currentHp - dmg)
      message = `${skill.name} seared ${enemy.name} for ${dmg}!`
      playSfx(enemy.difficulty >= 5 ? SFX.bossGettingHit : SFX.mobGettingHit)
    } else if (skill.kind === 'aoe') {
      const dmg = Math.round(attackPower * skill.power)
      for (const e of newRun.encounters[newRun.encounterIndex]) {
        e.currentHp = Math.max(0, e.currentHp - dmg)
      }
      message = `${skill.name} struck every enemy for ${dmg}!`
      playSfx(SFX.mobGettingHit)
    } else if (skill.kind === 'burn') {
      newRun.burn = skill.turns ?? 3
      message = `${enemy.name} is burning for ${newRun.burn} turns!`
      playSfx(SFX.mobGettingHit)
    } else {
      const maxHp = getMaxHp(player)
      const healed = Math.min(maxHp - player.currentHp, Math.round(maxHp * (skill.heal ?? 0)))
      newPlayer = { ...player, currentHp: player.currentHp + healed }
      // +1 because this turn's upkeep immediately ticks one off.
      newRun.attackBuffTurns = (skill.turns ?? 3) + 1
      message = `${skill.name}: healed ${healed} HP and empowered your attacks!`
      target = 'player'
    }

    skipDefeated(newRun)
    message += tickEffects(newRun, attackPower)

    set({
      run: newRun,
      player: newPlayer,
      vfx: { skillId, key: Date.now() },
      feedback: { message, tone: 'good', target, enemyDefeated: false, anim: 'special' },
      phase: 'feedback',
      windUpArmed: false,
    })
  },

  unlockActiveSkill: (skillId) => {
    const player = get().player
    const skill = getActiveSkill(skillId)
    if (!skill) return
    if (player.unlockedActiveSkills.includes(skillId)) return
    if (player.skillPoints < skill.unlockCost) return

    const newPlayer: PlayerState = {
      ...player,
      skillPoints: player.skillPoints - skill.unlockCost,
      unlockedActiveSkills: [...player.unlockedActiveSkills, skillId],
    }
    playSfx(SFX.menuClick)
    set({ player: newPlayer })
    persist(newPlayer)
  },

  advance: () => {
    const { run } = get()
    if (!run) return

    if (run.status !== 'active') {
      finalizeRun(get, set)
      return
    }

    const enemy = run.encounters[run.encounterIndex][run.currentEnemyIndex]
    const nextQuestion = getQuestionForEnemy(run.dungeon, enemy.difficulty, run.usedQuestionIds, run.chapter)
    set({ currentQuestion: nextQuestion, feedback: null, phase: 'question', vfx: null })
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
    // Sandbox runs are launched from the hub, so they return there rather than to a tier map.
    const view = get().run?.mode === 'sandbox' ? 'hub' : 'list'
    set({ view, run: null, currentQuestion: null, feedback: null, lastResult: null, phase: 'question', vfx: null })
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

/** How good sandbox loot gets, based on how deep the run went. */
function sandboxLootTier(wave: number): DifficultyTier {
  if (wave >= 10) return 'Hard'
  if (wave >= 7) return 'Moderate'
  if (wave >= 4) return 'Medium'
  return 'Easy'
}

function finalizeRun(get: () => GameStore, set: (partial: Partial<GameStore>) => void) {
  const { run, player } = get()
  if (!run) return
  const dungeon = run.dungeon

  const xpGained = run.xpAccumulated
  let skillPointsGained = 0
  let potionsGained = 0
  const lootGained: Item[] = []
  const luck = getLootLuckPercent(player)

  if (run.mode === 'sandbox') {
    // Sandbox has no "cleared" state - you're always paid out for how far you got.
    const tier = sandboxLootTier(run.wave)
    const rolls = Math.floor(run.wave / 3)
    skillPointsGained = Math.floor(run.wave / 5)
    potionsGained = Math.floor(run.wave / 4)
    for (let i = 0; i < rolls; i += 1) {
      lootGained.push(generateItem(rollRarity(tier, luck)))
    }
  } else if (run.status === 'cleared') {
    skillPointsGained = skillPointsForTier(dungeon.tier)
    potionsGained = POTIONS_PER_CLEAR
    const rolls = lootRollsForTier(dungeon.tier)
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
    clearedRuns: player.clearedRuns + (run.mode === 'dungeon' && run.status === 'cleared' ? 1 : 0),
  }

  const lastResult: LastRunResult = {
    outcome: run.mode === 'sandbox' ? 'sandbox' : run.status === 'cleared' ? 'cleared' : 'failed',
    dungeonName: dungeon.name,
    wavesSurvived: run.mode === 'sandbox' ? run.wave : undefined,
    xpGained,
    lootGained,
    skillPointsGained,
  }

  persist(newPlayer)
  set({ player: newPlayer, lastResult, phase: 'result' })
}
