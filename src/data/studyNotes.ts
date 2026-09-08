/**
 * Hand-written revision notes, one per chapter in the question bank.
 *
 * These ship with the game as static content: no API, no key, no network. The frog
 * surfaces the note for whichever chapter you keep losing ground on, so a run of bad
 * answers turns into something you can actually study from.
 *
 * Keyed by `${subject}::${topic}` to match the topic keys in game/mastery.ts.
 */

export interface StudyNote {
  /** What the chapter is really testing, in one line. */
  summary: string
  concepts: { title: string; detail: string }[]
  /** Where marks are most commonly lost. */
  traps: string[]
}

export const studyNotes: Record<string, StudyNote> = {
  'Math::Circle': {
    summary:
      'Coordinate geometry of circles: writing the equation, finding intersections, and handling tangents.',
    concepts: [
      {
        title: 'The two standard forms',
        detail:
          'Centre-radius: (x − h)² + (y − k)² = r². General: x² + y² + 2gx + 2fy + c = 0, which has centre (−g, −f) and radius √(g² + f² − c). Converting between them by completing the square is the single most useful move in this chapter.',
      },
      {
        title: 'Real circle condition',
        detail:
          'g² + f² − c must be positive for a real circle. If it equals zero you have a point circle; if negative, no real locus exists. Questions often hide a constraint here.',
      },
      {
        title: 'Tangency',
        detail:
          'A line is tangent to a circle exactly when the perpendicular distance from the centre to the line equals the radius. Use the distance formula |ax₀ + by₀ + c| / √(a² + b²) rather than substituting and forcing a repeated root — it is far quicker.',
      },
      {
        title: 'Tangents from an external point',
        detail:
          'From a point outside, two tangents exist; on the circle, one; inside, none. Length of the tangent from (x₁, y₁) is √(S₁) where S₁ is the circle equation evaluated at that point.',
      },
      {
        title: 'Intercepts on the axes',
        detail:
          'x-intercept length is 2√(g² − c) and y-intercept length is 2√(f² − c). A circle touches an axis when the corresponding intercept is zero.',
      },
    ],
    traps: [
      'Forgetting that the general form uses 2g and 2f, so the centre is (−g, −f) and not (−2g, −2f).',
      'Taking √(g² + f² − c) without checking the sign first — a negative value means the question has no real circle.',
      'Counting tangents without first testing whether the point is inside, on, or outside the circle.',
      'Sign slips when completing the square; always expand your answer back to check.',
    ],
  },

  'Math::Definite Integration': {
    summary:
      'Evaluating definite integrals, largely by exploiting symmetry and standard properties rather than brute-force antiderivatives.',
    concepts: [
      {
        title: 'The king property',
        detail:
          '∫₀ᵃ f(x) dx = ∫₀ᵃ f(a − x) dx. Adding the original and the transformed integral often collapses a horrible integrand into a constant. This single property solves a large share of exam questions.',
      },
      {
        title: 'Even and odd symmetry',
        detail:
          'Over a symmetric interval [−a, a]: an odd integrand gives 0, and an even integrand gives 2∫₀ᵃ. Always check parity before integrating anything — it can turn a page of work into one line.',
      },
      {
        title: 'Periodic functions',
        detail:
          'If f has period T, then ∫₀ⁿᵀ f(x) dx = n∫₀ᵀ f(x) dx. Useful whenever trigonometric functions appear over large intervals.',
      },
      {
        title: 'Leibniz rule',
        detail:
          'To differentiate ∫_{u(x)}^{v(x)} f(t) dt with respect to x: f(v)·v′ − f(u)·u′. Needed whenever the integral itself is the function being analysed.',
      },
      {
        title: 'Definite integral as a limit of a sum',
        detail:
          'lim(n→∞) (1/n)·Σ f(r/n) = ∫₀¹ f(x) dx. Recognising a sum in this shape converts a series problem into an integral.',
      },
    ],
    traps: [
      'Applying the king property with the wrong limits — it needs the interval [0, a], so shift first if necessary.',
      'Declaring an integrand odd without checking it over the whole interval, particularly with modulus or piecewise definitions.',
      'Ignoring discontinuities inside the limits; split the integral at every break point.',
      'Dropping the derivative factors v′ and u′ when applying Leibniz.',
    ],
  },

  'Math::Limits, Continuity and Derivability': {
    summary:
      'Evaluating limits, and testing whether a function is continuous and differentiable — especially at awkward points.',
    concepts: [
      {
        title: 'Indeterminate forms',
        detail:
          'Only 0/0, ∞/∞, 0·∞, ∞ − ∞, 1^∞, 0⁰ and ∞⁰ are indeterminate. Anything else can be evaluated directly. Identify the form before choosing a method.',
      },
      {
        title: 'Standard limits worth memorising',
        detail:
          'lim(x→0) sin x / x = 1, lim(x→0) (1 − cos x)/x² = 1/2, lim(x→0) (eˣ − 1)/x = 1, lim(x→0) ln(1 + x)/x = 1, lim(x→0) (aˣ − 1)/x = ln a. Most exam limits reduce to one of these.',
      },
      {
        title: 'The 1^∞ form',
        detail:
          'For lim f(x)^g(x) of the form 1^∞, the answer is e^(lim g(x)·[f(x) − 1]). This is faster and safer than taking logs by hand.',
      },
      {
        title: 'Continuity',
        detail:
          'f is continuous at a when the left limit, the right limit, and f(a) all exist and are equal. For piecewise functions, test precisely at the join.',
      },
      {
        title: 'Differentiability implies continuity',
        detail:
          'Differentiable ⇒ continuous, but never the reverse. |x| at x = 0 is the standard counterexample: continuous, not differentiable. Check the left- and right-hand derivatives separately at corners.',
      },
    ],
    traps: [
      'Applying L’Hôpital to something that is not actually indeterminate.',
      'Assuming continuity is enough for differentiability — corners and cusps break it.',
      'Only checking one side of a piecewise point; both one-sided limits must be computed.',
      'Cancelling a factor that is zero at the limiting point without justifying it.',
    ],
  },

  'Math::Sequence and Series': {
    summary: 'Arithmetic, geometric and harmonic progressions, their sums, and standard inequalities.',
    concepts: [
      {
        title: 'AP essentials',
        detail:
          'nth term aₙ = a + (n − 1)d. Sum Sₙ = (n/2)[2a + (n − 1)d] = (n/2)(first + last). If three terms are in AP, write them as a − d, a, a + d to cut the algebra.',
      },
      {
        title: 'GP essentials',
        detail:
          'nth term aₙ = ar^(n−1). Sum Sₙ = a(rⁿ − 1)/(r − 1) for r ≠ 1. Infinite sum S∞ = a/(1 − r) exists only when |r| < 1 — always state that condition.',
      },
      {
        title: 'AM ≥ GM ≥ HM',
        detail:
          'For positive numbers, the arithmetic mean is at least the geometric mean, which is at least the harmonic mean, with equality only when all terms are equal. This is the standard route into optimisation and inequality questions.',
      },
      {
        title: 'Standard summations',
        detail:
          'Σn = n(n + 1)/2, Σn² = n(n + 1)(2n + 1)/6, Σn³ = [n(n + 1)/2]². Many series reduce to combinations of these after splitting the general term.',
      },
      {
        title: 'Telescoping',
        detail:
          'If the general term can be written as f(n) − f(n + 1), almost everything cancels and only the endpoints survive. Partial fractions is usually how you get there.',
      },
    ],
    traps: [
      'Using S∞ = a/(1 − r) without checking |r| < 1.',
      'Off-by-one errors in the number of terms — count carefully with (last − first)/d + 1.',
      'Applying AM ≥ GM to terms that are not all positive.',
      'Confusing the harmonic progression with its reciprocal AP; work with the AP of reciprocals.',
    ],
  },

  'Physics::Circular Motion': {
    summary: 'Motion on a circular path: the forces required, and where the common misconceptions live.',
    concepts: [
      {
        title: 'Centripetal acceleration',
        detail:
          'a = v²/r = ω²r, always directed toward the centre. The net inward force must supply exactly this; it is not an extra force of its own.',
      },
      {
        title: 'Identify the real force',
        detail:
          'Centripetal force is a role, not a new force. Ask what physically provides it — tension, friction, gravity, the normal force, or a component of one of these.',
      },
      {
        title: 'Vertical circles',
        detail:
          'At the top of a vertical loop the minimum speed for maintaining contact is v = √(gr), where gravity alone supplies the centripetal force. Below that, the object leaves the path.',
      },
      {
        title: 'Banking',
        detail:
          'For a frictionless banked turn, tan θ = v²/(rg). With friction the safe range of speeds widens on both sides.',
      },
      {
        title: 'Tangential vs radial',
        detail:
          'In non-uniform circular motion the total acceleration has a radial component (v²/r, changing direction) and a tangential component (dv/dt, changing speed). Combine them with Pythagoras.',
      },
    ],
    traps: [
      'Adding "centrifugal force" in a ground frame — it only exists in the rotating frame.',
      'Drawing the centripetal force as an extra arrow in a free-body diagram instead of identifying which real force plays the role.',
      'Using v²/r with speed measured in the wrong units, or confusing ω (rad/s) with revolutions per second.',
      'Assuming uniform speed in a vertical circle — gravity changes it continuously.',
    ],
  },

  'Physics::Fluid Mechanics': {
    summary: 'Fluids at rest and in motion: pressure, buoyancy, and the flow equations.',
    concepts: [
      {
        title: 'Hydrostatic pressure',
        detail:
          'P = P₀ + ρgh. Pressure depends only on depth, not on the shape or volume of the container — the hydrostatic paradox.',
      },
      {
        title: 'Archimedes’ principle',
        detail:
          'Buoyant force equals the weight of fluid displaced: F = ρ_fluid · V_displaced · g. A floating body displaces its own weight; a submerged one displaces its own volume.',
      },
      {
        title: 'Continuity',
        detail:
          'For incompressible flow, A₁v₁ = A₂v₂. Narrower pipe means faster flow. This is conservation of mass, not of energy.',
      },
      {
        title: 'Bernoulli’s equation',
        detail:
          'P + ½ρv² + ρgh = constant along a streamline. Faster flow means lower pressure. Valid only for steady, non-viscous, incompressible flow.',
      },
      {
        title: 'Viscosity and terminal velocity',
        detail:
          'Stokes’ drag F = 6πηrv. A sphere falling in a fluid reaches terminal velocity when drag plus buoyancy balances weight.',
      },
    ],
    traps: [
      'Using gauge pressure where absolute pressure is needed, or vice versa.',
      'Applying Bernoulli across a viscous or turbulent region where it does not hold.',
      'Using the object’s full volume in the buoyancy formula when it is only partially submerged.',
      'Forgetting that continuity constrains speed before Bernoulli can give you pressure.',
    ],
  },

  'Chemistry::Chemical Kinetics': {
    summary: 'How fast reactions go: rate laws, order, half-life, and temperature dependence.',
    concepts: [
      {
        title: 'Order is experimental',
        detail:
          'The rate law rate = k[A]^m[B]^n has exponents found by experiment, not read off the balanced equation. Only for an elementary step do they match the stoichiometric coefficients.',
      },
      {
        title: 'First-order kinetics',
        detail:
          'k = (2.303/t)·log([A]₀/[A]). Half-life t½ = 0.693/k is independent of starting concentration — the signature of first order.',
      },
      {
        title: 'Zero and second order',
        detail:
          'Zero order: [A] = [A]₀ − kt, with t½ = [A]₀/2k. Second order: 1/[A] = 1/[A]₀ + kt, with t½ = 1/(k[A]₀). Note how half-life depends on concentration differently in each case.',
      },
      {
        title: 'Arrhenius equation',
        detail:
          'k = A·e^(−Ea/RT). A plot of ln k against 1/T is a straight line of slope −Ea/R. For two temperatures, log(k₂/k₁) = (Ea/2.303R)·(1/T₁ − 1/T₂).',
      },
      {
        title: 'Rate-determining step',
        detail:
          'The overall rate is governed by the slowest step in the mechanism. A proposed mechanism is only valid if its rate-determining step reproduces the experimental rate law.',
      },
    ],
    traps: [
      'Reading the order off the balanced equation for a non-elementary reaction.',
      'Mixing up units of k — they differ by order (s⁻¹ for first, M⁻¹s⁻¹ for second).',
      'Assuming half-life is always concentration-independent; that is only true for first order.',
      'Using temperature in Celsius in the Arrhenius equation instead of kelvin.',
    ],
  },

  'Chemistry::Electrochemistry': {
    summary: 'Redox reactions driving or driven by electricity: cell potentials, the Nernst equation, and electrolysis.',
    concepts: [
      {
        title: 'Cell potential',
        detail:
          'E°cell = E°cathode − E°anode, using reduction potentials throughout. A positive E°cell means the reaction is spontaneous as written.',
      },
      {
        title: 'Nernst equation',
        detail:
          'E = E° − (0.0591/n)·log Q at 298 K, where n is the number of electrons transferred. At equilibrium E = 0 and Q = K, which gives log K = nE°/0.0591.',
      },
      {
        title: 'Thermodynamic link',
        detail:
          'ΔG° = −nFE°, with F = 96500 C/mol. This is the bridge between electrochemistry and thermodynamics, and a very common question route.',
      },
      {
        title: 'Faraday’s laws',
        detail:
          'Mass deposited = (molar mass × charge) / (n × F), with charge = current × time. Equivalents, not moles, are what get compared across different electrodes in series.',
      },
      {
        title: 'Conductivity',
        detail:
          'Molar conductivity Λm = κ × 1000 / concentration, and it rises on dilution. For weak electrolytes, degree of dissociation α = Λm / Λ°m.',
      },
    ],
    traps: [
      'Reversing the sign when the anode reaction is written as an oxidation — always convert to reduction potentials first.',
      'Getting n wrong; it is the electrons transferred in the balanced overall reaction, not per species.',
      'Confusing the cathode’s sign between galvanic (positive) and electrolytic (negative) cells.',
      'Forgetting to convert time to seconds in Faraday calculations.',
    ],
  },

  'Chemistry::Environmental Chemistry': {
    summary: 'Pollutants, where they come from, and the chemistry of the damage they do.',
    concepts: [
      {
        title: 'Atmospheric layers and ozone',
        detail:
          'Stratospheric ozone absorbs UV and is beneficial; tropospheric ozone is a pollutant. Chlorofluorocarbons release chlorine radicals that catalytically destroy stratospheric ozone.',
      },
      {
        title: 'Acid rain',
        detail:
          'Caused mainly by SO₂ and NOₓ forming sulfuric and nitric acids. Rain below roughly pH 5.6 counts as acid rain, since normal rain is already slightly acidic from dissolved CO₂.',
      },
      {
        title: 'Photochemical smog',
        detail:
          'Oxidising smog formed from NOₓ and hydrocarbons in sunlight. Its markers are ozone, PAN (peroxyacetyl nitrate) and aldehydes. Distinguish it from classical reducing smog, which is SO₂ and smoke.',
      },
      {
        title: 'Water quality measures',
        detail:
          'BOD is the oxygen demanded by microbes breaking down organic matter; clean water has low BOD. Eutrophication is nutrient enrichment (phosphates, nitrates) causing algal blooms that deplete dissolved oxygen.',
      },
      {
        title: 'Greenhouse gases',
        detail:
          'CO₂, CH₄, N₂O, water vapour and CFCs absorb infrared re-radiated from the Earth. Methane is far more potent per molecule than carbon dioxide.',
      },
    ],
    traps: [
      'Treating all ozone as harmful — the stratospheric layer is protective.',
      'Confusing photochemical (oxidising) smog with classical (reducing) smog and their markers.',
      'Assuming high BOD means clean water; it is the reverse.',
      'Mixing up eutrophication’s cause (nutrients) with its effect (oxygen depletion).',
    ],
  },

  'Chemistry::General Organic Chemistry I': {
    summary:
      'The reasoning tools behind all of organic chemistry: electronic effects, stability, and how they decide reactivity.',
    concepts: [
      {
        title: 'Inductive effect',
        detail:
          'Permanent polarisation transmitted through sigma bonds, weakening rapidly with distance. −I groups (NO₂, CN, halogens) withdraw; +I groups (alkyl) donate.',
      },
      {
        title: 'Resonance and mesomeric effect',
        detail:
          'Delocalisation of pi or lone-pair electrons, transmitted through the conjugated system without weakening. Resonance stabilises, and more significant contributing structures means greater stability.',
      },
      {
        title: 'Hyperconjugation',
        detail:
          'Delocalisation of sigma C−H electrons into an adjacent empty or pi orbital. More alpha hydrogens means more hyperconjugation, which is why carbocation stability runs 3° > 2° > 1° > methyl.',
      },
      {
        title: 'Acidity and basicity',
        detail:
          'An acid is stronger when its conjugate base is more stable. Electron-withdrawing groups stabilise the anion and increase acidity; this is why phenol is more acidic than ethanol and carboxylic acids more acidic still.',
      },
      {
        title: 'Aromaticity',
        detail:
          'Requires a cyclic, planar, fully conjugated system with (4n + 2) pi electrons — Hückel’s rule. Aromatic systems are markedly stabilised; antiaromatic (4n) ones are destabilised.',
      },
    ],
    traps: [
      'Ranking stability on inductive effects when resonance is present — resonance almost always dominates.',
      'Forgetting planarity when testing aromaticity; a non-planar ring cannot be aromatic however many pi electrons it has.',
      'Comparing acid strength by looking at the acid rather than the stability of its conjugate base.',
      'Assuming carbanion stability follows the same order as carbocation stability — it is the reverse.',
    ],
  },
}

export function getStudyNote(subject: string, topic: string): StudyNote | undefined {
  return studyNotes[`${subject}::${topic}`]
}
