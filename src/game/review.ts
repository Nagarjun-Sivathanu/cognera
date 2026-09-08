import type { RunMistake } from '../types'

/**
 * Turns a run's mistakes into something teachable.
 *
 * This is the offline analysis: it groups by chapter, ranks weak spots, and surfaces
 * the explanation each question already carries. It deliberately returns a structured
 * result rather than prose, so an AI-written review can later be dropped in behind the
 * same shape without the UI changing.
 */

export interface TopicBreakdown {
  subject: string
  topic: string
  missed: number
  /** Average difficulty of the questions missed here, 1-5. */
  averageDifficulty: number
  mistakes: RunMistake[]
}

export interface RunReview {
  totalAnswered: number
  totalMissed: number
  accuracy: number // 0-100
  /** Chapters ordered worst-first. */
  topics: TopicBreakdown[]
  /** The chapter that cost the most, if there is a clear one. */
  weakest: TopicBreakdown | null
  /** The frog's opening line, chosen from how the run actually went. */
  verdict: string
}

function verdictFor(accuracy: number, totalMissed: number, weakest: TopicBreakdown | null): string {
  if (totalMissed === 0) {
    return "Not a single misstep. Either you studied, or you got lucky - I know which one I'm betting on."
  }
  if (accuracy >= 80) {
    return `Sharp work. ${totalMissed} slipped past you${weakest ? `, mostly in ${weakest.topic}` : ''} - close that gap and you're dangerous.`
  }
  if (accuracy >= 50) {
    return `Middling. You know the shape of this${weakest ? `, but ${weakest.topic} keeps catching you out` : ''}. Let's fix that.`
  }
  return `That hurt to watch.${weakest ? ` ${weakest.topic} is where you're bleeding.` : ''} Sit down - we're going through this properly.`
}

export function buildRunReview(mistakes: RunMistake[], totalAnswered: number): RunReview {
  const byTopic = new Map<string, TopicBreakdown>()

  for (const mistake of mistakes) {
    const key = `${mistake.subject}::${mistake.topic}`
    const existing = byTopic.get(key)
    if (existing) {
      existing.mistakes.push(mistake)
      existing.missed += 1
    } else {
      byTopic.set(key, {
        subject: mistake.subject,
        topic: mistake.topic,
        missed: 1,
        averageDifficulty: 0,
        mistakes: [mistake],
      })
    }
  }

  const topics = [...byTopic.values()]
  for (const topic of topics) {
    const sum = topic.mistakes.reduce((total, m) => total + m.difficulty, 0)
    topic.averageDifficulty = Math.round((sum / topic.mistakes.length) * 10) / 10
  }

  // Worst first: most missed, then hardest on a tie.
  topics.sort((a, b) => b.missed - a.missed || b.averageDifficulty - a.averageDifficulty)

  const totalMissed = mistakes.length
  const accuracy = totalAnswered > 0 ? Math.round(((totalAnswered - totalMissed) / totalAnswered) * 100) : 100
  // Only call out a weakest chapter when it actually stands out.
  const weakest = topics.length > 0 && (topics.length === 1 || topics[0].missed > topics[1].missed) ? topics[0] : null

  return {
    totalAnswered,
    totalMissed,
    accuracy,
    topics,
    weakest,
    verdict: verdictFor(accuracy, totalMissed, weakest),
  }
}
