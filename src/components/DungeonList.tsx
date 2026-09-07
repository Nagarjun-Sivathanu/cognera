import dungeonsData from '../data/dungeons.json'
import { getLevel } from '../game/player'
import { useGameStore } from '../store/gameStore'
import type { DifficultyTier, DungeonDef } from '../types'

const dungeons = dungeonsData as DungeonDef[]

const TIER_STYLES: Record<DifficultyTier, { border: string; badge: string }> = {
  Easy: { border: 'border-emerald-600', badge: 'bg-emerald-700 text-emerald-100' },
  Medium: { border: 'border-amber-500', badge: 'bg-amber-600 text-amber-100' },
  Moderate: { border: 'border-orange-600', badge: 'bg-orange-700 text-orange-100' },
  Hard: { border: 'border-red-600', badge: 'bg-red-700 text-red-100' },
}

function DungeonCard({ dungeon }: { dungeon: DungeonDef }) {
  const startRun = useGameStore((s) => s.startRun)
  const playerLevel = useGameStore((s) => getLevel(s.player.xp))
  const locked = playerLevel < dungeon.requiredLevel
  const style = TIER_STYLES[dungeon.tier]

  return (
    <div className="group relative">
      <button
        type="button"
        disabled={locked}
        onClick={() => startRun(dungeon.id)}
        className={`w-full rounded-lg border-2 ${style.border} bg-stone-900 p-4 text-left transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-100">{dungeon.name}</h3>
          <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${style.badge}`}>{dungeon.tier}</span>
        </div>
        <p className="mt-1 text-sm text-stone-400">
          {dungeon.encounterCount} encounters · Requires level {dungeon.requiredLevel}
        </p>
      </button>

      <div className="pointer-events-none absolute left-0 right-0 top-full z-10 mt-2 rounded-md border border-stone-700 bg-stone-950 p-3 text-sm text-stone-300 opacity-0 shadow-xl transition group-hover:opacity-100">
        <p className="font-semibold text-stone-100">Key topics</p>
        <p className="mt-1">{dungeon.topics.join(', ')}</p>
        {locked && <p className="mt-2 text-red-400">Locked — reach level {dungeon.requiredLevel} to enter.</p>}
      </div>
    </div>
  )
}

export function DungeonList() {
  return (
    <div className="mx-auto grid max-w-2xl gap-4 p-6">
      {dungeons.map((d) => (
        <DungeonCard key={d.id} dungeon={d} />
      ))}
    </div>
  )
}
