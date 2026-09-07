import type { LastRunResult } from '../types'

const RARITY_COLOR: Record<string, string> = {
  Common: 'text-stone-300',
  Uncommon: 'text-emerald-400',
  Rare: 'text-sky-400',
  Epic: 'text-purple-400',
  Legendary: 'text-amber-400',
}

export function ResultModal({ result, onContinue }: { result: LastRunResult; onContinue: () => void }) {
  const cleared = result.outcome === 'cleared'

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-stone-700 bg-stone-950 p-6 text-center">
        <h2 className={`text-2xl font-bold ${cleared ? 'text-emerald-400' : 'text-red-400'}`}>
          {cleared ? 'Dungeon Cleared!' : 'You Fell...'}
        </h2>
        <p className="mt-1 text-stone-400">{result.dungeonName}</p>

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
              <ul className="ml-4 list-disc">
                {result.lootGained.map((item) => (
                  <li key={item.id} className={RARITY_COLOR[item.rarity]}>
                    {item.name} (+{item.value} {item.stat})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!cleared && <p className="text-stone-400">No loot this time — partial XP kept from defeated enemies.</p>}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500"
        >
          Return to Dungeons
        </button>
      </div>
    </div>
  )
}
