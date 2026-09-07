import skillsData from '../data/skills.json'
import type { PlayerState, SkillNode, StatKey, Subject } from '../types'

const skills = skillsData as SkillNode[]

export const XP_PER_LEVEL = 100

export function getLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function xpIntoLevel(xp: number): { current: number; needed: number } {
  const level = getLevel(xp)
  const levelStartXp = (level - 1) * XP_PER_LEVEL
  return { current: xp - levelStartXp, needed: XP_PER_LEVEL }
}

function skillBonus(player: PlayerState, stat: StatKey | 'lootLuck'): number {
  let total = 0
  for (const skill of skills) {
    if (skill.effect.stat !== stat) continue
    const rank = player.unlockedSkills[skill.id] ?? 0
    total += rank * skill.effect.perRank
  }
  return total
}

function gearBonus(player: PlayerState, stat: StatKey): number {
  let total = 0
  for (const item of Object.values(player.equipped)) {
    if (item && item.stat === stat) total += item.value
  }
  return total
}

export function getAttackPower(player: PlayerState): number {
  const level = getLevel(player.xp)
  return player.baseAttack + level + skillBonus(player, 'attack') + gearBonus(player, 'attack')
}

export function getMaxHp(player: PlayerState): number {
  const level = getLevel(player.xp)
  return player.baseMaxHp + level * 5 + skillBonus(player, 'hp') + gearBonus(player, 'hp')
}

export function getLootLuckPercent(player: PlayerState): number {
  return skillBonus(player, 'lootLuck')
}

export function createNewPlayer(): PlayerState {
  return {
    level: 1,
    xp: 0,
    currentHp: 30,
    baseAttack: 5,
    baseMaxHp: 30,
    gold: 0,
    skillPoints: 0,
    unlockedSkills: {},
    equipped: {},
    inventory: [],
    subjectStats: {},
    clearedRuns: 0,
  }
}

export function recordAnswer(player: PlayerState, subject: Subject, correct: boolean) {
  const stats = player.subjectStats[subject] ?? { correct: 0, total: 0 }
  stats.total += 1
  if (correct) stats.correct += 1
  player.subjectStats[subject] = stats
}

export { skills }
