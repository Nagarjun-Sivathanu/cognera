import { useState } from 'react'
import { dungeonsForSubject, SUBJECTS, TIER_CONFIG } from '../game/dungeonLayout'
import { useGameStore } from '../store/gameStore'
import type { DifficultyTier, DungeonDef } from '../types'

// Scattered points, one per tier - no implied order or progression between them.
const NODE_POSITIONS: Record<DifficultyTier, { x: number; y: number }> = {
  Easy: { x: 20, y: 70 },
  Medium: { x: 45, y: 32 },
  Moderate: { x: 72, y: 62 },
  Hard: { x: 85, y: 24 },
}

const TIER_RING: Record<DifficultyTier, string> = {
  Easy: 'border-emerald-500 shadow-emerald-500/50',
  Medium: 'border-amber-500 shadow-amber-500/50',
  Moderate: 'border-orange-500 shadow-orange-500/50',
  Hard: 'border-red-500 shadow-red-500/50',
}

const TIER_NUMERAL: Record<DifficultyTier, string> = {
  Easy: 'I',
  Medium: 'II',
  Moderate: 'III',
  Hard: 'IV',
}

function DungeonNode({ dungeon }: { dungeon: DungeonDef }) {
  const [hovered, setHovered] = useState(false)
  const startRun = useGameStore((s) => s.startRun)
  const pos = NODE_POSITIONS[dungeon.tier]

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => startRun(dungeon.id)}
        className={`relative flex h-20 w-20 items-center justify-center rounded-full border-4 bg-stone-950/90 shadow-lg transition hover:brightness-125 ${TIER_RING[dungeon.tier]}`}
      >
        <span className="font-medieval text-2xl text-stone-100">{TIER_NUMERAL[dungeon.tier]}</span>
      </button>
      <p className="font-medieval mt-1 text-center text-sm text-stone-200 drop-shadow-md">{dungeon.tier}</p>

      {hovered && (
        <div className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-md border border-stone-700 bg-stone-950 p-3 text-sm text-stone-300 shadow-xl">
          <p className="font-semibold text-stone-100">{dungeon.tier}</p>
          <p className="mt-1 text-stone-400">{TIER_CONFIG[dungeon.tier].description}</p>
          <p className="mt-2 font-semibold text-stone-100">Topics covered</p>
          <p className="mt-0.5">{dungeon.topics.join(', ')}</p>
        </div>
      )}
    </div>
  )
}

export function DungeonMap() {
  const selectedSubjectId = useGameStore((s) => s.selectedSubjectId)
  const selectedChapter = useGameStore((s) => s.selectedChapter)
  const backToChapters = useGameStore((s) => s.backToChapters)
  const subject = SUBJECTS.find((s) => s.id === selectedSubjectId)
  const dungeons = selectedSubjectId ? dungeonsForSubject(selectedSubjectId) : []

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/sprites/backgrounds/cave/0.png)', imageRendering: 'pixelated' }}
      />
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <div>
          <p className="font-medieval text-lg text-amber-200 drop-shadow-md">{subject?.subject ?? 'Dungeons'}</p>
          <p className="text-xs text-stone-300 drop-shadow-md">
            {subject?.name} · {selectedChapter ?? 'Total Revision'}
          </p>
        </div>
        <button
          type="button"
          onClick={backToChapters}
          className="font-medieval rounded border border-stone-600 bg-stone-900/70 px-3 py-1.5 text-sm text-stone-200 hover:bg-stone-800"
        >
          ← Chapters
        </button>
      </div>

      <div data-tour="tier-nodes" className="pointer-events-none absolute inset-x-6 bottom-10 top-24" />
      {dungeons.map((d) => (
        <DungeonNode key={d.id} dungeon={d} />
      ))}
    </div>
  )
}
