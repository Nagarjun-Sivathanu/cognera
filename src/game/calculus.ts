/**
 * The maths engine behind the Shape Builder simulation.
 *
 * Students type a function, so something has to turn text into a curve. That is done
 * with a real tokeniser and recursive-descent parser compiled to a closure, rather
 * than `eval` or `new Function` - a bad expression comes back as a readable error
 * instead of a thrown exception or an arbitrary script.
 */

// ---------------------------------------------------------------- tokenising

type TokenKind = 'number' | 'name' | 'op' | '(' | ')'

interface Token {
  kind: TokenKind
  text: string
  /** Index in the source, so an error can point at the offending character. */
  at: number
}

const OPERATORS = '+-*/^'

function tokenise(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < source.length) {
    const ch = source[i]

    if (ch === ' ' || ch === '\t') {
      i += 1
      continue
    }

    if (ch >= '0' && ch <= '9') {
      let j = i
      while (j < source.length && ((source[j] >= '0' && source[j] <= '9') || source[j] === '.')) j += 1
      tokens.push({ kind: 'number', text: source.slice(i, j), at: i })
      i = j
      continue
    }

    // A leading '.5' is a number too.
    if (ch === '.') {
      let j = i + 1
      while (j < source.length && source[j] >= '0' && source[j] <= '9') j += 1
      if (j > i + 1) {
        tokens.push({ kind: 'number', text: source.slice(i, j), at: i })
        i = j
        continue
      }
    }

    if (/[a-zA-Z]/.test(ch)) {
      let j = i
      while (j < source.length && /[a-zA-Z0-9_]/.test(source[j])) j += 1
      tokens.push({ kind: 'name', text: source.slice(i, j).toLowerCase(), at: i })
      i = j
      continue
    }

    if (OPERATORS.includes(ch)) {
      tokens.push({ kind: 'op', text: ch, at: i })
      i += 1
      continue
    }

    if (ch === '(' || ch === '[') {
      tokens.push({ kind: '(', text: '(', at: i })
      i += 1
      continue
    }
    if (ch === ')' || ch === ']') {
      tokens.push({ kind: ')', text: ')', at: i })
      i += 1
      continue
    }

    throw new ParseError(`I don't know what to do with "${ch}".`, i)
  }

  return tokens
}

export class ParseError extends Error {
  at: number
  constructor(message: string, at: number) {
    super(message)
    this.at = at
  }
}

// ---------------------------------------------------------------- parsing

type Fn = (x: number) => number

const FUNCTIONS: Record<string, (v: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log, // natural log, as in every calculus paper
  log10: Math.log10,
  sqrt: Math.sqrt,
  abs: Math.abs,
  sign: Math.sign,
  floor: Math.floor,
  ceil: Math.ceil,
}

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E }

/**
 * Recursive descent over the usual precedence ladder. Implicit multiplication is
 * supported, because students write `2x` and `3sin(x)` and being pedantic about it
 * teaches nothing.
 */
function parse(tokens: Token[], source: string): Fn {
  let pos = 0

  const peek = (): Token | undefined => tokens[pos]
  const expect = (kind: TokenKind, what: string) => {
    const token = tokens[pos]
    if (!token || token.kind !== kind) {
      throw new ParseError(`Expected ${what}.`, token?.at ?? source.length)
    }
    pos += 1
    return token
  }

  /** True where the next token could start a new factor, i.e. `2x` style. */
  function startsFactor(): boolean {
    const token = peek()
    if (!token) return false
    return token.kind === 'number' || token.kind === 'name' || token.kind === '('
  }

  function expression(): Fn {
    let left = term()
    for (;;) {
      const token = peek()
      if (!token || token.kind !== 'op' || (token.text !== '+' && token.text !== '-')) return left
      pos += 1
      const right = term()
      const a = left
      left = token.text === '+' ? (x) => a(x) + right(x) : (x) => a(x) - right(x)
    }
  }

  function term(): Fn {
    let left = unary()
    for (;;) {
      const token = peek()
      if (token && token.kind === 'op' && (token.text === '*' || token.text === '/')) {
        pos += 1
        const right = power()
        const a = left
        left = token.text === '*' ? (x) => a(x) * right(x) : (x) => a(x) / right(x)
        continue
      }
      // Implicit multiplication: `2x`, `x(x+1)`, `3sin(x)`.
      if (startsFactor()) {
        const right = power()
        const a = left
        left = (x) => a(x) * right(x)
        continue
      }
      return left
    }
  }

  // Unary minus binds *looser* than exponentiation, so -x^2 is -(x^2) and not (-x)^2.
  function unary(): Fn {
    const token = peek()
    if (token && token.kind === 'op' && (token.text === '-' || token.text === '+')) {
      pos += 1
      const operand = unary()
      return token.text === '-' ? (x) => -operand(x) : operand
    }
    return power()
  }

  function power(): Fn {
    const base = primary()
    const token = peek()
    if (token && token.kind === 'op' && token.text === '^') {
      pos += 1
      // Right-associative via unary, which also lets the exponent be negative: 2^-3.
      const exponent = unary()
      return (x) => Math.pow(base(x), exponent(x))
    }
    return base
  }

  function primary(): Fn {
    const token = peek()
    if (!token) throw new ParseError('The expression stops early.', source.length)

    if (token.kind === 'number') {
      pos += 1
      const value = Number(token.text)
      if (!Number.isFinite(value)) throw new ParseError(`"${token.text}" is not a number.`, token.at)
      return () => value
    }

    if (token.kind === '(') {
      pos += 1
      const inner = expression()
      expect(')', 'a closing bracket')
      return inner
    }

    if (token.kind === 'name') {
      pos += 1
      const name = token.text

      if (name === 'x') return (x) => x
      if (name in CONSTANTS) {
        const value = CONSTANTS[name]
        return () => value
      }
      if (name in FUNCTIONS) {
        const fn = FUNCTIONS[name]
        // Bare `sin x` is accepted as well as `sin(x)`.
        expectArgument()
        const argument = peek()?.kind === '(' ? bracketed() : power()
        return (x) => fn(argument(x))
      }
      throw new ParseError(`I don't know "${name}".`, token.at)
    }

    throw new ParseError(`"${token.text}" can't start a term.`, token.at)
  }

  function expectArgument() {
    if (!startsFactor()) {
      throw new ParseError('That function needs something to work on.', peek()?.at ?? source.length)
    }
  }

  function bracketed(): Fn {
    expect('(', 'an opening bracket')
    const inner = expression()
    expect(')', 'a closing bracket')
    return inner
  }

  const result = expression()
  if (pos < tokens.length) {
    throw new ParseError(`I got stuck at "${tokens[pos].text}".`, tokens[pos].at)
  }
  return result
}

