import { useState } from 'react'
import type { RunMistake } from '../types'

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function MistakeCard({ mistake }: { mistake: RunMistake }) {
  const [open, setOpen] = useState(false)

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

          {mistake.explanation ? (
            <p className="mt-1 rounded bg-black/30 p-2 text-xs italic leading-relaxed text-stone-300">
              {mistake.explanation}
            </p>
          ) : (
            // The dataset ships no per-question explanations; the chapter note in the
            // Study Notes tab covers the method, and this is where a generated
            // step-by-step solution would land.
            <p className="mt-1 rounded border border-dashed border-stone-700 bg-black/20 p-2 text-[11px] text-stone-500">
              No step-by-step solution for this specific question — see the {mistake.topic} note under Study Notes for
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
