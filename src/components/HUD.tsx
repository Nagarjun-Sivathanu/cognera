import { getAttackPower, getLevel, getMaxHp, xpIntoLevel } from '../game/player'
import { useGameStore } from '../store/gameStore'

export function HUD({ onOpenSheet }: { onOpenSheet: () => void }) {
  const player = useGameStore((s) => s.player)
  const level = getLevel(player.xp)
  const maxHp = getMaxHp(player)
  const attack = getAttackPower(player)
  const { current, needed } = xpIntoLevel(player.xp)

  return (
    <div className="flex items-center justify-between border-b border-stone-800 bg-stone-950 px-4 py-3">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">Level</p>
          <p className="text-lg font-bold text-stone-100">{level}</p>
        </div>
        <div className="w-32">
          <p className="text-xs uppercase tracking-wide text-stone-500">
            XP {current}/{needed}
          </p>
          <div className="mt-1 h-2 w-full overflow-hidden rounded bg-stone-800">
            <div className="h-full bg-sky-500" style={{ width: `${(current / needed) * 100}%` }} />
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">HP</p>
          <p className="text-lg font-bold text-red-400">
            {player.currentHp}/{maxHp}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">Attack</p>
          <p className="text-lg font-bold text-orange-400">{attack}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">Skill Pts</p>
          <p className="text-lg font-bold text-emerald-400">{player.skillPoints}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenSheet}
        className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-200 hover:bg-stone-800"
      >
        Character
      </button>
    </div>
  )
}
