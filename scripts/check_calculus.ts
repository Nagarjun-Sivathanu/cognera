/**
 * Checks the Shape Builder's maths: that typed expressions parse with the right
 * precedence, that bad input fails cleanly rather than throwing, and that the
 * numeric integration agrees with integrals whose exact values are known.
 *
 * The simulation teaches calculus, so being wrong is worse than being missing.
 *
 * Run: npm run check:calculus
 */

import { areaBetween, compile, integrate, niceStep, peakGap, shapeChallenges } from '../src/game/calculus'

let fails = 0

function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected
  if (!ok) fails += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual}${ok ? '' : `  (expected ${expected})`}`)
}

function close(label: string, actual: number, expected: number, tolerance = 1e-6) {
  const ok = Number.isFinite(actual) && Math.abs(actual - expected) < tolerance
  if (!ok) fails += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual}${ok ? '' : `  (expected ${expected})`}`)
}

/** Compiles and evaluates, failing loudly if the expression did not parse. */
function at(source: string, x: number): number {
  const result = compile(source)
  if (!result.ok) {
    fails += 1
    console.log(`FAIL  could not parse "${source}": ${result.message}`)
    return NaN
  }
  return result.fn(x)
}

const fn = (source: string) => {
  const result = compile(source)
  if (!result.ok) throw new Error(`${source}: ${result.message}`)
  return result.fn
}

// --- parsing and precedence --------------------------------------------------
close('x^2 at 3', at('x^2', 3), 9)
close('unary minus is looser than ^: -x^2 at 2', at('-x^2', 2), -4)
close('(-x)^2 at 2', at('(-x)^2', 2), 4)
close('^ is right-associative: 2^3^2', at('2^3^2', 0), 512)
close('negative exponent: 2^-3', at('2^-3', 0), 0.125)
close('implicit multiply: 2x at 4', at('2x', 4), 8)
close('implicit multiply: 3sin(x) at pi/2', at('3sin(x)', Math.PI / 2), 3)
close('implicit multiply: x(x+1) at 3', at('x(x+1)', 3), 12)
close('bare argument: sin x at pi/2', at('sin x', Math.PI / 2), 1)
close('precedence: 1 + 2*3', at('1 + 2*3', 0), 7)
close('precedence: (1 + 2)*3', at('(1 + 2)*3', 0), 9)
close('subtraction is not implicit multiply: 5 - 2', at('5 - 2', 0), 3)
close('constants: pi', at('pi', 0), Math.PI)
close('nested calls: sqrt(abs(-x))  at 9', at('sqrt(abs(0-x))', 9), 3)
close('decimals: .5x at 8', at('.5x', 8), 4)
close('ln is the natural log', at('ln(e)', 0), 1)

// --- failures come back as messages, not exceptions ---------------------------
check('empty input fails', compile('   ').ok, false)
check('unknown name fails', compile('wibble(x)').ok, false)
check('unbalanced bracket fails', compile('sin(x').ok, false)
check('dangling operator fails', compile('x +').ok, false)
check('stray character fails', compile('x $ 2').ok, false)
check('bare function with no argument fails', compile('sin').ok, false)

// --- integration against exact values ----------------------------------------
close('integral of x^2 from 0 to 3 is 9', integrate(fn('x^2'), 0, 3), 9, 1e-9)
close('integral of sin from 0 to pi is 2', integrate(fn('sin(x)'), 0, Math.PI), 2, 1e-9)
close('integral of sin over a full period is 0', integrate(fn('sin(x)'), 0, 2 * Math.PI), 0, 1e-9)
close('integral of 1/x from 1 to e is 1', integrate(fn('1/x'), 1, Math.E), 1, 1e-9)
close('reversing the limits negates it', integrate(fn('x^2'), 3, 0), -9, 1e-9)
close('zero-width interval integrates to 0', integrate(fn('x^2'), 2, 2), 0)
close('integral of e^x from 0 to 1 is e-1', integrate(fn('exp(x)'), 0, 1), Math.E - 1, 1e-9)

// --- signed integral versus the area of the shape -----------------------------
const fullSine = areaBetween(fn('sin(x)'), fn('0'), 0, 2 * Math.PI)
close('sine over a period: signed is 0', fullSine.signed, 0, 1e-9)
close('sine over a period: area is 4', fullSine.area, 4, 1e-6)
check('sine over a period crosses the boundary', fullSine.crosses, true)

const arch = areaBetween(fn('sin(x)'), fn('0'), 0, Math.PI)
close('one arch: signed is 2', arch.signed, 2, 1e-9)
close('one arch: area is also 2', arch.area, 2, 1e-9)
check('one arch does not cross', arch.crosses, false)

// The classic "between two curves" case: x above x^2 on [0, 1], area 1/6.
close('between x and x^2 on [0,1]', areaBetween(fn('x'), fn('x^2'), 0, 1).area, 1 / 6, 1e-9)

// A region wholly under the axis integrates negative but has positive area.
const below = areaBetween(fn('0-x^2'), fn('0'), 0, 3)
close('below the axis: signed is -9', below.signed, -9, 1e-9)
close('below the axis: area is 9', below.area, 9, 1e-9)

// --- helpers ------------------------------------------------------------------
close('peak gap of sin against 0', peakGap(fn('sin(x)'), fn('0'), 0, Math.PI), 1, 1e-4)
check('niceStep rounds 0.3 up to 0.5', niceStep(0.3), 0.5)
check('niceStep rounds 7 up to 10', niceStep(7), 10)

// --- the challenges are actually clearable ------------------------------------
const clears = (id: string, f: string, g: string, a: number, b: number) => {
  const challenge = shapeChallenges.find((c) => c.id === id)
  if (!challenge) {
    fails += 1
    console.log(`FAIL  no challenge "${id}"`)
    return
  }
  check(`${id} clears with ${f} over [${a}, ${b}]`, challenge.check({ f: fn(f), g: fn(g), a, b }), true)
}

// 10 wide by 5 tall.
clears('area-50', '5', '0', 0, 10)
// One full period of sine: two equal lobes that cancel, 16 units of area between them.
clears('signed-zero', '4sin(x)', '0', 0, 2 * Math.PI)
// A flat line below the axis: 4 wide, 3 deep, integrates to -12.
clears('all-negative', '0-3', '0', 0, 4)
// The capped case: a flat top at exactly the 10 limit gives the full 40.
clears('capped-max', '10', '0', 0, 4)

// ...and are not trivially cleared by the empty default.
const flat = { f: fn('0'), g: fn('0'), a: 0, b: 4 }
for (const challenge of shapeChallenges) {
  check(`${challenge.id} is not cleared by a flat line`, challenge.check(flat), false)
}
// The capped challenge must reject a shape that breaks the height limit.
check(
  'capped-max rejects a curve taller than 10',
  shapeChallenges.find((c) => c.id === 'capped-max')!.check({ f: fn('20'), g: fn('0'), a: 0, b: 4 }),
  false,
)
// ...and one over the wrong limits.
check(
  'capped-max rejects the wrong limits',
  shapeChallenges.find((c) => c.id === 'capped-max')!.check({ f: fn('10'), g: fn('0'), a: 0, b: 8 }),
  false,
)

console.log(fails ? `\n${fails} FAILURES` : '\nall checks passed')
process.exit(fails ? 1 : 0)
