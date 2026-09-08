# Changelog

All notable changes to this project, newest first. Each entry corresponds to a commit on `UI_UX-and-dungeons-base-designs` (branched off `master`).

## Cache worked solutions per question, solved once and reused

- **Solutions are now cache-first.** Miss a question, and the frog looks for a worked solution: bundled first, then the player's own cache. Anything without one joins a "wanted" list rather than being recomputed — so a given question is only ever solved once, however many times it comes up.
- Expanding a mistake now shows the **key idea** that unlocks it plus **numbered working**, not just which option was right.
- **Eleven hand-written worked solutions** shipped (`src/data/solutions.ts`), spanning Circle, Sequence and Series, Definite Integration, Circular Motion, Fluid Mechanics, Chemical Kinetics and Electrochemistry. Each was checked against the dataset's own answer key before being written.
- **Copy-unsolved export**: one button serialises every outstanding question — id, chapter, difficulty, full options with the correct one marked — so solutions can be written for exactly the questions this player actually missed, and pasted back into the cache. Questions that already have solutions are excluded, so nothing is paid for twice.
- **The study guide is assembled from accumulated weakness**: the Study Notes tab leads with a summary counting the concepts and traps across every chapter the player is behind on, ordered worst first.
- `player.solutionCache` persists through the save migration, so solutions survive updates.

## Add written study notes for every chapter

- **Ten hand-written revision notes**, one per real chapter in the question bank (`src/data/studyNotes.ts`). Each covers what the chapter is actually testing, the concepts and formulas needed, and the specific places marks get lost.
- The **Study Notes tab** now leads with the chapters you're weakest in — annotated with your accuracy and attempt count — followed by the rest to browse.
- The note for whatever chapter hurt most also appears **inside the post-run review**, so a bad run immediately hands you the material to fix it.
- These are static content: no API key, no network, no per-request cost, and nothing to fail during a demo. Written to cover the "what concepts will be needed to solve related questions" half of the tutor brief.
- Still outstanding: **step-by-step solutions for individual questions**. The chapter notes cover method and traps, but no question in the dataset carries a worked solution, and 946 of them can't be hand-written.

## Persist mistakes and track improvement over time

- **Mistakes now persist across runs**, not just within one. Every missed question is logged (capped at 200), and answering the same question correctly later marks it *fixed* rather than deleting it.
- **Per-chapter mastery tracking**: attempts, correct, and a rolling window of recent results for every chapter you've touched.
- **Improvement is recognised and celebrated.** A chapter that was genuinely struggling (below 50% over at least 3 attempts) and has since been answered correctly 4 times running gets flagged as turned around — called out both in the post-run review and on the frog's desk. It only fires once per chapter, so it stays meaningful.
- **The Frog Wizard's Desk**, reachable from the frog icon in the top bar at any time, with a live badge counting unfixed questions. Three tabs: **Progress** (overall accuracy, chapters turned around, chapters needing work, chapters that are solid), **Mistakes** (the full history grouped by chapter, with fixed ones hidden by default), and **Study Notes**.
- **Known gap — worked solutions and study notes are not generated.** None of the 946 questions in the dataset carry an explanation, so there is no offline source to derive them from. The Study Notes tab and the per-mistake solution slot are both built and wired, and say plainly that they need the AI tutor connected.

## Add the Frog Wizard's post-run review

- Runs now **record which questions you got wrong** — the question, what you picked, the right answer, the topic and the difficulty. Previously only per-subject correct/total tallies were kept, so there was nothing to review.
- **The Frog Wizard reviews your run** at the end of a dungeon, on death or on a clear. He opens with a verdict that reacts to how it actually went, then breaks your mistakes down by chapter, worst first, and calls out the one chapter that cost you the most — with a pointer to drill it in chapter revision mode.
- Each mistake expands to show every option with your pick marked in red, the correct answer in green, and the question's own explanation where it has one.
- The analysis (`src/game/review.ts`) is deliberately structured rather than prose, so an AI-written review can later slot in behind the same shape without the UI changing. **No API key, no network, no backend** — it works entirely offline, which keeps the offline build fully presentable.
- Frog portrait downscaled from 616 KB to 68 KB, and his croak plays when he appears.

## Make characters mechanically distinct, and swappable mid-battle

- **Characters now have their own stats**, so picking one is a real decision rather than a costume change. Knight is heavy (1.15× atk / 1.2× hp), Monk tanks (0.9× / 1.35×), Ranger hits hard but is fragile (1.25× / 0.85×), Hashashin is a glass cannon (1.35× / 0.75×), Adventurer is the 1×/1× baseline. Your level, gear, XP and skills carry across all of them.
- **Characters are now sized to their true proportions** — one shared zoom across the Elementals cast, so the Knight genuinely towers over the Monk instead of every character being hand-tuned to the same height. The picker previews them at the same relative sizes they fight at.
- **Stagger is replaced by Swap**, which changes which body you're fighting in mid-battle. It costs the turn and goes on a 3-turn cooldown, and your current HP is clamped to the new body's maximum — so swapping to a frailer character while hurt is a real risk, not a free heal. Stagger's stun wasn't lost: a successful Dodge now has a 35% chance to leave the enemy off-balance.
- **The Leaf Ranger actually shoots.** Her arrow now leaves the bow and crosses the battlefield to the enemy, with a real impact effect on landing, using the pack's standalone projectile art.
- Fixed max HP being exceeded on load — a save made as a tankier character could show 400/383 after switching to a frailer one.

