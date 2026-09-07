import { skills } from '../game/player'
import { useGameStore } from '../store/gameStore'
import type { Item, ItemSlot } from '../types'

const RARITY_COLOR: Record<string, string> = {
  Common: 'border-stone-600 text-stone-300',
  Uncommon: 'border-emerald-600 text-emerald-400',
  Rare: 'border-sky-600 text-sky-400',
  Epic: 'border-purple-600 text-purple-400',
  Legendary: 'border-amber-500 text-amber-400',
}

const SLOTS: ItemSlot[] = ['weapon', 'armor', 'trinket']

function ItemPill({ item, onClick, actionLabel }: { item: Item; onClick: () => void; actionLabel: string }) {
  return (
    <div className={`flex items-center justify-between rounded border px-2 py-1.5 text-sm ${RARITY_COLOR[item.rarity]}`}>
      <span>
        {item.name} <span className="text-xs text-stone-500">(+{item.value} {item.stat})</span>
      </span>
      <button type="button" onClick={onClick} className="ml-2 rounded bg-stone-800 px-2 py-0.5 text-xs hover:bg-stone-700">
        {actionLabel}
      </button>
    </div>
  )
}

export function CharacterSheet({ onClose }: { onClose: () => void }) {
  const player = useGameStore((s) => s.player)
  const equipItem = useGameStore((s) => s.equipItem)
  const unequipItem = useGameStore((s) => s.unequipItem)
  const spendSkillPoint = useGameStore((s) => s.spendSkillPoint)

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-stone-700 bg-stone-950 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-100">Character</h2>
          <button type="button" onClick={onClose} className="rounded bg-stone-800 px-3 py-1 text-sm hover:bg-stone-700">
            Close
          </button>
        </div>

        <section className="mt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Equipped</h3>
          <div className="mt-2 space-y-1.5">
            {SLOTS.map((slot) => {
              const item = player.equipped[slot]
              return (
                <div key={slot} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-xs uppercase text-stone-500">{slot}</span>
                  {item ? (
                    <ItemPill item={item} onClick={() => unequipItem(slot)} actionLabel="Unequip" />
                  ) : (
                    <span className="text-sm text-stone-600">Empty</span>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Inventory ({player.inventory.length})
          </h3>
          <div className="mt-2 space-y-1.5">
            {player.inventory.length === 0 && <p className="text-sm text-stone-600">No items yet — clear a dungeon for loot.</p>}
            {player.inventory.map((item) => (
              <ItemPill key={item.id} item={item} onClick={() => equipItem(item)} actionLabel="Equip" />
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Skills ({player.skillPoints} points available)
          </h3>
          <div className="mt-2 space-y-2">
            {skills.map((skill) => {
              const rank = player.unlockedSkills[skill.id] ?? 0
              const maxed = rank >= skill.maxRank
              const canAfford = player.skillPoints >= skill.cost
              return (
                <div key={skill.id} className="flex items-center justify-between rounded border border-stone-800 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-stone-100">
                      {skill.name} <span className="text-xs text-stone-500">({rank}/{skill.maxRank})</span>
                    </p>
                    <p className="text-xs text-stone-500">{skill.description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={maxed || !canAfford}
                    onClick={() => spendSkillPoint(skill.id)}
                    className="rounded bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500"
                  >
                    {maxed ? 'Maxed' : `+1 (${skill.cost} pt)`}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Subject accuracy</h3>
          <div className="mt-2 space-y-1 text-sm text-stone-300">
            {Object.entries(player.subjectStats).length === 0 && (
              <p className="text-sm text-stone-600">Answer questions in a dungeon to track this.</p>
            )}
            {Object.entries(player.subjectStats).map(([subject, stats]) => (
              <p key={subject}>
                {subject}: {stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
