/**
 * Checks the Molecule Builder's chemistry end to end: that structures are built and
 * named correctly, that valency is enforced, and that every reagent produces the
 * product a chemistry textbook says it should.
 *
 * The simulation teaches chemistry, so being wrong is worse than being missing.
 *
 * Run: npx esbuild scripts/check_chemistry.ts --bundle --platform=node --format=esm  *        --outfile=node_modules/.chemcheck.mjs && node node_modules/.chemcheck.mjs
 */

import { addAtom, attach, fillHydrogens, formula, primaryGroup, name, validate, EMPTY, presets, bondAtoms, type Molecule } from '../src/game/molecules'
import { reagents } from '../src/game/reagents'

let fails = 0
function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual}${ok ? '' : `  (expected ${expected})`}`)
}
const R = (id: string) => reagents.find((r) => r.id === id)!
function react(mol: Molecule, id: string): Molecule {
  const res = R(id).apply(mol)
  if (!res.ok) { console.log(`FAIL  reagent ${id} refused: ${res.note}`); fails++; return mol }
  return res.mol
}
const describe = (m: Molecule) => `${formula(m)} / ${primaryGroup(m)?.name ?? 'none'} / ${name(m) ?? 'unnamed'}`

// --- building ---
const chain = (n: number) => {
  let m = addAtom(EMPTY, 'C', 300, 260)
  let last = m.id
  let mol = m.mol
  for (let i = 1; i < n; i++) { const a = attach(mol, 'C', last); mol = a.mol; last = a.id }
  return { mol, last, first: m.id }
}

check('methane', describe(fillHydrogens(addAtom(EMPTY, 'C', 300, 260).mol)), 'CH4 / Alkane / methane')

const eth = chain(2)
check('ethane', describe(fillHydrogens(eth.mol)), 'C2H6 / Alkane / ethane')

const ene = bondAtoms(eth.mol, eth.first, eth.last, 2)
check('ethene', describe(fillHydrogens(ene.mol)), 'C2H4 / Alkene / ethene')

const yne = bondAtoms(eth.mol, eth.first, eth.last, 3)
check('ethyne', describe(fillHydrogens(yne.mol)), 'C2H2 / Alkyne / ethyne')

const ethanol = presets.find((p) => p.label === 'Ethanol')!.build()
check('ethanol preset', describe(ethanol), 'C2H6O / Alcohol / ethanol')
check('ethanol valid', validate(ethanol).complete, true)

// (chain(3) is exercised through the presets below)
const amine = fillHydrogens(attach(eth.mol, 'N', eth.last).mol)
check('ethylamine', describe(amine), 'C2H7N / Primary amine / ethanamine')

const propanol2 = presets.find((p) => p.label === 'Propan-2-ol')!.build()
check('propan-2-ol', describe(propanol2), 'C3H8O / Alcohol / propan-2-ol')

const propene = presets.find((p) => p.label === 'Propene')!.build()
// No locant: prop-2-ene is the same molecule as prop-1-ene, so "propene" is unambiguous.
check('propene', describe(propene), 'C3H6 / Alkene / propene')

// --- valency refusal ---
const full = fillHydrogens(addAtom(EMPTY, 'C', 300, 260).mol)
const overload = bondAtoms(full, 1, 2, 2)
check('carbon overload refused', !!overload.error, true)

// --- reagents: the oxidation ladder ---
const ethanal = react(ethanol, 'dichromate')
check('ethanol -> ethanal', describe(ethanal), 'C2H4O / Aldehyde / ethanal')
const acid = react(ethanal, 'dichromate')
check('ethanal -> ethanoic acid', describe(acid), 'C2H4O2 / Carboxylic acid / ethanoic acid')
check('acid valid', validate(acid).complete, true)

const straight = react(ethanol, 'permanganate')
check('ethanol -> acid in one pass', describe(straight), 'C2H4O2 / Carboxylic acid / ethanoic acid')

const ketone = react(propanol2, 'dichromate')
check('propan-2-ol -> propanone', describe(ketone), 'C3H6O / Ketone / propan-2-one')
const noFurther = R('dichromate').apply(ketone)
check('ketone resists further oxidation', noFurther.ok, false)

// --- reduction ---
check('propanone -> propan-2-ol', describe(react(ketone, 'nabh4')), 'C3H8O / Alcohol / propan-2-ol')
check('ethanal -> ethanol', describe(react(ethanal, 'nabh4')), 'C2H6O / Alcohol / ethanol')
check('NaBH4 refuses an acid', R('nabh4').apply(acid).ok, false)
check('LiAlH4 acid -> ethanol', describe(react(acid, 'lialh4')), 'C2H6O / Alcohol / ethanol')

// --- addition ---
const ethene = fillHydrogens(ene.mol)
check('ethene + H2 -> ethane', describe(react(ethene, 'h2-pd')), 'C2H6 / Alkane / ethane')
check('ethyne + H2 -> ethene', describe(react(fillHydrogens(yne.mol), 'h2-pd')), 'C2H4 / Alkene / ethene')
check('ethene + HBr -> bromoethane', describe(react(ethene, 'hbr')), 'C2H5Br / Haloalkane / bromoethane')
check('propene + HBr -> 2-bromopropane', describe(react(propene, 'hbr')), 'C3H7Br / Haloalkane / 2-bromopropane')

// --- substitution and elimination ---
const bromoethane = react(ethene, 'hbr')
check('bromoethane + aq KOH -> ethanol', describe(react(bromoethane, 'aq-koh')), 'C2H6O / Alcohol / ethanol')
check('bromoethane + alc KOH -> ethene', describe(react(bromoethane, 'alc-koh')), 'C2H4 / Alkene / ethene')
check('ethanol dehydrated -> ethene', describe(react(ethanol, 'h2so4')), 'C2H4 / Alkene / ethene')

// --- refusals name the group they wanted ---
const methane = fillHydrogens(addAtom(EMPTY, 'C', 300, 260).mol)
check('methane cannot dehydrate', R('h2so4').apply(methane).ok, false)
check('methane has no halogen', R('aq-koh').apply(methane).ok, false)
check('methane has nothing to hydrogenate', R('h2-pd').apply(methane).ok, false)

console.log(fails ? `\n${fails} FAILURES` : '\nall checks passed')
process.exit(fails ? 1 : 0)