## Give every character its own skills, and land skill damage on impact

- **Fixed: skills applied damage before the animation played.** The numbers moved the instant you cast, then an animation played over an already-resolved turn, so the effect looked cosmetic. Casting is now two-phase — the animation starts and the focus is spent, and the hit lands part-way through the swing, when it visually connects. Each skill declares how far through its animation that happens.
- **Each character now has its own skill school**, animated with its own art rather than sharing one borrowed set:
  - **Fire Knight — Emberblade**: Ember Cleave, Flame Wheel (spinning AoE), Inferno Blade.
  - **Ground Monk — Stone Path**: Iron Palm, Stone Spikes (erupts under every enemy), Meditation (heal + attack buff, using the pack's meditate animation), Mountain's Wrath.
  - **Leaf Ranger — Wild Hunt**: Poison Arrow, Entangling Shot (roots the enemy so its next attack whiffs), Arrow Volley, Verdant Beam.
  - **Wind Hashashin — Windcraft**: Blade Flurry, Cyclone, Gale Dash.
  - **Adventurer — Flame Arts**: keeps the original four, since its sheets have no spell animations of their own.
- The Elementals packs bake their spell effects into the attack animations, so those skills need no overlay art. The Leaf Ranger is the only pack shipping standalone projectiles, so its arrows get real poison/entangle/volley impact effects over the enemy.
- Added a **stun** skill type, and wired up the extra attack animations (2nd/3rd attack, special, meditate) that were previously unused.
- The battle menu and the character sheet's skill list are now labelled with, and filtered to, the current character's school. Skills you've learned for a character are remembered if you switch away and back.

## Add selectable characters with full battle animations

- **Five playable characters**, chosen from a new Hero tab in the character sheet: the original Adventurer plus Fire Knight, Ground Monk, Leaf Ranger and Wind Hashashin from the Elementals packs. The picker previews each one animating on hover. The choice is cosmetic — stats, gear and skills come with you — and it's saved with your progress.
- **The character now acts out the fight.** Each action plays its own animation instead of everything being idle-or-attack: attack on a correct answer, take-hit on a wrong one, block on a successful Dodge or a potion, a full special-attack animation when casting a Flame Art, and a death animation when you fall (the result screen waits for it to finish).
- The Elementals characters ship their own outfits, so **armour isn't forced on top of them** — gear stays stat-only there and is only drawn on the Adventurer, whose modular layers are built for it. The picker labels which is which.
- Portraits are now generated per character by cropping the head from its idle sheet, so the HUD avatar matches whoever you're playing.
- `scripts/build_characters.py` packs the packs' per-frame PNGs into game-ready strips and derives each character's anchor box. It centres the anchor on the frame's centre line rather than the raw sprite bounds, so characters with long weapons (the knight's greatsword, the ranger's bow) stand centred instead of being shoved sideways by their own weapon.

## Add equipment, flame skills, chapter revision and sandbox mode

- **Fixed: enemies above difficulty 3 were invisible.** Not a missing asset — `EnemyCard` rendered each sprite at 512×512 inside a 132×132 centred crop, so only the middle ~33px of a frame was ever on screen. Small mobs happen to sit in that band; the bigger ones are bottom-anchored in their frames and fell outside it entirely. Sprites are now sized and aligned by a measured content box (`scripts/measure_sprites.py`), so every enemy is fully visible, they share a floor line, and bosses are genuinely bigger than trash mobs.
- **Fixed: Dino Tri's sheet was sliced wrong** — it's 6 frames of 384×128, not 18 of 128×128, so most of its frames were blank.
- **Fixed: the same question could repeat immediately.** The normal Attack path never recorded its question as used; only Bag/Dodge/Stagger did.
- **Equipment**: seven slots (Weapon, Helmet, Chest, Legs, Hands, Boots, Trinket), six of which render as layers on the character sprite. Rarity is shown by tint on the gear and by the icon sheet's own colour rows for weapons/shields. Loot rolls real item icons from the 196-icon sheet, and the attack animation's swing FX is wired up as the clash effect.
- **Character page** rebuilt as a wood-panelled sheet: Gear / Skills / Stats tabs, a paper doll wearing your actual equipment, and a grid inventory of item icons with rarity borders and hover tooltips.
- **Flame Arts**: four unlockable active skills (Fireball, Ignite, Meteor Shower, Ember Guard) that spend **Focus** — a bar that fills only from correct answers, faster on a streak. Each plays its effect from the fire VFX packs over the battlefield.
- **Chapter revision**: subject now leads to a chapter screen — Total Revision (all chapters) or a single chapter — before the tier map, and questions are filtered to that chapter for the whole run.
- **Sandbox mode** is live: pick one subject or all, then fight endless waves whose difficulty budget ramps each wave. There's no clear condition — you play until you fall or retreat, and XP, loot and skill points are paid out scaled to how far you got.
- **All difficulty tiers unlocked** — the level gate on the tier map is gone.
- **Text size controls** (A− / A+) on every screen, persisted to localStorage.
- Dropped 30 questions whose options had been reduced to bare letters ("(A)", "(B)") during conversion — they were unanswerable.
- Nudged the `torch-3` battle background off its baked-in black stairwell void so fighters no longer stand in an empty corner.

## Add sound design and fix battle screen layout

- Removed the bordered box around enemy cards so they match the player's borderless look (sprite + name + HP bar only).
- Lowered both the player and enemies onto a shared floor baseline — they previously floated too high in the battlefield area.
- Widened the quiz panel to fill the full width of its column instead of being capped narrow with empty space around it.
- Wired up sound:
  - **Music**: `menu_song` plays across Title / Hub / Subject picker / tier map; `cave_0` takes over only once a battle actually starts, switching back to `menu_song` on return.
  - **SFX**: `mob_getting_hit` / `boss_getting_hit` (difficulty-5 enemies) on a successful hit, `mob_doing_dmg` on taking damage, `player_getting_hit_deathblow` on the killing blow, `menu_click` on navigation buttons.
  - Not yet wired: `combat_music_1/2`, `helping_frog`, `player_getting_hit_0`, `sword-slash*` — present in `public/sounds/` but no assigned purpose yet.

## Convert real JEE question dataset into the game's question bank

- Added `scripts/convert_questions.py`, which parses the raw JEE-style JSONL dataset (`Question data set/`) into the game's `Question` schema:
  - **Difficulty** comes from the exercise/module number (Exercise 1→2, 2→3, 3→4, HLP→5 on our 1–5 scale — higher module = harder).
  - **Topic** comes from the chapter (derived from the filename, e.g. `circle.jsonl` → "Circle").
  - Only single-answer multiple-choice entries are used (942 of ~2,200 total raw entries) — Subjective/Numerical/Comprehension/Match-the-Column/multi-answer entries are skipped since combat needs exactly one correct option.
- Replaced the old placeholder Math/Physics/Chemistry questions with this real content. Biology keeps its placeholders (the dataset doesn't cover it).
- Known gap: both Class 12 Physics source files had no answer keys at all in the raw data and contributed zero usable questions — Physics content currently comes only from the two Class 11 files.

## Add subject-first dungeon navigation with tier sub-dungeons

- Restructured dungeon navigation into three steps: pick a **subject** (Math/Physics/Chemistry/Biology — no levels or locks), then pick a **difficulty tier** from four sub-dungeons scattered inside that subject (Easy/Medium/Moderate/Hard, level-gated, no connecting path between them), then the regular battle flow.
- Replaced the static battle background with the animated torch-lit corridor GIFs (matching the original reference art), looping behind every fight.
- Shrank the bottom command/question panel from a 50/50 split to a compact fixed strip so the battlefield gets more visual room.

## Add hub screen, battle action menu, and bigger character sprites

- Added a Hub screen between the Title and dungeon map: a click-to-rename avatar (cropped from the player's own sprite) plus mode tiles — Dungeon Mode is live, Sandbox/PvP/Leaderboard/Guild show as "Coming Soon".
- Added a 5-action battle command menu: **Bag** (heal from a new potion system — 1 to start, +1 per clear), **Stagger** (chance to stun the enemy, negating its next counter-hit), **Dodge** (chance to take zero damage), **Wind Up** (risk/reward — arm it, then a correct answer charges bonus damage on your *next* hit, a wrong answer takes extra damage), **Retreat**.
- Fixed a real bug where flexbox was silently shrinking sprites down to nothing in the tighter battle layout; sized characters up substantially as a result.
- Initialized the git repository and connected it to GitHub (`Nagarjun-Sivathanu/cognera`).

## Replace placeholder art with real sprites: player, 10 enemies, cave backgrounds

- Integrated the purchased asset pack: an animated player character (idle + attack), ten enemies spanning all five difficulty tiers (two rabbits, two zombies, four bosses reskinned as mid/high-tier enemies, plus Gollux as the top-tier "boss"), and real cave parallax backgrounds replacing the gradient placeholders.
- Built a reusable `SpriteSheet` animator component (frame-stepping via `background-position`, configurable fps/scale/flip/play-once).

## Set up the dungeon crawler MVP: dungeon select, encounter/combat loop, loot and skills

- Initial scaffold: Vite + React + TypeScript + Tailwind + Zustand.
- Dungeon list across 4 difficulty tiers; encounters generated from a per-tier **difficulty budget** filled by randomly drawn enemies.
- Turn-based combat: a quiz question per turn, correct answers deal player-power-scaled damage, wrong answers take enemy damage.
- Randomized, tier-weighted loot and a small passive skill tree (Sharp Mind / Iron Will / Quick Study).
- LocalStorage persistence behind a swappable `SaveService` interface (ready to swap for a real backend later).
- Sample placeholder question bank to prove out the pipeline before real content existed.
