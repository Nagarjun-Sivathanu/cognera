import { SANDBOX_MAX_BUDGET, SUBJECTS } from '../game/dungeonLayout'
import { questionCount } from '../game/questions'
import { useGameStore } from '../store/gameStore'

export function SandboxSelect() {
  const startSandbox = useGameStore((s) => s.startSandbox)
  const enterHub = useGameStore((s) => s.enterHub)

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: 'url(/sprites/backgrounds/cave/0.png)', imageRendering: 'pixelated' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-black/55" />

      <div className="relative z-10 mx-auto max-w-4xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medieval text-2xl text-amber-200 drop-shadow-md">Sandbox</h2>
            <p className="text-sm text-stone-300 drop-shadow-md">
              Endless waves. Each one is harder than the last — the further you get, the better the reward.
            </p>
          </div>
          <button
            type="button"
            onClick={enterHub}
            className="font-medieval rounded border border-stone-600 bg-stone-900/70 px-3 py-1.5 text-sm text-stone-200 hover:bg-stone-800"
          >
            ← Hub
          </button>
        </div>

        <button
          type="button"
          onClick={() => startSandbox(null)}
          className="mt-6 w-full rounded-lg border-2 border-amber-600 bg-amber-950/70 p-4 text-left shadow-lg transition hover:brightness-125"
        >
          <p className="font-medieval text-xl text-amber-200">All Subjects</p>
          <p className="mt-1 text-sm text-stone-400">
            Everything mixed together — the real endurance run.
          </p>
        </button>

        <p className="font-medieval mt-6 text-sm uppercase tracking-wide text-stone-400">Single subject</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {SUBJECTS.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => startSandbox(subject.id)}
              className="rounded-lg border-2 border-stone-700 bg-stone-950/80 p-4 text-left shadow-lg transition hover:border-amber-700 hover:brightness-125"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medieval text-lg text-stone-100">{subject.subject}</p>
                <span className="shrink-0 text-xs text-stone-500">{questionCount(subject.subject)} q</span>
              </div>
              <p className="mt-0.5 text-xs text-stone-500">{subject.name}</p>
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs text-stone-500">
          Waves ramp from a difficulty budget of 2 up to {SANDBOX_MAX_BUDGET}. There's no clear condition — you play
          until you fall or retreat, and keep what you earned.
        </p>
      </div>
    </div>
  )
}
