import { useEffect, useState } from 'react'
import type { ContentBox, SpriteSheetDef } from '../types'

/**
 * Drives the frame counter for a sprite animation. Split out from the renderer so
 * several stacked layers (character + equipment) can share one frame index.
 */
export function useSpriteFrame({
  frameCount,
  fps = 6,
  playOnce = false,
  onDone,
  resetKey,
}: {
  frameCount: number
  fps?: number
  playOnce?: boolean
  onDone?: () => void
  resetKey?: string
}): number {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    setFrame(0)
  }, [resetKey])

  useEffect(() => {
    if (playOnce && frame >= frameCount - 1) return
    const interval = setInterval(() => {
      setFrame((f) => {
        const next = f + 1
        if (next >= frameCount) {
          if (playOnce) {
            onDone?.()
            return f
          }
          return 0
        }
        return next
      })
    }, 1000 / fps)
    return () => clearInterval(interval)
  }, [frame, fps, playOnce, frameCount, onDone])

  return frame
}

function contentOf(sheet: SpriteSheetDef): ContentBox {
  return sheet.content ?? { x: 0, y: 0, w: sheet.frameWidth, h: sheet.frameHeight }
}

/**
 * One image layer, cropped and scaled so the sheet's content box exactly fills the
 * parent. The frame is drawn at natural size then transformed, so no knowledge of
 * the sheet's overall dimensions is needed.
 */
function Layer({
  src,
  sheet,
  frame,
  scale,
  filter,
}: {
  src: string
  sheet: SpriteSheetDef
  frame: number
  scale: number
  filter?: string
}) {
  const content = contentOf(sheet)
  // Animations that wrap across rows advance row-major through the sheet.
  const columns = sheet.columns ?? sheet.frameCount
  const col = frame % columns
  const row = (sheet.row ?? 0) + Math.floor(frame / columns)

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: sheet.frameWidth,
        height: sheet.frameHeight,
        backgroundImage: `url(${src})`,
        backgroundPosition: `-${col * sheet.frameWidth}px -${row * sheet.frameHeight}px`,
        // Scale about the top-left, then shift the content box's corner to (0,0).
        transform: `translate(${-content.x * scale}px, ${-content.y * scale}px) scale(${scale})`,
        transformOrigin: 'top left',
        imageRendering: 'pixelated',
        // The layer's box is the whole frame, which is much larger than the visible
        // sprite and deliberately overflows its parent - it must never eat clicks.
        pointerEvents: 'none',
        filter,
      }}
    />
  )
}

export interface SpriteLayer {
  src: string
  filter?: string // CSS filter, used to tint equipment by rarity
}

interface SpriteProps {
  sheet: SpriteSheetDef
  /** Rendered height of the sprite's content box in px; width follows its aspect. */
  displayHeight: number
  /** Extra layers drawn over the base sheet, sharing its frame geometry. */
  layers?: SpriteLayer[]
  fps?: number
  flip?: boolean
  playOnce?: boolean
  onDone?: () => void
  className?: string
}

/**
 * Renders a sprite sized and aligned by its content box: the element's box *is* the
 * drawn pixels, so callers can align sprites of wildly different source resolutions
 * on a shared baseline just by bottom-aligning them.
 *
 * The box is an anchor, not a crop - pixels may deliberately overflow it (a sword
 * swing, an impact effect), and animations of the same character share one box so
 * the character doesn't jump or resize when it switches animation.
 */
export function Sprite({
  sheet,
  displayHeight,
  layers,
  fps = 6,
  flip = false,
  playOnce = false,
  onDone,
  className,
}: SpriteProps) {
  const frame = useSpriteFrame({
    frameCount: sheet.frameCount,
    fps,
    playOnce,
    onDone,
    resetKey: `${sheet.src}:${sheet.row ?? 0}`,
  })

  const content = contentOf(sheet)
  const scale = displayHeight / content.h

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: content.w * scale,
        height: content.h * scale,
        transform: flip ? 'scaleX(-1)' : undefined,
        flexShrink: 0,
      }}
    >
      <Layer src={sheet.src} sheet={sheet} frame={frame} scale={scale} />
      {layers?.map((layer) => (
        <Layer key={layer.src} src={layer.src} sheet={sheet} frame={frame} scale={scale} filter={layer.filter} />
      ))}
    </div>
  )
}
