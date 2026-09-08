import { useEffect, useRef, useState } from 'react'
import type { ConceptSection } from '../data/concepts'
import { playSfx, SFX } from '../game/audio'
import { getNpc } from '../game/npcs'
import { Sprite } from './Sprite'

interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Split-screen NPC conversation: the scripted lesson on the left, and once it's
 * finished, a free-form chat where the player can push back with their own questions.
 * The NPC's voice and concept context are sent with every request so answers stay in
 * character and on topic.
 */
export function NpcDialogue({ section, onClose }: { section: ConceptSection; onClose: () => void }) {
  const npc = getNpc(section.npc)
  const [beat, setBeat] = useState(0)
  const [chat, setChat] = useState<ChatTurn[]>([])
  const [draft, setDraft] = useState('')
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  // A section with no beats is a townsfolk stall: no lesson, straight to questions.
  const hasScript = section.beats.length > 0
  const scriptDone = !hasScript || beat >= section.beats.length - 1

  useEffect(() => {
    playSfx(SFX.menuClick, 0.4)
  }, [beat])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [chat, beat])

  if (!npc) return null

  async function ask() {
    const question = draft.trim()
    if (!question || asking) return

    const next: ChatTurn[] = [...chat, { role: 'user', content: question }]
    setChat(next)
    setDraft('')
    setAsking(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcName: npc!.name,
          npcTitle: npc!.title,
          voice: npc!.voice,
          context: section.context,
          heading: section.heading,
          history: next,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.reply) {
        setError(data.error ?? 'No answer came back.')
      } else {
        setChat([...next, { role: 'assistant', content: data.reply }])
      }
    } catch {
      setError('Could not reach the tutor. Is the dev server running with a key set?')
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex bg-slate-950/95">
      {/* Left: the NPC themself */}
      <div className="relative hidden w-2/5 items-end justify-center overflow-hidden border-r-2 border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 md:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'url(/sprites/backgrounds/scifi/2.png)',
            backgroundSize: 'cover',
            imageRendering: 'pixelated',
          }}
        />
        <div className="relative z-10 pb-16 text-center">
          <Sprite sheet={npc.sheets.dialogue} displayHeight={Math.round(npc.displayHeight * 1.75)} fps={8} />
          <p className={`font-medieval mt-4 text-xl ${npc.accent.split(' ')[1]}`}>{npc.name}</p>
          <p className="text-xs uppercase tracking-widest text-stone-500">{npc.title}</p>
        </div>
      </div>

      {/* Right: what they're saying, then the chat */}
      <div className="flex flex-1 flex-col">
        <div className={`flex items-center justify-between border-b-2 bg-slate-900/80 px-5 py-3 ${npc.accent}`}>
          <div>
            <p className="font-medieval text-lg">{section.heading}</p>
            <p className="text-[11px] text-stone-500">
              {!hasScript
                ? 'Takes questions — no lesson of their own'
                : scriptDone
                  ? 'Lesson complete — ask anything'
                  : `${beat + 1} of ${section.beats.length}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-medieval rounded border border-slate-600 bg-slate-800 px-3 py-1 text-sm text-stone-200 hover:bg-slate-700"
          >
            Leave
          </button>
        </div>

        <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          {section.beats.slice(0, beat + 1).map((line, i) => (
            <p key={i} className="rounded border border-slate-700 bg-slate-900/70 p-3 text-[15px] leading-relaxed text-stone-200">
              {line}
            </p>
          ))}

          {!hasScript && !chat.length && (
            <p className="rounded border border-dashed border-slate-700 p-3 text-sm italic text-stone-400">
              {npc.name} looks up and waits. Ask whatever the researchers left unclear.
            </p>
          )}

          {chat.map((turn, i) => (
            <p
              key={`chat-${i}`}
              className={
                turn.role === 'user'
                  ? 'ml-8 rounded border border-amber-800/70 bg-amber-950/30 p-3 text-sm text-amber-100'
                  : 'rounded border border-slate-700 bg-slate-900/70 p-3 text-[15px] leading-relaxed text-stone-200'
              }
            >
              {turn.content}
            </p>
          ))}

          {asking && <p className="animate-pulse p-3 text-sm text-stone-500">{npc.name} is thinking…</p>}
          {error && <p className="rounded border border-red-900 bg-red-950/40 p-3 text-xs text-red-300">{error}</p>}
        </div>

        <div className="border-t-2 border-slate-700 bg-slate-900/80 p-4">
          {!scriptDone ? (
            <button
              type="button"
              onClick={() => setBeat((b) => b + 1)}
              className="font-medieval w-full rounded border-2 border-cyan-700 bg-cyan-950/60 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-900/60"
            >
              Continue →
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ask()}
                placeholder={`Ask ${npc.name} about ${section.heading.toLowerCase()}…`}
                className="flex-1 rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-stone-100 outline-none focus:border-cyan-600"
              />
              <button
                type="button"
                onClick={ask}
                disabled={asking || !draft.trim()}
                className="font-medieval rounded border-2 border-cyan-700 bg-cyan-950/60 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-900/60 disabled:opacity-40"
              >
                Ask
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
