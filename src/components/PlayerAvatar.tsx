import { getCharacter } from '../game/characters'
import { useGameStore } from '../store/gameStore'
import { Sprite } from './Sprite'

/**
 * Portrait built by cropping the head out of the character's idle sprite - none of
 * the packs ship a dedicated portrait. The wrapper clips the rest of the body,
 * since Sprite deliberately lets art overflow its anchor box.
 */
export function PlayerAvatar({ size = 56, characterId }: { size?: number; characterId?: string }) {
  const playerCharacterId = useGameStore((s) => s.player.characterId)
  const character = getCharacter(characterId ?? playerCharacterId)
  const idle = character.sheets.idle!

  return (
    <div
      className="shrink-0 overflow-hidden rounded-full border-2 border-amber-700 bg-stone-900 shadow-md"
      style={{ width: size, height: size }}
    >
      <Sprite
        sheet={{ ...idle, frameCount: 1, content: character.avatarCrop }}
        displayHeight={size}
        fps={1}
      />
    </div>
  )
}
