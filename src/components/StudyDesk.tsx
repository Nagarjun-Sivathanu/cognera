import { useState } from 'react'
import { getStudyNote, studyNotes } from '../data/studyNotes'
import { playSfx, SFX } from '../game/audio'
import { groupMistakesByTopic, summariseMastery, topicAccuracy } from '../game/mastery'
import { exportWantedSolutions, solveOnce, wantedSolutions } from '../game/solutions'
import { useGameStore } from '../store/gameStore'
import type { RunMistake, TopicMastery } from '../types'
import { MistakeList } from './MistakeList'
import { StudyNoteCard } from './StudyNoteCard'

type Tab = 'overview' | 'mistakes' | 'notes'

function AccuracyBar({ mastery }: { mastery: TopicMastery }) {
  const pct = Math.round(topicAccuracy(mastery) * 100)
  const tone = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate text-stone-200">{mastery.topic}</span>
        <span className="shrink-0 text-stone-500">
          {mastery.correct}/{mastery.attempts} · {pct}%
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded bg-stone-900">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Overview() {
  const player = useGameStore((s) => s.player)
  const summary = summariseMastery(player)

  if (summary.totalAttempts === 0) {
    return (
      <p className="py-10 text-center text-sm text-stone-400">
        Nothing recorded yet. Answer some questions in a dungeon and I'll start keeping track.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Overall accuracy', `${summary.overallAccuracy}%`, 'text-emerald-300'],
          ['Questions answered', String(summary.totalAttempts), 'text-stone-100'],
          ['Still unfixed', String(summary.unresolvedMistakes), 'text-red-300'],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded border-2 border-amber-950/70 bg-[#1c140c] p-2 text-center">
            <p className={`font-medieval text-lg ${tone}`}>{value}</p>
            <p className="text-[10px] uppercase tracking-wide text-stone-500">{label}</p>
          </div>
        ))}
      </div>

      {summary.improvedTopics.length > 0 && (
        <section className="rounded border-2 border-emerald-800 bg-emerald-950/30 p-3">
          <p className="font-medieval text-sm text-emerald-300">You've turned these around</p>
          <p className="mt-0.5 text-xs text-stone-400">
            You used to struggle here and you've since answered them right, repeatedly. Good work.
          </p>
          <div className="mt-2 space-y-2">
            {summary.improvedTopics.map((t) => (
              <AccuracyBar key={`${t.subject}-${t.topic}`} mastery={t} />
            ))}
          </div>
        </section>
      )}

      {summary.weakTopics.length > 0 && (
        <section>
          <p className="font-medieval text-sm text-amber-200">Needs work</p>
          <p className="mt-0.5 text-xs text-stone-500">Weakest first. Drill these in chapter revision.</p>
          <div className="mt-2 space-y-2">
            {summary.weakTopics.map((t) => (
              <AccuracyBar key={`${t.subject}-${t.topic}`} mastery={t} />
            ))}
          </div>
        </section>
      )}

      {summary.strongTopics.length > 0 && (
        <section>
          <p className="font-medieval text-sm text-stone-300">Solid</p>
          <div className="mt-2 space-y-2">
            {summary.strongTopics.map((t) => (
              <AccuracyBar key={`${t.subject}-${t.topic}`} mastery={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Mistakes() {
  const player = useGameStore((s) => s.player)
  const cacheSolution = useGameStore((s) => s.cacheSolution)
  const [showResolved, setShowResolved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [solving, setSolving] = useState(false)
  const wanted = wantedSolutions(player)

  const log: RunMistake[] = player.mistakeLog ?? []
  const visible = showResolved ? log : log.filter((m) => !m.resolvedAt)
  const groups = groupMistakesByTopic(visible)
  const resolvedCount = log.filter((m) => m.resolvedAt).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-stone-400">
          {visible.length} question{visible.length === 1 ? '' : 's'} shown
          {resolvedCount > 0 && ` · ${resolvedCount} since fixed`}
          {wanted.length > 0 && ` · ${wanted.length} awaiting a worked solution`}
        </p>
        <div className="flex shrink-0 gap-2">
          {wanted.length > 0 && (
            <button
              type="button"
              disabled={solving}
              onClick={async () => {
                setSolving(true)
                // Sequential rather than parallel: free tiers rate-limit bursts.
                for (const mistake of wanted) {
                  await solveOnce(mistake, false, cacheSolution)
                }
                setSolving(false)
              }}
              className="rounded border border-amber-700 px-2 py-1 text-[11px] text-amber-200 hover:bg-amber-950/60 disabled:opacity-50"
            >
              {solving ? 'Solving…' : `Solve ${wanted.length}`}
            </button>
          )}
          {wanted.length > 0 && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(exportWantedSolutions(player))
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                } catch {
                  // clipboard can be blocked; nothing to recover, the button just won't confirm
                }
              }}
              title="Copy the unsolved questions so worked solutions can be written for them"
              className="rounded border border-emerald-800 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-950/60"
            >
              {copied ? 'Copied' : `Copy ${wanted.length} unsolved`}
            </button>
          )}
          {resolvedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowResolved((v) => !v)}
              className="rounded border border-stone-700 px-2 py-1 text-[11px] text-stone-300 hover:bg-stone-800"
            >
              {showResolved ? 'Hide fixed' : 'Show fixed'}
            </button>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-400">
          No outstanding mistakes. Either you're perfect or you haven't played enough yet.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <h4 className="font-medieval text-base text-amber-200">{group.topic}</h4>
              <span className="shrink-0 text-xs text-stone-500">
                {group.subject} · {group.mistakes.length} missed
              </span>
            </div>
            <MistakeList mistakes={group.mistakes} />
          </section>
        ))
      )}
    </div>
  )
}

