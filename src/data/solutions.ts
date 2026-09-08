/**
 * Worked solutions, keyed by question id.
 *
 * These ship with the game. The rest are filled in lazily: when a question is missed
 * and has no solution here, it goes on the "wanted" list (see game/solutions.ts), and
 * whatever generates them writes into the player's local cache so each question is
 * only ever solved once.
 */

export interface Solution {
  /** The single idea that unlocks the question. */
  keyIdea: string
  /** Working, one step per line. */
  steps: string[]
}

export const bundledSolutions: Record<string, Solution> = {
  'circle-exercise-1-a-1': {
    keyIdea: 'An angle in a semicircle is a right angle — so if two chords meet at 90°, the line joining their far ends is a diameter.',
    steps: [
      'Plot the three points: (1, 2), (5, 2) and (5, −2).',
      '(1, 2) and (5, 2) share y = 2, so that segment is horizontal.',
      '(5, 2) and (5, −2) share x = 5, so that segment is vertical.',
      'These two meet at (5, 2) at a right angle, so the angle subtended at (5, 2) is 90°.',
      'By the converse of the angle-in-a-semicircle theorem, the far ends (1, 2) and (5, −2) must be the ends of a diameter.',
      'Diameter = √[(5 − 1)² + (−2 − 2)²] = √(16 + 16) = √32 = 4√2.',
      'Radius = half of that = 2√2.',
    ],
  },

  'circle-exercise-1-a-2': {
    keyIdea: 'The circle on the segment joining (x₁, y₁) and (x₂, y₂) as diameter is (x − x₁)(x − x₂) + (y − y₁)(y − y₂) = 0.',
    steps: [
      'For x² + y² − 6x − 8y − 7 = 0, compare with x² + y² + 2gx + 2fy + c = 0: 2g = −6 and 2f = −8, so the centre is (3, 4).',
      'For x² + y² − 4x − 10y − 3 = 0: 2g = −4 and 2f = −10, so the centre is (2, 5).',
      'These two centres are the ends of the required diameter.',
      'Apply the diameter form: (x − 3)(x − 2) + (y − 4)(y − 5) = 0.',
      'Expand: (x² − 5x + 6) + (y² − 9y + 20) = 0.',
      'Collect: x² + y² − 5x − 9y + 26 = 0.',
    ],
  },

  'sequence-and-series-exercise-1-a-1': {
    keyIdea: 'Consecutive integers means the common difference is 1 — then it is just the standard AP sum formula.',
    steps: [
      'First term a = p² + 1, and since the terms are consecutive integers, d = 1.',
      'Number of terms n = 2p + 1.',
      'Sₙ = (n/2)[2a + (n − 1)d] = ((2p + 1)/2)[2(p² + 1) + (2p)(1)].',
      'Inside the bracket: 2p² + 2 + 2p = 2(p² + p + 1).',
      'So Sₙ = (2p + 1)(p² + p + 1) = 2p³ + 3p² + 3p + 1.',
      'Check the options: p³ + (p + 1)³ = p³ + (p³ + 3p² + 3p + 1) = 2p³ + 3p² + 3p + 1. Same expression.',
    ],
  },

  'sequence-and-series-exercise-1-a-2': {
    keyIdea: 'In an AP, aₘ + aₙ is the same for every pair whose subscripts add to the same total.',
    steps: [
      'Look at the subscripts given: 1, 5, 10, 15, 20, 24.',
      'Pair them from the outside in: (1, 24), (5, 20), (10, 15). Each pair sums to 25.',
      'In an AP, if m + n is constant then aₘ + aₙ is constant, so all three pairs equal a₁ + a₂₄.',
      'So 3(a₁ + a₂₄) = 225, giving a₁ + a₂₄ = 75.',
      'The sum of 24 terms is S₂₄ = (24/2)(a₁ + a₂₄) = 12 × 75.',
      'S₂₄ = 900.',
    ],
  },

  'circular-motion-exercise-1-a-2': {
    keyIdea: 'Uniform angular acceleration from rest — use the rotational analogue of the SUVAT equations.',
    steps: [
      'Starting from rest, ω₀ = 0; final ω = 80 rad/s at t = 5 s.',
      'Angular acceleration α = (ω − ω₀)/t = 80/5 = 16 rad/s².',
      'Angular displacement θ = ω₀t + ½αt² = 0 + ½(16)(5²).',
      'θ = ½ × 16 × 25 = 200 rad.',
      'Quicker check: with uniform acceleration, average angular velocity is (0 + 80)/2 = 40 rad/s, and 40 × 5 = 200 rad.',
    ],
  },

  'circular-motion-exercise-1-a-4': {
    keyIdea: 'Velocity and acceleration are vectors — constant speed does not mean constant velocity.',
    steps: [
      'In uniform circular motion the speed (a scalar) stays constant.',
      'Velocity is a vector and always points along the tangent, so its direction changes continuously — velocity changes.',
      'The acceleration is centripetal, of constant magnitude v²/r, but always directed toward the centre.',
      'As the object moves round, "toward the centre" is a different direction at every instant — so acceleration changes too.',
      'Both velocity and acceleration change. Only their magnitudes stay fixed.',
    ],
  },

  'fluid-mechanics-exercise-1-b-1': {
    keyIdea: 'Mass is conserved when ice melts; volume is not. Convert mass to volume with V = m/ρ at each density.',
    steps: [
      'Volume of ice before melting = mass / density = m/x cc.',
      'When it melts the mass is unchanged, so the water has volume m/y cc.',
      'Change in volume = final − initial = m/y − m/x.',
      'Factor out m: change = m(1/y − 1/x) cc.',
      'Sanity check: ice is less dense (x < y), so 1/y − 1/x is negative — the volume decreases on melting, which is exactly why ice floats.',
    ],
  },

  'definite-integration-exercise-1-a-1': {
    keyIdea: 'Recognise the standard form ∫ dt / (t√(t² − 1)) = sec⁻¹|t| + C.',
    steps: [
      'The limits run from 1 to x, so on this interval t > 1 and |t| = t.',
      'The integral becomes ∫₁ˣ dt / (t√(t² − 1)), which is the standard arcsec integral.',
      'Antiderivative: sec⁻¹(t), evaluated from 1 to x.',
      'sec⁻¹(x) − sec⁻¹(1) = sec⁻¹(x) − 0 = sec⁻¹(x).',
      'Set sec⁻¹(x) = π/6, so x = sec(π/6) = 1 / cos(π/6).',
      'cos(π/6) = √3/2, so x = 2/√3.',
    ],
  },

  'chemical-kinetics-exercise-1-a-2': {
    keyIdea: 'Rates of disappearance and appearance are linked by the stoichiometric coefficients, and a difference of logs is the log of a ratio.',
    steps: [
      'For xA → yB, the single reaction rate is −(1/x)·d[A]/dt = (1/y)·d[B]/dt.',
      'Rearranging: −d[A]/dt = (x/y)·(d[B]/dt).',
      'Take logs of both sides: log(−d[A]/dt) = log(x/y) + log(d[B]/dt).',
      'Compare with the given relation log(−d[A]/dt) = log(d[B]/dt) + 0.3.',
      'So log(x/y) = 0.3, meaning x/y = 10^0.3 ≈ 2.',
      'Therefore x : y = 2 : 1.',
    ],
  },

  'electrochemistry-exercise-1-a-1': {
    keyIdea: 'A galvanic cell runs a spontaneous redox reaction and harvests the energy as electricity — the electrolytic cell is the reverse.',
    steps: [
      'In a galvanic (voltaic) cell the redox reaction is spontaneous, so ΔG is negative and E°cell is positive.',
      'That spontaneous chemical change drives electrons round the external circuit, producing electrical energy.',
      'So "chemical reaction produces electrical energy" is correct.',
      'The reverse — electrical energy driving a non-spontaneous reaction — describes an electrolytic cell, so that option is wrong.',
      'The remaining two options invert the electrode definitions: oxidation always occurs at the anode and reduction at the cathode, in both cell types.',
    ],
  },

  'electrochemistry-exercise-1-a-2': {
    keyIdea: 'The salt bridge has two distinct jobs: completing the circuit with ion flow, and suppressing the liquid junction potential.',
    steps: [
      'As the cell runs, the anode compartment builds up positive charge and the cathode compartment builds up negative charge.',
      'That charge separation would stop the reaction almost immediately.',
      'The salt bridge lets ions migrate between the compartments to neutralise it, completing the circuit — electrons through the external wire, ions through the bridge.',
      'It also separates the two solutions so they do not mix directly, which minimises the liquid junction potential that would otherwise develop at their interface.',
      'Both stated functions are genuine, so "both correct" is the answer.',
    ],
  },
}
