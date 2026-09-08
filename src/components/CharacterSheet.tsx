import { useState } from 'react'
import { activeSkills } from '../game/activeSkills'
import { characters, getCharacter, resolveAnim, type CharacterAnim } from '../game/characters'
import { SLOT_LABEL } from '../game/loot'
import { getAttackPower, getLevel, getMaxHp, skills, xpIntoLevel } from '../game/player'
import { equipmentLayers } from '../game/playerSprite'
import { RARITY_BORDER, RARITY_GLOW, RARITY_TEXT } from '../game/rarity'
import { useGameStore } from '../store/gameStore'
import type { Item, ItemSlot } from '../types'
import { ItemIcon } from './ItemIcon'
import { Sprite } from './Sprite'

type Tab = 'gear' | 'hero' | 'skills' | 'stats'

const INVENTORY_CELLS = 30

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-md border-2 border-amber-950 bg-[#2e2115] shadow-inner ${className}`}>{children}</div>
  )
}

function ItemTooltip({ item }: { item: Item }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-44 -translate-x-1/2 rounded border border-stone-700 bg-stone-950 p-2 text-left shadow-xl">
      <p className={`font-medieval text-sm ${RARITY_TEXT[item.rarity]}`}>{item.name}</p>
      <p className="text-[11px] uppercase tracking-wide text-stone-500">{SLOT_LABEL[item.slot]}</p>
      <p className="mt-1 text-xs text-emerald-300">
        +{item.value} {item.stat === 'hp' ? 'Max HP' : 'Attack'}
      </p>
    </div>
  )
}

function ItemCell({
  item,
  onClick,
  placeholder,
}: {
  item?: Item
  onClick?: () => void
  placeholder?: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!item}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`flex h-12 w-12 items-center justify-center rounded border-2 bg-[#1c140c] transition ${
          item
            ? `${RARITY_BORDER[item.rarity]} ${RARITY_GLOW[item.rarity]} hover:brightness-125`
            : 'border-amber-950/70'
        }`}
      >
        {item ? (
          <ItemIcon item={item} size={38} />
        ) : (
          <span className="text-[9px] uppercase tracking-wide text-stone-600">{placeholder}</span>
        )}
      </button>
      {item && hovered && <ItemTooltip item={item} />}
    </div>
  )
}

/** The player's current character, idling in whatever gear it can actually wear. */
function PaperDoll({ height = 150 }: { height?: number }) {
  const player = useGameStore((s) => s.player)
  const character = getCharacter(player.characterId)
  const idle = resolveAnim(character, 'idle')

  return (
    <Sprite
      sheet={idle.sheet}
      displayHeight={height}
      layers={character.wearsEquipment ? equipmentLayers(player.equipped, 'idle') : []}
      fps={idle.fps}
    />
  )
}

/** Cycles a character through its animations so the picker shows what it can do. */
function CharacterPreview({ characterId, height }: { characterId: string; height: number }) {
  const character = getCharacter(characterId)
  const [anim, setAnim] = useState<CharacterAnim>('idle')
  const resolved = resolveAnim(character, anim)
  const showcase: CharacterAnim[] = ['attack', 'special', 'defend', 'hurt']

  return (
    <button
      type="button"
      // Preview on hover: swing on the way in, back to idle on the way out.
      onMouseEnter={() => setAnim(showcase[Math.floor(Math.random() * showcase.length)])}
      onMouseLeave={() => setAnim('idle')}
      className="flex h-full w-full items-end justify-center"
      tabIndex={-1}
    >
      {/* Shown bare - this picker is about the base body, not the gear on top. */}
      <Sprite
        key={resolved.anim}
        sheet={resolved.sheet}
        displayHeight={height}
        fps={resolved.fps}
        playOnce={resolved.playOnce}
      />
    </button>
  )
}

