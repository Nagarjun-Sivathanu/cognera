import { useUiStore } from '../store/uiStore'

// Fixed-position overlay so it's reachable from every screen (title/hub included).
export function FontSizeControl() {
  const fontScale = useUiStore((s) => s.fontScale)
  const decreaseFontSize = useUiStore((s) => s.decreaseFontSize)
  const increaseFontSize = useUiStore((s) => s.increaseFontSize)

  return (
    <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1 rounded-full border border-stone-700 bg-stone-950/90 px-2 py-1.5 shadow-lg">
      <button
        type="button"
        onClick={decreaseFontSize}
        title="Decrease text size"
        className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-stone-200 hover:bg-stone-800"
      >
        A-
      </button>
      <span className="w-9 text-center text-xs text-stone-400">{Math.round(fontScale * 100)}%</span>
      <button
        type="button"
        onClick={increaseFontSize}
        title="Increase text size"
        className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-stone-200 hover:bg-stone-800"
      >
        A+
      </button>
    </div>
  )
}
