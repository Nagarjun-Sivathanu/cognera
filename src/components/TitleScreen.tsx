import { useEffect } from 'react'
import { BGM, playBgm } from '../game/audio'
import { useGameStore } from '../store/gameStore'

export function TitleScreen() {
  const enterHub = useGameStore((s) => s.enterHub)

  useEffect(() => {
    playBgm(BGM.cave)
  }, [])

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      <div
        className="animate-drift-slow pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/sprites/backgrounds/cave/0.png)', imageRendering: 'pixelated' }}
      />
      <div
        className="animate-drift-fast pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/sprites/backgrounds/cave/1.png)', imageRendering: 'pixelated' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <h1 className="font-medieval text-6xl text-amber-200 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] sm:text-7xl">
          COGNERA
        </h1>
        <p className="max-w-md text-sm tracking-wide text-stone-300 sm:text-base">
          Descend into the dungeon. Answer wisely, or bleed for it.
        </p>
        <button
          type="button"
          onClick={enterHub}
          className="font-medieval mt-4 rounded border-2 border-amber-700 bg-amber-950/80 px-8 py-3 text-xl text-amber-200 shadow-lg transition hover:bg-amber-900/80 hover:brightness-110"
        >
          Enter the Dungeon
        </button>
      </div>
    </div>
  )
}
