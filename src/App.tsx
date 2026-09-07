import { useState } from 'react'
import { CharacterSheet } from './components/CharacterSheet'
import { DungeonList } from './components/DungeonList'
import { HUD } from './components/HUD'
import { RunScreen } from './components/RunScreen'
import { useGameStore } from './store/gameStore'

function App() {
  const view = useGameStore((s) => s.view)
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <HUD onOpenSheet={() => setSheetOpen(true)} />
      {view === 'list' ? <DungeonList /> : <RunScreen />}
      {sheetOpen && <CharacterSheet onClose={() => setSheetOpen(false)} />}
    </div>
  )
}

export default App
