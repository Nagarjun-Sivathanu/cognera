// Crops the head/shoulders region out of the player's idle sprite frame (row 0, col 0)
// to fake a portrait, since the asset pack has no dedicated head icon.
// Measured directly from the sprite: the character occupies roughly (54,50)-(73,80)
// in the 128px frame, so a 24x24 window at (51,46) frames the head with a hint of shoulder.
const SHEET_SIZE = 512 // full idle.png sheet is 512x512 (4x4 grid of 128px frames)
const CROP_X = 51
const CROP_Y = 46
const CROP_SIZE = 24

export function PlayerAvatar({ size = 56 }: { size?: number }) {
  const zoom = size / CROP_SIZE

  return (
    <div
      className="shrink-0 overflow-hidden rounded-full border-2 border-amber-700 bg-stone-900 shadow-md"
      style={{
        width: size,
        height: size,
        backgroundImage: 'url(/sprites/player/idle.png)',
        backgroundSize: `${SHEET_SIZE * zoom}px ${SHEET_SIZE * zoom}px`,
        backgroundPosition: `-${CROP_X * zoom}px -${CROP_Y * zoom}px`,
        imageRendering: 'pixelated',
      }}
    />
  )
}
