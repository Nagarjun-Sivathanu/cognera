# Cognera

**A dungeon crawler where the combat system is a diagnostic instrument.**

Cognera is a turn-based RPG in which every attack is a question from a real exam
syllabus, and every wrong answer is recorded, explained, and taught back. The game
layer is not a wrapper around a quiz — it is the reporting surface for a model of
what the student does and does not understand.

Built on a JEE-level bank of **942 questions across ten chapters** of Mathematics,
Physics and Chemistry. Biology is scaffolded end to end — subject, dungeons, tiers — and
awaiting content.

---

## The educational design

Most gamified learning bolts points and streaks onto a flashcard app. The extrinsic
reward carries the session, and when it is removed nothing has been learned. Cognera
is built the other way round: the reward mechanics are driven by, and report on,
genuine understanding.

### Difficulty is not cosmetic

An encounter is generated from a **difficulty budget**, filled by drawing enemies whose
individual difficulty values sum to it. A budget of 4 might be one difficulty-4 enemy or
four difficulty-1 enemies. Each enemy carries its own HP and damage, and the questions
it asks are drawn from its own difficulty band.

The consequence is that difficulty is felt as *pacing* rather than announced as a label.
A hard encounter is longer, asks harder questions, and punishes a wrong answer more.
The player's attack power — from level, gear and skills — decides how many correct
answers an enemy takes to fell, so growing stronger genuinely shortens the fight.

### Failure is the input, not the punishment

The loop most learning apps get wrong is what happens after a wrong answer. Cognera
treats the mistake as the beginning of the work:

1. **The moment an answer is wrong**, a worked solution is requested — cache first,
   then bundled solutions, then the model. Every solution is stored against the
   question id, so a given question is solved once and never recomputed, however many
   times it resurfaces.
2. **At the end of the run**, the Frog Wizard reviews the run: which topics failed,
   what the underlying concept was, and what to do about it.
3. **Across runs**, per-topic mastery is tracked as a rolling accuracy. A topic the
   player struggled with (under 50% over at least three attempts) and has since
   answered correctly four times running is surfaced explicitly as an improvement.
   Progress the student cannot feel is progress they will not believe.
4. **The mistake log persists**, grouped by topic, so a weakness that recurs across
   sessions is visible as a pattern rather than as a series of unrelated bad days.

### Teaching before testing

A chapter is not only a question bank. Where a lesson exists, the chapter offers
**Learn Content** as an alternative to the dungeon — a side-scrolling hall in which
four characters each teach one part of the chapter, in sequence, in their own voice.

The voices are a pedagogical device rather than decoration. The same material is
delivered four ways, because the explanation that lands varies by student:

| Angle | Delivered by |
| --- | --- |
| First principles, rebuilt from the foundation | a scholar who refuses shortcuts |
| Plain restatement with everyday analogies | a tutor who explains it a second way |
| Mnemonics, each with the reason it works | a collector of memory tricks |
| What the examiner is testing, and where marks go | a marker of thousands of papers |

Once a character's scripted lesson finishes, the panel becomes a **live conversation**.
The student can push back, ask for a different framing, or query an edge case, and the
answer comes back in that character's voice with the chapter's concept context pinned
into the system prompt. Subject specialists — a bondsmith who explains valency in
metalwork terms, a bard who treats functional groups as verses — stand alongside them.

Progression through the hall is gated: the simulation at the end does not unlock until
every teaching character has been heard.

### Simulations, not animations

The end of each chapter's hall is an interactive model of the concept. The student
constructs and manipulates the object of study rather than watching it.

**Molecule Builder** — *General Organic Chemistry I.* Place atoms from C, H, O, N and
the halogens; join them with single, double or triple bonds. Valency is enforced, not
displayed: a bond that would overspend an atom is refused by name. Thirteen functional
groups are recognised from the graph in IUPAC seniority order, so a carbonyl carrying an
O–H reads as a carboxylic acid rather than as an aldehyde plus an alcohol. Nine reagents
then transform the structure for real — the oxidation ladder, reduction, addition,
substitution, elimination — each rendered as *reactant → reagent → product* with an
explanation of what moved. Reagents with nothing to act on refuse and say what they were
looking for; a tertiary alcohol is turned away because its carbinol carbon has no
hydrogen left to strip.

