import { useState } from 'react'
import { CharacterSheet } from './components/CharacterSheet'
import { DungeonMap } from './components/DungeonMap'
import { HUD } from './components/HUD'
import { HubScreen } from './components/HubScreen'
import { RunScreen } from './components/RunScreen'
import { TitleScreen } from './components/TitleScreen'
import { useGameStore } from './store/gameStore'

function App() {
  const view = useGameStore((s) => s.view)
  const [sheetOpen, setSheetOpen] = useState(false)

  if (view === 'title') {
    return <TitleScreen />
  }

  if (view === 'hub') {
    return <HubScreen />
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <HUD onOpenSheet={() => setSheetOpen(true)} />
      {view === 'list' ? <DungeonMap /> : <RunScreen />}
      {sheetOpen && <CharacterSheet onClose={() => setSheetOpen(false)} />}
    </div>
  )
}

export default App
