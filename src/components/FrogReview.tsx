import { useEffect, useState } from 'react'
import { playSfx, SFX } from '../game/audio'
import { buildRunReview, type TopicBreakdown } from '../game/review'
import type { RunMistake } from '../types'

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function MistakeCard({ mistake }: { mistake: RunMistake }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded border-2 border-amber-950/70 bg-[#1c140c]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-2 p-2 text-left hover:bg-black/20"
      >
        <span className="mt-0.5 text-xs text-stone-500">{open ? '▾' : '▸'}</span>
        <span className="flex-1 text-sm text-stone-200">{mistake.question}</span>
        <span className="shrink-0 rounded bg-stone-800 px-1.5 py-0.5 text-[10px] text-stone-400">
          D{mistake.difficulty}
        </span>
      </button>

      {open && (
        <div className="space-y-1.5 border-t border-amber-950/70 p-2">
          {mistake.options.map((option, i) => {
            const isCorrect = i === mistake.correctIndex
            const isChosen = i === mistake.chosenIndex
            return (
              <div
                key={i}
                className={`rounded border px-2 py-1 text-xs ${
                  isCorrect
                    ? 'border-emerald-600 bg-emerald-950/40 text-emerald-200'
                    : isChosen
                      ? 'border-red-700 bg-red-950/40 text-red-200'
                      : 'border-stone-800 text-stone-500'
                }`}
              >
                <span className="mr-1.5 font-bold">{OPTION_LETTERS[i] ?? i + 1}.</span>
                {option}
                {isCorrect && <span className="ml-2 text-[10px] uppercase tracking-wide">correct</span>}
                {isChosen && !isCorrect && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide">you picked this</span>
                )}
              </div>
            )
          })}
          {mistake.explanation && (
            <p className="mt-1 rounded bg-black/30 p-2 text-xs italic leading-relaxed text-stone-300">
              {mistake.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

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
      <div className="space-y-1.5">
        {topic.mistakes.map((mistake) => (
          <MistakeCard key={mistake.questionId} mistake={mistake} />
        ))}
      </div>
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
