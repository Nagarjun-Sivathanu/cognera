import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playSfx, SFX } from '../game/audio'
import {
  areaBetween,
  compile,
  fitRange,
  niceStep,
  sampleCurve,
  shapeChallenges,
  shapePresets,
  type Compiled,
  type CompileFailure,
} from '../game/calculus'

const W = 940
const H = 520
const PAD_L = 46
const PAD_R = 16
const PAD_T = 16
const PAD_B = 38
const PLOT_W = W - PAD_L - PAD_R
const PLOT_H = H - PAD_T - PAD_B

const DEMO_SOURCE = 'x^2'
const DEMO_STEP_MS = 130

function format(value: number, places = 3): string {
  if (!Number.isFinite(value)) return '—'
  const rounded = Number(value.toFixed(places))
  // -0 reads as a mistake; it is not one.
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

/** Rounds a slider's float to something that can land exactly on 0 or 4. */
const snap = (value: number) => Math.round(value * 100) / 100

/**
 * The Shape Builder: type a function, set the limits, and the region between the
 * curve and its boundary is filled in and measured live.
 *
 * All the maths lives in game/calculus.ts - this file only draws it and moves the
 * handles around.
 */
export function ShapeBuilder({ onClose }: { onClose: () => void }) {
  const [fSource, setFSource] = useState('')
  const [gSource, setGSource] = useState('0')
  const [a, setA] = useState(0)
  const [b, setB] = useState(3)
  const [xMin, setXMin] = useState(-1)
  const [xMax, setXMax] = useState(7)
  const [strips, setStrips] = useState(0)
  const [cleared, setCleared] = useState<Set<string>>(new Set())
  const [justCleared, setJustCleared] = useState<string | null>(null)
  const [demoing, setDemoing] = useState(true)

  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<'a' | 'b' | null>(null)
  const demoTimers = useRef<number[]>([])

  // The opening demo: the curve is typed out a character at a time, so the first
  // thing a player sees is a function being drawn rather than a blank grid.
  useEffect(() => {
    for (let i = 1; i <= DEMO_SOURCE.length; i += 1) {
      demoTimers.current.push(
        window.setTimeout(() => setFSource(DEMO_SOURCE.slice(0, i)), i * DEMO_STEP_MS),
      )
    }
    demoTimers.current.push(
      window.setTimeout(() => setDemoing(false), DEMO_SOURCE.length * DEMO_STEP_MS + 500),
    )
    return () => {
      demoTimers.current.forEach(clearTimeout)
      demoTimers.current = []
    }
  }, [])

  /** Any real interaction cancels the demo mid-type rather than fighting it. */
  function stopDemo() {
    if (!demoing && !demoTimers.current.length) return
    demoTimers.current.forEach(clearTimeout)
    demoTimers.current = []
    setDemoing(false)
  }

  const f = useMemo(() => compile(fSource), [fSource])
  const g = useMemo(() => compile(gSource), [gSource])
  const ready = f.ok && g.ok

  // The y-window follows the functions, not the limits - so dragging a and b never
  // makes the picture jump around underneath you.
  const { yMin, yMax } = useMemo(() => {
    if (!f.ok) return { yMin: -5, yMax: 5 }
    return fitRange(g.ok ? [f.fn, g.fn] : [f.fn], xMin, xMax)
  }, [f, g, xMin, xMax])

  const lo = Math.min(a, b)
  const hi = Math.max(a, b)

  const result = useMemo(() => {
    if (!f.ok || !g.ok) return null
    return areaBetween(f.fn, g.fn, a, b)
  }, [f, g, a, b])

  // Challenges are checked against whatever is on screen, however it got there.
  useEffect(() => {
    if (!f.ok || !g.ok) return
    const state = { f: f.fn, g: g.fn, a, b }
    for (const challenge of shapeChallenges) {
      if (cleared.has(challenge.id)) continue
      let passed = false
      try {
        passed = challenge.check(state)
      } catch {
        passed = false
      }
      if (passed) {
        setCleared((c) => new Set(c).add(challenge.id))
        setJustCleared(challenge.label)
        playSfx(SFX.frogCroak, 0.45)
        window.setTimeout(() => setJustCleared(null), 3600)
        break
      }
    }
  }, [f, g, a, b, cleared])

  // Stable across renders, so the memos below can depend on them by name rather
  // than on the four window numbers they close over.
  const sx = useCallback((x: number) => PAD_L + ((x - xMin) / (xMax - xMin)) * PLOT_W, [xMin, xMax])
  const sy = useCallback((y: number) => PAD_T + ((yMax - y) / (yMax - yMin)) * PLOT_H, [yMin, yMax])
  const toWorldX = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const px = ((clientX - rect.left) / rect.width) * W
    return xMin + ((px - PAD_L) / PLOT_W) * (xMax - xMin)
  }

  const polyline = useCallback(
    (source: Compiled | CompileFailure): string[] => {
      if (!source.ok) return []
      return sampleCurve(source.fn, xMin, xMax, yMin, yMax).map((run) =>
        run.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(' '),
      )
    },
    [xMin, xMax, yMin, yMax, sx, sy],
  )

  const fRuns = useMemo(() => polyline(f), [f, polyline])
  const gRuns = useMemo(() => polyline(g), [g, polyline])

  /**
   * The filled region, split wherever f crosses g so each lobe can be coloured by
   * its sign. Seeing the negative lobes in a different colour is the entire point of
   * the signed-versus-area distinction, so it is worth the extra bookkeeping.
   */
  const regionPaths = useMemo(() => {
    if (!f.ok || !g.ok || hi <= lo) return []
    const steps = 400
    const lobes: { d: string; negative: boolean }[] = []
    let top: string[] = []
    let bottom: string[] = []
    let sign = 0

    const flush = () => {
      if (top.length > 1) {
        lobes.push({ d: `M ${top.join(' L ')} L ${[...bottom].reverse().join(' L ')} Z`, negative: sign < 0 })
      }
      top = []
      bottom = []
    }

    for (let i = 0; i <= steps; i += 1) {
      const x = lo + ((hi - lo) * i) / steps
      const fy = f.fn(x)
      const gy = g.fn(x)
      if (!Number.isFinite(fy) || !Number.isFinite(gy)) {
        flush()
        sign = 0
        continue
      }
      const here = fy === gy ? sign : fy > gy ? 1 : -1
      if (sign !== 0 && here !== 0 && here !== sign) {
        // Carry this point into the old lobe as well, so the two meet with no seam.
        top.push(`${sx(x).toFixed(2)} ${sy(fy).toFixed(2)}`)
        bottom.push(`${sx(x).toFixed(2)} ${sy(gy).toFixed(2)}`)
        flush()
      }
      sign = here || sign
      top.push(`${sx(x).toFixed(2)} ${sy(fy).toFixed(2)}`)
      bottom.push(`${sx(x).toFixed(2)} ${sy(gy).toFixed(2)}`)
    }
    flush()
    return lobes
  }, [f, g, lo, hi, sx, sy])

  const xStep = niceStep((xMax - xMin) / 10)
  const yStep = niceStep((yMax - yMin) / 8)
  const gridX: number[] = []
  for (let v = Math.ceil(xMin / xStep) * xStep; v <= xMax + 1e-9; v += xStep) gridX.push(Number(v.toFixed(6)))
  const gridY: number[] = []
  for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax + 1e-9; v += yStep) gridY.push(Number(v.toFixed(6)))

  // Midpoint-rule rectangles, drawn only when asked for.
  const stripRects = useMemo(() => {
    if (!strips || !f.ok || !g.ok || hi <= lo) return []
    const width = (hi - lo) / strips
    const out: { x: number; y: number; w: number; h: number; negative: boolean }[] = []
    for (let i = 0; i < strips; i += 1) {
      const mid = lo + width * (i + 0.5)
      const fy = f.fn(mid)
      const gy = g.fn(mid)
      if (!Number.isFinite(fy) || !Number.isFinite(gy)) continue
      const top = Math.max(fy, gy)
      const base = Math.min(fy, gy)
      out.push({
        x: sx(lo + width * i),
        y: sy(top),
        w: Math.abs(sx(lo + width) - sx(lo)),
        h: Math.abs(sy(base) - sy(top)),
        negative: fy < gy,
      })
    }
    return out
  }, [strips, f, g, lo, hi, sx, sy])

  function applyPreset(preset: (typeof shapePresets)[number]) {
    stopDemo()
    playSfx(SFX.menuClick, 0.3)
    setFSource(preset.f)
    setGSource(preset.g)
    setA(preset.a)
    setB(preset.b)
  }

  const numberField =
    'w-24 rounded border border-slate-600 bg-slate-950 px-2 py-1 font-mono text-sm text-stone-100 outline-none focus:border-cyan-600'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-stone-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-cyan-900 bg-slate-900/80 px-4 py-2.5">
        <div>
          <h2 className="font-medieval text-lg text-cyan-300">Shape Builder</h2>
          <p className="text-[11px] text-stone-500">Draw it, bound it, then make the area whatever you want.</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-xl text-stone-100">
            {result ? format(result.area, 4) : '—'}
            <span className="ml-2 text-xs text-stone-500">area of the shape</span>
          </p>
          <p className="font-mono text-[13px] text-cyan-400">
            ∫ = {result ? format(result.signed, 4) : '—'}
            <span className="ml-1 text-[11px] text-stone-500">signed</span>
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
        {/* Controls */}
        <div className="w-60 shrink-0 space-y-4 overflow-y-auto border-r border-slate-800 bg-slate-900/50 p-3 pb-20">
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-stone-500">
              f(x) — your curve
            </label>
            <input
              value={fSource}
              onChange={(e) => {
                stopDemo()
                setFSource(e.target.value)
              }}
              placeholder="x^2"
              spellCheck={false}
              className={`w-full rounded border px-2 py-1.5 font-mono text-sm outline-none ${
                f.ok || !fSource.trim()
                  ? 'border-cyan-800 bg-slate-950 text-cyan-100 focus:border-cyan-500'
                  : 'border-red-800 bg-red-950/30 text-red-200'
              }`}
            />
            {!f.ok && fSource.trim() !== '' && (
              <p className="mt-1 text-[11px] text-red-300">{f.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-stone-500">
              The other boundary
            </label>
            <input
              value={gSource}
              onChange={(e) => {
                stopDemo()
                setGSource(e.target.value)
              }}
              spellCheck={false}
              className={`w-full rounded border px-2 py-1.5 font-mono text-sm outline-none ${
                g.ok
                  ? 'border-violet-800 bg-slate-950 text-violet-100 focus:border-violet-500'
                  : 'border-red-800 bg-red-950/30 text-red-200'
              }`}
            />
            <p className="mt-1 text-[10px] leading-snug text-stone-500">
              Leave it at <span className="font-mono">0</span> for the x-axis, or put a second curve here.
            </p>
            {!g.ok && <p className="mt-1 text-[11px] text-red-300">{g.message}</p>}
          </div>

          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-stone-500">Limits</p>
            <div className="space-y-2">
              {(
                [
                  ['a', a, setA, 'text-amber-300'],
                  ['b', b, setB, 'text-emerald-300'],
                ] as const
              ).map(([name, value, set, colour]) => (
                <div key={name}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-mono text-sm ${colour}`}>{name} =</span>
                    <input
                      type="number"
                      step="0.1"
                      value={value}
                      onChange={(e) => {
                        stopDemo()
                        const next = Number(e.target.value)
                        if (Number.isFinite(next)) set(next)
                      }}
                      className={numberField}
                    />
                  </div>
                  <input
                    type="range"
                    min={xMin}
                    max={xMax}
                    step={0.05}
                    value={value}
                    onChange={(e) => {
                      stopDemo()
                      set(snap(Number(e.target.value)))
                    }}
                    className="mt-1 w-full accent-cyan-500"
                  />
                </div>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-stone-500">
              Width b − a = <span className="font-mono">{format(b - a)}</span>. You can drag the handles on the
              plot too.
            </p>
          </div>

          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-stone-500">
              Riemann strips · {strips || 'off'}
            </p>
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={strips}
              onChange={(e) => setStrips(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <p className="mt-1 text-[10px] leading-snug text-stone-500">
              Where the area comes from: add strips and watch their total close in on it.
            </p>
          </div>

          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-stone-500">View</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setXMin(xMin - (xMax - xMin) * 0.25)
                  setXMax(xMax + (xMax - xMin) * 0.25)
                }}
                className="flex-1 rounded border border-slate-700 bg-slate-900 py-1 text-xs hover:border-slate-500"
              >
                Zoom out
              </button>
              <button
                type="button"
                onClick={() => {
                  const shrink = (xMax - xMin) * 0.17
                  if (xMax - xMin > 1) {
                    setXMin(xMin + shrink)
                    setXMax(xMax - shrink)
                  }
                }}
                className="flex-1 rounded border border-slate-700 bg-slate-900 py-1 text-xs hover:border-slate-500"
              >
                Zoom in
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-stone-500">Start from</p>
            <div className="space-y-1">
              {shapePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-left text-xs text-stone-300 hover:border-slate-500"
                >
                  {preset.label}
                  <span className="ml-1 font-mono text-[10px] text-stone-500">{preset.f}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Plot */}
        <div className="relative flex min-w-0 flex-1 flex-col bg-[#0b1220] p-2">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-full w-full touch-none"
            onPointerMove={(e) => {
              if (!dragging.current) return
              const value = snap(toWorldX(e.clientX))
              if (dragging.current === 'a') setA(value)
              else setB(value)
            }}
            onPointerUp={() => {
              dragging.current = null
            }}
            onPointerLeave={() => {
              dragging.current = null
            }}
          >
            {/* Grid */}
            {gridX.map((v) => (
              <line key={`gx${v}`} x1={sx(v)} y1={PAD_T} x2={sx(v)} y2={PAD_T + PLOT_H} stroke="#1e293b" strokeWidth={1} />
            ))}
            {gridY.map((v) => (
              <line key={`gy${v}`} x1={PAD_L} y1={sy(v)} x2={PAD_L + PLOT_W} y2={sy(v)} stroke="#1e293b" strokeWidth={1} />
            ))}

            {/* Axes */}
            {yMin <= 0 && yMax >= 0 && (
              <line x1={PAD_L} y1={sy(0)} x2={PAD_L + PLOT_W} y2={sy(0)} stroke="#64748b" strokeWidth={1.5} />
            )}
            {xMin <= 0 && xMax >= 0 && (
              <line x1={sx(0)} y1={PAD_T} x2={sx(0)} y2={PAD_T + PLOT_H} stroke="#64748b" strokeWidth={1.5} />
            )}
            {gridX.map((v) => (
              <text key={`lx${v}`} x={sx(v)} y={PAD_T + PLOT_H + 16} textAnchor="middle" fontSize={11} fill="#64748b">
                {format(v, 2)}
              </text>
            ))}
            {gridY.map((v) => (
              <text key={`ly${v}`} x={PAD_L - 6} y={sy(v) + 4} textAnchor="end" fontSize={11} fill="#64748b">
                {format(v, 2)}
              </text>
            ))}

            {/* Riemann strips sit under the fill so the shape stays readable. */}
            {stripRects.map((rect, i) => (
              <rect
                key={i}
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                fill={rect.negative ? 'rgba(244,63,94,0.18)' : 'rgba(251,191,36,0.18)'}
                stroke={rect.negative ? '#f43f5e' : '#f59e0b'}
                strokeWidth={0.7}
              />
            ))}

            {/* The region itself, one path per lobe so the signs read apart */}
            {regionPaths.map((lobe, i) => (
              <path
                key={i}
                d={lobe.d}
                fill={lobe.negative ? 'rgba(244,63,94,0.24)' : 'rgba(34,211,238,0.22)'}
                stroke="none"
              />
            ))}

            {/* g(x), the boundary */}
            {gRuns.map((d, i) => (
              <path
                key={`g${i}-${gSource}`}
                d={d}
                fill="none"
                stroke="#a78bfa"
                strokeWidth={2}
                strokeDasharray={gSource.trim() === '0' ? '0' : '6 4'}
              />
            ))}

            {/* f(x), drawn on rather than simply appearing */}
            {fRuns.map((d, i) => (
              <path
                key={`f${i}-${fSource}`}
                d={d}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={2.6}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
              >
                <animate attributeName="stroke-dashoffset" from="1" to="0" dur="0.45s" fill="freeze" />
              </path>
            ))}

            {/* Limit handles */}
            {([['a', a, '#fbbf24'], ['b', b, '#34d399']] as const).map(([name, value, colour]) => (
              <g
                key={name}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  stopDemo()
                  dragging.current = name
                }}
                style={{ cursor: 'ew-resize' }}
              >
                <line x1={sx(value)} y1={PAD_T} x2={sx(value)} y2={PAD_T + PLOT_H} stroke="transparent" strokeWidth={18} />
                <line
                  x1={sx(value)}
                  y1={PAD_T}
                  x2={sx(value)}
                  y2={PAD_T + PLOT_H}
                  stroke={colour}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                />
                <rect x={sx(value) - 11} y={PAD_T + PLOT_H - 16} width={22} height={16} rx={3} fill={colour} />
                <text
                  x={sx(value)}
                  y={PAD_T + PLOT_H - 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="#0b1220"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {name}
                </text>
              </g>
            ))}

            {!ready && (
              <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={15} fill="#475569">
                Type a function on the left and it will be drawn here.
              </text>
            )}
          </svg>

          {demoing && (
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded border border-cyan-700 bg-slate-900/90 px-4 py-2 text-xs text-cyan-200">
              Watch — this is f(x) = x², being drawn as it's typed. Then it's yours.
            </div>
          )}
          {justCleared && (
            <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded border-2 border-emerald-500 bg-emerald-950/90 px-4 py-2 text-sm text-emerald-200 shadow-lg">
              ✓ {justCleared} — target cleared.
            </div>
          )}
        </div>

        {/* Readout */}
        <div className="w-72 shrink-0 space-y-3 overflow-y-auto border-l border-slate-800 bg-slate-900/50 p-3 pb-20">
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-stone-500">The two numbers</p>
            {!result ? (
              <p className="text-xs text-stone-500">Nothing drawn yet.</p>
            ) : (
              <div className="space-y-1.5">
                <div className="rounded border border-cyan-800 bg-cyan-950/30 p-2">
                  <p className="font-mono text-sm text-cyan-200">∫ = {format(result.signed, 4)}</p>
                  <p className="text-[11px] text-stone-400">
                    The definite integral. Anything below the boundary counts as negative.
                  </p>
                </div>
                <div className="rounded border border-amber-800 bg-amber-950/25 p-2">
                  <p className="font-mono text-sm text-amber-200">Area = {format(result.area, 4)}</p>
                  <p className="text-[11px] text-stone-400">
                    The size of the shaded shape, which is ∫|f − g|.
                  </p>
                </div>
                <p className="flex items-center gap-3 px-1 text-[11px] text-stone-400">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-4 rounded-sm bg-cyan-400/40" /> counts positive
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-4 rounded-sm bg-rose-400/40" /> counts negative
                  </span>
                </p>
                {result.crosses && (
                  <p className="rounded border border-rose-800 bg-rose-950/30 p-2 text-[11px] text-rose-200">
                    Your curve crosses the boundary inside these limits, so these two numbers disagree. If a
                    question asks for <em>area</em>, the integral alone is the wrong answer.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-stone-500">
              Targets · {cleared.size}/{shapeChallenges.length}
            </p>
            <div className="space-y-1.5">
              {shapeChallenges.map((challenge) => {
                const done = cleared.has(challenge.id)
                return (
                  <div
                    key={challenge.id}
                    className={`rounded border p-2 ${
                      done ? 'border-emerald-800 bg-emerald-950/30' : 'border-slate-800'
                    }`}
                  >
                    <p className={`text-xs font-semibold ${done ? 'text-emerald-300' : 'text-stone-300'}`}>
                      {done ? '✓' : '○'} {challenge.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-stone-500">
                      {done ? challenge.lesson : challenge.brief}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-stone-500">What you can type</p>
            <p className="text-[11px] leading-relaxed text-stone-500">
              <span className="font-mono text-stone-400">+ − * / ^</span>, brackets, and{' '}
              <span className="font-mono text-stone-400">sin cos tan exp ln sqrt abs</span>. Constants{' '}
              <span className="font-mono text-stone-400">pi</span> and <span className="font-mono text-stone-400">e</span>.
              <span className="font-mono text-stone-400"> 2x</span> and{' '}
              <span className="font-mono text-stone-400">3sin(x)</span> work as written.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
