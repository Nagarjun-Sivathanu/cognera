import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getChapterConcept, type ConceptSection } from '../data/concepts'
import { BGM, playBgm, playSfx, SFX } from '../game/audio'
import { getCharacter, resolveAnim, type CharacterAnim } from '../game/characters'
import { getNpc } from '../game/npcs'
import { useGameStore } from '../store/gameStore'
import { MoleculeBuilder } from './MoleculeBuilder'
import { ShapeBuilder } from './ShapeBuilder'
import { NpcDialogue } from './NpcDialogue'
import { Sprite } from './Sprite'

const MIN_WORLD_WIDTH = 2400
const STATION_GAP = 300 // comfortably more than twice INTERACT_RANGE
const HALL_START = 420
const HALL_END = 480 // room past the last station for the frog
const RUN_SPEED = 4.2
const ROLL_SPEED = 9.5
const ROLL_MS = 420
const JUMP_VELOCITY = 15
const GRAVITY = 0.86
const INTERACT_RANGE = 110
const FLOOR_Y = 96 // px above the bottom of the world that everyone stands on

/** Where the player is in the air, and what their body should be doing about it. */
interface Motion {
  /** Height above the floor line, in px. */
  y: number
  anim: CharacterAnim
}

interface Station {
  section: ConceptSection
  x: number
  /** Researchers teach a lesson and gate the simulation; regulars only take questions. */
  kind: 'researcher' | 'regular'
}

