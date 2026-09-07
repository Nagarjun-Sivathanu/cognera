import { useState } from 'react'
import dungeonsData from '../data/dungeons.json'
import { getLevel } from '../game/player'
import { useGameStore } from '../store/gameStore'
import type { DifficultyTier, DungeonDef } from '../types'

const dungeons = dungeonsData as DungeonDef[]

// Hand-placed positions (percent of container) forming a winding path across the map.
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  'crypt-easy': { x: 16, y: 78 },
  'catacombs-medium': { x: 38, y: 56 },
  'keep-moderate': { x: 63, y: 62 },
  'citadel-hard': { x: 85, y: 30 },
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
  const playerLevel = useGameStore((s) => getLevel(s.player.xp))
  const locked = playerLevel < dungeon.requiredLevel
  const pos = NODE_POSITIONS[dungeon.id] ?? { x: 50, y: 50 }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        disabled={locked}
        onClick={() => startRun(dungeon.id)}
        className={`relative flex h-20 w-20 items-center justify-center rounded-full border-4 bg-stone-950/90 shadow-lg transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale ${TIER_RING[dungeon.tier]}`}
      >
        <span className="font-medieval text-2xl text-stone-100">{TIER_NUMERAL[dungeon.tier]}</span>
      </button>
      <p className="font-medieval mt-1 text-center text-sm text-stone-200 drop-shadow-md">{dungeon.name}</p>

      {hovered && (
        <div className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-md border border-stone-700 bg-stone-950 p-3 text-sm text-stone-300 shadow-xl">
          <p className="font-semibold text-stone-100">
            {dungeon.tier} · Lv {dungeon.requiredLevel}+
          </p>
          <p className="mt-1">{dungeon.topics.join(', ')}</p>
          {locked && <p className="mt-2 text-red-400">Locked — reach level {dungeon.requiredLevel}.</p>}
        </div>
      )}
    </div>
  )
}

export function DungeonMap() {
  const orderedIds = ['crypt-easy', 'catacombs-medium', 'keep-moderate', 'citadel-hard']
  const points = orderedIds.map((id) => NODE_POSITIONS[id])
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/sprites/backgrounds/cave/0.png)', imageRendering: 'pixelated' }}
      />
      <div className="absolute inset-0 bg-black/35" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={pathD} fill="none" stroke="#d97706" strokeWidth="0.4" strokeDasharray="2,2" opacity="0.6" />
      </svg>

      {dungeons.map((d) => (
        <DungeonNode key={d.id} dungeon={d} />
      ))}
    </div>
  )
}
