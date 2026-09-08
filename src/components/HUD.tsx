import { getAttackPower, getLevel, getMaxHp, xpIntoLevel } from '../game/player'
import { useGameStore } from '../store/gameStore'
import { PlayerAvatar } from './PlayerAvatar'

export function HUD({
  onOpenSheet,
  onOpenStudyDesk,
}: {
  onOpenSheet: () => void
  onOpenStudyDesk: () => void
}) {
  const player = useGameStore((s) => s.player)
  const unresolved = (player.mistakeLog ?? []).filter((m) => !m.resolvedAt).length
  const enterHub = useGameStore((s) => s.enterHub)
  const level = getLevel(player.xp)
  const maxHp = getMaxHp(player)
  const attack = getAttackPower(player)
  const { current, needed } = xpIntoLevel(player.xp)

  return (
    <div className="flex items-center justify-between border-b border-stone-800 bg-stone-950 px-4 py-3">
      <div className="flex items-center gap-4">
        <button type="button" onClick={enterHub} title="Back to hub">
          <PlayerAvatar size={40} />
        </button>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">Potions</p>
          <p className="text-lg font-bold text-emerald-300">{player.potions}</p>
        </div>
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
      <div className="flex items-center gap-2">
        {/* The frog's desk: every past mistake and how you're trending. */}
        <button
          type="button"
          data-tour="study-desk"
          onClick={onOpenStudyDesk}
          title="The Frog Wizard's Desk - past mistakes and progress"
          className="relative flex items-center gap-2 rounded border border-emerald-800 bg-emerald-950/40 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-900/50"
        >
          <img
            src="/sprites/ui/frog-wizard.png"
            alt=""
            className="h-7 w-7"
            style={{ imageRendering: 'pixelated' }}
          />
          Study
          {unresolved > 0 && (
            <span className="rounded-full bg-red-900 px-1.5 py-0.5 text-[10px] font-bold text-red-100">
              {unresolved}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onOpenSheet}
          className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-200 hover:bg-stone-800"
        >
          Character
        </button>
      </div>
    </div>
  )
}
