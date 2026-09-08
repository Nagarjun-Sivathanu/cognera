import type { PlayerState, RunMistake, Subject, TopicMastery } from '../types'

/** How many recent results are kept per topic. */
const RECENT_WINDOW = 8
/** Consecutive correct answers needed to call a struggling topic turned around. */
const IMPROVEMENT_STREAK = 4
/** Minimum attempts before accuracy means anything. */
const MIN_ATTEMPTS = 3
/** Accuracy below this counts as struggling. */
const STRUGGLING_ACCURACY = 0.5
/** Mistakes kept in the log. Enough for a long history, small enough for localStorage. */
export const MISTAKE_LOG_CAP = 200

export function topicKey(subject: Subject, topic: string): string {
  return `${subject}::${topic}`
}

export function topicAccuracy(mastery: TopicMastery): number {
  return mastery.attempts > 0 ? mastery.correct / mastery.attempts : 0
}

/** Length of the current run of correct answers at the end of the recent window. */
function currentStreak(mastery: TopicMastery): number {
  let streak = 0
  for (let i = mastery.recent.length - 1; i >= 0; i -= 1) {
    if (!mastery.recent[i]) break
    streak += 1
  }
  return streak
}

/**
 * Folds one answer into a topic's rolling record, and decides whether the topic has
 * just been turned around. Mutates and returns the mastery entry.
 */
export function recordTopicAnswer(mastery: TopicMastery, correct: boolean, now: number): TopicMastery {
  mastery.attempts += 1
  if (correct) mastery.correct += 1
  mastery.recent = [...mastery.recent, correct].slice(-RECENT_WINDOW)

  if (mastery.attempts >= MIN_ATTEMPTS && topicAccuracy(mastery) < STRUGGLING_ACCURACY) {
    mastery.everStruggled = true
  }

  // Only celebrate a turnaround once, and only for a topic that was genuinely bad.
  if (
    mastery.everStruggled &&
    !mastery.improvedAt &&
    currentStreak(mastery) >= IMPROVEMENT_STREAK
  ) {
    mastery.improvedAt = now
  }

  return mastery
}

export function newTopicMastery(subject: Subject, topic: string): TopicMastery {
  return { subject, topic, attempts: 0, correct: 0, recent: [], everStruggled: false }
}

export interface MasterySummary {
  /** Topics currently worth drilling, worst first. */
  weakTopics: TopicMastery[]
  /** Topics that were struggling and have since been turned around. */
  improvedTopics: TopicMastery[]
  /** Topics answered well from the start. */
  strongTopics: TopicMastery[]
  totalAttempts: number
  totalCorrect: number
  overallAccuracy: number // 0-100
  unresolvedMistakes: number
}

/** A topic is still weak if it's below the bar and isn't on a recovery streak. */
function isWeak(mastery: TopicMastery): boolean {
  if (mastery.attempts < MIN_ATTEMPTS) return false
  if (mastery.improvedAt) return false
  return topicAccuracy(mastery) < 0.65
}

export function summariseMastery(player: PlayerState): MasterySummary {
  const all = Object.values(player.topicStats ?? {})

  const weakTopics = all.filter(isWeak).sort((a, b) => topicAccuracy(a) - topicAccuracy(b))
  const improvedTopics = all
    .filter((t) => t.improvedAt)
    .sort((a, b) => (b.improvedAt ?? 0) - (a.improvedAt ?? 0))
  const strongTopics = all
    .filter((t) => t.attempts >= MIN_ATTEMPTS && !t.everStruggled && topicAccuracy(t) >= 0.8)
    .sort((a, b) => topicAccuracy(b) - topicAccuracy(a))

  const totalAttempts = all.reduce((sum, t) => sum + t.attempts, 0)
  const totalCorrect = all.reduce((sum, t) => sum + t.correct, 0)

  return {
    weakTopics,
    improvedTopics,
    strongTopics,
    totalAttempts,
    totalCorrect,
    overallAccuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    unresolvedMistakes: (player.mistakeLog ?? []).filter((m) => !m.resolvedAt).length,
  }
}

/** Groups logged mistakes by chapter, most-missed first. */
export function groupMistakesByTopic(mistakes: RunMistake[]): { key: string; subject: Subject; topic: string; mistakes: RunMistake[] }[] {
  const groups = new Map<string, { key: string; subject: Subject; topic: string; mistakes: RunMistake[] }>()
  for (const mistake of mistakes) {
    const key = topicKey(mistake.subject, mistake.topic)
    const existing = groups.get(key)
    if (existing) existing.mistakes.push(mistake)
    else groups.set(key, { key, subject: mistake.subject, topic: mistake.topic, mistakes: [mistake] })
  }
  return [...groups.values()].sort((a, b) => b.mistakes.length - a.mistakes.length)
}