**Shape Builder** — *Definite Integration.* Type a function, choose the other boundary,
and drag the limits while the region between them is filled and measured live. The
signed integral and the area of the shape are shown side by side, with positive lobes
and negative lobes coloured apart, because that distinction is the single largest source
of lost marks in the chapter. A Riemann-strip overlay makes the definition visible: add
strips and watch their total close on the integral. Four targets ask for specific
geometry — an area of exactly 50, an integral that vanishes while the shape stays large,
the largest area that fits under a height cap.

Both simulations are verified against known-correct results in CI-ready check scripts
(see [Verification](#verification)). A simulation that teaches the wrong thing is worse
than no simulation.

### Onboarding without a manual

A first-time player is walked through the real interface rather than a mock of it.
Everything on screen is desaturated except the element being explained, which keeps its
colour and takes a highlight ring; the tour then waits for the player to actually perform
the action. It follows them across screens, so navigating ahead never strands it.

---

## Game systems

**Characters.** Five playable bodies — Adventurer, Fire Knight, Ground Monk, Leaf Ranger,
Wind Hashashin — with distinct attack/HP multipliers and roles, rendered at their true
relative proportions from a shared zoom. Each has its own skill school; the Ranger fires
a projectile that crosses the field so ranged attacks visibly connect. Characters can be
swapped mid-battle on a cooldown, which makes the choice a tactical decision rather than
a costume change.

**Combat actions.** Wind Up (higher payoff, higher risk), Dodge, Bag, Swap, an active
skill spent from a Focus bar built by answer streaks, and Retreat.

**Progression.** XP and levels, a passive skill tree, and seven equipment slots with five
rarity tiers rolled on a table weighted by dungeon tier. The original Adventurer sprite
supports modular armour layers rendered over the base body and tinted by rarity.

**Modes.** Dungeon Mode across four tiers (Easy, Medium, Moderate, Hard) by subject and
chapter or as mixed Total Revision; Sandbox Mode with escalating waves and loot that
scales off waves survived; Learn Content where a chapter has a lesson written.

---

## Architecture

```
src/
  components/   React views: screens, HUD, sprite renderer, both simulations
  game/         Pure domain logic — no React, no I/O
  data/         Question bank, enemies, skills, concepts, solutions, study notes
  store/        Zustand stores (game state, UI preferences)
  services/     SaveService interface, localStorage implementation
scripts/        Python asset pipelines and TypeScript verification suites
```

The rule the codebase holds to is that `src/game/` contains no React and no I/O. Combat
maths, loot rolls, mastery tracking, chemistry graph analysis and the calculus engine are
all plain functions over plain data, which is what makes them testable from Node without
a browser.

### Notable modules

| Module | Responsibility |
| --- | --- |
| `game/combat.ts` | Encounter generation from a difficulty budget, damage, Focus, XP |
| `game/mastery.ts` | Per-topic rolling accuracy and improvement detection |
| `game/solutions.ts` | Cache-first solution resolution with in-flight de-duplication |
| `game/molecules.ts` | Molecular graph, valency, formula, functional-group recognition, naming |
| `game/reagents.ts` | Reagents as graph transformations, with explanations and refusals |
| `game/calculus.ts` | Tokeniser, recursive-descent parser, Simpson integration |
| `game/characters.ts` | Character definitions, animation resolution with fallback chains |
| `components/Sprite.tsx` | Content-box sprite renderer |

### Sprite rendering

Art is drawn from several packs with different frame sizes and inconsistent in-frame
anchoring. Rendering by frame therefore produces sprites that jump and resize between
animations, and large sprites that render mostly off-screen.

`Sprite.tsx` instead treats a measured **content box** as the element's box: the sprite is
scaled and aligned by the drawn pixels, not the frame, and every animation of a character
shares one box so switching animation never moves the character. Pixels may deliberately
overflow it — a sword swing, an impact effect — which is why layers are
`pointer-events: none`. The boxes are measured by the Python pipelines in `scripts/`,
which slice source packs into strips and print the geometry the renderer needs.

### Expression parsing

The Shape Builder accepts typed functions, so it needs to turn text into a curve.
It does this with a tokeniser and a recursive-descent parser compiled to a closure —
not `eval` or `new Function`. Malformed input returns a readable message pointing at the
offending character instead of throwing, and no user-supplied string is ever executed.
Implicit multiplication (`2x`, `3sin(x)`, `x(x+1)`) is supported because that is how
students write it, and unary minus binds looser than exponentiation, so `-x^2` is `-(x^2)`.

### AI integration

Worked solutions and NPC conversation are served through Groq's OpenAI-compatible API.
The key is read in the Node process by Vite middleware (`/api/solve`, `/api/chat`) and
never reaches the browser — the prompts are shared from `src/game/solutionPrompt.ts` so a
later move to a serverless function keeps identical behaviour.

The game is fully playable with no key configured. Bundled solutions and hand-written
chapter notes cover the offline path; the model fills gaps and is cached the moment it
answers.

### Persistence

Progress is saved to `localStorage` behind a `SaveService` interface (`load` / `save` /
`reset`). Swapping in a backed store is an implementation of that interface rather than a
rewrite of game logic.

---

## Getting started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. No configuration is required to play.

To enable the AI tutor and NPC conversation, create `.env.local`:

```
GROQ_API_KEY=your-key-here
```

The variable has **no** `VITE_` prefix, deliberately: Vite compiles `VITE_`-prefixed
variables into the browser bundle, which would publish the key. `.env.local` is
gitignored.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server with HMR |
| `npm run build` | Type-check the project and produce a production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Oxlint |
| `npm run check:chemistry` | Verify the Molecule Builder's chemistry |
| `npm run check:calculus` | Verify the Shape Builder's mathematics |

> Note: the root `tsconfig.json` is a project-references stub, so `tsc --noEmit` is a
> no-op here. `tsc -b`, which `npm run build` runs, is what actually type-checks.

### Asset pipelines

Source art is not tracked in the repository; only the sliced output under
`public/sprites` is. To rebuild it from the original packs:

```bash
python scripts/build_characters.py   # character animation strips + anchor boxes
python scripts/build_npcs.py         # NPC strips from labelled contact sheets
```

---

## Verification

The simulations teach real subject matter, so their correctness is checked rather than
assumed. Both suites run in Node with no browser.

**`npm run check:chemistry`** — 30 checks over structure building, IUPAC naming, valency
refusal, and every reagent against the product a textbook gives. The oxidation ladder is
walked end to end (ethanol → ethanal → ethanoic acid), NaBH₄ is confirmed to refuse a
carboxylic acid while LiAlH₄ reduces it, Markovnikov addition is checked to give
2-bromopropane from propene, and aqueous versus alcoholic KOH are checked to diverge into
substitution and elimination.

**`npm run check:calculus`** — 51 checks over operator precedence, implicit multiplication,
clean failure on malformed input, and numeric integration against integrals whose exact
values are known. Signed integral and area are checked to agree where the curve stays on
one side of its boundary and to disagree correctly where it crosses.

---

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · Oxlint

Rendering is layered DOM and CSS over sprite sheets rather than a canvas engine — the
core loop is turn-based, so a full game engine would add build complexity without
buying anything the interface needs.

---

## Roadmap

- Learn Content and simulations for the remaining chapters
- Server-backed accounts and cross-device progress behind the existing `SaveService`
- Realtime PvP: action combat and a shared-timer rapid-fire quiz mode
- Guilds, weekly guild competitions, and per-subject leaderboards
