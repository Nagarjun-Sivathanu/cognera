import { getAttackPower, getMaxHp } from '../game/player'
import { useGameStore } from '../store/gameStore'
import type { SpriteSheetDef } from '../types'
import { SpriteSheet } from './SpriteSheet'

const IDLE_SHEET: SpriteSheetDef = { src: '/sprites/player/idle.png', frameSize: 128, frameCount: 4, row: 0 }
const ATTACK_SHEET: SpriteSheetDef = { src: '/sprites/player/attack.png', frameSize: 128, frameCount: 6, row: 0 }

interface Props {
  attacking: boolean
  hurt: boolean
  charged?: boolean
}

// No card/border around the player, per design: only enemies get boxed cards.
export function PlayerPanel({ attacking, hurt, charged }: Props) {
  const player = useGameStore((s) => s.player)
  const maxHp = getMaxHp(player)
  const hpPercent = Math.max(0, (player.currentHp / maxHp) * 100)

  return (
    <div className={`w-48 text-center transition ${hurt ? 'brightness-150' : ''}`}>
      <div
        className={`flex h-40 w-40 items-center justify-center overflow-hidden drop-shadow-[0_8px_14px_rgba(0,0,0,0.6)] ${hurt ? 'animate-pulse' : ''} ${
          charged ? 'drop-shadow-[0_0_16px_rgba(56,189,248,0.8)]' : ''
        }`}
      >
        <SpriteSheet
          sheet={attacking ? ATTACK_SHEET : IDLE_SHEET}
          fps={attacking ? 12 : 6}
          playOnce={attacking}
          scale={4.5}
          className="shrink-0"
        />
      </div>
      <p className="font-medieval text-lg text-stone-100 drop-shadow-md">{player.name}</p>
      <p className="text-xs text-amber-300 drop-shadow-md">
        Attack {getAttackPower(player)}
        {charged && <span className="ml-1 text-sky-300">(Charged!)</span>}
      </p>
      <div className="mx-auto mt-2 h-2 w-36 overflow-hidden rounded border border-black/40 bg-stone-900/70">
        <div className="h-full bg-sky-500 transition-all" style={{ width: `${hpPercent}%` }} />
      </div>
      <p className="mt-1 text-xs text-stone-200 drop-shadow-md">
        {player.currentHp}/{maxHp} HP
      </p>
    </div>
  )
}
