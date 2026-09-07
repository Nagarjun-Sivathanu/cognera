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

export function RunScreen() {
  const run = useGameStore((s) => s.run)
  const currentQuestion = useGameStore((s) => s.currentQuestion)
  const feedback = useGameStore((s) => s.feedback)
  const phase = useGameStore((s) => s.phase)
  const lastResult = useGameStore((s) => s.lastResult)
  const answerQuestion = useGameStore((s) => s.answerQuestion)
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
  const backgroundId = dungeon.backgrounds[run.backgroundIndex % dungeon.backgrounds.length]
  const bg = getBackground(backgroundId)

  const playerAttacking = phase === 'feedback' && feedback?.target === 'enemy'
  const playerHurt = phase === 'feedback' && feedback?.target === 'player'

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] flex-col overflow-hidden" style={{ filter: bg.filter }}>
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg.base})`, imageRendering: 'pixelated' }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg.vignette})`, imageRendering: 'pixelated' }}
      />

      <div className="relative z-10 flex items-center justify-between px-6 py-3 text-stone-300">
        <div>
          <p className="text-sm font-semibold">{dungeon.name}</p>
          <p className="text-xs text-stone-400">
            Encounter {run.encounterIndex + 1}/{dungeon.encounterCount} · Enemy {run.currentEnemyIndex + 1}/{encounter.length}
          </p>
        </div>
        <button
          type="button"
          onClick={retreat}
          className="rounded border border-stone-600 bg-stone-900/70 px-3 py-1.5 text-sm text-stone-200 hover:bg-stone-800"
        >
          Flee Dungeon
        </button>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6">
        {/* battlefield: player vs enemy queue */}
        <div className="flex items-end gap-6">
          <PlayerPanel attacking={playerAttacking} hurt={playerHurt} />
          <div className="flex items-end gap-3">
            {encounter.map((enemy, i) => (
              <div key={enemy.instanceId} className={i === run.currentEnemyIndex ? 'scale-110' : 'opacity-50 grayscale'}>
                <EnemyCard enemy={enemy} hitFlash={feedback?.target === 'enemy' && i === run.currentEnemyIndex && feedback !== null} />
              </div>
            ))}
          </div>
        </div>

        {feedback && (
          <p className={`text-lg font-bold ${feedback.correct ? 'text-emerald-400' : 'text-red-400'}`}>
            {feedback.correct
              ? `Correct! Dealt ${feedback.damage} damage.${feedback.enemyDefeated ? ' Enemy defeated!' : ''}`
              : `Wrong! Took ${feedback.damage} damage.`}
          </p>
        )}

        {currentQuestion && (
          <div className="w-full max-w-xl">
            <QuestionCard question={currentQuestion} answering={phase === 'question'} onAnswer={answerQuestion} />
          </div>
        )}
      </div>
    </div>
  )
}
