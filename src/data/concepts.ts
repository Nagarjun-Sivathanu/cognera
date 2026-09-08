/**
 * Learn Content: the concept material each chapter's NPCs teach.
 *
 * Written so the lesson leads directly into that chapter's simulation - a player who
 * has talked to every NPC should have exactly the vocabulary the simulation expects.
 * Keyed "Subject::Topic" to match game/mastery.ts.
 */

export interface ConceptSection {
  /** Which NPC delivers this - see game/npcs.ts. */
  npc: string
  heading: string
  /** What the NPC says, in order. Each entry is one dialogue beat. */
  beats: string[]
  /** Fed to the model so free-form answers stay on topic and in character. */
  context: string
}

export interface ChapterConcept {
  subject: string
  topic: string
  intro: string
  sections: ConceptSection[]
  /**
   * Townsfolk standing around the atrium who teach no script and gate nothing - they
   * only take questions, so a player who did not follow a researcher's explanation
   * has somewhere else to ask. Their beats are empty by design.
   */
  regulars?: ConceptSection[]
  /** The frog's hand-off into the simulation. */
  simulationPitch: string
  /** Which simulation to launch; undefined means none built yet. */
  simulation?: 'molecule-builder' | 'shape-builder'
}

export const chapterConcepts: Record<string, ChapterConcept> = {
  'Math::Definite Integration': {
    subject: 'Math',
    topic: 'Definite Integration',
    intro:
      'The Hall of Areas. Four of the town regulars are here, and each will tell you about the definite integral in a completely different way. Hear all four, then go and build areas yourself.',
    simulation: 'shape-builder',
    simulationPitch:
      "Enough. You've been told what an area IS four separate times now, Traveller. Go and make one. Draw a curve, drag the limits, and I'll tell you the area while you watch it change — then I'll ask you for a specific number and you'll go and find it.",
    sections: [
      {
        npc: 'oldman',
        heading: 'What a definite integral actually is',
        context:
          'Teaching the definite integral from first principles: the limit of a Riemann sum. Divide [a, b] into n strips of width (b-a)/n, take f at a sample point in each, sum the rectangles, and let n tend to infinity. The result is written as the integral from a to b of f(x) dx. It measures signed area: strips below the axis contribute negatively because f is negative there. The student will shortly build regions and watch strips converge on the area, so they need to see the integral as an accumulated sum rather than as a formula.',
        beats: [
          'Start further back than that. Before anyone shows you a rule, you should know what the thing IS — and it is not a formula. It is a sum that never stops.',
          "Take the strip of ground between x equals a and x equals b, under your curve. Chop it into n vertical slices. Each is nearly a rectangle: width (b − a) over n, height whatever f happens to be there. Add all the rectangles up. That is a Riemann sum, and it is an approximation.",
          "Now do the honest part. Let n grow without bound. The slices get thinner, the error in calling each one a rectangle shrinks toward nothing, and the sum settles on a single number. THAT number is the definite integral. The elongated S is just an S for 'sum', drawn by someone with time on their hands.",
          'And note what happens where f dips below the axis. The height is negative, so those rectangles subtract. The integral does not measure how much shape there is — it measures how much shape there is ABOVE the line, minus how much there is below. Remember that, and half the traps in this chapter stop working on you.',
        ],
      },
      {
        npc: 'woman',
        heading: 'The Fundamental Theorem, plainly',
        context:
          'Teaching the Fundamental Theorem of Calculus. The accumulation function A(x) = integral from a to x of f(t) dt has derivative f(x). Therefore if F is any antiderivative of f, the integral from a to b of f equals F(b) - F(a), written [F(x)] from a to b. The constant of integration cancels, which is why it is dropped for definite integrals. Explain plainly with everyday analogies rather than jargon.',
        beats: [
          "Let me try it a different way, because that last explanation was true and probably didn't land. You do not actually compute infinite sums. Nobody does. There's a shortcut, and it is the single best idea in this whole subject.",
          "Think of a car. Your speed at each moment is f. The distance you've covered by time x is the running total of that speed — call it A(x). Here's the point: the rate at which your distance grows IS your speed. Differentiating the accumulated area gives you back the curve. That's the Fundamental Theorem.",
          "So run it backwards. If you want the total between a and b, find any function F whose derivative is f — an antiderivative — and the answer is simply F(b) − F(a). Odometer at the end, minus odometer at the start.",
          "That's what the square brackets mean when you write them. And it's why the '+ C' vanishes here: if F works, so does F + C, and the C cancels in the subtraction. It was never going to matter, so we stop writing it.",
          "Two limits, one subtraction. An infinite sum, done in a line. That's the whole trick, and everything else in the chapter is bookkeeping around it.",
        ],
      },
      {
        npc: 'hat-man',
        heading: 'The properties worth memorising',
        context:
          'Teaching the standard properties of definite integrals with memory hooks and the reason each works: swapping the limits negates the integral; an integral from a to a is zero; splitting at an interior point c adds; constants factor out and sums split; the even/odd rule (integral from -a to a is twice the integral from 0 to a for even functions and zero for odd ones); and the king property, integral from a to b of f(x) equals integral from a to b of f(a + b - x). Always give the reason, not just the trick.',
        beats: [
          "Right! Tricks. I collect them. But I'll only give you ones I can also explain, because a trick you can't justify is a trick you'll misapply under pressure.",
          "Swap the limits, flip the sign. Walking the interval backwards makes every strip width negative, so the whole sum changes sign. And an integral from a to a is zero — no width, no area, no argument.",
          "Split anywhere you like: a to b equals a to c plus c to b. Areas simply add. Use it every single time the function changes its rule partway, or crosses the axis and you were asked for AREA rather than the integral.",
          "Now the good one. Over a symmetric interval, minus a to a: if the function is EVEN — a mirror in the y-axis, like cos or x squared — the two halves match, so it's twice the half. If it's ODD — like sin or x cubed — the halves are equal and opposite, and the whole thing is zero. Spot an odd function over a symmetric interval and you can write down 0 without integrating anything. Free marks. Take them.",
          "Last one, the king property: a to b of f(x) equals a to b of f(a + b − x). You're reading the interval right to left. Add the two versions together and the awkward part often cancels itself out. It looks like sorcery the first time and like arithmetic the fifth.",
        ],
      },
      {
        npc: 'bearded',
        heading: 'Where the marks actually go',
        context:
          "Teaching what definite integration questions are really testing and how marks are lost: confusing the signed integral with the geometric area (must split at the roots and integrate |f|); forgetting to change the limits after a substitution, or changing them and also back-substituting; integrating across a discontinuity or asymptote as if nothing happened; the area between two curves being the integral of upper minus lower, with the roles swapping where the curves cross; and sign errors from evaluating F(a) - F(b) instead of F(b) - F(a).",
        beats: [
          "You want to know what the examiner is testing. Good. It is almost never whether you can integrate — it is whether you noticed which question you were asked.",
          "The biggest one: AREA is not the same as the INTEGRAL. If the curve crosses the axis between your limits, the parts below cancel the parts above and the integral shrinks. If the question says area, you find the roots, split there, and add the sizes. Students who skip that lose the whole question, not part of it.",
          "Substitution. Change the variable and you must change the limits with it — or convert back before you evaluate. Doing neither, or doing both, is the most common sign of a rushed script I see.",
          "Between two curves, it is always upper minus lower. Where they cross, the roles swap, so you split at the crossing. Getting a negative area should stop you dead — a shape cannot have negative size, so you have subtracted the wrong way round.",
          "And the plain one: it is F(b) − F(a). Upper first. An entire answer can be perfect and score nothing because it came out with the wrong sign at the last line.",
        ],
      },
    ],
    regulars: [
      {
        npc: 'smith',
        heading: 'Blunt answers only',
        beats: [],
        context:
          'Definite integration. Answer questions about Riemann sums, the Fundamental Theorem, antiderivatives, the standard properties, substitution with limits, and area between curves. Keep it short and concrete; give the step that unblocks them and nothing more.',
      },
      {
        npc: 'maid',
        heading: 'The method, step by step',
        beats: [],
        context:
          'Definite integration, as a procedure. Given a problem, lay out the steps in order: identify whether area or the integral is wanted, find the roots if the curve crosses, choose a substitution and convert the limits, find the antiderivative, then evaluate upper minus lower. Explain it as a recipe that can be followed.',
      },
    ],
  },

  'Chemistry::General Organic Chemistry I': {
    subject: 'Chemistry',
    topic: 'General Organic Chemistry I',
    intro:
      'The Atrium of Bonds. Four researchers here each hold one piece of how organic molecules behave. Talk to all of them, then the frog will let you build molecules yourself.',
    simulation: 'molecule-builder',
    simulationPitch:
      "Right, Traveller. Enough talking. You've been told what a functional group is — now go and MAKE one. Bond some atoms together and I'll tell you what you've built, then you can throw reagents at it and watch what happens.",
    sections: [
      {
        npc: 'smith',
        heading: 'Atoms and their bonds',
        context:
          'Teaching valency: carbon forms 4 bonds, nitrogen 3, oxygen 2, halogens and hydrogen 1. Bonds can be single, double or triple, and a double bond uses two of an atom\'s available slots. The student will shortly build molecules by connecting C, H, O, N and halogens, so they need to know how many connections each atom can take.',
        beats: [
          "You want to build molecules? Then you learn the metal first. Every atom has a fixed number of bonds it can make. That number is not a suggestion.",
          "Carbon takes FOUR. Nitrogen takes three. Oxygen takes two. Hydrogen and the halogens — fluorine, chlorine, bromine, iodine — take exactly one each. That's your whole toolkit.",
          "A single bond spends one slot on each atom. A double bond spends two. A triple bond spends three. So a carbon with one double bond has two slots left, not three.",
          "Get the count wrong and what you've drawn doesn't exist. The structure has to satisfy every atom at once, or it isn't a molecule — it's a mistake with lines on it.",
        ],
      },
      {
        npc: 'bard',
        heading: 'Functional groups',
        context:
          'Teaching that a functional group is a specific arrangement of atoms that determines a molecule\'s chemistry. Key groups: alcohol (C-O-H), aldehyde (terminal C=O with H), ketone (internal C=O), carboxylic acid (C=O plus O-H on the same carbon), amine (C-N), alkene (C=C), alkyne (C triple bond C), haloalkane (C-X). The student will build these and have them recognised by name.',
        beats: [
          "Ahh, a builder! Then let me sing you the only verse that matters: a molecule's behaviour lives in its FUNCTIONAL GROUP, not in the boring carbon skeleton around it.",
          "A carbon bonded to an oxygen which is bonded to a hydrogen — C, O, H in a chain — that is an ALCOHOL. It doesn't matter if the rest is two carbons or twenty. Alcohol is alcohol.",
          "A carbon double-bonded to an oxygen is a CARBONYL. If it sits at the end of the chain wearing a hydrogen, it's an ALDEHYDE. If it sits in the middle between two carbons, it's a KETONE. Same two atoms — position changes the name and the chemistry.",
          "Put a carbonyl AND an O-H on the very same carbon and you have a CARBOXYLIC ACID, the loudest group in the repertoire. A carbon to a nitrogen gives an AMINE. A carbon double-bonded to a carbon is an ALKENE, tripled is an ALKYNE.",
          "Learn to spot the group and you can predict the reaction. Ignore it, and you're memorising a thousand unrelated facts. I know which I'd rather.",
        ],
      },
      {
        npc: 'chopper',
        heading: 'Electronic effects',
        context:
          'Teaching inductive effect (through sigma bonds, weakens with distance, -I withdrawing like NO2/CN/halogens, +I donating like alkyl), resonance/mesomeric effect (delocalisation through pi systems, no weakening with distance, usually dominates over induction), and hyperconjugation (sigma C-H electrons into an adjacent empty or pi orbital, giving carbocation stability 3>2>1>methyl).',
        beats: [
          "Everything in organic chemistry comes down to where the electrons went. Follow the electrons and the answers follow you.",
          "The INDUCTIVE effect is pull through the single bonds. Electronegative things — halogens, nitro groups, cyano — drag electron density toward themselves. That's minus-I. Alkyl groups push it away: plus-I. It weakens fast with distance; three bonds away it barely matters.",
          "RESONANCE is different. That's delocalisation through pi systems and lone pairs, and it does NOT fade with distance. When resonance and induction disagree, resonance almost always wins. Most people get this backwards and lose the mark.",
          "HYPERCONJUGATION is sigma C-H electrons leaning into an adjacent empty orbital. More alpha hydrogens means more of it — which is exactly why carbocation stability runs tertiary, then secondary, then primary, then methyl.",
        ],
      },
      {
        npc: 'maid',
        heading: 'Reagents and transformations',
        context:
          'Teaching that reagents convert one functional group into another, and the student will apply these in the simulation. Core transformations: alcohol + oxidising agent (KMnO4/K2Cr2O7) gives aldehyde then carboxylic acid; aldehyde/ketone + reducing agent (NaBH4/LiAlH4) gives alcohol; alkene + H2/Pd gives alkane; alkene + HBr gives haloalkane (Markovnikov); haloalkane + aqueous KOH gives alcohol; carboxylic acid + alcohol gives ester.',
        beats: [
          "Everything on this tray is a reagent, and every reagent has exactly one job: turn one functional group into another. That's all a reaction is.",
          "Oxidise an alcohol — potassium permanganate, potassium dichromate — and it climbs. Primary alcohol becomes an aldehyde, and if you keep pushing, a carboxylic acid. Oxidation adds oxygen or strips hydrogen.",
          "Reduce it and it goes back down. Sodium borohydride or lithium aluminium hydride turn an aldehyde or ketone back into an alcohol. Reduction adds hydrogen.",
          "An alkene is hungry. Hydrogen over palladium saturates it to an alkane. Add HBr instead and you get a haloalkane — and the hydrogen goes to the carbon that already has more hydrogens. That's Markovnikov's rule, and yes, the rich get richer.",
          "Treat a haloalkane with aqueous potassium hydroxide and it becomes an alcohol again. Everything here is a loop, Traveller. Learn the loop and you can walk it in either direction.",
        ],
      },
    ],
    regulars: [
      {
        npc: 'woman',
        heading: 'Ask it another way',
        beats: [],
        context:
          'General Organic Chemistry I: valency (C 4, N 3, O 2, H and halogens 1), functional groups (alcohol, aldehyde, ketone, carboxylic acid, ester, amine, alkene, alkyne, haloalkane), electronic effects (inductive, resonance, hyperconjugation), and reagent transformations (oxidation, reduction, addition, substitution, elimination). The student has just been taught this by four researchers and may not have followed one of them. Re-explain whatever they ask in a different way from a textbook, checking first what they already understand.',
      },
      {
        npc: 'oldman',
        heading: 'Back to first principles',
        beats: [],
        context:
          'General Organic Chemistry I, taken from the foundations upward: why an atom has a fixed number of bonds at all, why electron density moves, why a functional group determines reactivity, why oxidation and reduction are the same ladder in two directions. Rebuild the answer from the underlying principle rather than giving a rule to memorise.',
      },
      {
        npc: 'hat-man',
        heading: 'Tricks for remembering',
        beats: [],
        context:
          'General Organic Chemistry I. Give a short correct explanation and then a memory hook for it: valency counts, the order of the oxidation ladder (primary alcohol to aldehyde to carboxylic acid), Markovnikov (the rich get richer), carbocation stability order (tertiary > secondary > primary > methyl), aqueous KOH substitutes while alcoholic KOH eliminates. Always say why the trick works so it is not memorisation alone.',
      },
      {
        npc: 'bearded',
        heading: 'What the exam is testing',
        beats: [],
        context:
          'General Organic Chemistry I, from an examiner\'s side. Common ways marks are lost: drawing a structure that violates valency, missing that resonance beats induction, forgetting that tertiary alcohols resist oxidation, confusing aqueous and alcoholic KOH, applying Markovnikov backwards, and naming a functional group by the atoms present rather than by how they are arranged. Say what a question is really testing before answering it.',
      },
    ],
  },
}

export function getChapterConcept(subject: string, topic: string): ChapterConcept | undefined {
  return chapterConcepts[`${subject}::${topic}`]
}
