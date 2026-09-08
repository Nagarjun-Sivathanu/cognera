import { useState } from 'react'
import { getSolution } from '../game/solutions'
import { useGameStore } from '../store/gameStore'
import type { RunMistake } from '../types'

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function MistakeCard({ mistake }: { mistake: RunMistake }) {
  const [open, setOpen] = useState(false)
  const player = useGameStore((s) => s.player)
  const solution = getSolution(player, mistake.questionId)

  return (
    <div className={`rounded border-2 bg-[#1c140c] ${mistake.resolvedAt ? 'border-emerald-900/70' : 'border-amber-950/70'}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-2 p-2 text-left hover:bg-black/20"
      >
        <span className="mt-0.5 text-xs text-stone-500">{open ? '▾' : '▸'}</span>
        <span className="flex-1 text-sm text-stone-200">{mistake.question}</span>
        {mistake.resolvedAt && (
          <span className="shrink-0 rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
            fixed
          </span>
        )}
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

          {solution ? (
            <div className="mt-1 rounded border border-emerald-900/70 bg-emerald-950/20 p-2">
              <p className="text-[10px] uppercase tracking-wide text-emerald-400">Key idea</p>
              <p className="mt-0.5 text-xs leading-relaxed text-emerald-100">{solution.keyIdea}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wide text-amber-300">Working</p>
              <ol className="mt-1 space-y-1">
                {solution.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-stone-200">
                    <span className="shrink-0 text-stone-500">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            // Not solved yet - it's on the wanted list until something writes one.
            <p className="mt-1 rounded border border-dashed border-stone-700 bg-black/20 p-2 text-[11px] text-stone-500">
              No worked solution yet — this one is queued. Meanwhile, the {mistake.topic} note under Study Notes covers
              the method and the usual traps.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function MistakeList({ mistakes }: { mistakes: RunMistake[] }) {
  return (
    <div className="space-y-1.5">
      {mistakes.map((mistake) => (
        <MistakeCard key={`${mistake.questionId}-${mistake.at ?? 0}`} mistake={mistake} />
      ))}
    </div>
  )
}
