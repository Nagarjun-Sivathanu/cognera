import { useMemo, useRef, useState } from 'react'
import { playSfx, SFX } from '../game/audio'
import {
  addAtom,
  atomOf,
  attach,
  bondAtoms,
  CANVAS_H,
  CANVAS_W,
  challenges,
  clearedChallenge,
  detectGroups,
  ELEMENT_COLOUR,
  EMPTY,
  formula,
  freeValency,
  name as nameMolecule,
  presets,
  removeAtom,
  removeBond,
  validate,
  VALENCY,
  type Element,
  type Molecule,
} from '../game/molecules'
import { reagents, type Reagent } from '../game/reagents'

const PALETTE: Element[] = ['C', 'H', 'O', 'N', 'F', 'Cl', 'Br', 'I']

type Tool = { mode: 'atom'; el: Element } | { mode: 'bond'; order: 1 | 2 | 3 } | { mode: 'erase' }

interface Reaction {
  before: Molecule
  after: Molecule
  reagent: Reagent
  note: string
}

/** Molecular formula with the counts dropped to subscripts. */
function Formula({ value }: { value: string }) {
  return (
    <span>
      {value.split(/(\d+)/).map((part, i) =>
        /^\d+$/.test(part) ? <sub key={i}>{part}</sub> : <span key={i}>{part}</span>,
      )}
    </span>
  )
}

function atomRadius(el: Element): number {
  return el === 'H' ? 12 : 17
}

/** The bonds of a molecule as SVG lines - doubles and triples drawn as parallels. */
function BondLines({ mol, onPick }: { mol: Molecule; onPick?: (a: number, b: number) => void }) {
  return (
    <>
      {mol.bonds.map((bond) => {
        const a = atomOf(mol, bond.a)
        const b = atomOf(mol, bond.b)
        if (!a || !b) return null
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy) || 1
        // Perpendicular unit vector, so parallel lines sit either side of the axis.
        const px = (-dy / len) * 4.5
        const py = (dx / len) * 4.5
        const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-1, 1] : [-1, 0, 1]
        return (
          <g key={`${bond.a}-${bond.b}`} onClick={() => onPick?.(bond.a, bond.b)} style={{ cursor: onPick ? 'pointer' : undefined }}>
            {onPick && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={16} />}
            {offsets.map((o, i) => (
              <line
                key={i}
                x1={a.x + px * o}
                y1={a.y + py * o}
                x2={b.x + px * o}
                y2={b.y + py * o}
                stroke="#a1a1aa"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            ))}
          </g>
        )
      })}
    </>
  )
}

/** A whole molecule shrunk to fit a small box, for the reaction strip. */
function MiniMolecule({ mol, size = 150 }: { mol: Molecule; size?: number }) {
  if (!mol.atoms.length) return <div style={{ width: size, height: size }} />
  const xs = mol.atoms.map((a) => a.x)
  const ys = mol.atoms.map((a) => a.y)
  const pad = 30
  const minX = Math.min(...xs) - pad
  const minY = Math.min(...ys) - pad
  const w = Math.max(Math.max(...xs) + pad - minX, 60)
  const h = Math.max(Math.max(...ys) + pad - minY, 60)
  const span = Math.max(w, h)

  return (
    <svg width={size} height={size} viewBox={`${minX + (w - span) / 2} ${minY + (h - span) / 2} ${span} ${span}`}>
      <BondLines mol={mol} />
      {mol.atoms.map((atom) => (
        <g key={atom.id}>
          <circle cx={atom.x} cy={atom.y} r={atomRadius(atom.el)} fill={ELEMENT_COLOUR[atom.el]} stroke="#18181b" strokeWidth={2} />
          <text
            x={atom.x}
            y={atom.y + 5}
            textAnchor="middle"
            fontSize={atom.el === 'H' ? 12 : 15}
            fontWeight={700}
            fill={atom.el === 'H' ? '#27272a' : '#fafafa'}
          >
            {atom.el}
          </text>
        </g>
      ))}
    </svg>
  )
}

