import type { EnemyInstance } from '../types'

export function EnemyCard({ enemy, hitFlash }: { enemy: EnemyInstance; hitFlash: boolean }) {
  const hpPercent = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100)

  return (
    <div
      className={`relative w-48 rounded-lg border-4 p-3 text-center shadow-lg transition ${
        hitFlash ? 'border-red-400' : 'border-red-800'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 35%, #3a3a3a 0%, #262626 55%, #141414 100%)',
      }}
    >
      <div className="text-5xl leading-none">{enemy.sprite}</div>
      <p className="mt-2 truncate text-sm font-semibold text-stone-100">{enemy.name}</p>
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
