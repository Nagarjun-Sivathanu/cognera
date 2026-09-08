# Changelog

All notable changes to this project, newest first. Each entry corresponds to a commit on `UI_UX-and-dungeons-base-designs` (branched off `master`).

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
