import { bundledSolutions, type Solution } from '../data/solutions'
import type { PlayerState, RunMistake } from '../types'

export type { Solution }

/**
 * Solution lookup, cache-first.
 *
 * The flow is: a question is missed -> look for a worked solution -> if there isn't
 * one, it joins the wanted list. Whatever produces solutions (a generator, or hand
 * -written batches) writes them into the player's cache, so any given question is
 * only ever solved once and every later encounter is free.
 */

export type SolutionSource = 'bundled' | 'cached'

export interface ResolvedSolution extends Solution {
  source: SolutionSource
}

export function getSolution(player: PlayerState, questionId: string): ResolvedSolution | undefined {
  const bundled = bundledSolutions[questionId]
  if (bundled) return { ...bundled, source: 'bundled' }

  const cached = player.solutionCache?.[questionId]
  if (cached) return { ...cached, source: 'cached' }

  return undefined
}

/**
 * Asks the tutor endpoint for a worked solution.
 *
 * Returns null whenever it can't produce one - no key configured, offline, rate
 * limited, a malformed response. Callers treat that as "still on the wanted list",
 * so a missing tutor degrades to exactly the offline behaviour rather than breaking.
 */
export async function fetchSolution(mistake: RunMistake): Promise<Solution | null> {
  try {
    const response = await fetch('/api/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: mistake.question,
        options: mistake.options,
        correctIndex: mistake.correctIndex,
        subject: mistake.subject,
        topic: mistake.topic,
        difficulty: mistake.difficulty,
      }),
    })
    if (!response.ok) return null

    const data = await response.json()
    if (typeof data?.keyIdea !== 'string' || !Array.isArray(data?.steps)) return null
    return { keyIdea: data.keyIdea, steps: data.steps }
  } catch {
    return null
  }
}

// Requests in flight, so a question is never solved twice concurrently.
const inFlight = new Set<string>()

export function isSolving(questionId: string): boolean {
  return inFlight.has(questionId)
}

/**
 * Solves a missed question once and hands the result to `onSolved` to be cached.
 * Safe to fire and forget - it dedupes, and silently gives up if the tutor is off.
 */
export async function solveOnce(
  mistake: RunMistake,
  alreadySolved: boolean,
  onSolved: (questionId: string, solution: Solution) => void,
): Promise<void> {
  if (alreadySolved || inFlight.has(mistake.questionId)) return
  inFlight.add(mistake.questionId)
  try {
    const solution = await fetchSolution(mistake)
    if (solution) onSolved(mistake.questionId, solution)
  } finally {
    inFlight.delete(mistake.questionId)
  }
}

/** Missed questions that still have no worked solution, newest first. */
export function wantedSolutions(player: PlayerState): RunMistake[] {
  return (player.mistakeLog ?? []).filter((m) => !getSolution(player, m.questionId))
}

/**
 * Serialises the outstanding questions so they can be handed to whatever writes the
 * solutions, and pasted back as cache entries. Keeps the free path practical.
 */
export function exportWantedSolutions(player: PlayerState): string {
  const wanted = wantedSolutions(player)
  if (wanted.length === 0) return 'No outstanding questions — every mistake already has a worked solution.'

  const blocks = wanted.map((m) => {
    const options = m.options
      .map((opt, i) => `    ${String.fromCharCode(65 + i)}. ${opt}${i === m.correctIndex ? '   <-- correct' : ''}`)
      .join('\n')
    return [
      `id: ${m.questionId}`,
      `chapter: ${m.subject} / ${m.topic}   (difficulty ${m.difficulty})`,
      `question: ${m.question}`,
      options,
    ].join('\n')
  })

  return [
    `${wanted.length} question(s) missed with no worked solution yet.`,
    'Paste this to whoever is writing the solutions.',
    '',
    blocks.join('\n\n'),
  ].join('\n')
}
