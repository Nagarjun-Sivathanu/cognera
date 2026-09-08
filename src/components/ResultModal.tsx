import { useState } from 'react'
import { RARITY_TEXT } from '../game/rarity'
import type { LastRunResult } from '../types'
import { FrogReview } from './FrogReview'
import { ItemIcon } from './ItemIcon'

export function ResultModal({ result, onContinue }: { result: LastRunResult; onContinue: () => void }) {
  const sandbox = result.outcome === 'sandbox'
  const cleared = result.outcome === 'cleared'
  const good = cleared || sandbox
  const [reviewOpen, setReviewOpen] = useState(false)

  const title = sandbox ? 'Run Over' : cleared ? 'Dungeon Cleared!' : 'You Fell...'
  const missed = result.mistakes.length

  if (reviewOpen) {
    return (
      <FrogReview
        mistakes={result.mistakes}
        questionsAnswered={result.questionsAnswered}
        onClose={() => setReviewOpen(false)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-md rounded-lg border-4 border-amber-950 bg-[#241a10] p-6 text-center shadow-2xl">
        <h2 className={`font-medieval text-2xl ${good ? 'text-emerald-400' : 'text-red-400'}`}>{title}</h2>
        <p className="mt-1 text-stone-400">{result.dungeonName}</p>
        {sandbox && (
          <p className="font-medieval mt-2 text-lg text-amber-300">
            {result.wavesSurvived} {result.wavesSurvived === 1 ? 'wave' : 'waves'} survived
          </p>
        )}

        <div className="mt-4 space-y-2 text-left text-sm text-stone-200">
          <p>
            XP gained: <span className="font-semibold text-sky-400">{result.xpGained}</span>
          </p>
          {result.skillPointsGained > 0 && (
            <p>
              Skill points gained: <span className="font-semibold text-emerald-400">{result.skillPointsGained}</span>
            </p>
          )}
          {result.lootGained.length > 0 && (
            <div>
              <p className="font-semibold text-stone-100">Loot:</p>
              <ul className="mt-1 space-y-1">
                {result.lootGained.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <ItemIcon item={item} size={24} />
                    <span className={RARITY_TEXT[item.rarity]}>
                      {item.name}{' '}
                      <span className="text-xs text-stone-500">
                        (+{item.value} {item.stat})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!good && <p className="text-stone-400">No loot this time — partial XP kept from defeated enemies.</p>}
          {sandbox && result.lootGained.length === 0 && (
            <p className="text-stone-400">Survive 3 waves or more to earn loot.</p>
          )}
        </div>

        {/* The frog only has something to say if you actually got something wrong. */}
        {missed > 0 && (
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="mt-5 flex w-full items-center gap-3 rounded border-2 border-emerald-800 bg-emerald-950/40 p-3 text-left transition hover:border-emerald-600 hover:bg-emerald-950/70"
          >
            <img
              src="/sprites/ui/frog-wizard.png"
              alt=""
              className="h-12 w-12 shrink-0"
              style={{ imageRendering: 'pixelated' }}
            />
            <span className="min-w-0">
              <span className="font-medieval block text-sm text-emerald-300">The Frog Wizard has notes</span>
              <span className="block text-xs text-stone-400">
                Review the {missed} question{missed === 1 ? '' : 's'} you missed
              </span>
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onContinue}
          className="font-medieval mt-3 w-full rounded border-2 border-amber-700 bg-amber-950/80 px-4 py-2 text-amber-200 hover:bg-amber-900/80"
        >
          {sandbox ? 'Return to Hub' : 'Return to Dungeons'}
        </button>
      </div>
    </div>
  )
}
