import { randomBackgroundId } from './backgrounds'
import { allQuestions as questions } from './questions'
import type { DifficultyTier, DungeonDef, Subject } from '../types'

const TIERS: DifficultyTier[] = ['Easy', 'Medium', 'Moderate', 'Hard']

export const TIER_CONFIG: Record<DifficultyTier, { encounterCount: number; budgetRange: [number, number]; requiredLevel: number; description: string }> = {
  Easy: {
    encounterCount: 3,
    budgetRange: [1, 2],
    requiredLevel: 1,
    description: 'Foundational recall questions. Weak, low-HP enemies - a safe warm-up.',
  },
  Medium: {
    encounterCount: 4,
    budgetRange: [2, 4],
    requiredLevel: 3,
    description: 'Applied problems with tougher enemy packs. Some risk if you rush.',
  },
  Moderate: {
    encounterCount: 5,
    budgetRange: [4, 6],
    requiredLevel: 6,
    description: 'Multi-step problems and larger enemy groups. Real risk of failure.',
  },
  Hard: {
    encounterCount: 6,
    budgetRange: [6, 9],
    requiredLevel: 10,
    description: 'Advanced, multi-concept questions guarded by the toughest enemies.',
  },
}

export interface SubjectTemplate {
  id: string
  subject: Subject
  name: string
}

// The subject picker screen - plain categories, no levels or locks.
export const SUBJECTS: SubjectTemplate[] = [
  { id: 'math', subject: 'Math', name: 'Numeral Vault' },
  { id: 'physics', subject: 'Physics', name: 'Force Foundry' },
  { id: 'chemistry', subject: 'Chemistry', name: "Alchemist's Den" },
  { id: 'biology', subject: 'Biology', name: 'Living Depths' },
]

function topicsForSubject(subject: Subject): string[] {
  const topics = new Set<string>()
  for (const q of questions) {
    if (q.subject === subject) topics.add(q.topic)
  }
  return [...topics]
}

function pickBackgrounds(count: number): string[] {
  return Array.from({ length: count }, () => randomBackgroundId())
}

/** Every subject has all four difficulty tiers as its own sub-dungeons. */
function generateDungeonLayout(): DungeonDef[] {
  const result: DungeonDef[] = []
  for (const template of SUBJECTS) {
    for (const tier of TIERS) {
      const config = TIER_CONFIG[tier]
      result.push({
        id: `${template.id}-${tier.toLowerCase()}`,
        name: template.name,
        tier,
        subjects: [template.subject],
        topics: topicsForSubject(template.subject),
        encounterCount: config.encounterCount,
        budgetRange: config.budgetRange,
        backgrounds: pickBackgrounds(3),
        requiredLevel: config.requiredLevel,
      })
    }
  }
  return result
}

// Computed once per session (module load).
export const dungeons: DungeonDef[] = generateDungeonLayout()

// Sandbox waves ramp their difficulty budget instead of using a fixed tier.
export const SANDBOX_START_BUDGET = 2
export const SANDBOX_MAX_BUDGET = 16

export function sandboxBudgetForWave(wave: number): number {
  return Math.min(SANDBOX_MAX_BUDGET, SANDBOX_START_BUDGET + Math.floor(wave * 0.8))
}

/**
 * A synthetic dungeon for Sandbox runs. `subjectId` of null mixes every subject.
 * It never appears in the dungeon list - the run carries it directly.
 */
export function createSandboxDungeon(subjectId: string | null): DungeonDef {
  const template = subjectId ? SUBJECTS.find((s) => s.id === subjectId) : undefined
  const subjects = template ? [template.subject] : SUBJECTS.map((s) => s.subject)
  return {
    id: `sandbox-${subjectId ?? 'all'}`,
    name: template ? `${template.name} Sandbox` : 'Endless Sandbox',
    tier: 'Easy', // starting point only; sandbox loot scales off waves survived
    subjects,
    topics: subjects.flatMap((s) => topicsForSubject(s)),
    encounterCount: 0, // unbounded - waves are appended as they're cleared
    budgetRange: [SANDBOX_START_BUDGET, SANDBOX_START_BUDGET],
    backgrounds: pickBackgrounds(4),
    requiredLevel: 1,
  }
}

export function dungeonsForSubject(subjectId: string): DungeonDef[] {
  const template = SUBJECTS.find((s) => s.id === subjectId)
  if (!template) return []
  return dungeons.filter((d) => d.subjects.includes(template.subject))
}
