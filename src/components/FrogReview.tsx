import { useEffect } from 'react'
import { playSfx, SFX } from '../game/audio'
import { summariseMastery } from '../game/mastery'
import { buildRunReview, type TopicBreakdown } from '../game/review'
import { useGameStore } from '../store/gameStore'
import type { RunMistake } from '../types'
import { MistakeList } from './MistakeList'
import { StudyNoteCard } from './StudyNoteCard'

/** A turnaround counts as "just now" if it was recognised within this run's lifetime. */
const RECENT_IMPROVEMENT_MS = 30 * 60 * 1000

function TopicSection({ topic, isWeakest }: { topic: TopicBreakdown; isWeakest: boolean }) {
  return (
    <section>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <h4 className="font-medieval text-base text-amber-200">
          {topic.topic}
          {isWeakest && (
            <span className="ml-2 rounded bg-red-950/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-red-300">
              weakest
            </span>
          )}
        </h4>
        <span className="shrink-0 text-xs text-stone-500">
          {topic.missed} missed · avg difficulty {topic.averageDifficulty}
        </span>
      </div>
      <MistakeList mistakes={topic.mistakes} />
    </section>
  )
}

interface Props {
  mistakes: RunMistake[]
  questionsAnswered: number
  onClose: () => void
}

/**
 * The Frog Wizard's post-run review: what you got wrong, what the right answer was,
 * and which chapter is costing you the most.
 */
export function FrogReview({ mistakes, questionsAnswered, onClose }: Props) {
  const review = buildRunReview(mistakes, questionsAnswered)
  const player = useGameStore((s) => s.player)
  // Only celebrate turnarounds recognised during this run, not old ones.
  const justImproved = summariseMastery(player).improvedTopics.filter(
    (t) => t.improvedAt && Date.now() - t.improvedAt < RECENT_IMPROVEMENT_MS,
  )

  useEffect(() => {
    playSfx(SFX.frogCroak, 0.5)
  }, [])

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-lg border-4 border-amber-950 bg-[#241a10] shadow-2xl">
        {/* The frog, and what he makes of the run */}
        <div className="flex items-start gap-4 border-b-2 border-amber-950 p-4">
          <img
            src="/sprites/ui/frog-wizard.png"
            alt="The Frog Wizard"
            className="h-24 w-24 shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-medieval text-xl text-emerald-300">The Frog Wizard</h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-300">{review.verdict}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <span className="text-stone-400">
                Accuracy <span className="font-bold text-emerald-300">{review.accuracy}%</span>
              </span>
              <span className="text-stone-400">
                Answered <span className="font-bold text-stone-200">{review.totalAnswered}</span>
              </span>
              <span className="text-stone-400">
                Missed <span className="font-bold text-red-300">{review.totalMissed}</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-medieval shrink-0 rounded border-2 border-amber-800 bg-amber-950/70 px-3 py-1 text-sm text-amber-200 hover:bg-amber-900/70"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {justImproved.length > 0 && (
            <div className="rounded border-2 border-emerald-700 bg-emerald-950/40 p-3">
              <p className="font-medieval text-sm text-emerald-300">You've improved — good work</p>
              <p className="mt-1 text-sm text-stone-300">
                You used to lose ground on{' '}
                <span className="font-semibold text-emerald-200">
                  {justImproved.map((t) => t.topic).join(', ')}
                </span>
                . You've been answering {justImproved.length === 1 ? 'it' : 'them'} right consistently now. That's
                the whole point of this — keep it up.
              </p>
            </div>
          )}

          {review.totalMissed === 0 ? (
            <p className="py-8 text-center text-sm text-stone-400">
              Nothing to review — you answered everything correctly.
            </p>
          ) : (
            <>
              {review.weakest && (
                <div className="rounded border-2 border-amber-700/60 bg-amber-950/30 p-3">
                  <p className="font-medieval text-sm text-amber-200">Study this first</p>
                  <p className="mt-1 text-sm text-stone-300">
                    <span className="font-semibold text-amber-100">{review.weakest.topic}</span> cost you{' '}
                    {review.weakest.missed} of your {review.totalMissed} mistakes. Run that chapter on its own from the
                    subject screen — pick <span className="italic">{review.weakest.subject}</span>, then{' '}
                    <span className="italic">{review.weakest.topic}</span>, and drill it until it stops biting.
                  </p>
                </div>
              )}

              {/* The frog's written note for whatever hurt most this run. */}
              {review.weakest && (
                <StudyNoteCard
                  subject={review.weakest.subject}
                  topic={review.weakest.topic}
                  reason="Here's what you actually need to know for this chapter."
                />
              )}

              {review.topics.map((topic) => (
                <TopicSection
                  key={`${topic.subject}-${topic.topic}`}
                  topic={topic}
                  isWeakest={review.weakest === topic}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
