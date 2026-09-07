import { useEffect, useState } from 'react'
import type { Question } from '../types'

interface Props {
  question: Question
  answering: boolean // true while phase === 'question'
  onAnswer: (index: number) => void
}

export function QuestionCard({ question, answering, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    setSelected(null)
  }, [question.id])

  function handleClick(index: number) {
    if (!answering) return
    setSelected(index)
    onAnswer(index)
  }

  return (
    <div className="rounded-lg border border-stone-700 bg-stone-950/90 p-3">
      <p className="text-[11px] uppercase tracking-wide text-stone-500">
        {question.subject} · {question.topic}
      </p>
      <p className="mt-1 text-base font-medium text-stone-100">{question.question}</p>
      <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {question.options.map((option, index) => {
          const isCorrect = index === question.correctIndex
          const isSelected = index === selected
          let extra = 'border-stone-700 bg-stone-900 hover:bg-stone-800'
          if (!answering) {
            if (isCorrect) extra = 'border-emerald-500 bg-emerald-900/60'
            else if (isSelected) extra = 'border-red-500 bg-red-900/60'
            else extra = 'border-stone-800 bg-stone-900 opacity-60'
          }
          return (
            <button
              key={index}
              type="button"
              disabled={!answering}
              onClick={() => handleClick(index)}
              className={`rounded border-2 px-2.5 py-1.5 text-left text-sm text-stone-100 transition disabled:cursor-not-allowed ${extra}`}
            >
              {option}
            </button>
          )
        })}
      </div>
      {!answering && question.explanation && (
        <p className="mt-2 text-xs italic text-stone-400">{question.explanation}</p>
      )}
    </div>
  )
}