/**
 * The Molecule Builder: build a structure from atoms and bonds, have it recognised,
 * then throw reagents at it and watch what it turns into.
 *
 * The chemistry lives entirely in game/molecules.ts and game/reagents.ts - this file
 * only draws the graph and routes clicks into those.
 */
export function MoleculeBuilder({ onClose }: { onClose: () => void }) {
  const [mol, setMol] = useState<Molecule>(EMPTY)
  const [history, setHistory] = useState<Molecule[]>([])
  const [tool, setTool] = useState<Tool>({ mode: 'atom', el: 'C' })
  const [pending, setPending] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [reaction, setReaction] = useState<Reaction | null>(null)
  const [cleared, setCleared] = useState<Set<string>>(new Set())
  const [justCleared, setJustCleared] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: number; startX: number; startY: number; moved: boolean } | null>(null)
  // A drag that ends on an atom still fires a click, which would place or bond.
  const suppressClick = useRef(false)

  const groups = useMemo(() => detectGroups(mol), [mol])
  const validity = useMemo(() => validate(mol), [mol])
  const molName = useMemo(() => nameMolecule(mol), [mol])
  const highlighted = useMemo(
    () => new Set(groups[0] && groups[0].id !== 'alkane' ? groups[0].atoms : []),
    [groups],
  )

  /** Every change goes through here so undo and challenge checks are never missed. */
  function commit(next: Molecule, note?: string) {
    setHistory((h) => [...h.slice(-40), mol])
    setMol(next)
    setMessage(note ?? null)

    const done = clearedChallenge(next)
    if (done && !cleared.has(done.id)) {
      setCleared((c) => new Set(c).add(done.id))
      setJustCleared(done.label)
      playSfx(SFX.frogCroak, 0.45)
      window.setTimeout(() => setJustCleared(null), 3200)
    }
  }

  function undo() {
    if (!history.length) return
    setMol(history[history.length - 1])
    setHistory((h) => h.slice(0, -1))
    setMessage(null)
  }

  function reset(next: Molecule = EMPTY) {
    setHistory((h) => [...h.slice(-40), mol])
    setMol(next)
    setPending(null)
    setReaction(null)
    setMessage(null)
  }

  function svgPoint(e: React.PointerEvent | React.MouseEvent) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { x: CANVAS_W / 2, y: CANVAS_H / 2 }
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    }
  }

  function onCanvasClick(e: React.MouseEvent) {
    if (tool.mode !== 'atom') {
      setPending(null)
      return
    }
    const p = svgPoint(e)
    playSfx(SFX.menuClick, 0.25)
    commit(addAtom(mol, tool.el, p.x, p.y).mol)
  }

  function onAtomClick(id: number) {
    const atom = atomOf(mol, id)
    if (!atom) return

    if (tool.mode === 'erase') {
      playSfx(SFX.menuClick, 0.25)
      commit(removeAtom(mol, id))
      return
    }

    if (tool.mode === 'atom') {
      // Clicking an existing atom with an element selected grows the molecule from
      // there, which is far quicker than placing then bonding.
      if (freeValency(mol, id) < 1) {
        setMessage(`${atom.el} has all ${VALENCY[atom.el]} of its bonds already. Nothing more will fit on it.`)
        return
      }
      playSfx(SFX.menuClick, 0.25)
      commit(attach(mol, tool.el, id).mol)
      return
    }

    // Bond mode: first click picks, second click bonds.
    if (pending === null) {
      setPending(id)
      setMessage(null)
      return
    }
    if (pending === id) {
      setPending(null)
      return
    }
    const result = bondAtoms(mol, pending, id, tool.order)
    setPending(null)
    if (result.error) {
      setMessage(result.error)
      return
    }
    playSfx(SFX.menuClick, 0.25)
    commit(result.mol)
  }

  function applyReagent(reagent: Reagent) {
    const result = reagent.apply(mol)
    if (!result.ok) {
      setReaction(null)
      setMessage(result.note)
      return
    }
    playSfx(SFX.mobGettingHit, 0.3)
    setReaction({ before: mol, after: result.mol, reagent, note: result.note })
    commit(result.mol)
    setMessage(null)
  }

  const toolButton = (label: string, active: boolean, onClick: () => void, extra = '') => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-1.5 text-xs transition ${
        active ? 'border-cyan-400 bg-cyan-900/60 text-cyan-100' : 'border-slate-700 bg-slate-900 text-stone-300 hover:border-slate-500'
      } ${extra}`}
    >
      {label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-stone-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-cyan-900 bg-slate-900/80 px-4 py-2.5">
        <div>
          <h2 className="font-medieval text-lg text-cyan-300">Molecule Builder</h2>
          <p className="text-[11px] text-stone-500">Build it, name it, then react it.</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-xl text-stone-100">
            {mol.atoms.length ? <Formula value={formula(mol)} /> : <span className="text-stone-600">empty</span>}
          </p>
          <p className="text-[11px] text-cyan-400">
            {molName ?? (validity.complete ? 'valid structure' : 'incomplete')}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="font-medieval rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"
        >
          Leave the bench
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Tools */}
        <div className="w-52 shrink-0 space-y-4 overflow-y-auto border-r border-slate-800 bg-slate-900/50 p-3">
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-stone-500">Atoms</p>
            <div className="grid grid-cols-4 gap-1">
              {PALETTE.map((el) => (
                <button
                  key={el}
                  type="button"
                  onClick={() => {
                    setTool({ mode: 'atom', el })
                    setPending(null)
                  }}
                  title={`${el} — ${VALENCY[el]} bond${VALENCY[el] > 1 ? 's' : ''}`}
                  className={`rounded border py-1.5 text-xs font-bold transition ${
                    tool.mode === 'atom' && tool.el === el
                      ? 'border-cyan-400 ring-1 ring-cyan-400'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                  style={{ background: ELEMENT_COLOUR[el], color: el === 'H' ? '#27272a' : '#fafafa' }}
                >
                  {el}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-stone-500">
              Click empty space to place one, or click an existing atom to grow from it.
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-stone-500">Bonds</p>
            <div className="grid grid-cols-3 gap-1">
              {([1, 2, 3] as const).map((order) => (
                <button
                  key={order}
                  type="button"
                  onClick={() => {
                    setTool({ mode: 'bond', order })
                    setPending(null)
                  }}
                  className={`rounded border py-1.5 text-sm transition ${
                    tool.mode === 'bond' && tool.order === order
                      ? 'border-cyan-400 bg-cyan-900/60 text-cyan-100'
                      : 'border-slate-700 bg-slate-900 text-stone-300 hover:border-slate-500'
                  }`}
                >
                  {order === 1 ? '—' : order === 2 ? '=' : '≡'}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-stone-500">
              Click two atoms to join them. Picking the same pair again changes the order.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1">
            {toolButton('Erase', tool.mode === 'erase', () => {
              setTool({ mode: 'erase' })
              setPending(null)
            })}
            {toolButton('Undo', false, undo)}
          </div>

          <button
            type="button"
            onClick={() => {
              playSfx(SFX.menuClick, 0.3)
              commit(
                mol.atoms.reduce<Molecule>((m, atom) => {
                  if (atom.el === 'H') return m
                  let out = m
                  while (freeValency(out, atom.id) > 0) out = attach(out, 'H', atom.id).mol
                  return out
                }, mol),
              )
            }}
            disabled={!mol.atoms.length || validity.complete}
            className="w-full rounded border border-emerald-700 bg-emerald-950/50 py-1.5 text-xs text-emerald-200 hover:bg-emerald-900/50 disabled:opacity-35"
          >
            Cap with hydrogen
          </button>

          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-stone-500">Start from</p>
            <div className="space-y-1">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => reset(preset.build())}
                  className="w-full rounded border border-slate-700 bg-slate-900 py-1.5 text-xs text-stone-300 hover:border-slate-500"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => reset()}
                className="w-full rounded border border-red-900 bg-red-950/40 py-1.5 text-xs text-red-300 hover:bg-red-900/40"
              >
                Clear the bench
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 bg-[#0b1220] p-2">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              className="h-full w-full touch-none"
              onClick={onCanvasClick}
              onPointerMove={(e) => {
                if (!drag.current) return
                const p = svgPoint(e)
                if (Math.hypot(p.x - drag.current.startX, p.y - drag.current.startY) > 4) drag.current.moved = true
                if (!drag.current.moved) return
                setMol((m) => ({
                  atoms: m.atoms.map((a) => (a.id === drag.current?.id ? { ...a, x: p.x, y: p.y } : a)),
                  bonds: m.bonds,
                }))
              }}
              onPointerUp={() => {
                if (drag.current?.moved) suppressClick.current = true
                drag.current = null
              }}
              onPointerLeave={() => {
                drag.current = null
              }}
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" />

              <BondLines
                mol={mol}
                onPick={(a, b) => {
                  if (tool.mode !== 'erase') return
                  playSfx(SFX.menuClick, 0.25)
                  commit(removeBond(mol, a, b))
                }}
              />

              {mol.atoms.map((atom) => {
                const free = freeValency(mol, atom.id)
                const r = atomRadius(atom.el)
                return (
                  <g
                    key={atom.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (suppressClick.current) {
                        suppressClick.current = false
                        return
                      }
                      onAtomClick(atom.id)
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      const p = svgPoint(e)
                      drag.current = { id: atom.id, startX: p.x, startY: p.y, moved: false }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {highlighted.has(atom.id) && (
                      <circle cx={atom.x} cy={atom.y} r={r + 7} fill="none" stroke="#22d3ee" strokeWidth={2} opacity={0.7} />
                    )}
                    {pending === atom.id && (
                      <circle cx={atom.x} cy={atom.y} r={r + 4} fill="none" stroke="#fbbf24" strokeWidth={3} />
                    )}
                    <circle cx={atom.x} cy={atom.y} r={r} fill={ELEMENT_COLOUR[atom.el]} stroke="#0b1220" strokeWidth={2} />
                    <text
                      x={atom.x}
                      y={atom.y + (atom.el === 'H' ? 4 : 5)}
                      textAnchor="middle"
                      fontSize={atom.el === 'H' ? 12 : 15}
                      fontWeight={700}
                      fill={atom.el === 'H' ? '#27272a' : '#fafafa'}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {atom.el}
                    </text>
                    {free > 0 && (
                      <text
                        x={atom.x + r + 3}
                        y={atom.y - r + 2}
                        fontSize={11}
                        fontWeight={700}
                        fill="#f59e0b"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {free}
                      </text>
                    )}
                  </g>
                )
              })}

              {!mol.atoms.length && (
                <text x={CANVAS_W / 2} y={CANVAS_H / 2} textAnchor="middle" fontSize={16} fill="#475569">
                  Pick an element and click here to place your first atom.
                </text>
              )}
            </svg>

            {justCleared && (
              <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded border-2 border-emerald-500 bg-emerald-950/90 px-4 py-2 text-sm text-emerald-200 shadow-lg">
                ✓ {justCleared} built — target cleared.
              </div>
            )}
          </div>

          {/* Reactant → Reagent → Product */}
          {reaction && (
            <div className="shrink-0 border-t-2 border-amber-900 bg-slate-900/80 p-3 pr-28">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <MiniMolecule mol={reaction.before} size={118} />
                  <p className="font-mono text-[11px] text-stone-400">
                    <Formula value={formula(reaction.before)} />
                  </p>
                </div>
                <div className="shrink-0 text-center">
                  <p className="text-[11px] text-amber-300">{reaction.reagent.name}</p>
                  <p className="text-2xl leading-none text-amber-500">⟶</p>
                </div>
                <div className="text-center">
                  <MiniMolecule mol={reaction.after} size={118} />
                  <p className="font-mono text-[11px] text-stone-400">
                    <Formula value={formula(reaction.after)} />
                  </p>
                </div>
                <p className="flex-1 border-l border-slate-700 pl-3 text-[13px] leading-relaxed text-stone-300">
                  {reaction.note}
                </p>
                <button
                  type="button"
                  onClick={() => setReaction(null)}
                  className="self-start rounded border border-slate-600 px-2 py-0.5 text-xs text-stone-400 hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className="shrink-0 border-t border-amber-900 bg-amber-950/40 px-4 py-2 text-[13px] text-amber-200">
              {message}
            </div>
          )}
        </div>

        {/* Readout */}
        <div className="w-72 shrink-0 space-y-3 overflow-y-auto border-l border-slate-800 bg-slate-900/50 p-3 pb-20">
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-stone-500">Structure</p>
            {!mol.atoms.length ? (
              <p className="text-xs text-stone-500">Nothing on the bench.</p>
            ) : !validity.connected ? (
              <p className="rounded border border-amber-800 bg-amber-950/30 p-2 text-xs text-amber-300">
                These are separate fragments. Bond them together to make one molecule.
              </p>
            ) : validity.unfilled.length ? (
              <p className="rounded border border-amber-800 bg-amber-950/30 p-2 text-xs text-amber-300">
                {validity.unfilled.length} atom{validity.unfilled.length > 1 ? 's' : ''} still {validity.unfilled.length > 1 ? 'have' : 'has'} an
                empty slot ({validity.unfilled.map((u) => u.atom.el).join(', ')}). Every atom must be satisfied at once,
                or it is not a molecule.
              </p>
            ) : (
              <p className="rounded border border-emerald-800 bg-emerald-950/30 p-2 text-xs text-emerald-300">
                Valid structure. Every valency is filled.
              </p>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-stone-500">Functional groups</p>
            {!groups.length ? (
              <p className="text-xs text-stone-500">None detected yet.</p>
            ) : (
              <div className="space-y-1.5">
                {groups.map((group, i) => (
                  <div
                    key={`${group.id}-${i}`}
                    className={`rounded border p-2 ${
                      i === 0 ? 'border-cyan-700 bg-cyan-950/40' : 'border-slate-700 bg-slate-900/60'
                    }`}
                  >
                    <p className={`text-xs font-semibold ${i === 0 ? 'text-cyan-200' : 'text-stone-300'}`}>
                      {i === 0 ? 'Functional group detected: ' : ''}
                      {group.name}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-stone-400">{group.why}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-stone-500">Reagent tray</p>
            <div className="space-y-1">
              {reagents.map((reagent) => (
                <button
                  key={reagent.id}
                  type="button"
                  onClick={() => applyReagent(reagent)}
                  disabled={!mol.atoms.length}
                  title={reagent.acts}
                  className={`w-full rounded border px-2 py-1.5 text-left transition hover:brightness-125 disabled:opacity-30 ${reagent.colour}`}
                >
                  <p className="text-xs font-semibold">{reagent.name}</p>
                  <p className="text-[10px] opacity-80">{reagent.blurb}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-stone-500">
              Targets · {cleared.size}/{challenges.length}
            </p>
            <div className="space-y-1">
              {challenges.map((challenge) => {
                const done = cleared.has(challenge.id)
                return (
                  <div
                    key={challenge.id}
                    className={`rounded border px-2 py-1 text-[11px] ${
                      done ? 'border-emerald-800 bg-emerald-950/30 text-emerald-300' : 'border-slate-800 text-stone-400'
                    }`}
                    title={challenge.hint}
                  >
                    {done ? '✓' : '○'} {challenge.label}
                    {!done && <span className="block text-[10px] text-stone-600">{challenge.hint}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
