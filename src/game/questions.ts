import questionsData from '../data/questions.json'
import type { DungeonDef, Question } from '../types'

const allQuestions = questionsData as Question[]

/**
 * Picks a question for the given enemy within the dungeon's subjects.
 * Prefers an exact difficulty match not yet used this run; falls back to the
 * closest difficulty, then allows repeats rather than ever showing nothing.
 */
export function getQuestionForEnemy(
  dungeon: DungeonDef,
  enemyDifficulty: number,
  usedIds: string[],
): Question {
  const inSubject = allQuestions.filter((q) => dungeon.subjects.includes(q.subject))
  const pool = inSubject.length > 0 ? inSubject : allQuestions

  const unused = pool.filter((q) => !usedIds.includes(q.id))
  const searchPool = unused.length > 0 ? unused : pool

  const exact = searchPool.filter((q) => q.difficulty === enemyDifficulty)
  if (exact.length > 0) return exact[Math.floor(Math.random() * exact.length)]

  const sortedByCloseness = [...searchPool].sort(
    (a, b) => Math.abs(a.difficulty - enemyDifficulty) - Math.abs(b.difficulty - enemyDifficulty),
  )
  return sortedByCloseness[0]
}
