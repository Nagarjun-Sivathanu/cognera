import { useEffect } from 'react'
import dungeonsData from '../data/dungeons.json'
import { getBackground } from '../game/backgrounds'
import { useGameStore } from '../store/gameStore'
import type { DungeonDef } from '../types'
import { EnemyCard } from './EnemyCard'
import { PlayerPanel } from './PlayerPanel'
import { QuestionCard } from './QuestionCard'
import { ResultModal } from './ResultModal'

const dungeons = dungeonsData as DungeonDef[]

const FEEDBACK_DELAY_MS = 1100

// Zigzag vertical offsets so enemies don't sit in a flat line.
const STAGGER_OFFSETS = [0, 28, -12, 18, -4]

const TONE_COLOR: Record<string, string> = {
  good: 'text-emerald-400',
  bad: 'text-red-400',
  neutral: 'text-stone-300',
}

export function RunScreen() {
  const run = useGameStore((s) => s.run)
  const player = useGameStore((s) => s.player)
  const currentQuestion = useGameStore((s) => s.currentQuestion)
  const feedback = useGameStore((s) => s.feedback)
  const phase = useGameStore((s) => s.phase)
  const windUpArmed = useGameStore((s) => s.windUpArmed)
  const lastResult = useGameStore((s) => s.lastResult)
  const answerQuestion = useGameStore((s) => s.answerQuestion)
  const armWindUp = useGameStore((s) => s.armWindUp)
  const useBag = useGameStore((s) => s.useBag)
  const useDodge = useGameStore((s) => s.useDodge)
  const useStagger = useGameStore((s) => s.useStagger)
  const advance = useGameStore((s) => s.advance)
  const retreat = useGameStore((s) => s.retreat)
  const acknowledgeResult = useGameStore((s) => s.acknowledgeResult)

  useEffect(() => {
    if (phase !== 'feedback') return
    const timer = setTimeout(() => advance(), FEEDBACK_DELAY_MS)
    return () => clearTimeout(timer)
  }, [phase, advance])

  if (!run) return null

  if (phase === 'result' && lastResult) {
    return <ResultModal result={lastResult} onContinue={acknowledgeResult} />
  }

  const dungeon = dungeons.find((d) => d.id === run.dungeonId)!
  const encounter = run.encounters[run.encounterIndex]
  const activeEnemy = encounter[run.currentEnemyIndex]
  const backgroundId = dungeon.backgrounds[run.backgroundIndex % dungeon.backgrounds.length]
  const bg = getBackground(backgroundId)

  const playerAttacking = phase === 'feedback' && feedback?.target === 'enemy'
  const playerHurt = phase === 'feedback' && feedback?.target === 'player'
  const canAct = phase === 'question'

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      {/* top half: battlefield */}
      <div className="relative flex-1 overflow-hidden" style={{ filter: bg.filter }}>
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bg.base})`, imageRendering: 'pixelated' }}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bg.vignette})`, imageRendering: 'pixelated' }}
        />

        <div className="absolute left-3 top-2 z-10 text-stone-300">
          <p className="font-medieval text-sm text-amber-200 drop-shadow-md">{dungeon.name}</p>
          <p className="text-xs text-stone-300 drop-shadow-md">
            Encounter {run.encounterIndex + 1}/{dungeon.encounterCount} · Enemy {run.currentEnemyIndex + 1}/{encounter.length}
          </p>
        </div>

        <div className="relative z-10 flex h-full items-center justify-between gap-4 px-6">
          <PlayerPanel attacking={playerAttacking} hurt={playerHurt} charged={run.charged} />

          <div className="flex items-end gap-4 pr-4">
            {encounter.map((enemy, i) => (
              <div
                key={enemy.instanceId}
                className={i === run.currentEnemyIndex ? 'scale-110' : 'scale-90 opacity-50 grayscale'}
                style={{ marginBottom: STAGGER_OFFSETS[i % STAGGER_OFFSETS.length] }}
              >
                <EnemyCard
                  enemy={enemy}
                  hitFlash={feedback?.target === 'enemy' && i === run.currentEnemyIndex && feedback !== null}
                  stunned={run.enemyStunned && i === run.currentEnemyIndex}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* bottom half: command panel + question panel, retro wood-frame style */}
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_minmax(0,2fr)] overflow-hidden border-t-4 border-amber-950 bg-[#241a10]">
        <div className="flex flex-col justify-between gap-2 overflow-y-auto border-r-4 border-amber-950 bg-[#2e2115] p-3">
          <div className="text-center">
            <p className="font-medieval text-xs uppercase tracking-wide text-amber-500">Target</p>
            <p className="font-medieval text-base text-stone-100">{activeEnemy.name}</p>
            {feedback && <p className={`mt-1 text-sm font-bold ${TONE_COLOR[feedback.tone]}`}>{feedback.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={!canAct || player.potions <= 0}
              onClick={useBag}
              className="font-medieval rounded border-2 border-amber-800 bg-amber-950/70 px-2 py-1.5 text-xs text-amber-200 hover:bg-amber-900/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Bag ({player.potions})
            </button>
            <button
              type="button"
              disabled={!canAct}
              onClick={useStagger}
              className="font-medieval rounded border-2 border-amber-800 bg-amber-950/70 px-2 py-1.5 text-xs text-amber-200 hover:bg-amber-900/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Stagger
            </button>
            <button
              type="button"
              disabled={!canAct}
              onClick={useDodge}
              className="font-medieval rounded border-2 border-amber-800 bg-amber-950/70 px-2 py-1.5 text-xs text-amber-200 hover:bg-amber-900/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Dodge
            </button>
            <button
              type="button"
              disabled={!canAct}
              onClick={armWindUp}
              className={`font-medieval rounded border-2 px-2 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${
                windUpArmed
                  ? 'border-sky-400 bg-sky-900/70 text-sky-200'
                  : 'border-amber-800 bg-amber-950/70 text-amber-200 hover:bg-amber-900/70'
              }`}
            >
              {windUpArmed ? 'Winding Up...' : 'Wind Up'}
            </button>
          </div>
          <button
            type="button"
            onClick={retreat}
            className="font-medieval rounded border-2 border-red-900 bg-red-950/60 px-3 py-1.5 text-sm text-red-300 hover:bg-red-900/60"
          >
            Retreat
          </button>
        </div>

        <div className="flex items-center justify-center overflow-y-auto bg-[#1c140c] p-3">
          {currentQuestion && (
            <div className="w-full max-w-xl">
              <QuestionCard question={currentQuestion} answering={phase === 'question'} onAnswer={answerQuestion} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