export interface Compiled {
  ok: true
  fn: Fn
  source: string
}

export interface CompileFailure {
  ok: false
  message: string
  at: number
}

/** Turns typed text into a callable curve, or an error that says where it went wrong. */
export function compile(source: string): Compiled | CompileFailure {
  const trimmed = source.trim()
  if (!trimmed) return { ok: false, message: 'Nothing to draw yet.', at: 0 }
  try {
    const fn = parse(tokenise(trimmed), trimmed)
    // A parse can still be nonsense at runtime; probe it before handing it out.
    fn(1)
    return { ok: true, fn, source: trimmed }
  } catch (error) {
    if (error instanceof ParseError) return { ok: false, message: error.message, at: error.at }
    return { ok: false, message: 'That expression could not be read.', at: 0 }
  }
}

// ---------------------------------------------------------------- integration

/** Composite Simpson's rule. `steps` is forced even, as the rule requires. */
export function integrate(fn: Fn, a: number, b: number, steps = 2000): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN
  if (a === b) return 0
  const n = steps % 2 === 0 ? steps : steps + 1
  const h = (b - a) / n

  let total = fn(a) + fn(b)
  for (let i = 1; i < n; i += 1) {
    const value = fn(a + i * h)
    total += value * (i % 2 === 0 ? 2 : 4)
  }
  const result = (total * h) / 3
  return Number.isFinite(result) ? result : NaN
}

/**
 * The two numbers a definite-integration question can be asking for, and the
 * distinction that costs the most marks:
 *
 * - `signed` is the integral itself; area below the axis counts as negative.
 * - `area` is the size of the shaded shape, which is the integral of |f - g|.
 */
export interface AreaResult {
  signed: number
  area: number
  /** True when the two differ, i.e. the region crosses the other boundary. */
  crosses: boolean
}

export function areaBetween(f: Fn, g: Fn, a: number, b: number, steps = 2000): AreaResult {
  const difference = (x: number) => f(x) - g(x)
  const signed = integrate(difference, a, b, steps)
  const area = integrate((x) => Math.abs(difference(x)), a, b, steps)
  return {
    signed,
    area: Math.abs(area),
    crosses: Number.isFinite(signed) && Number.isFinite(area) && Math.abs(Math.abs(signed) - Math.abs(area)) > 1e-4,
  }
}

/** Largest |f - g| anywhere in the window, used by the capped-height challenge. */
export function peakGap(f: Fn, g: Fn, a: number, b: number, samples = 600): number {
  let peak = 0
  for (let i = 0; i <= samples; i += 1) {
    const x = a + ((b - a) * i) / samples
    const value = Math.abs(f(x) - g(x))
    if (Number.isFinite(value)) peak = Math.max(peak, value)
  }
  return peak
}

/**
 * Samples a curve for plotting, splitting into separate runs wherever the value
 * stops being finite or leaps - so an asymptote leaves a gap instead of a vertical
 * line straight through the plot.
 */
