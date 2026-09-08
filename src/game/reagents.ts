/**
 * Reagents for the Molecule Builder: each one is a graph edit that turns one
 * functional group into another, matching what Perrin teaches on the reagent tray.
 *
 * Every reagent either transforms the molecule and explains what it did, or refuses
 * and explains why it had nothing to act on. A refusal is a teaching moment, so the
 * message always names the group it was looking for.
 */

import {
  attach,
  atomOf,
  countH,
  detectGroups,
  hydrogenOn,
  HALOGENS,
  type Molecule,
  neighbours,
  removeAtom,
  removeAtoms,
  setBondOrder,
} from './molecules'

export type ReactionResult = { ok: true; mol: Molecule; note: string } | { ok: false; note: string }

export interface Reagent {
  id: string
  /** What appears on the bottle. */
  name: string
  /** The one-line job, in Perrin's terms. */
  blurb: string
  /** Groups this reagent can act on, for the "what will this do?" hints. */
  acts: string
  colour: string
  apply: (mol: Molecule) => ReactionResult
}

// ---------------------------------------------------------------- site finders

interface AlcoholSite {
  o: number
  c: number
  h: number
  /** Carbons attached to the carbinol carbon: 0-1 primary, 2 secondary, 3 tertiary. */
  carbons: number
}

function findAlcohol(mol: Molecule): AlcoholSite | undefined {
  for (const atom of mol.atoms) {
    if (atom.el !== 'O') continue
    const ns = neighbours(mol, atom.id)
    if (ns.length !== 2 || ns.some((n) => n.order !== 1)) continue
    const carbon = ns.find((n) => n.atom.el === 'C')
    const hydrogen = ns.find((n) => n.atom.el === 'H')
    if (!carbon || !hydrogen) continue
    return {
      o: atom.id,
      c: carbon.atom.id,
      h: hydrogen.atom.id,
      carbons: neighbours(mol, carbon.atom.id).filter((n) => n.atom.el === 'C').length,
    }
  }
  return undefined
}

/** The carbon of a C=O belonging to one of the named groups. */
function findCarbonyl(mol: Molecule, want: string[]): { c: number; o: number } | undefined {
  for (const group of detectGroups(mol)) {
    if (!want.includes(group.id)) continue
    const c = group.atoms.find((id) => atomOf(mol, id)?.el === 'C')
    if (c === undefined) continue
    const o = neighbours(mol, c).find((n) => n.atom.el === 'O' && n.order === 2)
    if (o) return { c, o: o.atom.id }
  }
  return undefined
}

function findCarboxylicAcid(mol: Molecule): { c: number; carbonylO: number; hydroxylO: number; hydroxylH: number } | undefined {
  const group = detectGroups(mol).find((g) => g.id === 'carboxylic-acid')
  if (!group) return undefined
  const c = group.atoms.find((id) => atomOf(mol, id)?.el === 'C')
  if (c === undefined) return undefined
  const carbonylO = neighbours(mol, c).find((n) => n.atom.el === 'O' && n.order === 2)
  const hydroxylO = neighbours(mol, c).find((n) => n.atom.el === 'O' && n.order === 1)
  if (!carbonylO || !hydroxylO) return undefined
  const hydroxylH = hydrogenOn(mol, hydroxylO.atom.id)
  if (hydroxylH === undefined) return undefined
  return { c, carbonylO: carbonylO.atom.id, hydroxylO: hydroxylO.atom.id, hydroxylH }
}

function findMultipleBond(mol: Molecule, order: 2 | 3): { a: number; b: number } | undefined {
  const bond = mol.bonds.find(
    (b) => b.order === order && atomOf(mol, b.a)?.el === 'C' && atomOf(mol, b.b)?.el === 'C',
  )
  return bond ? { a: bond.a, b: bond.b } : undefined
}

function findHalogen(mol: Molecule): { x: number; c: number } | undefined {
  for (const atom of mol.atoms) {
    if (!HALOGENS.includes(atom.el)) continue
    const carbon = neighbours(mol, atom.id).find((n) => n.atom.el === 'C')
    if (carbon) return { x: atom.id, c: carbon.atom.id }
  }
  return undefined
}