function Notes() {
  const player = useGameStore((s) => s.player)
  const summary = summariseMastery(player)

  // Lead with the chapters actually costing marks, then everything else to browse.
  const weakKeys = new Set(summary.weakTopics.map((t) => `${t.subject}::${t.topic}`))
  const priority = summary.weakTopics.filter((t) => getStudyNote(t.subject, t.topic))
  const rest = Object.keys(studyNotes)
    .filter((key) => !weakKeys.has(key))
    .map((key) => {
      const [subject, topic] = key.split('::')
      return { subject, topic }
    })

  return (
    <div className="space-y-4">
      {priority.length > 0 && (
        <div className="rounded border-2 border-amber-700/60 bg-amber-950/30 p-3">
          <p className="font-medieval text-sm text-amber-200">Your study guide</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-300">
            Built from every chapter you're behind on:{' '}
            <span className="text-amber-100">{priority.map((t) => t.topic).join(', ')}</span>. That's{' '}
            {priority.reduce((n, t) => n + (getStudyNote(t.subject, t.topic)?.concepts.length ?? 0), 0)} concepts and{' '}
            {priority.reduce((n, t) => n + (getStudyNote(t.subject, t.topic)?.traps.length ?? 0), 0)} common traps to
            work through, ordered worst first.
          </p>
        </div>
      )}

      {priority.length > 0 && (
        <section className="space-y-3">
          <div>
            <p className="font-medieval text-sm text-amber-200">Read these first</p>
            <p className="mt-0.5 text-xs text-stone-500">
              The chapters you keep losing ground on, based on everything you've answered.
            </p>
          </div>
          {priority.map((t) => (
            <StudyNoteCard
              key={`${t.subject}-${t.topic}`}
              subject={t.subject}
              topic={t.topic}
              reason={`You're at ${Math.round(topicAccuracy(t) * 100)}% here across ${t.attempts} questions.`}
            />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <p className="font-medieval text-sm text-stone-300">
          {priority.length > 0 ? 'Every other chapter' : 'All chapters'}
        </p>
        {rest.map(({ subject, topic }) => (
          <StudyNoteCard key={`${subject}-${topic}`} subject={subject} topic={topic} />
        ))}
      </section>
    </div>
  )
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Progress' },
  { key: 'mistakes', label: 'Mistakes' },
  { key: 'notes', label: 'Study Notes' },
]

/** The frog's persistent desk: long-term progress, every past mistake, and study notes. */
export function StudyDesk({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('overview')
  const player = useGameStore((s) => s.player)
  const summary = summariseMastery(player)

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-lg border-4 border-amber-950 bg-[#241a10] shadow-2xl">
        <div className="flex items-start gap-4 border-b-2 border-amber-950 p-4">
          <img
            src="/sprites/ui/frog-wizard.png"
            alt="The Frog Wizard"
            className="h-20 w-20 shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-medieval text-xl text-emerald-300">The Frog Wizard's Desk</h2>
            <p className="mt-1 text-sm text-stone-300">
              {summary.improvedTopics.length > 0
                ? `You've turned around ${summary.improvedTopics.length} topic${summary.improvedTopics.length === 1 ? '' : 's'}. Keep going.`
                : summary.unresolvedMistakes > 0
                  ? `${summary.unresolvedMistakes} question${summary.unresolvedMistakes === 1 ? '' : 's'} still owe you an answer.`
                  : 'Everything you have missed, and how you are trending.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playSfx(SFX.menuClick)
              onClose()
            }}
            className="font-medieval shrink-0 rounded border-2 border-amber-800 bg-amber-950/70 px-3 py-1 text-sm text-amber-200 hover:bg-amber-900/70"
          >
            Close
          </button>
        </div>

        <div className="flex gap-2 border-b-2 border-amber-950 px-4 py-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`font-medieval rounded border-2 px-4 py-1 text-sm transition ${
                tab === t.key
                  ? 'border-amber-600 bg-amber-900/60 text-amber-100'
                  : 'border-amber-950 bg-[#2e2115] text-stone-400 hover:text-stone-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === 'overview' && <Overview />}
          {tab === 'mistakes' && <Mistakes />}
          {tab === 'notes' && <Notes />}
        </div>
      </div>
    </div>
  )
}
