import questionsData from '../data/questions.json'
import { randomBackgroundId } from './backgrounds'
import type { DifficultyTier, DungeonDef, Question, Subject } from '../types'

const questions = questionsData as Question[]

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

export function dungeonsForSubject(subjectId: string): DungeonDef[] {
  const template = SUBJECTS.find((s) => s.id === subjectId)
  if (!template) return []
  return dungeons.filter((d) => d.subjects.includes(template.subject))
}
