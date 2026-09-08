import { getStudyNote } from '../data/studyNotes'

interface Props {
  subject: string
  topic: string
  /** Why the frog is showing this note now. */
  reason?: string
  defaultOpen?: boolean
}

/** The frog's revision note for one chapter: concepts to know, and where marks get lost. */
export function StudyNoteCard({ subject, topic, reason }: Props) {
  const note = getStudyNote(subject, topic)
  if (!note) return null

  return (
    <div className="rounded border-2 border-emerald-900/70 bg-emerald-950/20 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="font-medieval text-base text-emerald-300">{topic}</h4>
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-stone-500">{subject}</span>
      </div>
      {reason && <p className="mt-0.5 text-xs text-amber-300">{reason}</p>}
      <p className="mt-1.5 text-sm leading-relaxed text-stone-300">{note.summary}</p>

      <p className="font-medieval mt-3 text-xs uppercase tracking-wide text-amber-200">What you need to know</p>
      <div className="mt-1.5 space-y-2">
        {note.concepts.map((concept) => (
          <div key={concept.title} className="rounded bg-black/30 p-2">
            <p className="text-xs font-bold text-stone-100">{concept.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-stone-300">{concept.detail}</p>
          </div>
        ))}
      </div>

      <p className="font-medieval mt-3 text-xs uppercase tracking-wide text-red-300">Where marks get lost</p>
      <ul className="mt-1.5 space-y-1">
        {note.traps.map((trap) => (
          <li key={trap} className="flex gap-2 text-xs leading-relaxed text-stone-300">
            <span className="shrink-0 text-red-400">✗</span>
            <span>{trap}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