export function sampleCurve(
  fn: Fn,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  samples = 900,
): { x: number; y: number }[][] {
  const runs: { x: number; y: number }[][] = []
  let run: { x: number; y: number }[] = []
  const limit = Math.max(Math.abs(yMin), Math.abs(yMax)) * 12

  for (let i = 0; i <= samples; i += 1) {
    const x = xMin + ((xMax - xMin) * i) / samples
    const y = fn(x)
    if (!Number.isFinite(y) || Math.abs(y) > limit) {
      if (run.length > 1) runs.push(run)
      run = []
      continue
    }
    run.push({ x, y })
  }
  if (run.length > 1) runs.push(run)
  return runs
}

/** A y-range that comfortably contains the curve, rounded to something readable. */
export function fitRange(fns: Fn[], xMin: number, xMax: number): { yMin: number; yMax: number } {
  let low = Infinity
  let high = -Infinity
  for (const fn of fns) {
    for (let i = 0; i <= 400; i += 1) {
      const y = fn(xMin + ((xMax - xMin) * i) / 400)
      if (!Number.isFinite(y) || Math.abs(y) > 1e5) continue
      low = Math.min(low, y)
      high = Math.max(high, y)
    }
  }
  if (!Number.isFinite(low) || !Number.isFinite(high)) return { yMin: -5, yMax: 5 }

  const pad = Math.max((high - low) * 0.2, 1)
  low -= pad
  high += pad
  // Always keep the x-axis in shot; a definite integral is about area against it.
  low = Math.min(low, 0)
  high = Math.max(high, 0)
  const step = niceStep((high - low) / 8)
  return { yMin: Math.floor(low / step) * step, yMax: Math.ceil(high / step) * step }
}

/** 1, 2, 5, 10, 20, 50 … - the gridline spacings that read well. */
export function niceStep(rough: number): number {
  if (!Number.isFinite(rough) || rough <= 0) return 1
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)))
  const normalised = rough / magnitude
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
  return step * magnitude
}

// ---------------------------------------------------------------- challenges

export interface BuilderState {
  f: Fn
  g: Fn
  a: number
  b: number
}

export interface ShapeChallenge {
  id: string
  label: string
  brief: string
  /** What the player is meant to notice by clearing it. */
  lesson: string
  check: (state: BuilderState) => boolean
}

export const shapeChallenges: ShapeChallenge[] = [
  {
    id: 'area-50',
    label: 'Area exactly 50',
    brief: 'Build a shaded shape whose area is 50, to within 0.05. Any function, any limits.',
    lesson: 'Area is something you can aim at and hit. The function, the limits and the second boundary are all dials on the same number.',
    check: ({ f, g, a, b }) => Math.abs(areaBetween(f, g, a, b).area - 50) < 0.05,
  },
  {
    id: 'signed-zero',
    label: 'Signed integral of zero',
    brief: 'Make the integral come out as 0 while the shape still has more than 12 of actual area.',
    lesson: 'The integral is not the area. Below the axis it counts against you, so a genuinely large shape can integrate to nothing at all.',
    check: ({ f, g, a, b }) => {
      const result = areaBetween(f, g, a, b)
      return Math.abs(result.signed) < 0.05 && result.area > 12
    },
  },
  {
    id: 'all-negative',
    label: 'Entirely below the line',
    brief: 'Get the signed integral down to −10 or lower.',
    lesson: 'A negative integral is not a mistake - it is the region sitting under the boundary rather than over it.',
    check: ({ f, g, a, b }) => areaBetween(f, g, a, b).signed <= -10,
  },
  {
    id: 'capped-max',
    label: 'The largest shape that fits',
    brief: 'Fix the limits at 0 and 4. Keep the gap between your two curves no wider than 10 anywhere, and push the area past 39.',
    lesson: 'Height times width is the ceiling: 10 tall across 4 wide can never beat 40, and only a flat top gets close to it.',
    check: ({ f, g, a, b }) => {
      const lo = Math.min(a, b)
      const hi = Math.max(a, b)
      if (Math.abs(lo - 0) > 1e-6 || Math.abs(hi - 4) > 1e-6) return false
      if (peakGap(f, g, lo, hi) > 10 + 1e-6) return false
      return areaBetween(f, g, lo, hi).area > 39
    },
  },
]

/** Starting points, so the bench is never a blank page. */
export const shapePresets: { label: string; f: string; g: string; a: number; b: number }[] = [
  { label: 'A parabola', f: 'x^2', g: '0', a: 0, b: 3 },
  { label: 'One arch of sine', f: 'sin(x)', g: '0', a: 0, b: 3.14159265 },
  { label: 'Sine, both halves', f: 'sin(x)', g: '0', a: 0, b: 6.28318531 },
  { label: 'Between two curves', f: 'x', g: 'x^2', a: 0, b: 1 },
  { label: 'A straight line', f: '2x + 1', g: '0', a: 0, b: 4 },
]
