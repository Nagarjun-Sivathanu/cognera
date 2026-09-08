import { useEffect, useState } from 'react'
import { playSfx, SFX } from '../game/audio'
import { currentTourStep, tourSteps } from '../game/tour'
import { emotionStyles } from '../game/tutorial'
import { useGameStore } from '../store/gameStore'

const PAD = 8 // breathing room around the spotlit element

/** Tracks a `data-tour` element's position on screen, following layout changes. */
function useTargetRect(target: string | undefined): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!target) {
      setRect(null)
      return
    }
    function measure() {
      const el = document.querySelector(`[data-tour="${target}"]`)
      setRect(el ? el.getBoundingClientRect() : null)
    }
    measure()
    // Cheap poll: the battle screen animates constantly and elements move between
    // steps, and this is far simpler than observing every ancestor for changes.
    const timer = setInterval(measure, 200)
    window.addEventListener('resize', measure)
    return () => {
      clearInterval(timer)
      window.removeEventListener('resize', measure)
    }
  }, [target])

  return rect
}

/** Desaturating dimmer, drawn as four panels so the spotlit element stays untouched. */
function Backdrop({ rect }: { rect: DOMRect | null }) {
  const dim = 'fixed backdrop-grayscale backdrop-brightness-[0.35] transition-all duration-200'

  if (!rect) return <div className={`${dim} inset-0`} />

  const top = Math.max(0, rect.top - PAD)
  const left = Math.max(0, rect.left - PAD)
  const right = Math.min(window.innerWidth, rect.right + PAD)
  const bottom = Math.min(window.innerHeight, rect.bottom + PAD)

  return (
    <>
      <div className={dim} style={{ left: 0, top: 0, width: '100%', height: top }} />
      <div className={dim} style={{ left: 0, top: bottom, width: '100%', bottom: 0 }} />
      <div className={dim} style={{ left: 0, top, width: left, height: bottom - top }} />
      <div className={dim} style={{ left: right, top, right: 0, height: bottom - top }} />
      {/* Ring around the live element, so it reads as deliberately highlighted. */}
      <div
        className="pointer-events-none fixed rounded border-2 border-amber-300 transition-all duration-200"
        style={{
          left,
          top,
          width: right - left,
          height: bottom - top,
          boxShadow: '0 0 0 2px rgba(0,0,0,0.6), 0 0 18px 4px rgba(252,211,77,0.45)',
        }}
      />
    </>
  )
}

/**
 * First-run walkthrough: dims and desaturates everything except the element being
 * explained, and follows the player from screen to screen as they go.
 */
export function GuidedTour() {
  const view = useGameStore((s) => s.view)
  const tourIndex = useGameStore((s) => s.tourIndex)
  const advanceTour = useGameStore((s) => s.advanceTour)
  const endTour = useGameStore((s) => s.endTour)

  const resolved = tourIndex === null ? null : currentTourStep(tourIndex, view)
  const step = resolved?.step
  const rect = useTargetRect(step?.target)

  // Croak whenever the frog says something new.
  useEffect(() => {
    if (step) playSfx(SFX.frogCroak, 0.4)
  }, [step?.id])

  // The player navigated past this step's screen - catch the tour up.
  useEffect(() => {
    if (tourIndex === null || !resolved) return
    if (resolved.index !== tourIndex) advanceTour(resolved.index)
  }, [resolved?.index, tourIndex, advanceTour, resolved])

  if (tourIndex === null || !step) return null

  const emotion = emotionStyles[step.emotion]
  const isLast = resolved!.index === tourSteps.length - 1

  // Sit the bubble opposite the highlight so it never covers what it's describing.
  const below = !rect || rect.bottom < window.innerHeight * 0.55
  const bubbleStyle: React.CSSProperties = rect
    ? below
      ? { top: Math.min(rect.bottom + 90, window.innerHeight - 220) }
      : { bottom: Math.min(window.innerHeight - rect.top + 30, window.innerHeight - 220) }
    : { top: '50%' }

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      <Backdrop rect={rect} />

      <div className="pointer-events-auto absolute inset-x-0 flex justify-center px-4" style={bubbleStyle}>
        <div className="relative w-full max-w-xl">
          <img
            src="/sprites/ui/frog-wizard.png"
            alt="The Frog Wizard"
            className={`absolute -top-[82px] left-6 z-10 h-24 w-24 origin-bottom ${emotion.frog}`}
            style={{ imageRendering: 'pixelated' }}
          />

          <div
            className="relative border-[3px] border-black bg-white px-5 py-4"
            style={{ boxShadow: 'inset 0 -10px 0 0 #c7c7e8, 0 8px 0 0 #b08e6e, 0 8px 0 3px #000' }}
          >
            <p className={`text-[15px] leading-relaxed ${emotion.text}`}>{step.text}</p>

            <div className="mt-3 flex items-center justify-between gap-3 border-t-2 border-stone-200 pt-2.5">
              <button
                type="button"
                onClick={endTour}
                className="text-[11px] uppercase tracking-wide text-stone-500 hover:text-stone-800"
              >
                Skip tutorial
              </button>

              {step.waitForAction ? (
                <span className="font-medieval animate-pulse text-xs text-amber-700">{step.waitForAction}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => (isLast ? endTour() : advanceTour(resolved!.index + 1))}
                  className="font-medieval rounded border-2 border-amber-800 bg-amber-100 px-4 py-1 text-sm text-amber-900 hover:bg-amber-200"
                >
                  {isLast ? 'Got it' : 'Next →'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
