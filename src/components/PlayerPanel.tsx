import { getCharacter, resolveAnim, type CharacterAnim } from '../game/characters'
import { getAttackPower, getMaxHp } from '../game/player'
import { ATTACK_FX_LAYER, equipmentLayers } from '../game/playerSprite'
import { useGameStore } from '../store/gameStore'
import { Sprite } from './Sprite'

interface Props {
  anim: CharacterAnim
  charged?: boolean
}

// No card/border around the player, per design: only enemies get boxed cards.
export function PlayerPanel({ anim, charged }: Props) {
  const player = useGameStore((s) => s.player)
  const maxHp = getMaxHp(player)
  const hpPercent = Math.max(0, (player.currentHp / maxHp) * 100)

  const character = getCharacter(player.characterId)
  const resolved = resolveAnim(character, anim)
  const hurt = anim === 'hurt' || anim === 'death'

  // The armour layers are drawn to match the original hero's frames only; the
  // Elementals characters wear their own art.
  let layers = character.wearsEquipment
    ? equipmentLayers(player.equipped, resolved.anim === 'attack' ? 'attack' : 'idle')
    : []
  if (character.wearsEquipment && resolved.anim === 'attack') layers = [...layers, ATTACK_FX_LAYER]

  return (
    <div className={`flex w-48 flex-col items-center text-center transition ${hurt ? 'brightness-150' : ''}`}>
      <Sprite
        // Remounting per animation restarts one-shots (two hits in a row must both play).
        key={resolved.anim}
        sheet={resolved.sheet}
        displayHeight={character.displayHeight}
        layers={layers}
        fps={resolved.fps}
        playOnce={resolved.playOnce}
        className={`drop-shadow-[0_8px_14px_rgba(0,0,0,0.6)] ${hurt ? 'animate-pulse' : ''} ${
          charged ? 'drop-shadow-[0_0_16px_rgba(56,189,248,0.8)]' : ''
        }`}
      />
      <p className="font-medieval mt-1 text-lg text-stone-100 drop-shadow-md">{player.name}</p>
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
