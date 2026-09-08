import { useState } from 'react'
import { ChapterSelect } from './components/ChapterSelect'
import { CharacterSheet } from './components/CharacterSheet'
import { DungeonMap } from './components/DungeonMap'
import { FontSizeControl } from './components/FontSizeControl'
import { HUD } from './components/HUD'
import { HubScreen } from './components/HubScreen'
import { RunScreen } from './components/RunScreen'
import { SandboxSelect } from './components/SandboxSelect'
import { StudyDesk } from './components/StudyDesk'
import { SubjectSelect } from './components/SubjectSelect'
import { TitleScreen } from './components/TitleScreen'
import { useGameStore } from './store/gameStore'

function App() {
  const view = useGameStore((s) => s.view)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [studyDeskOpen, setStudyDeskOpen] = useState(false)

  if (view === 'title') {
    return (
      <>
        <TitleScreen />
        <FontSizeControl />
      </>
    )
  }

  if (view === 'hub') {
    return (
      <>
        <HubScreen />
        <FontSizeControl />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <HUD onOpenSheet={() => setSheetOpen(true)} onOpenStudyDesk={() => setStudyDeskOpen(true)} />
      {view === 'subjects' && <SubjectSelect />}
      {view === 'chapters' && <ChapterSelect />}
      {view === 'list' && <DungeonMap />}
      {view === 'sandbox' && <SandboxSelect />}
      {view === 'run' && <RunScreen />}
      {sheetOpen && <CharacterSheet onClose={() => setSheetOpen(false)} />}
      {studyDeskOpen && <StudyDesk onClose={() => setStudyDeskOpen(false)} />}
      <FontSizeControl />
    </div>
  )
}

export default App
