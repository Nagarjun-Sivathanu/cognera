import { SUBJECTS } from '../game/dungeonLayout'
import { getChapterConcept } from '../data/concepts'
import { chaptersForSubject, questionCount } from '../game/questions'
import { useGameStore } from '../store/gameStore'

export function ChapterSelect() {
  const selectedSubjectId = useGameStore((s) => s.selectedSubjectId)
  const selectChapter = useGameStore((s) => s.selectChapter)
  const enterLearn = useGameStore((s) => s.enterLearn)
  const backToSubjects = useGameStore((s) => s.backToSubjects)

  const subject = SUBJECTS.find((s) => s.id === selectedSubjectId)
  if (!subject) return null

  const chapters = chaptersForSubject(subject.subject)
  const total = questionCount(subject.subject)

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
            <h2 className="font-medieval text-2xl text-amber-200 drop-shadow-md">{subject.subject}</h2>
            <p className="text-sm text-stone-300 drop-shadow-md">Choose what to revise</p>
          </div>
          <button
            type="button"
            onClick={backToSubjects}
            className="font-medieval rounded border border-stone-600 bg-stone-900/70 px-3 py-1.5 text-sm text-stone-200 hover:bg-stone-800"
          >
            ← Subjects
          </button>
        </div>

        <button
          type="button"
          data-tour="total-revision"
          onClick={() => selectChapter(null)}
          className="mt-6 w-full rounded-lg border-2 border-amber-600 bg-amber-950/70 p-4 text-left shadow-lg transition hover:brightness-125"
        >
          <div className="flex items-center justify-between">
            <p className="font-medieval text-xl text-amber-200">Total Revision</p>
            <span className="text-xs text-stone-400">{total} questions</span>
          </div>
          <p className="mt-1 text-sm text-stone-400">Every chapter in {subject.subject}, mixed together.</p>
        </button>

        <p className="font-medieval mt-6 text-sm uppercase tracking-wide text-stone-400">Chapter revision</p>
        <div data-tour="chapter-list" className="mt-2 grid gap-3 sm:grid-cols-2">
          {chapters.map((chapter) => {
            const hasLesson = Boolean(getChapterConcept(subject.subject, chapter))
            return (
              <div
                key={chapter}
                className="rounded-lg border-2 border-stone-700 bg-stone-950/80 p-4 shadow-lg transition hover:border-amber-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medieval text-lg text-stone-100">{chapter}</p>
                  <span className="shrink-0 text-xs text-stone-500">
                    {questionCount(subject.subject, chapter)} q
                  </span>
                </div>
                {/* Learn the concepts first, or go straight to being hit by them. */}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    // The tour spotlights the first chapter that actually has a lesson.
                    data-tour={hasLesson ? 'learn-content' : undefined}
                    disabled={!hasLesson}
                    onClick={() => enterLearn(chapter)}
                    title={hasLesson ? 'Walk the atrium and learn the concepts' : 'No lesson written for this chapter yet'}
                    className="flex-1 rounded border-2 border-cyan-800 bg-cyan-950/50 px-2 py-1.5 text-xs text-cyan-200 hover:bg-cyan-900/60 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Learn Content
                  </button>
                  <button
                    type="button"
                    onClick={() => selectChapter(chapter)}
                    className="flex-1 rounded border-2 border-amber-800 bg-amber-950/60 px-2 py-1.5 text-xs text-amber-200 hover:bg-amber-900/60"
                  >
                    Quiz Dungeon
                  </button>
                </div>
              </div>
            )
          })}
          {chapters.length === 0 && (
            <p className="text-sm text-stone-500">No questions loaded for this subject yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
