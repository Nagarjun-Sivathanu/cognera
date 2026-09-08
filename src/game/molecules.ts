/**
 * The chemistry engine behind the Molecule Builder simulation.
 *
 * A molecule is a plain graph: atoms carry an element and a canvas position, bonds
 * carry an order. Everything else - valency checking, molecular formula, functional
 * group recognition, naming - is derived from that graph, so a molecule the player
 * built by hand and one produced by a reagent are indistinguishable to the rest of
 * the code.
 */

export type Element = 'C' | 'H' | 'O' | 'N' | 'F' | 'Cl' | 'Br' | 'I'

/** How many bonds each element must make. Brannoc's lesson, in code. */
export const VALENCY: Record<Element, number> = { C: 4, N: 3, O: 2, H: 1, F: 1, Cl: 1, Br: 1, I: 1 }

export const HALOGENS: Element[] = ['F', 'Cl', 'Br', 'I']

export const ELEMENT_COLOUR: Record<Element, string> = {
  C: '#52525b',
  H: '#d4d4d8',
  O: '#dc2626',
  N: '#2563eb',
  F: '#65a30d',
  Cl: '#16a34a',
  Br: '#b45309',
  I: '#7c3aed',
}

export interface Atom {
  id: number
  el: Element
  x: number
  y: number
}

export interface Bond {
  a: number
  b: number
  order: 1 | 2 | 3
}

export interface Molecule {
  atoms: Atom[]
  bonds: Bond[]
}

export const EMPTY: Molecule = { atoms: [], bonds: [] }

export const CANVAS_W = 900
export const CANVAS_H = 520
const BOND_LENGTH = 62

// ---------------------------------------------------------------- graph helpers

export function atomOf(mol: Molecule, id: number): Atom | undefined {
  return mol.atoms.find((a) => a.id === id)
}

export function bondsOf(mol: Molecule, id: number): Bond[] {
  return mol.bonds.filter((b) => b.a === id || b.b === id)
}

export function bondBetween(mol: Molecule, a: number, b: number): Bond | undefined {
  return mol.bonds.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
}

export function other(bond: Bond, id: number): number {
  return bond.a === id ? bond.b : bond.a
}

export interface Neighbour {
  atom: Atom
  order: 1 | 2 | 3
}

export function neighbours(mol: Molecule, id: number): Neighbour[] {
  const out: Neighbour[] = []
  for (const bond of bondsOf(mol, id)) {
    const atom = atomOf(mol, other(bond, id))
    if (atom) out.push({ atom, order: bond.order })
  }
  return out
}

/** Bond slots already spent on this atom. */
export function usedValency(mol: Molecule, id: number): number {
  return bondsOf(mol, id).reduce((sum, b) => sum + b.order, 0)
}

export function freeValency(mol: Molecule, id: number): number {
  const atom = atomOf(mol, id)
  if (!atom) return 0
  return VALENCY[atom.el] - usedValency(mol, id)
}

function nextId(mol: Molecule): number {
  return mol.atoms.reduce((max, a) => Math.max(max, a.id), 0) + 1
}

/** Somewhere near `anchor` that is not already crowded, kept inside the canvas. */
function freeSpot(mol: Molecule, anchor: Atom): { x: number; y: number } {
  let best = { x: anchor.x + BOND_LENGTH, y: anchor.y }
  let bestScore = -Infinity
  for (let i = 0; i < 32; i++) {
    const t = (i / 32) * Math.PI * 2
    const p = { x: anchor.x + Math.cos(t) * BOND_LENGTH, y: anchor.y + Math.sin(t) * BOND_LENGTH }
    let score = Infinity
    for (const a of mol.atoms) score = Math.min(score, Math.hypot(a.x - p.x, a.y - p.y))
    if (p.x < 34 || p.y < 34 || p.x > CANVAS_W - 34 || p.y > CANVAS_H - 34) score -= 1000
    if (score > bestScore) {
      bestScore = score
      best = p
    }
  }
  return best
}

// ---------------------------------------------------------------- graph editing
// All of these return a new molecule; nothing mutates in place, so undo is just
// keeping the previous value.

