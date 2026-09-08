import { useEffect, useState } from 'react'
import { getActiveSkill, skillImpactMs, usableSkills } from '../game/activeSkills'
import { getBackground } from '../game/backgrounds'
import { animDurationMs, characters, getCharacter, type CharacterAnim } from '../game/characters'
import { FOCUS_MAX } from '../game/combat'
import { useGameStore } from '../store/gameStore'
import { EnemyCard } from './EnemyCard'
import { PlayerPanel } from './PlayerPanel'
import { Projectile } from './Projectile'
import { QuestionCard } from './QuestionCard'
import { ResultModal } from './ResultModal'
import { Sprite } from './Sprite'

const FEEDBACK_DELAY_MS = 1100
// A death animation is long and worth watching before the result screen appears.
const DEATH_DELAY_MS = 2200

// Zigzag offsets (bottom-aligned baseline, so only upward/positive values) so
// enemies don't sit in a flat line.
const STAGGER_OFFSETS = [0, 26, 8, 20, 4]

// Animations during which a ranged character actually looses a shot.
const ATTACK_ANIMS: CharacterAnim[] = ['attack', 'attack2', 'attack3', 'special']

const TONE_COLOR: Record<string, string> = {
  good: 'text-emerald-400',
  bad: 'text-red-400',
  neutral: 'text-stone-300',
}

const ACTION_BUTTON =
  'font-medieval rounded border-2 border-amber-800 bg-amber-950/70 px-2 py-1.5 text-xs text-amber-200 hover:bg-amber-900/70 disabled:cursor-not-allowed disabled:opacity-40'

