import { emotionStyles, type FrogEmotion } from '../game/tutorial'

interface Props {
  emotion: FrogEmotion
  children: React.ReactNode
  /** Shown small above the bubble to mark a new section. */
  chapter?: string
}

/**
 * RPG-style speech bubble with the frog sitting on its top edge.
 *
 * Drawn in CSS rather than from an image so it grows with the text: hard black
 * outline, a lavender inner shelf along the bottom and a tan drop shadow, matching
 * the pixel-art bubble style, with a stepped tail built from squares.
 */
export function FrogChatBubble({ emotion, children, chapter }: Props) {
  const style = emotionStyles[emotion]

  return (
    <div className="relative w-full max-w-2xl">
      {chapter && (
        <p className="font-medieval mb-2 text-center text-sm uppercase tracking-[0.2em] text-amber-300 drop-shadow">
          {chapter}
        </p>
      )}

      {/* The frog perches on the top edge of the bubble. */}
      <img
        src="/sprites/ui/frog-wizard.png"
        alt="The Frog Wizard"
        className={`absolute -top-[94px] left-8 z-10 h-28 w-28 origin-bottom transition-transform duration-200 ${style.frog}`}
        style={{ imageRendering: 'pixelated' }}
      />

      <div
        className="relative border-[3px] border-black bg-white px-5 py-4"
        style={{
          // lavender shelf inside the bottom edge, tan slab under the whole bubble
          boxShadow: 'inset 0 -10px 0 0 #c7c7e8, 0 8px 0 0 #b08e6e, 0 8px 0 3px #000',
        }}
      >
        <p className={`relative z-10 text-base leading-relaxed ${style.text}`}>{children}</p>

        {/* Stepped pixel tail, bottom-right. Sits above the bubble's own drop shadow,
            and steps down-and-right the way the reference art does. */}
        <div className="absolute right-12 top-full z-20 -mt-[3px]">
          <div className="h-[9px] w-[30px] border-x-[3px] border-black bg-white" />
          <div className="ml-[8px] h-[9px] w-[22px] border-x-[3px] border-black bg-[#c7c7e8]" />
          <div className="ml-[16px] h-[9px] w-[14px] border-x-[3px] border-b-[3px] border-black bg-[#b08e6e]" />
        </div>
      </div>
    </div>
  )
}
