import { useEffect, useState } from 'react'
import type { CharacterDef } from '../game/characters'
import { Sprite } from './Sprite'

type Stage = 'waiting' | 'flying' | 'impact' | 'done'

interface Props {
  character: CharacterDef
  /** Length of the attack animation, so the shot is released on the right frame. */
  animMs: number
  /** How long the projectile takes to cross the battlefield. */
  flightMs?: number
}

/**
 * Flies a ranged character's projectile from the player across to the enemy, then
 * plays its impact. Purely visual - the damage timing lives in the store - but it's
 * what makes a bow shot read as actually reaching the target.
 */
export function Projectile({ character, animMs, flightMs = 320 }: Props) {
  const [stage, setStage] = useState<Stage>('waiting')
  const projectile = character.projectile

  useEffect(() => {
    if (!projectile) return
    const timers = [
      setTimeout(() => setStage('flying'), animMs * projectile.releaseAt),
      setTimeout(() => setStage('impact'), animMs * projectile.releaseAt + flightMs),
      setTimeout(() => setStage('done'), animMs * projectile.releaseAt + flightMs + 400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [projectile, animMs, flightMs])

  if (!projectile || stage === 'waiting' || stage === 'done') return null

  if (stage === 'impact') {
    return (
      <div className="pointer-events-none absolute bottom-[38%] right-[16%] z-20">
        <Sprite sheet={projectile.impact} displayHeight={projectile.impactHeight} fps={14} playOnce />
      </div>
    )
  }

  return (
    <div
      className="pointer-events-none absolute bottom-[40%] z-20"
      style={{
        left: '12%',
        animation: `arrow-flight ${flightMs}ms linear forwards`,
      }}
    >
      <Sprite sheet={projectile.flight} displayHeight={projectile.height} fps={1} />
    </div>
  )
}