function FocusBar({ focus }: { focus: number }) {
  const percent = (focus / FOCUS_MAX) * 100
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-medieval text-[11px] uppercase tracking-wide text-orange-400">Focus</span>
        <span className="text-[11px] text-stone-400">
          {focus}/{FOCUS_MAX}
        </span>
      </div>
      <div className="mt-0.5 h-2 overflow-hidden rounded border border-black/40 bg-stone-900/70">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function RunScreen() {
  const run = useGameStore((s) => s.run)
  const player = useGameStore((s) => s.player)
  const currentQuestion = useGameStore((s) => s.currentQuestion)
  const feedback = useGameStore((s) => s.feedback)
  const phase = useGameStore((s) => s.phase)
  const windUpArmed = useGameStore((s) => s.windUpArmed)
  const lastResult = useGameStore((s) => s.lastResult)
  const vfx = useGameStore((s) => s.vfx)
  const answerQuestion = useGameStore((s) => s.answerQuestion)
  const armWindUp = useGameStore((s) => s.armWindUp)
  const useBag = useGameStore((s) => s.useBag)
  const useDodge = useGameStore((s) => s.useDodge)
  const swapCharacter = useGameStore((s) => s.swapCharacter)
  const castSkill = useGameStore((s) => s.castSkill)
  const resolveSkill = useGameStore((s) => s.resolveSkill)
  const pendingSkill = useGameStore((s) => s.pendingSkill)
  const advance = useGameStore((s) => s.advance)
  const retreat = useGameStore((s) => s.retreat)
  const acknowledgeResult = useGameStore((s) => s.acknowledgeResult)
  const [skillMenuOpen, setSkillMenuOpen] = useState(false)
  const [swapMenuOpen, setSwapMenuOpen] = useState(false)

  const character = getCharacter(player.characterId)

  // A cast holds the turn open until its animation connects; only then does the hit
  // land, and only after that does the turn advance.
  useEffect(() => {
    if (phase !== 'feedback') return

    if (pendingSkill) {
      const skill = getActiveSkill(pendingSkill)
      const impact = skill ? skillImpactMs(character, skill) : 0
      const timer = setTimeout(() => resolveSkill(), impact)
      return () => clearTimeout(timer)
    }

    const delay = feedback?.anim === 'death' ? DEATH_DELAY_MS : FEEDBACK_DELAY_MS
    const timer = setTimeout(() => advance(), delay)
    return () => clearTimeout(timer)
  }, [phase, advance, feedback?.anim, pendingSkill, resolveSkill, character])

  if (!run) return null

  if (phase === 'result' && lastResult) {
    return <ResultModal result={lastResult} onContinue={acknowledgeResult} />
  }

  const dungeon = run.dungeon
  const encounter = run.encounters[run.encounterIndex]
  const activeEnemy = encounter[run.currentEnemyIndex]
  const backgroundId = dungeon.backgrounds[run.backgroundIndex % dungeon.backgrounds.length]
  const bg = getBackground(backgroundId)

  // The store tags each action with the animation it should play; outside feedback
  // the character just idles.
  const playerAnim: CharacterAnim = phase === 'feedback' ? (feedback?.anim ?? 'idle') : 'idle'
  const canAct = phase === 'question'
  const vfxSkill = vfx ? getActiveSkill(vfx.skillId) : undefined
  const vfxSheet = vfxSkill?.vfx
  const vfxHeight = vfxSkill?.vfxHeight ?? 130
  const knownSkills = usableSkills(player.characterId, player.unlockedActiveSkills)

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      {/* top: battlefield (takes remaining space) */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${bg.url})`,
            backgroundPosition: bg.position ?? 'center',
            backgroundSize: bg.size ?? 'cover',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
          }}
        />

        <div className="absolute left-3 top-2 z-10 text-stone-300">
          <p className="font-medieval text-sm text-amber-200 drop-shadow-md">{dungeon.name}</p>
          <p className="text-xs text-stone-300 drop-shadow-md">
            {run.mode === 'sandbox'
              ? `Wave ${run.wave + 1}`
              : `Encounter ${run.encounterIndex + 1}/${dungeon.encounterCount}`}{' '}
            · Enemy {run.currentEnemyIndex + 1}/{encounter.length}
          </p>
        </div>

        <div className="relative z-10 flex h-full items-end justify-between gap-4 px-6 pb-8">
          <PlayerPanel anim={playerAnim} charged={run.charged} />

          <div className="flex items-end gap-4 pr-4">
            {encounter.map((enemy, i) => (
              <div
                key={enemy.instanceId}
                className={i === run.currentEnemyIndex ? 'scale-110' : 'scale-90 opacity-50 grayscale'}
                style={{ marginBottom: STAGGER_OFFSETS[i % STAGGER_OFFSETS.length] }}
              >
                <EnemyCard
                  enemy={enemy}
                  hitFlash={feedback?.target === 'enemy' && i === run.currentEnemyIndex && feedback !== null}
                  stunned={run.enemyStunned && i === run.currentEnemyIndex}
                />
              </div>
            ))}
          </div>
        </div>

        {/* A ranged character's shot crossing to the enemy, so the arrow visibly
            connects rather than stopping at the bow. */}
        {character.projectile && phase === 'feedback' && ATTACK_ANIMS.includes(playerAnim) && (
          <Projectile
            key={`${feedback?.message}-${playerAnim}`}
            character={character}
            animMs={animDurationMs(character, playerAnim)}
          />
        )}

        {/* Overlay effects, laid out to mirror the combatants underneath them. Most of
            the Elementals skills have their effect baked into the caster's animation
            and so carry no overlay at all. */}
        {vfxSheet && (
          <div
            key={vfx!.key}
            className="pointer-events-none absolute inset-0 z-20 flex items-end justify-between gap-4 px-6 pb-8"
          >
            <div className="flex w-48 justify-center">
              {vfxSkill!.vfxTarget === 'player' && (
                <Sprite sheet={vfxSheet} displayHeight={vfxHeight} fps={16} playOnce />
              )}
            </div>
            <div className="flex items-end gap-4 pr-4">
              {encounter.map((enemy, i) => {
                const show =
                  vfxSkill!.vfxTarget === 'all-enemies' ||
                  (vfxSkill!.vfxTarget === 'enemy' && i === run.currentEnemyIndex)
                return (
                  <div
                    key={enemy.instanceId}
                    className="flex w-56 justify-center"
                    style={{ marginBottom: STAGGER_OFFSETS[i % STAGGER_OFFSETS.length] }}
                  >
                    {show && <Sprite sheet={vfxSheet} displayHeight={vfxHeight} fps={16} playOnce />}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* bottom: command panel + question panel, retro wood-frame style (kept compact) */}
      <div className="grid h-64 shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,2fr)] overflow-hidden border-t-4 border-amber-950 bg-[#241a10]">
        <div className="flex flex-col justify-between gap-1.5 overflow-y-auto border-r-4 border-amber-950 bg-[#2e2115] p-2">
          <div className="text-center">
            <p className="font-medieval text-[11px] uppercase tracking-wide text-amber-500">Target</p>
            <p className="font-medieval text-sm text-stone-100">{activeEnemy.name}</p>
            {feedback && <p className={`mt-0.5 text-xs font-bold ${TONE_COLOR[feedback.tone]}`}>{feedback.message}</p>}
          </div>

          <FocusBar focus={run.focus} />

          {swapMenuOpen ? (
            <div className="space-y-1">
              {characters
                .filter((c) => c.id !== player.characterId)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!canAct || run.swapCooldown > 0}
                    title={c.stats.role}
                    onClick={() => {
                      swapCharacter(c.id)
                      setSwapMenuOpen(false)
                    }}
                    className="font-medieval flex w-full items-center justify-between rounded border-2 border-amber-800 bg-amber-950/70 px-2 py-1 text-xs text-amber-200 hover:bg-amber-900/70 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] text-stone-400">
                      {c.stats.attack}x atk · {c.stats.hp}x hp
                    </span>
                  </button>
                ))}
              <button type="button" onClick={() => setSwapMenuOpen(false)} className={`${ACTION_BUTTON} w-full`}>
                Back
              </button>
            </div>
          ) : skillMenuOpen ? (
            <div className="space-y-1">
              {knownSkills.length === 0 && (
                <p className="text-center text-[11px] text-stone-500">
                  No {character.skillSchool} learned. Spend skill points in Character.
                </p>
              )}
              {knownSkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  disabled={!canAct || run.focus < skill.cost}
                  title={skill.description}
                  onClick={() => {
                    castSkill(skill.id)
                    setSkillMenuOpen(false)
                  }}
                  className="font-medieval flex w-full items-center justify-between rounded border-2 border-orange-800 bg-orange-950/60 px-2 py-1 text-xs text-orange-200 hover:bg-orange-900/60 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>{skill.name}</span>
                  <span className="text-[10px] text-amber-400">{skill.cost}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSkillMenuOpen(false)}
                className={`${ACTION_BUTTON} w-full`}
              >
                Back
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              <button type="button" disabled={!canAct || player.potions <= 0} onClick={useBag} className={ACTION_BUTTON}>
                Bag ({player.potions})
              </button>
              <button
                type="button"
                disabled={!canAct || run.swapCooldown > 0}
                onClick={() => setSwapMenuOpen(true)}
                className={ACTION_BUTTON}
                title="Change which character you're fighting as"
              >
                {run.swapCooldown > 0 ? `Swap (${run.swapCooldown})` : 'Swap'}
              </button>
              <button type="button" disabled={!canAct} onClick={useDodge} className={ACTION_BUTTON}>
                Dodge
              </button>
              <button
                type="button"
                disabled={!canAct}
                onClick={armWindUp}
                className={`font-medieval rounded border-2 px-2 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${
                  windUpArmed
                    ? 'border-sky-400 bg-sky-900/70 text-sky-200'
                    : 'border-amber-800 bg-amber-950/70 text-amber-200 hover:bg-amber-900/70'
                }`}
              >
                {windUpArmed ? 'Winding Up...' : 'Wind Up'}
              </button>
              <button
                type="button"
                disabled={!canAct}
                onClick={() => setSkillMenuOpen(true)}
                className="font-medieval col-span-2 rounded border-2 border-orange-700 bg-orange-950/60 px-2 py-1.5 text-xs text-orange-200 hover:bg-orange-900/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {character.skillSchool}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={retreat}
            className="font-medieval rounded border-2 border-red-900 bg-red-950/60 px-3 py-1.5 text-sm text-red-300 hover:bg-red-900/60"
          >
            Retreat
          </button>
        </div>

        <div className="flex items-center justify-center overflow-y-auto bg-[#1c140c] p-2">
          {currentQuestion && (
            <div className="h-full w-full">
              <QuestionCard question={currentQuestion} answering={phase === 'question'} onAnswer={answerQuestion} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