export function addAtom(mol: Molecule, el: Element, x: number, y: number): { mol: Molecule; id: number } {
  const id = nextId(mol)
  return { mol: { atoms: [...mol.atoms, { id, el, x, y }], bonds: mol.bonds }, id }
}

/** Adds an atom already bonded to `anchorId`, placed in a gap beside it. */
export function attach(
  mol: Molecule,
  el: Element,
  anchorId: number,
  order: 1 | 2 | 3 = 1,
): { mol: Molecule; id: number } {
  const anchor = atomOf(mol, anchorId)
  if (!anchor) return { mol, id: -1 }
  const spot = freeSpot(mol, anchor)
  const id = nextId(mol)
  return {
    mol: {
      atoms: [...mol.atoms, { id, el, x: spot.x, y: spot.y }],
      bonds: [...mol.bonds, { a: anchorId, b: id, order }],
    },
    id,
  }
}

export function removeAtom(mol: Molecule, id: number): Molecule {
  return {
    atoms: mol.atoms.filter((a) => a.id !== id),
    bonds: mol.bonds.filter((b) => b.a !== id && b.b !== id),
  }
}

export function removeAtoms(mol: Molecule, ids: number[]): Molecule {
  return ids.reduce((m, id) => removeAtom(m, id), mol)
}

export function removeBond(mol: Molecule, a: number, b: number): Molecule {
  return {
    atoms: mol.atoms,
    bonds: mol.bonds.filter((x) => !((x.a === a && x.b === b) || (x.a === b && x.b === a))),
  }
}

export function setBondOrder(mol: Molecule, a: number, b: number, order: 1 | 2 | 3): Molecule {
  return {
    atoms: mol.atoms,
    bonds: mol.bonds.map((x) =>
      (x.a === a && x.b === b) || (x.a === b && x.b === a) ? { ...x, order } : x,
    ),
  }
}

export interface BondResult {
  mol: Molecule
  error?: string
}

/**
 * Bonds two atoms, or changes the order of a bond they already share. Refuses
 * anything that would overspend either atom's valency, and says which one.
 */
export function bondAtoms(mol: Molecule, a: number, b: number, order: 1 | 2 | 3): BondResult {
  if (a === b) return { mol, error: 'An atom cannot bond to itself.' }
  const atomA = atomOf(mol, a)
  const atomB = atomOf(mol, b)
  if (!atomA || !atomB) return { mol }

  const existing = bondBetween(mol, a, b)
  const spentA = usedValency(mol, a) - (existing?.order ?? 0)
  const spentB = usedValency(mol, b) - (existing?.order ?? 0)

  for (const [atom, spent] of [
    [atomA, spentA],
    [atomB, spentB],
  ] as const) {
    if (spent + order > VALENCY[atom.el]) {
      const max = VALENCY[atom.el]
      return { mol, error: `${atom.el} takes ${max} bond${max > 1 ? 's' : ''} — no room for that one.` }
    }
  }

  if (existing) return { mol: setBondOrder(mol, a, b, order) }
  return { mol: { atoms: mol.atoms, bonds: [...mol.bonds, { a, b, order }] } }
}

/** Caps every unfilled valency with hydrogen - the "and the rest is hydrogen" button. */
export function fillHydrogens(mol: Molecule): Molecule {
  let out = mol
  // Iterate the snapshot, so the hydrogens being added are not themselves visited.
  for (const atom of mol.atoms) {
    if (atom.el === 'H') continue
    while (freeValency(out, atom.id) > 0) {
      out = attach(out, 'H', atom.id).mol
    }
  }
  return out
}

/** One hydrogen hanging off this atom, if it has any - reagents strip these. */
export function hydrogenOn(mol: Molecule, id: number): number | undefined {
  return neighbours(mol, id).find((n) => n.atom.el === 'H')?.atom.id
}

export function countH(mol: Molecule, id: number): number {
  return neighbours(mol, id).filter((n) => n.atom.el === 'H').length
}

// ---------------------------------------------------------------- validity

export interface Validity {
  complete: boolean
  connected: boolean
  /** Atoms still holding an unfilled bond slot. */
  unfilled: { atom: Atom; free: number }[]
}