/** A neighbouring carbon that still has a hydrogen to lose - needed for elimination. */
function betaCarbon(mol: Molecule, carbon: number): number | undefined {
  return neighbours(mol, carbon).find((n) => n.atom.el === 'C' && countH(mol, n.atom.id) > 0)?.atom.id
}

// ---------------------------------------------------------------- reactions

/** Alcohol to carbonyl, or aldehyde to acid. One rung of the ladder per call. */
function oxidiseOnce(mol: Molecule): ReactionResult {
  const alcohol = findAlcohol(mol)
  if (alcohol) {
    if (alcohol.carbons >= 3) {
      return {
        ok: false,
        note: 'That is a tertiary alcohol. Its carbinol carbon carries no hydrogen, so there is nothing left to strip — tertiary alcohols resist oxidation.',
      }
    }
    const carbinolH = hydrogenOn(mol, alcohol.c)
    if (carbinolH === undefined) {
      return { ok: false, note: 'That carbon has no hydrogen for the oxidising agent to remove.' }
    }
    let out = removeAtoms(mol, [alcohol.h, carbinolH])
    out = setBondOrder(out, alcohol.c, alcohol.o, 2)
    const secondary = alcohol.carbons === 2
    return {
      ok: true,
      mol: out,
      note: secondary
        ? 'Secondary alcohol oxidised to a ketone. Two hydrogens came off — one from the O–H, one from the carbinol carbon — and the C–O closed up into a C=O. A ketone has no hydrogen left on that carbon, so it stops here.'
        : 'Primary alcohol oxidised to an aldehyde. Oxidation strips hydrogen: one from the O–H and one from the carbon, leaving a C=O. Push it again and the aldehyde will climb to a carboxylic acid.',
    }
  }

  const aldehyde = findCarbonyl(mol, ['aldehyde'])
  if (aldehyde) {
    const aldehydeH = hydrogenOn(mol, aldehyde.c)
    if (aldehydeH === undefined) {
      return { ok: false, note: 'That carbonyl has no hydrogen left, so it cannot be oxidised further.' }
    }
    let out = removeAtom(mol, aldehydeH)
    const oxygen = attach(out, 'O', aldehyde.c)
    out = attach(oxygen.mol, 'H', oxygen.id).mol
    return {
      ok: true,
      mol: out,
      note: 'Aldehyde oxidised to a carboxylic acid. The aldehydic hydrogen was replaced by an O–H, so the same carbon now carries both a C=O and an O–H — that pairing is what makes it an acid.',
    }
  }

  const ketone = detectGroups(mol).some((g) => g.id === 'ketone')
  return {
    ok: false,
    note: ketone
      ? 'Nothing to oxidise. A ketone is already at the top of its ladder — the carbonyl carbon has no hydrogen to give up.'
      : 'Nothing to oxidise. This reagent needs an alcohol or an aldehyde to work on.',
  }
}

const reduceCarbonyl = (mol: Molecule, site: { c: number; o: number }): Molecule => {
  let out = setBondOrder(mol, site.c, site.o, 1)
  out = attach(out, 'H', site.o).mol
  out = attach(out, 'H', site.c).mol
  return out
}

