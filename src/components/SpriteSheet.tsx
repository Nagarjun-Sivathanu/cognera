import { useEffect, useState } from 'react'
import type { SpriteSheetDef } from '../types'

interface Props {
  sheet: SpriteSheetDef
  fps?: number
  scale?: number
  flip?: boolean
  playOnce?: boolean
  onDone?: () => void
  className?: string
}

/** Animates one row of a fixed-frame-size sprite sheet via background-position stepping. */
export function SpriteSheet({ sheet, fps = 6, scale = 1.5, flip = false, playOnce = false, onDone, className }: Props) {
  const [frame, setFrame] = useState(0)
  const row = sheet.row ?? 0

  useEffect(() => {
    setFrame(0)
  }, [sheet.src, sheet.row])

  useEffect(() => {
    if (playOnce && frame >= sheet.frameCount - 1) return
    const interval = setInterval(
      () => {
        setFrame((f) => {
          const next = f + 1
          if (next >= sheet.frameCount) {
            if (playOnce) {
              onDone?.()
              return f
            }
            return 0
          }
          return next
        })
      },
      1000 / fps,
    )
    return () => clearInterval(interval)
  }, [frame, fps, playOnce, sheet.frameCount, onDone])

  const size = sheet.frameSize * scale

  return (
    <div className={className} style={{ width: size, height: size, overflow: 'hidden' }}>
      <div
        style={{
          width: sheet.frameSize,
          height: sheet.frameSize,
          backgroundImage: `url(${sheet.src})`,
          backgroundPosition: `-${frame * sheet.frameSize}px -${row * sheet.frameSize}px`,
          transform: `scale(${scale}) ${flip ? 'scaleX(-1)' : ''}`,
          transformOrigin: 'top left',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  )
}
