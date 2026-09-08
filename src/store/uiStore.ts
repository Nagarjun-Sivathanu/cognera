import { create } from 'zustand'

const STORAGE_KEY = 'cognera-font-scale'
const MIN_SCALE = 0.8
const MAX_SCALE = 1.4
const STEP = 0.1
const DEFAULT_SCALE = 1

function loadScale(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? parseFloat(raw) : DEFAULT_SCALE
    return Number.isFinite(parsed) ? parsed : DEFAULT_SCALE
  } catch {
    return DEFAULT_SCALE
  }
}

function applyScale(scale: number) {
  document.documentElement.style.fontSize = `${scale * 100}%`
}

function persistScale(scale: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(scale))
  } catch {
    // localStorage unavailable - scale just won't survive a reload.
  }
}

interface UiStore {
  fontScale: number
  increaseFontSize: () => void
  decreaseFontSize: () => void
}

const initialScale = loadScale()
applyScale(initialScale)

export const useUiStore = create<UiStore>((set, get) => ({
  fontScale: initialScale,
  increaseFontSize: () => {
    const next = Math.min(MAX_SCALE, Math.round((get().fontScale + STEP) * 10) / 10)
    applyScale(next)
    persistScale(next)
    set({ fontScale: next })
  },
  decreaseFontSize: () => {
    const next = Math.max(MIN_SCALE, Math.round((get().fontScale - STEP) * 10) / 10)
    applyScale(next)
    persistScale(next)
    set({ fontScale: next })
  },
}))
