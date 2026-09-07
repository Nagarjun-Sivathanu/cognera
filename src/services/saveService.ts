import type { PlayerState } from '../types'

export interface SaveData {
  player: PlayerState
}

export interface SaveService {
  load(): SaveData | null
  save(data: SaveData): void
  reset(): void
}

const STORAGE_KEY = 'cp0-save-v1'

// LocalStorage-backed for the hackathon MVP. Swap this implementation for one
// backed by a real account/database later; nothing outside this file needs to change.
export const localSaveService: SaveService = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as SaveData
    } catch {
      return null
    }
  },
  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },
  reset() {
    localStorage.removeItem(STORAGE_KEY)
  },
}