export function validate(mol: Molecule): Validity {
  const unfilled = mol.atoms
    .map((atom) => ({ atom, free: freeValency(mol, atom.id) }))
    .filter((entry) => entry.free > 0)

  let connected = true
  if (mol.atoms.length > 1) {
    const seen = new Set<number>([mol.atoms[0].id])
    const queue = [mol.atoms[0].id]
    while (queue.length) {
      const id = queue.pop() as number
      for (const n of neighbours(mol, id)) {
        if (!seen.has(n.atom.id)) {
          seen.add(n.atom.id)
          queue.push(n.atom.id)
        }
      }
    }
    connected = seen.size === mol.atoms.length
  }

  return {
    complete: unfilled.length === 0 && connected && mol.atoms.length > 0,
    connected,
    unfilled,
  }
}

/** Hill notation: carbon, then hydrogen, then everything else alphabetically. */
export function formula(mol: Molecule): string {
  const counts: Partial<Record<Element, number>> = {}
  for (const atom of mol.atoms) counts[atom.el] = (counts[atom.el] ?? 0) + 1

  const rest = (Object.keys(counts) as Element[]).filter((el) => el !== 'C' && el !== 'H').sort()
  const order: Element[] = [
    ...(counts.C ? (['C'] as Element[]) : []),
    ...(counts.H ? (['H'] as Element[]) : []),
    ...rest,
  ]

  return order.map((el) => `${el}${(counts[el] as number) > 1 ? counts[el] : ''}`).join('')
}

// ---------------------------------------------------------------- groups

export type GroupId =
  | 'carboxylic-acid'
  | 'ester'
  | 'amide'
  | 'nitrile'
  | 'aldehyde'
  | 'ketone'
  | 'alcohol'
  | 'amine'
  | 'ether'
  | 'alkyne'
  | 'alkene'
  | 'haloalkane'
  | 'alkane'

export interface FunctionalGroup {
  id: GroupId
  name: string
  /** Why this counts as that group, in the researchers' own terms. */
  why: string
  atoms: number[]
}

/** IUPAC-ish seniority: the first match is what the molecule gets called. */
const SENIORITY: GroupId[] = [
  'carboxylic-acid',
  'ester',
  'amide',
  'nitrile',
  'aldehyde',
  'ketone',
  'alcohol',
  'amine',
  'ether',
  'alkyne',
  'alkene',
  'haloalkane',
  'alkane',
]

function isCarbonylCarbon(mol: Molecule, id: number): boolean {
  const atom = atomOf(mol, id)
  if (!atom || atom.el !== 'C') return false
  return neighbours(mol, id).some((n) => n.atom.el === 'O' && n.order === 2)
}

