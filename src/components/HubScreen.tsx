import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { PlayerAvatar } from './PlayerAvatar'

interface ModeTile {
  key: string
  label: string
  description: string
  available: boolean
}

const MODES: ModeTile[] = [
  { key: 'dungeon', label: 'Dungeon Mode', description: 'PvE quiz dungeon crawl', available: true },
  { key: 'sandbox', label: 'Sandbox Mode', description: 'Free practice, no stakes', available: false },
  { key: 'pvp', label: 'PvP Mode', description: 'Battle other players', available: false },
  { key: 'leaderboard', label: 'Leaderboard', description: 'Global & subject rankings', available: false },
  { key: 'guild', label: 'Guild', description: 'Join a guild, compete together', available: false },
]

function NameTag() {
  const player = useGameStore((s) => s.player)
  const setPlayerName = useGameStore((s) => s.setPlayerName)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(player.name)

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        maxLength={20}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setPlayerName(draft)
          setEditing(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        className="font-medieval w-32 rounded border border-amber-700 bg-stone-900 px-2 py-0.5 text-lg text-amber-200 outline-none"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(player.name)
        setEditing(true)
      }}
      className="font-medieval text-lg text-amber-200 hover:underline"
      title="Click to rename"
    >
      {player.name}
    </button>
  )
}

export function HubScreen() {
  const enterMap = useGameStore((s) => s.enterMap)

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: 'url(/sprites/backgrounds/cave/0.png)', imageRendering: 'pixelated' }}
      />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 flex items-center gap-3 border-b border-stone-800 bg-stone-950/60 px-6 py-3">
        <PlayerAvatar />
        <NameTag />
      </div>

      <div className="relative z-10 mx-auto grid max-w-2xl gap-4 p-8">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            disabled={!mode.available}
            onClick={() => mode.key === 'dungeon' && enterMap()}
            className="rounded-lg border-2 border-amber-800 bg-stone-950/80 p-4 text-left shadow-lg transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
          >
            <div className="flex items-center justify-between">
              <p className="font-medieval text-xl text-amber-200">{mode.label}</p>
              {!mode.available && (
                <span className="rounded bg-stone-800 px-2 py-0.5 text-xs uppercase tracking-wide text-stone-400">
                  Coming soon
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-stone-400">{mode.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
