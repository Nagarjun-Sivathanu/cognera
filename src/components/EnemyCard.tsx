import type { EnemyInstance } from '../types'
import { Sprite } from './Sprite'

interface Props {
  enemy: EnemyInstance
  hitFlash: boolean
  stunned?: boolean
}

// No card/border, matching the player's look: just sprite + name + HP bar.
export function EnemyCard({ enemy, hitFlash, stunned }: Props) {
  const hpPercent = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100)

  return (
    <div className={`flex w-56 flex-col items-center text-center transition ${hitFlash ? 'brightness-150' : ''}`}>
      {stunned && (
        <span className="rounded bg-sky-900/90 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sky-200">
          Stunned
        </span>
      )}
      <Sprite
        sheet={enemy.sprite}
        displayHeight={enemy.displayHeight}
        flip={enemy.flip}
        fps={6}
        className={`drop-shadow-[0_8px_14px_rgba(0,0,0,0.6)] ${
          stunned ? 'drop-shadow-[0_0_16px_rgba(56,189,248,0.8)]' : ''
        } ${hitFlash ? 'animate-pulse' : ''}`}
      />
      <p className="font-medieval mt-1 text-sm text-stone-100 drop-shadow-md">{enemy.name}</p>
      <p className="text-xs text-stone-300 drop-shadow-md">Difficulty {enemy.difficulty}</p>
      <div className="mt-2 h-2 w-40 overflow-hidden rounded border border-black/40 bg-stone-900/70">
        <div className="h-full bg-red-500 transition-all" style={{ width: `${hpPercent}%` }} />
      </div>
      <p className="mt-1 text-xs text-stone-200 drop-shadow-md">
        {enemy.currentHp}/{enemy.maxHp} HP
      </p>
    </div>
  )
}