export function detectGroups(mol: Molecule): FunctionalGroup[] {
  const found: FunctionalGroup[] = []
  const claimed = new Set<number>()

  const push = (group: FunctionalGroup) => {
    found.push(group)
    for (const id of group.atoms) claimed.add(id)
  }

  // Carbonyl-based groups first: they consume the oxygens that would otherwise
  // read as a plain alcohol or ether.
  for (const atom of mol.atoms) {
    if (!isCarbonylCarbon(mol, atom.id)) continue
    const ns = neighbours(mol, atom.id)
    const carbonylO = ns.find((n) => n.atom.el === 'O' && n.order === 2)
    if (!carbonylO) continue
    const singleO = ns.find((n) => n.atom.el === 'O' && n.order === 1)
    const nitrogen = ns.find((n) => n.atom.el === 'N' && n.order === 1)
    const carbons = ns.filter((n) => n.atom.el === 'C')
    const hydrogens = ns.filter((n) => n.atom.el === 'H')

    if (singleO) {
      const hydroxylH = neighbours(mol, singleO.atom.id).find((n) => n.atom.el === 'H')
      if (hydroxylH) {
        push({
          id: 'carboxylic-acid',
          name: 'Carboxylic acid',
          why: 'A carbonyl and an O–H on the very same carbon — the loudest group in the repertoire.',
          atoms: [atom.id, carbonylO.atom.id, singleO.atom.id, hydroxylH.atom.id],
        })
        continue
      }
      const esterC = neighbours(mol, singleO.atom.id).find((n) => n.atom.el === 'C' && n.atom.id !== atom.id)
      if (esterC) {
        push({
          id: 'ester',
          name: 'Ester',
          why: 'A carbonyl carbon whose second oxygen carries another carbon.',
          atoms: [atom.id, carbonylO.atom.id, singleO.atom.id],
        })
        continue
      }
    }

    if (nitrogen) {
      push({
        id: 'amide',
        name: 'Amide',
        why: 'A carbonyl bonded straight onto a nitrogen.',
        atoms: [atom.id, carbonylO.atom.id, nitrogen.atom.id],
      })
      continue
    }

    if (carbons.length >= 2) {
      push({
        id: 'ketone',
        name: 'Ketone',
        why: 'A C=O sitting in the middle, with a carbon on either side.',
        atoms: [atom.id, carbonylO.atom.id],
      })
    } else if (hydrogens.length >= 1 || carbons.length <= 1) {
      push({
        id: 'aldehyde',
        name: 'Aldehyde',
        why: 'A C=O at the end of the chain, still wearing its hydrogen.',
        atoms: [atom.id, carbonylO.atom.id],
      })
    }
  }

  // Nitrile
  for (const bond of mol.bonds) {
    if (bond.order !== 3) continue
    const a = atomOf(mol, bond.a)
    const b = atomOf(mol, bond.b)
    if (!a || !b) continue
    if ((a.el === 'C' && b.el === 'N') || (a.el === 'N' && b.el === 'C')) {
      push({
        id: 'nitrile',
        name: 'Nitrile',
        why: 'A carbon spending three slots on a single nitrogen.',
        atoms: [a.id, b.id],
      })
    }
  }

  // Alcohol / ether: an oxygen with two single bonds that nothing else has claimed.
  for (const atom of mol.atoms) {
    if (atom.el !== 'O' || claimed.has(atom.id)) continue
    const ns = neighbours(mol, atom.id)
    if (ns.some((n) => n.order !== 1)) continue
    const carbons = ns.filter((n) => n.atom.el === 'C')
    const hydrogens = ns.filter((n) => n.atom.el === 'H')
    if (carbons.length === 1 && hydrogens.length === 1) {
      push({
        id: 'alcohol',
        name: 'Alcohol',
        why: 'Carbon, oxygen, hydrogen in a chain — alcohol is alcohol, whatever the skeleton looks like.',
        atoms: [carbons[0].atom.id, atom.id, hydrogens[0].atom.id],
      })
    } else if (carbons.length === 2) {
      push({ id: 'ether', name: 'Ether', why: 'An oxygen bridging two carbons.', atoms: [atom.id] })
    }
  }

  // Amine
  for (const atom of mol.atoms) {
    if (atom.el !== 'N' || claimed.has(atom.id)) continue
    const ns = neighbours(mol, atom.id)
    if (ns.some((n) => n.order !== 1)) continue
    const carbons = ns.filter((n) => n.atom.el === 'C')
    if (!carbons.length) continue
    const degree = carbons.length === 1 ? 'Primary' : carbons.length === 2 ? 'Secondary' : 'Tertiary'
    push({
      id: 'amine',
      name: `${degree} amine`,
      why: `A nitrogen carrying ${carbons.length} carbon${carbons.length > 1 ? 's' : ''}, nothing doubled.`,
      atoms: [atom.id],
    })
  }

  // Carbon-carbon multiple bonds
  for (const bond of mol.bonds) {
    const a = atomOf(mol, bond.a)
    const b = atomOf(mol, bond.b)
    if (!a || !b || a.el !== 'C' || b.el !== 'C') continue
    if (bond.order === 2) {
      push({ id: 'alkene', name: 'Alkene', why: 'Two carbons sharing two pairs — a C=C.', atoms: [a.id, b.id] })
    } else if (bond.order === 3) {
      push({ id: 'alkyne', name: 'Alkyne', why: 'Two carbons sharing three pairs — a C≡C.', atoms: [a.id, b.id] })
    }
  }

  // Haloalkane
  const halogenAtoms = mol.atoms.filter((a) => HALOGENS.includes(a.el))
  if (halogenAtoms.length) {
    push({
      id: 'haloalkane',
      name: 'Haloalkane',
      why: 'A halogen hanging off the skeleton, dragging electron density toward itself.',
      atoms: halogenAtoms.map((a) => a.id),
    })
  }

  if (!found.length && mol.atoms.some((a) => a.el === 'C') && mol.atoms.every((a) => a.el === 'C' || a.el === 'H')) {
    found.push({
      id: 'alkane',
      name: 'Alkane',
      why: 'Carbon and hydrogen, every bond single. Nothing here is in a hurry to react.',
      atoms: mol.atoms.map((a) => a.id),
    })
  }

  return found.sort((x, y) => SENIORITY.indexOf(x.id) - SENIORITY.indexOf(y.id))
}

