import { ICON_IS_RARITY_COLOURED, ICON_SHEET_COLS } from '../game/loot'
import { RARITY_TINT } from '../game/rarity'
import type { Item } from '../types'

const SHEET = '/sprites/ui/weapon-icons.png'
const CELL = 32
const SHEET_COLS = ICON_SHEET_COLS
const SHEET_ROWS = 14

/** One 32px cell of the icon sheet, scaled up and tinted by rarity where needed. */
export function ItemIcon({ item, size = 32 }: { item: Item; size?: number }) {
  const zoom = size / CELL
  const col = item.icon % SHEET_COLS
  const row = Math.floor(item.icon / SHEET_COLS)
  // Weapons and shields already come in rarity colours on the sheet; the single-colour
  // armour icons get the same CSS tint the character's equipment layers use.
  const filter = ICON_IS_RARITY_COLOURED[item.slot] ? undefined : RARITY_TINT[item.rarity]

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${SHEET})`,
        backgroundSize: `${SHEET_COLS * CELL * zoom}px ${SHEET_ROWS * CELL * zoom}px`,
        backgroundPosition: `-${col * CELL * zoom}px -${row * CELL * zoom}px`,
        imageRendering: 'pixelated',
        filter,
      }}
    />
  )
}