export const reagents: Reagent[] = [
  {
    id: 'dichromate',
    name: 'K₂Cr₂O₇ / H⁺',
    blurb: 'Oxidise one step',
    acts: 'alcohol → aldehyde → carboxylic acid · secondary alcohol → ketone',
    colour: 'border-orange-600 text-orange-200 bg-orange-950/40',
    apply: oxidiseOnce,
  },
  {
    id: 'permanganate',
    name: 'KMnO₄ / H⁺, Δ',
    blurb: 'Oxidise as far as it will go',
    acts: 'primary alcohol → carboxylic acid in one pass',
    colour: 'border-fuchsia-600 text-fuchsia-200 bg-fuchsia-950/40',
    apply: (mol) => {
      let current = mol
      const steps: string[] = []
      for (let i = 0; i < 4; i++) {
        const result = oxidiseOnce(current)
        if (!result.ok) break
        current = result.mol
        steps.push(result.note)
      }
      if (!steps.length) return oxidiseOnce(mol)
      return {
        ok: true,
        mol: current,
        note:
          steps.length > 1
            ? `Hot acidified permanganate does not stop halfway — it climbed ${steps.length} rungs at once. ${steps[steps.length - 1]}`
            : steps[0],
      }
    },
  },
  {
    id: 'nabh4',
    name: 'NaBH₄',
    blurb: 'Reduce a carbonyl',
    acts: 'aldehyde → primary alcohol · ketone → secondary alcohol',
    colour: 'border-sky-600 text-sky-200 bg-sky-950/40',
    apply: (mol) => {
      const site = findCarbonyl(mol, ['aldehyde', 'ketone'])
      if (!site) {
        return {
          ok: false,
          note: 'Nothing here to reduce. Sodium borohydride is a mild reducing agent — it wants an aldehyde or a ketone. It will not touch a carboxylic acid.',
        }
      }
      const wasAldehyde = detectGroups(mol).some((g) => g.id === 'aldehyde')
      return {
        ok: true,
        mol: reduceCarbonyl(mol, site),
        note: `Carbonyl reduced back to an alcohol. Reduction adds hydrogen: the C=O opened to a C–O, one hydrogen went to the oxygen and one to the carbon. ${
          wasAldehyde ? 'An aldehyde gives a primary alcohol.' : 'A ketone gives a secondary alcohol.'
        }`,
      }
    },
  },
  {
    id: 'lialh4',
    name: 'LiAlH₄',
    blurb: 'Reduce anything with a C=O',
    acts: 'carboxylic acid → primary alcohol · also aldehydes and ketones',
    colour: 'border-cyan-600 text-cyan-200 bg-cyan-950/40',
    apply: (mol) => {
      const acid = findCarboxylicAcid(mol)
      if (acid) {
        // The hydroxyl leaves, the carbonyl opens, and the carbon fills up with H.
        let out = removeAtoms(mol, [acid.hydroxylO, acid.hydroxylH])
        out = setBondOrder(out, acid.c, acid.carbonylO, 1)
        out = attach(out, 'H', acid.carbonylO).mol
        out = attach(out, 'H', acid.c).mol
        out = attach(out, 'H', acid.c).mol
        return {
          ok: true,
          mol: out,
          note: 'Carboxylic acid driven all the way down to a primary alcohol. Lithium aluminium hydride is the strong one — it does what NaBH₄ refuses to.',
        }
      }
      const site = findCarbonyl(mol, ['aldehyde', 'ketone'])
      if (!site) return { ok: false, note: 'No C=O anywhere for the hydride to attack.' }
      return {
        ok: true,
        mol: reduceCarbonyl(mol, site),
        note: 'Carbonyl reduced to an alcohol. LiAlH₄ will do this too, though NaBH₄ is enough for an aldehyde or ketone.',
      }
    },
  },
  {
    id: 'h2-pd',
    name: 'H₂ / Pd',
    blurb: 'Saturate a multiple bond',
    acts: 'alkyne → alkene → alkane',
    colour: 'border-emerald-600 text-emerald-200 bg-emerald-950/40',
    apply: (mol) => {
      const triple = findMultipleBond(mol, 3)
      if (triple) {
        let out = setBondOrder(mol, triple.a, triple.b, 2)
        out = attach(out, 'H', triple.a).mol
        out = attach(out, 'H', triple.b).mol
        return { ok: true, mol: out, note: 'Alkyne half-saturated to an alkene. One equivalent of hydrogen adds across the triple bond, dropping it to a double.' }
      }
      const double = findMultipleBond(mol, 2)
      if (double) {
        let out = setBondOrder(mol, double.a, double.b, 1)
        out = attach(out, 'H', double.a).mol
        out = attach(out, 'H', double.b).mol
        return { ok: true, mol: out, note: 'Alkene saturated to an alkane. A hydrogen went to each carbon and the double bond became single. The molecule is now as unreactive as it gets.' }
      }
      return { ok: false, note: 'Nothing unsaturated here. Hydrogen over palladium needs a C=C or a C≡C to add across.' }
    },
  },
  {
    id: 'hbr',
    name: 'HBr',
    blurb: 'Add across a double bond',
    acts: 'alkene → haloalkane, Markovnikov',
    colour: 'border-amber-600 text-amber-200 bg-amber-950/40',
    apply: (mol) => {
      const double = findMultipleBond(mol, 2)
      if (!double) return { ok: false, note: 'HBr adds across a C=C. There is no double bond here to add across.' }

      // Markovnikov: the hydrogen goes to the carbon that already has more of them,
      // because that leaves the positive charge on the better-stabilised carbon.
      const hA = countH(mol, double.a)
      const hB = countH(mol, double.b)
      const takesH = hA >= hB ? double.a : double.b
      const takesBr = takesH === double.a ? double.b : double.a

      let out = setBondOrder(mol, double.a, double.b, 1)
      out = attach(out, 'H', takesH).mol
      out = attach(out, 'Br', takesBr).mol
      return {
        ok: true,
        mol: out,
        note:
          hA === hB
            ? 'HBr added across the double bond. Both carbons carried the same number of hydrogens, so Markovnikov has nothing to decide — either way gives the same product.'
            : 'HBr added across the double bond, Markovnikov style: the hydrogen went to the carbon that already had more hydrogens, and the bromine took the other. That route runs through the more substituted carbocation, which hyperconjugation stabilises best.',
      }
    },
  },
  {
    id: 'aq-koh',
    name: 'KOH (aqueous)',
    blurb: 'Swap a halogen for an OH',
    acts: 'haloalkane → alcohol',
    colour: 'border-teal-600 text-teal-200 bg-teal-950/40',
    apply: (mol) => {
      const site = findHalogen(mol)
      if (!site) return { ok: false, note: 'Aqueous KOH substitutes a halogen. There is no halogen on this molecule.' }
      let out = removeAtom(mol, site.x)
      const oxygen = attach(out, 'O', site.c)
      out = attach(oxygen.mol, 'H', oxygen.id).mol
      return {
        ok: true,
        mol: out,
        note: 'Substitution: hydroxide displaced the halogen and took its place, giving an alcohol. Water as the solvent favours substitution over elimination.',
      }
    },
  },
  {
    id: 'alc-koh',
    name: 'KOH (alcoholic), Δ',
    blurb: 'Eliminate to a double bond',
    acts: 'haloalkane → alkene',
    colour: 'border-lime-600 text-lime-200 bg-lime-950/40',
    apply: (mol) => {
      const site = findHalogen(mol)
      if (!site) return { ok: false, note: 'Alcoholic KOH eliminates from a haloalkane. There is no halogen here.' }
      const beta = betaCarbon(mol, site.c)
      if (beta === undefined) {
        return { ok: false, note: 'Elimination needs a hydrogen on the neighbouring carbon, and there is not one to take.' }
      }
      const betaH = hydrogenOn(mol, beta)
      if (betaH === undefined) return { ok: false, note: 'No β-hydrogen available.' }
      let out = removeAtoms(mol, [site.x, betaH])
      out = setBondOrder(out, site.c, beta, 2)
      return {
        ok: true,
        mol: out,
        note: 'Elimination: the halogen left from one carbon and a hydrogen from its neighbour, and the two carbons closed the gap with a double bond. Same starting material as the aqueous case — the solvent picked the path.',
      }
    },
  },
  {
    id: 'h2so4',
    name: 'conc. H₂SO₄, 170 °C',
    blurb: 'Dehydrate an alcohol',
    acts: 'alcohol → alkene',
    colour: 'border-rose-600 text-rose-200 bg-rose-950/40',
    apply: (mol) => {
      const alcohol = findAlcohol(mol)
      if (!alcohol) return { ok: false, note: 'Dehydration needs an alcohol, and there is no O–H on a carbon here.' }
      const beta = betaCarbon(mol, alcohol.c)
      if (beta === undefined) {
        return { ok: false, note: 'There is no neighbouring carbon with a hydrogen, so no water can be eliminated. Methanol cannot dehydrate — it has nowhere to put the double bond.' }
      }
      const betaH = hydrogenOn(mol, beta)
      if (betaH === undefined) return { ok: false, note: 'No β-hydrogen available.' }
      let out = removeAtoms(mol, [alcohol.o, alcohol.h, betaH])
      out = setBondOrder(out, alcohol.c, beta, 2)
      return {
        ok: true,
        mol: out,
        note: 'Dehydration: the O–H and a hydrogen from the next carbon left together as water, and a double bond formed between them. This is the reverse of adding water to an alkene.',
      }
    },
  },
]

export function getReagent(id: string): Reagent | undefined {
  return reagents.find((r) => r.id === id)
}
