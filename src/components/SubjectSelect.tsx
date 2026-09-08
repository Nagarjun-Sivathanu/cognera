import { SUBJECTS } from '../game/dungeonLayout'
import { useGameStore } from '../store/gameStore'

export function SubjectSelect() {
  const selectSubject = useGameStore((s) => s.selectSubject)

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: 'url(/sprites/backgrounds/cave/0.png)', imageRendering: 'pixelated' }}
      />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 p-8 text-center">
        <h2 className="font-medieval text-2xl text-amber-200">Choose a Subject</h2>
        <p className="mt-1 text-sm text-stone-400">No levels here - just pick where you want to dig in.</p>

        <div data-tour="subject-list" className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSubject(s.id)}
              className="rounded-lg border-2 border-amber-800 bg-stone-950/80 p-6 text-left shadow-lg transition hover:brightness-125"
            >
              <p className="font-medieval text-xl text-amber-200">{s.subject}</p>
              <p className="mt-1 text-sm text-stone-400">{s.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
