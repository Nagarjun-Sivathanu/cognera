import questionsData from '../data/questions.json'
import jeeQuestionsData from '../data/questions-jee.json'
import type { DungeonDef, Question } from '../types'

// A handful of source questions lost their option text in conversion and came out as
// bare option letters ("(A)", "B"), which are unanswerable. They're dropped here so a
// bad row in the dataset can never reach a battle.
const DEGENERATE_OPTION = /^\(?[A-Da-d]\)?[.)]?$/

function isUsable(q: Question): boolean {
  if (q.options.length < 2) return false
  if (q.correctIndex < 0 || q.correctIndex >= q.options.length) return false
  return q.options.every((o) => o != null && o.trim() !== '' && !DEGENERATE_OPTION.test(o.trim()))
}

// questions.json: hand-written placeholders (currently the only Biology content).
// questions-jee.json: converted from the real JEE-style dataset (Math/Physics/Chemistry).
export const allQuestions = [...(questionsData as Question[]), ...(jeeQuestionsData as Question[])].filter(
  isUsable,
)

/** Distinct chapters (topics) available for a subject, alphabetically. */
export function chaptersForSubject(subject: string): string[] {
  const topics = new Set<string>()
  for (const q of allQuestions) {
    if (q.subject === subject) topics.add(q.topic)
  }
  return [...topics].sort()
}

export function questionCount(subject: string, topic?: string | null): number {
  return allQuestions.filter((q) => q.subject === subject && (!topic || q.topic === topic)).length
}

/**
 * Picks a question for the given enemy within the dungeon's subjects, optionally
 * restricted to one chapter. Prefers an exact difficulty match not yet used this run;
 * falls back to the closest difficulty, then allows repeats rather than showing nothing.
 */
export function getQuestionForEnemy(
  dungeon: Pick<DungeonDef, 'subjects'>,
  enemyDifficulty: number,
  usedIds: string[],
  chapter?: string | null,
): Question {
  const inSubject = allQuestions.filter((q) => dungeon.subjects.includes(q.subject))
  const inChapter = chapter ? inSubject.filter((q) => q.topic === chapter) : inSubject
  // Fall back up the chain rather than ever returning nothing.
  const pool = inChapter.length > 0 ? inChapter : inSubject.length > 0 ? inSubject : allQuestions

  const unused = pool.filter((q) => !usedIds.includes(q.id))
  const searchPool = unused.length > 0 ? unused : pool

  const exact = searchPool.filter((q) => q.difficulty === enemyDifficulty)
  if (exact.length > 0) return exact[Math.floor(Math.random() * exact.length)]

  const sortedByCloseness = [...searchPool].sort(
    (a, b) => Math.abs(a.difficulty - enemyDifficulty) - Math.abs(b.difficulty - enemyDifficulty),
  )
  return sortedByCloseness[0]
}
