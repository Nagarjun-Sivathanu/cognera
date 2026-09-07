import type { EnemyInstance } from '../types'
import { SpriteSheet } from './SpriteSheet'

interface Props {
  enemy: EnemyInstance
  hitFlash: boolean
  stunned?: boolean
}

export function EnemyCard({ enemy, hitFlash, stunned }: Props) {
  const hpPercent = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100)

  return (
    <div
      className={`relative flex w-56 flex-col items-center rounded-lg border-4 p-2.5 text-center shadow-lg transition ${
        hitFlash ? 'border-red-400 brightness-150' : stunned ? 'border-sky-400' : 'border-red-800'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 35%, #3a3a3a 0%, #262626 55%, #141414 100%)',
      }}
    >
      {stunned && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded bg-sky-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sky-200">
          Stunned
        </span>
      )}
      <div className="flex h-[132px] w-[132px] items-center justify-center overflow-hidden">
        <SpriteSheet
          sheet={enemy.sprite}
          flip={enemy.flip}
          fps={enemy.sprite.frameCount > 10 ? 14 : 6}
          scale={4}
          className="shrink-0"
        />
      </div>
      <p className="font-medieval mt-2 truncate text-sm text-stone-100">{enemy.name}</p>
      <p className="text-xs text-stone-400">Difficulty {enemy.difficulty}</p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded bg-stone-800">
        <div className="h-full bg-red-500 transition-all" style={{ width: `${hpPercent}%` }} />
      </div>
      <p className="mt-1 text-xs text-stone-400">
        {enemy.currentHp}/{enemy.maxHp} HP
      </p>
    </div>
  )
}