function HeroTab() {
  const player = useGameStore((s) => s.player)
  const setCharacter = useGameStore((s) => s.setCharacter)

  return (
    <Panel className="p-3">
      <p className="font-medieval mb-1 text-sm text-amber-300">Choose your fighter</p>
      <p className="mb-3 text-[11px] text-stone-500">
        Purely cosmetic — your stats, gear and skills come with you. Hover a character to see it move.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map((character) => {
          const selected = character.id === player.characterId
          return (
            <div
              key={character.id}
              className={`rounded-lg border-2 p-2 transition ${
                selected ? 'border-amber-500 bg-amber-950/40' : 'border-amber-950/70 bg-[#1c140c]'
              }`}
            >
              <div className="flex h-[150px] items-end justify-center overflow-hidden rounded bg-black/30">
                <CharacterPreview characterId={character.id} height={118} />
              </div>
              <p className="font-medieval mt-2 text-center text-sm text-stone-100">{character.name}</p>
              <p className="mt-0.5 h-8 text-center text-[11px] leading-tight text-stone-500">{character.blurb}</p>
              <p className="mt-1 text-center text-[10px] uppercase tracking-wide text-stone-600">
                {character.wearsEquipment ? 'Shows your armour' : 'Own outfit'}
              </p>
              <button
                type="button"
                disabled={selected}
                onClick={() => setCharacter(character.id)}
                className="font-medieval mt-2 w-full rounded border-2 border-amber-800 bg-amber-950/70 px-2 py-1 text-xs text-amber-200 hover:bg-amber-900/70 disabled:cursor-default disabled:border-amber-600 disabled:text-amber-400"
              >
                {selected ? 'Selected' : 'Play as'}
              </button>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function GearTab() {
  const player = useGameStore((s) => s.player)
  const equipItem = useGameStore((s) => s.equipItem)
  const unequipItem = useGameStore((s) => s.unequipItem)
  const emptyCells = Math.max(0, INVENTORY_CELLS - player.inventory.length)

  return (
    <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
      <Panel className="p-3">
        <p className="font-medieval mb-2 text-center text-sm text-amber-300">Equipped</p>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-2">
            {(['weapon', 'helmet', 'chest'] as ItemSlot[]).map((slot) => (
              <ItemCell
                key={slot}
                item={player.equipped[slot]}
                onClick={() => unequipItem(slot)}
                placeholder={SLOT_LABEL[slot]}
              />
            ))}
          </div>

          {/* Paper doll: the character wearing whatever is currently equipped. */}
          <div className="flex h-[190px] w-28 items-end justify-center rounded border-2 border-amber-950/70 bg-[#1c140c] p-2">
            <PaperDoll />
          </div>

          <div className="flex flex-col gap-2">
            {(['legs', 'gloves', 'boots', 'trinket'] as ItemSlot[]).map((slot) => (
              <ItemCell
                key={slot}
                item={player.equipped[slot]}
                onClick={() => unequipItem(slot)}
                placeholder={SLOT_LABEL[slot]}
              />
            ))}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-stone-500">Click a slot to unequip</p>
      </Panel>

      <Panel className="p-3">
        <p className="font-medieval mb-2 text-sm text-amber-300">Inventory ({player.inventory.length})</p>
        <div className="flex max-h-[260px] flex-wrap gap-2 overflow-y-auto">
          {player.inventory.map((item) => (
            <ItemCell key={item.id} item={item} onClick={() => equipItem(item)} />
          ))}
          {Array.from({ length: emptyCells }).map((_, i) => (
            <ItemCell key={`empty-${i}`} />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-stone-500">Click an item to equip it</p>
      </Panel>
    </div>
  )
}

function SkillsTab() {
  const player = useGameStore((s) => s.player)
  const spendSkillPoint = useGameStore((s) => s.spendSkillPoint)
  const unlockActiveSkill = useGameStore((s) => s.unlockActiveSkill)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel className="p-3">
        <p className="font-medieval mb-2 text-sm text-amber-300">Passive</p>
        <div className="space-y-2">
          {skills.map((skill) => {
            const rank = player.unlockedSkills[skill.id] ?? 0
            const maxed = rank >= skill.maxRank
            const canAfford = player.skillPoints >= skill.cost
            return (
              <div
                key={skill.id}
                className="flex items-center justify-between gap-2 rounded border border-amber-950/70 bg-[#1c140c] px-3 py-2"
              >
                <div>
                  <p className="font-medieval text-sm text-stone-100">
                    {skill.name} <span className="text-xs text-stone-500">({rank}/{skill.maxRank})</span>
                  </p>
                  <p className="text-xs text-stone-500">{skill.description}</p>
                </div>
                <button
                  type="button"
                  disabled={maxed || !canAfford}
                  onClick={() => spendSkillPoint(skill.id)}
                  className="shrink-0 rounded bg-emerald-800 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500"
                >
                  {maxed ? 'Maxed' : `+1 (${skill.cost})`}
                </button>
              </div>
            )
          })}
        </div>
      </Panel>

      <Panel className="p-3">
        <p className="font-medieval mb-2 text-sm text-amber-300">Flame Arts</p>
        <p className="mb-2 text-[11px] text-stone-500">
          Cast in battle using Focus, which builds up as you answer correctly.
        </p>
        <div className="space-y-2">
          {activeSkills.map((skill) => {
            const unlocked = player.unlockedActiveSkills.includes(skill.id)
            const canAfford = player.skillPoints >= skill.unlockCost
            return (
              <div
                key={skill.id}
                className={`flex items-center justify-between gap-2 rounded border px-3 py-2 ${
                  unlocked ? 'border-orange-800/70 bg-orange-950/20' : 'border-amber-950/70 bg-[#1c140c]'
                }`}
              >
                <div>
                  <p className="font-medieval text-sm text-orange-200">
                    {skill.name} <span className="text-xs text-stone-500">· {skill.cost} focus</span>
                  </p>
                  <p className="text-xs text-stone-500">{skill.description}</p>
                </div>
                <button
                  type="button"
                  disabled={unlocked || !canAfford}
                  onClick={() => unlockActiveSkill(skill.id)}
                  className="shrink-0 rounded bg-orange-800 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500"
                >
                  {unlocked ? 'Learned' : `Learn (${skill.unlockCost})`}
                </button>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

function StatsTab() {
  const player = useGameStore((s) => s.player)
  const level = getLevel(player.xp)
  const { current, needed } = xpIntoLevel(player.xp)
  const subjects = Object.entries(player.subjectStats)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel className="p-3">
        <p className="font-medieval mb-2 text-sm text-amber-300">Character</p>
        <dl className="space-y-1 text-sm text-stone-300">
          {[
            ['Level', level],
            ['XP', `${current}/${needed}`],
            ['Attack', getAttackPower(player)],
            ['Max HP', getMaxHp(player)],
            ['Potions', player.potions],
            ['Skill points', player.skillPoints],
            ['Dungeons cleared', player.clearedRuns],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between border-b border-amber-950/40 pb-1">
              <dt className="text-stone-500">{label}</dt>
              <dd className="text-stone-100">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel className="p-3">
        <p className="font-medieval mb-2 text-sm text-amber-300">Subject accuracy</p>
        {subjects.length === 0 && <p className="text-sm text-stone-500">Answer questions in a dungeon to track this.</p>}
        <div className="space-y-2">
          {subjects.map(([subject, stats]) => {
            const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
            return (
              <div key={subject}>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-300">{subject}</span>
                  <span className="text-stone-400">
                    {stats.correct}/{stats.total} ({pct}%)
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded bg-stone-900">
                  <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'gear', label: 'Gear' },
  { key: 'hero', label: 'Hero' },
  { key: 'skills', label: 'Skills' },
  { key: 'stats', label: 'Stats' },
]

export function CharacterSheet({ onClose }: { onClose: () => void }) {
  const player = useGameStore((s) => s.player)
  const [tab, setTab] = useState<Tab>('gear')

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-lg border-4 border-amber-950 bg-[#241a10] p-4 shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-amber-950 pb-3">
          <div>
            <h2 className="font-medieval text-xl text-amber-200">{player.name}</h2>
            <p className="text-xs text-stone-400">
              Level {getLevel(player.xp)} · {player.skillPoints} skill points
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-medieval rounded border-2 border-amber-800 bg-amber-950/70 px-3 py-1 text-sm text-amber-200 hover:bg-amber-900/70"
          >
            Close
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`font-medieval rounded border-2 px-4 py-1 text-sm transition ${
                tab === t.key
                  ? 'border-amber-600 bg-amber-900/60 text-amber-100'
                  : 'border-amber-950 bg-[#2e2115] text-stone-400 hover:text-stone-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-3">
          {tab === 'gear' && <GearTab />}
          {tab === 'hero' && <HeroTab />}
          {tab === 'skills' && <SkillsTab />}
          {tab === 'stats' && <StatsTab />}
        </div>
      </div>
    </div>
  )
}
