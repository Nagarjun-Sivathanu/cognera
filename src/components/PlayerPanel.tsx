import { getAttackPower, getMaxHp } from '../game/player'
import { useGameStore } from '../store/gameStore'
import type { SpriteSheetDef } from '../types'
import { SpriteSheet } from './SpriteSheet'

const IDLE_SHEET: SpriteSheetDef = { src: '/sprites/player/idle.png', frameSize: 128, frameCount: 4, row: 0 }
const ATTACK_SHEET: SpriteSheetDef = { src: '/sprites/player/attack.png', frameSize: 128, frameCount: 6, row: 0 }

export function PlayerPanel({ attacking, hurt }: { attacking: boolean; hurt: boolean }) {
  const player = useGameStore((s) => s.player)
  const maxHp = getMaxHp(player)
  const hpPercent = Math.max(0, (player.currentHp / maxHp) * 100)

  return (
    <div
      className={`w-40 rounded-lg border-4 p-3 text-center shadow-lg transition ${hurt ? 'border-red-400 brightness-150' : 'border-sky-800'}`}
      style={{ background: 'radial-gradient(circle at 50% 35%, #263041 0%, #17202c 55%, #0b0f16 100%)' }}
    >
      <div className="flex justify-center">
        <SpriteSheet sheet={attacking ? ATTACK_SHEET : IDLE_SHEET} fps={attacking ? 12 : 6} playOnce={attacking} />
      </div>
      <p className="mt-2 text-sm font-semibold text-stone-100">You</p>
      <p className="text-xs text-stone-400">Attack {getAttackPower(player)}</p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded bg-stone-800">
        <div className="h-full bg-sky-500 transition-all" style={{ width: `${hpPercent}%` }} />
      </div>
      <p className="mt-1 text-xs text-stone-400">
        {player.currentHp}/{maxHp} HP
      </p>
    </div>
  )
}