export function LearnScreen() {
  const selectedChapter = useGameStore((s) => s.selectedChapter)
  const player = useGameStore((s) => s.player)
  const backToChapters = useGameStore((s) => s.backToChapters)
  const enterMap = useGameStore((s) => s.enterMap)

  const subject = useGameStore((s) => s.selectedSubjectName)
  const concept = selectedChapter ? getChapterConcept(subject, selectedChapter) : undefined

  const [x, setX] = useState(140)
  const [facing, setFacing] = useState<1 | -1>(1)
  const [motion, setMotion] = useState<Motion>({ y: 0, anim: 'idle' })
  const [talkingTo, setTalkingTo] = useState<Station | null>(null)
  const [visited, setVisited] = useState<Set<string>>(new Set())
  const [atFrog, setAtFrog] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const keys = useRef<Set<string>>(new Set())
  const frame = useRef<number>(0)
  // Physics state lives in refs: it changes every frame, and only the resulting
  // height and animation need to reach React.
  const height = useRef(0)
  const vy = useRef(0)
  const airborne = useRef(false)
  const rollUntil = useRef(0)
  const jumpQueued = useRef(false)
  const facingRef = useRef<1 | -1>(1)

  const character = getCharacter(player.characterId)

  const sections = useMemo(() => concept?.sections ?? [], [concept])
  const regulars = useMemo(() => concept?.regulars ?? [], [concept])

  /**
   * The townsfolk take the front of each pairing and the researchers stand behind
   * them, so walking the hall alternates stall, lesson, stall, lesson - you meet
   * someone who will answer anything before you meet the one who lectures.
   *
   * The hall is then made long enough to hold everyone at a fixed spacing, rather
   * than squeezing them into a fixed length, so no one is easy to run straight past.
   */
  const { stations, worldWidth } = useMemo(() => {
    const ordered: Omit<Station, 'x'>[] = []
    for (let i = 0; i < Math.max(sections.length, regulars.length); i += 1) {
      if (regulars[i]) ordered.push({ section: regulars[i], kind: 'regular' })
      if (sections[i]) ordered.push({ section: sections[i], kind: 'researcher' })
    }
    return {
      stations: ordered.map((entry, i): Station => ({ ...entry, x: HALL_START + i * STATION_GAP })),
      worldWidth: Math.max(MIN_WORLD_WIDTH, HALL_START + ordered.length * STATION_GAP + HALL_END),
    }
  }, [sections, regulars])

  // Close enough to the right-hand wall that walking to the end cannot overshoot him.
  const frogX = worldWidth - 150

  useEffect(() => {
    playBgm(BGM.combat)
  }, [])

  // Movement: held keys drive a rAF loop, so running, the jump arc and the roll all
  // advance on the same clock.
  useEffect(() => {
    if (talkingTo || simulating) return

    const HELD = ['arrowleft', 'arrowright', 'a', 'd', 'e', ' ', 'shift']

    function down(e: KeyboardEvent) {
      const key = e.key.toLowerCase()
      if (HELD.includes(key)) e.preventDefault()
      // A roll is a committed dash, so it fires on the press rather than being
      // re-triggered for every frame the key stays down.
      if (key === 'shift' && !keys.current.has('shift') && !airborne.current) {
        rollUntil.current = performance.now() + ROLL_MS
        playSfx(SFX.menuClick, 0.2)
      }
      // Queued on the press rather than read from the held set, so a quick tap
      // between two frames still jumps.
      if (key === ' ' && !keys.current.has(' ')) jumpQueued.current = true
      keys.current.add(key)
    }
    function up(e: KeyboardEvent) {
      keys.current.delete(e.key.toLowerCase())
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    function tick() {
      const k = keys.current
      const rolling = performance.now() < rollUntil.current

      let dx = 0
      if (k.has('arrowleft') || k.has('a')) dx -= 1
      if (k.has('arrowright') || k.has('d')) dx += 1

      if (dx !== 0) {
        facingRef.current = dx > 0 ? 1 : -1
        setFacing(facingRef.current)
      }
      // A roll carries you the way you were already facing, with or without input.
      const speed = rolling ? ROLL_SPEED * facingRef.current : dx * RUN_SPEED
      if (speed !== 0) setX((prev) => Math.max(60, Math.min(worldWidth - 60, prev + speed)))

      if (jumpQueued.current) {
        jumpQueued.current = false
        if (!airborne.current && !rolling) {
          airborne.current = true
          vy.current = JUMP_VELOCITY
        }
      }
      if (airborne.current) {
        height.current += vy.current
        vy.current -= GRAVITY
        if (height.current <= 0) {
          height.current = 0
          vy.current = 0
          airborne.current = false
        }
      }

      const anim: CharacterAnim = airborne.current
        ? vy.current > 0
          ? 'jumpUp'
          : 'jumpDown'
        : rolling
          ? 'roll'
          : dx !== 0
            ? 'run'
            : 'idle'

      setMotion((prev) =>
        prev.y === height.current && prev.anim === anim ? prev : { y: height.current, anim },
      )
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      cancelAnimationFrame(frame.current)
      keys.current.clear()
      jumpQueued.current = false
      airborne.current = false
      height.current = 0
      vy.current = 0
    }
    // The hall only changes length when the chapter does, so rebuilding the loop
    // on it costs nothing.
  }, [talkingTo, simulating, worldWidth])

  // Nearest station wins, so overlapping ranges are never ambiguous.
  const near = useMemo(() => {
    let best: Station | null = null
    let bestDistance = INTERACT_RANGE
    for (const station of stations) {
      const distance = Math.abs(station.x - x)
      if (distance < bestDistance) {
        best = station
        bestDistance = distance
      }
    }
    return best
  }, [stations, x])

  const nearFrog = Math.abs(frogX - x) < INTERACT_RANGE

  const interact = useCallback(() => {
    if (talkingTo || simulating) return
    if (near) {
      playSfx(SFX.menuClick)
      setTalkingTo(near)
    } else if (nearFrog) {
      playSfx(SFX.frogCroak, 0.5)
      setAtFrog(true)
    }
  }, [near, nearFrog, talkingTo, simulating])

  // E interacts, matching the on-screen prompt.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'e') interact()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [interact])

  if (!concept) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="font-medieval text-xl text-amber-200">No lesson written for this chapter yet</p>
        <p className="max-w-md text-sm text-stone-400">
          Learn Content currently covers General Organic Chemistry I. The others still go straight to the dungeon.
        </p>
        <button
          type="button"
          onClick={backToChapters}
          className="font-medieval rounded border-2 border-amber-700 bg-amber-950/80 px-5 py-2 text-sm text-amber-200 hover:bg-amber-900/80"
        >
          ← Back to chapters
        </button>
      </div>
    )
  }

  const body = resolveAnim(character, motion.anim)

  // Camera follows the player, clamped to the world edges.
  const viewport = typeof window !== 'undefined' ? window.innerWidth : 1280
  const camera = Math.max(0, Math.min(worldWidth - viewport, x - viewport / 2))
  const allVisited = visited.size >= sections.length

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden bg-[#070b14]">
      {/* Parallax sci-fi layers; further layers scroll slower. */}
      {[0, 1, 2, 3, 4, 5].map((layer) => (
        <div
          key={layer}
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(/sprites/backgrounds/scifi/${layer}.png)`,
            backgroundSize: 'auto 100%',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: `${-camera * (0.12 + layer * 0.14)}px bottom`,
            imageRendering: 'pixelated',
            opacity: layer === 0 ? 1 : 0.95,
          }}
        />
      ))}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#070b14]/70 via-transparent to-[#070b14]/80" />

      {/* Header */}
      <div className="relative z-20 flex items-start justify-between p-4">
        <div>
          <h2 className="font-medieval text-xl text-cyan-300 drop-shadow-[0_2px_6px_rgba(34,211,238,0.5)]">
            {concept.topic}
          </h2>
          <p className="max-w-xl text-xs text-stone-300 drop-shadow">{concept.intro}</p>
          <p data-tour="learn-progress" className="mt-1 text-[11px] text-cyan-400">
            Researchers heard: {visited.size}/{sections.length}
            {regulars.length > 0 && (
              <span className="text-stone-500"> · {regulars.length} townsfolk take questions, optional</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={backToChapters}
          className="font-medieval rounded border border-cyan-700 bg-slate-900/80 px-3 py-1.5 text-sm text-cyan-200 hover:bg-slate-800"
        >
          ← Chapters
        </button>
      </div>

      {/* The world itself, scrolled by the camera. */}
      <div
        className="absolute bottom-0 left-0 top-0 transition-transform duration-75"
        style={{ width: worldWidth, transform: `translateX(${-camera}px)` }}
      >
        {stations.map((station) => {
          const npc = getNpc(station.section.npc)
          if (!npc) return null
          const isNear = near?.section === station.section
          const done = station.kind === 'researcher' && visited.has(station.section.heading)
          const isRegular = station.kind === 'regular'
          return (
            <div key={station.section.heading} className="absolute" style={{ left: station.x, bottom: FLOOR_Y }}>
              <div className="relative -translate-x-1/2">
                {(isNear || done) && (
                  <div className="absolute -top-14 left-1/2 w-max -translate-x-1/2 text-center">
                    <p
                      className={`font-medieval text-xs ${
                        done ? 'text-emerald-400' : isRegular ? 'text-stone-300' : 'text-cyan-300'
                      }`}
                    >
                      {npc.name} {done && '✓'}
                    </p>
                    <p className="text-[10px] text-stone-400">{station.section.heading}</p>
                  </div>
                )}
                <Sprite
                  sheet={isNear ? npc.sheets.dialogue : npc.sheets.idle}
                  displayHeight={npc.displayHeight}
                  fps={7}
                  className={done ? 'brightness-90' : ''}
                />
                {isNear && (
                  <div
                    className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border bg-slate-900/90 px-2 py-1 text-[11px] ${
                      isRegular ? 'border-stone-500 text-stone-200' : 'border-cyan-500 text-cyan-200'
                    }`}
                  >
                    Press E to {isRegular ? 'ask' : 'talk'}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* The frog waits at the end of the atrium. */}
        <div className="absolute" style={{ left: frogX, bottom: FLOOR_Y }}>
          <div className="relative -translate-x-1/2 text-center">
            <img
              src="/sprites/ui/frog-wizard.png"
              alt="The Frog Wizard"
              className={`h-32 w-32 ${allVisited ? 'animate-frog-bounce' : 'opacity-60 grayscale'}`}
              style={{ imageRendering: 'pixelated' }}
            />
            {nearFrog && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-emerald-500 bg-slate-900/90 px-2 py-1 text-[11px] text-emerald-200">
                {allVisited ? 'Press E for the simulation' : `Talk to all ${sections.length} researchers first`}
              </div>
            )}
          </div>
        </div>

        {/* The player */}
        <div className="absolute" style={{ left: x, bottom: FLOOR_Y + motion.y }}>
          <div className="-translate-x-1/2">
            <Sprite
              sheet={body.sheet}
              displayHeight={character.displayHeight}
              fps={body.fps}
              playOnce={body.playOnce}
              flip={facing === -1}
            />
          </div>
        </div>

        {/* Floor line */}
        <div
          className="pointer-events-none absolute left-0 right-0 border-t-2 border-cyan-900/60"
          style={{ bottom: FLOOR_Y - 4 }}
        />
      </div>

      {/* Controls hint */}
      <div
        data-tour="learn-controls"
        className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs text-stone-300"
      >
        <span className="text-cyan-300">A / D</span> to run · <span className="text-cyan-300">Space</span> to jump ·{' '}
        <span className="text-cyan-300">Shift</span> to roll · <span className="text-cyan-300">E</span> to talk
      </div>

      {talkingTo && (
        <NpcDialogue
          section={talkingTo.section}
          onClose={() => {
            if (talkingTo.kind === 'researcher') {
              setVisited((v) => new Set(v).add(talkingTo.section.heading))
            }
            setTalkingTo(null)
          }}
        />
      )}

      {simulating && concept.simulation === 'molecule-builder' && (
        <MoleculeBuilder onClose={() => setSimulating(false)} />
      )}
      {simulating && concept.simulation === 'shape-builder' && (
        <ShapeBuilder onClose={() => setSimulating(false)} />
      )}

      {atFrog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-lg border-4 border-emerald-900 bg-slate-900 p-6 text-center">
            <img
              src="/sprites/ui/frog-wizard.png"
              alt=""
              className="mx-auto h-24 w-24"
              style={{ imageRendering: 'pixelated' }}
            />
            {allVisited ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-stone-200">{concept.simulationPitch}</p>
                {concept.simulation === 'molecule-builder' && (
                  <p className="mt-4 rounded border border-emerald-800 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                    Place atoms, bond them, and the bench names what you have built. Then reach for the reagent tray
                    and watch it turn into something else.
                  </p>
                )}
                {concept.simulation === 'shape-builder' && (
                  <p className="mt-4 rounded border border-emerald-800 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                    Type a function, drag the limits, and the region between them is filled in and measured as you
                    move. Then go and hit a specific number.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-stone-300">
                Not yet, Traveller. You've heard {visited.size} of {sections.length}. Go and talk to the rest — I'm
                not testing you on material you skipped.
              </p>
            )}
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setAtFrog(false)}
                className="font-medieval rounded border-2 border-slate-600 bg-slate-800 px-4 py-2 text-sm text-stone-200 hover:bg-slate-700"
              >
                Back
              </button>
              {allVisited && concept.simulation && (
                <button
                  type="button"
                  onClick={() => {
                    playSfx(SFX.menuClick)
                    setAtFrog(false)
                    setSimulating(true)
                  }}
                  className="font-medieval rounded border-2 border-cyan-600 bg-cyan-950/70 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-900/70"
                >
                  Open the bench →
                </button>
              )}
              {allVisited && (
                <button
                  type="button"
                  onClick={enterMap}
                  className="font-medieval rounded border-2 border-amber-700 bg-amber-950/80 px-4 py-2 text-sm text-amber-200 hover:bg-amber-900/80"
                >
                  To the dungeon →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