export function primaryGroup(mol: Molecule): FunctionalGroup | undefined {
  return detectGroups(mol)[0]
}

// ---------------------------------------------------------------- naming

const STEMS = ['', 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec']
const HALO_PREFIX: Partial<Record<Element, string>> = { F: 'fluoro', Cl: 'chloro', Br: 'bromo', I: 'iodo' }

/** The chain of carbons, end to end, or undefined if it branches or loops. */
function carbonChain(mol: Molecule): number[] | undefined {
  const carbons = mol.atoms.filter((a) => a.el === 'C')
  if (!carbons.length || carbons.length > 10) return undefined

  for (const c of carbons) {
    if (neighbours(mol, c.id).filter((n) => n.atom.el === 'C').length > 2) return undefined
  }
  const carbonBonds = mol.bonds.filter((b) => atomOf(mol, b.a)?.el === 'C' && atomOf(mol, b.b)?.el === 'C')
  if (carbonBonds.length !== carbons.length - 1) return undefined

  const ends = carbons.filter((c) => neighbours(mol, c.id).filter((n) => n.atom.el === 'C').length <= 1)
  if (!ends.length) return undefined

  const chain: number[] = []
  let current: number | undefined = ends[0].id
  let previous = -1
  while (current !== undefined) {
    chain.push(current)
    const next: number | undefined = neighbours(mol, current).find(
      (n) => n.atom.el === 'C' && n.atom.id !== previous,
    )?.atom.id
    previous = current
    current = next
  }
  return chain.length === carbons.length ? chain : undefined
}

/**
 * A name, but only where one can be given honestly: unbranched, acyclic, and with a
 * single functional group. Anything else gets no name rather than a wrong one.
 */
export function name(mol: Molecule): string | undefined {
  const chain = carbonChain(mol)
  if (!chain) return undefined

  const groups = detectGroups(mol)
  if (groups.length !== 1) return undefined
  const group = groups[0]

  const stem = STEMS[chain.length]
  if (!stem) return undefined

  /** Lowest locant this set of atoms can be given, numbering from either end. */
  const locantOf = (ids: number[]): number => {
    const positions = ids.map((id) => chain.indexOf(id) + 1).filter((n) => n > 0)
    if (!positions.length) return 1
    return Math.min(Math.min(...positions), chain.length + 1 - Math.max(...positions))
  }
  /** Only worth stating once the chain is long enough for the position to be ambiguous. */
  const at = (ids: number[], from: number): string => (chain.length < from ? '' : `${locantOf(ids)}-`)

  const groupCarbons = group.atoms.filter((id) => atomOf(mol, id)?.el === 'C')

  switch (group.id) {
    case 'alkane':
      return `${stem}ane`
    case 'alkene':
      return `${stem}-${at(groupCarbons, 4)}ene`.replace('-ene', 'ene').replace('--', '-')
    case 'alkyne':
      return `${stem}-${at(groupCarbons, 4)}yne`.replace('-yne', 'yne').replace('--', '-')
    case 'alcohol':
      return `${stem}an-${at(groupCarbons, 3)}ol`.replace('an-ol', 'anol')
    case 'aldehyde':
      return `${stem}anal`
    case 'ketone':
      return `${stem}an-${at(groupCarbons, 3)}one`.replace('an-one', 'anone')
    case 'carboxylic-acid':
      return `${stem}anoic acid`
    case 'amine':
      return `${stem}an-${at(groupCarbons, 3)}amine`.replace('an-amine', 'anamine')
    case 'nitrile':
      return `${stem}anenitrile`
    case 'haloalkane': {
      const halogen = mol.atoms.find((a) => HALOGENS.includes(a.el))
      if (!halogen) return undefined
      const carrier = neighbours(mol, halogen.id).find((n) => n.atom.el === 'C')
      if (!carrier) return undefined
      return `${at([carrier.atom.id], 3)}${HALO_PREFIX[halogen.el]}${stem}ane`
    }
    default:
      return undefined
  }
}

// ---------------------------------------------------------------- presets

/** Starting points, so a player can reach the reagents without drawing from scratch. */
export const presets: { label: string; build: () => Molecule }[] = [
  {
    label: 'Ethane',
    build: () => {
      const c1 = addAtom(EMPTY, 'C', 380, 250)
      const c2 = attach(c1.mol, 'C', c1.id)
      return fillHydrogens(c2.mol)
    },
  },
  {
    label: 'Ethanol',
    build: () => {
      const c1 = addAtom(EMPTY, 'C', 340, 250)
      const c2 = attach(c1.mol, 'C', c1.id)
      const o = attach(c2.mol, 'O', c2.id)
      return fillHydrogens(o.mol)
    },
  },
  {
    label: 'Propene',
    build: () => {
      const c1 = addAtom(EMPTY, 'C', 320, 250)
      const c2 = attach(c1.mol, 'C', c1.id, 2)
      const c3 = attach(c2.mol, 'C', c2.id)
      return fillHydrogens(c3.mol)
    },
  },
  {
    label: 'Propan-2-ol',
    build: () => {
      const c1 = addAtom(EMPTY, 'C', 320, 290)
      const c2 = attach(c1.mol, 'C', c1.id)
      const c3 = attach(c2.mol, 'C', c2.id)
      const o = attach(c3.mol, 'O', c2.id)
      return fillHydrogens(o.mol)
    },
  },
]

// ---------------------------------------------------------------- challenges

export interface Challenge {
  id: string
  label: string
  hint: string
  formula: string
  group: GroupId
}

/**
 * Checked against whatever is on the canvas, however it got there - so oxidising
 * ethanol twice clears the aldehyde and the acid on the way through.
 */
export const challenges: Challenge[] = [
  { id: 'methane', label: 'Methane', hint: 'One carbon. Fill all four of its slots with hydrogen.', formula: 'CH4', group: 'alkane' },
  { id: 'ethene', label: 'Ethene', hint: 'Two carbons sharing a double bond.', formula: 'C2H4', group: 'alkene' },
  { id: 'ethanol', label: 'Ethanol', hint: 'Two carbons, then an oxygen wearing a hydrogen.', formula: 'C2H6O', group: 'alcohol' },
  { id: 'ethanal', label: 'Ethanal', hint: 'Oxidise ethanol once — or build the C=O yourself.', formula: 'C2H4O', group: 'aldehyde' },
  { id: 'ethanoic-acid', label: 'Ethanoic acid', hint: 'Keep oxidising. The aldehyde climbs one more step.', formula: 'C2H4O2', group: 'carboxylic-acid' },
  { id: 'propanone', label: 'Propanone', hint: 'A C=O with a carbon on each side.', formula: 'C3H6O', group: 'ketone' },
  { id: 'bromoethane', label: 'Bromoethane', hint: 'Throw HBr at ethene.', formula: 'C2H5Br', group: 'haloalkane' },
  { id: 'ethylamine', label: 'Ethylamine', hint: 'Nitrogen takes three bonds: one carbon, two hydrogens.', formula: 'C2H7N', group: 'amine' },
]

export function clearedChallenge(mol: Molecule): Challenge | undefined {
  if (!validate(mol).complete) return undefined
  const f = formula(mol)
  const group = primaryGroup(mol)
  if (!group) return undefined
  return challenges.find((c) => c.formula === f && c.group === group.id)
}
