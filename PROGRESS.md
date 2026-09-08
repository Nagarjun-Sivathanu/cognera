# COGNERA — Progress & Reference

Living reference doc for where the project stands. See `CHANGELOG.md` for the change-by-change history and `First_mark.md` / `L2 fixes.md` for the original design notes this was built from.

## How to run it

Double-click **`start.bat`** — it opens a terminal running the dev server and launches your browser to it automatically.

Manually: `npm install` once, then `npm run dev`, then open the printed `http://localhost:5173` URL. `npm run build` produces a production build in `dist/`.

## Current game flow

```
Title screen (animated parallax cave)
  -> Hub (avatar + name, mode tiles)
    -> Dungeon Mode -> Subject picker (Math / Physics / Chemistry / Biology, no levels)
      -> Chapter picker (Total Revision, or one specific chapter)
        -> Tier map for that subject (Easy / Medium / Moderate / Hard, scattered, no path, all unlocked)
          -> Battle (top: battlefield: player + staggered enemy formation.
                      bottom: command panel [Bag/Stagger/Dodge/Wind Up/Flame Arts/Retreat]
                              + Focus bar + quiz panel)
            -> Result screen (XP / loot / skill points) -> back to tier map
    -> Sandbox Mode -> pick one subject or All
      -> Endless waves, difficulty budget ramping each wave
        -> Result screen paid out by waves survived -> back to hub
  PvP / Leaderboard / Guild tiles exist but are "Coming Soon" placeholders.
```

## Architecture at a glance

- **Stack**: Vite + React + TypeScript + Tailwind CSS v4 + Zustand. No backend — everything is client-side, persisted to `localStorage` via `src/services/saveService.ts` (already behind a `SaveService` interface so a real backend can be swapped in later without touching game logic).
- **State**: `src/store/gameStore.ts` is the single Zustand store — screen navigation (`view`), the active run, combat resolution, and all player-state mutations live here.
- **Content pipeline**:
  - `src/data/questions.json` — hand-written Biology placeholders (no real Biology dataset yet).
  - `src/data/questions-jee.json` — generated output of `scripts/convert_questions.py`, which converts the raw dataset in `Question data set/` (real JEE-style Math/Physics/Chemistry questions) into the game's schema. Re-run the script if the raw dataset changes.
  - `src/game/dungeonLayout.ts` — builds the subject → tier dungeon list at module load (one random-difficulty-tier-per-subject was the old model; now every subject gets all four tiers as fixed sub-dungeons).
- **Art**: `public/sprites/` holds only the specific files actually used by the game (player + equipment layers, 10 enemies, cave backgrounds, fight-scene GIFs, item icon sheet, fire VFX), sliced/cropped from the much larger raw pack in `Assets/` (gitignored — too large and mostly unused to track). `src/components/Sprite.tsx` is the animator everything renders through.
  - Sprites come from several packs at wildly different intrinsic sizes (a rabbit is 13×18 source px, a pengu is 82×94) and are anchored inconsistently inside their frames. So a sprite is positioned and scaled by a **content box** — the measured bounding box of its drawn pixels — not by its frame. `scripts/measure_sprites.py` produces those numbers; `displayHeight` in `enemies.json` sets how tall each enemy renders. The box is an anchor, not a crop: sword swings and impact FX deliberately overflow it, and all of a character's animations share one box so it never jumps when switching animation.
  - **Equipment** renders as extra layers over the base sheet (`src/game/playerSprite.ts`). The layers are frame-aligned with the base art, so they just stack. The pack ships one design per layer, so rarity is conveyed by CSS tint (`src/game/rarity.ts`) rather than different artwork.
  - **Playable characters** live in `src/game/characters.ts`: five bodies, each with its own animation set (idle / attack / special / defend / hurt / death) and a shared anchor box across all of its animations, so switching animation never moves or resizes the character. Animations that a character lacks degrade to the closest one it has. Only the Adventurer wears the modular armour layers — the rest have baked-in outfits, so gear is stat-only for them. `scripts/build_characters.py` regenerates the sheets from the raw packs.
- **Audio**: `src/game/audio.ts` — thin wrapper over `HTMLAudioElement` for one-shot SFX and a single looping BGM track at a time. Raw sound sources live in `sounds/` (gitignored); the served copies are in `public/sounds/`.
- **Combat tuning**: difficulty-budget/tier constants live in `src/game/dungeonLayout.ts` (`TIER_CONFIG`); damage/action-chance constants (dodge %, stagger %, wind-up multipliers, heal fraction) live in `src/game/combat.ts` — both are the places to retune balance after playtesting.

## What's built and working

- Full navigation flow above, verified end to end.
- Turn-based combat where damage scales with player attack power (gear/level/skills), so a leveled-up player can one-shot weak enemies.
- Battle actions: Attack (default), Bag (heal), Swap (change character, 3-turn cooldown), Dodge (evasion, with a stun chance), Wind Up (risk/reward damage modifier), the character's skill school, Retreat.
- **Focus**: a bar that fills only from correct answers — faster the longer your streak — and is spent casting skills. It's the mechanical link between answering well and combat power.
- **Per-character skill schools**: each of the five characters has its own 3–4 skills, animated with its own art (Emberblade, Stone Path, Wild Hunt, Windcraft, Flame Arts). Damage lands part-way through the cast animation, when the swing connects — not on the button press.
- **Equipment**: 7 slots, 6 of them visible on the Adventurer's sprite, with rarity tinting and real item icons.
- **Five playable characters** with their own stat profiles (attack/HP multipliers), true relative sizes, skill schools and animations. Swappable from the character sheet, or mid-battle on a cooldown. The Ranger fires a real projectile that crosses to the enemy.
- Randomized loot (5 rarities, tier-weighted odds), a passive skill tree, and 4 unlockable active skills.
- Real question content: ~912 usable converted JEE-style Math/Physics/Chemistry questions plus Biology placeholders, filterable by chapter.
- **Sandbox**: endless escalating waves with rewards scaled to depth.
- Sound: background music that switches with navigation, and SFX for hits/damage/deathblow/menu clicks.
- Local save/load of player progress (level, XP, gear, inventory, potions, skill points, learned skills, subject accuracy stats), with migration for saves from the old 3-slot equipment model.
- Accessibility: text size controls on every screen.
- **Frog Wizard review** after every run: mistakes grouped by chapter, worst first, with the correct answers and each question's explanation, plus a nudge toward the chapter that needs drilling. Runs fully offline; `src/game/review.ts` returns a structured result so an AI-written review can replace it later without touching the UI.

## Known gaps / deliberate placeholders

- **PvP, Leaderboard, Guild** — UI tiles exist, nothing behind them yet.
- **No difficulty-5 questions exist.** The dataset tops out at difficulty 4, but the Hard tier's boss (Gollux) is difficulty 5, so it falls back to the closest available question. Hard fights never get a genuinely "hardest" question tier.
- **No accounts/backend** — progress is per-browser (`localStorage`) only; not shared across devices.
- **Biology has no real dataset** — still using the original 4 hand-written placeholder questions.
- **Class 12 Physics has almost no content** — both source files (Current Electricity, Electrostatics) had no answer keys in the raw data, so nothing could be converted from them. Only the two Class 11 Physics chapters (Circular Motion, Fluid Mechanics) are populated.
- **Unused assets still sitting ready**: the horse+rider set (needs layering work), the plains parallax backgrounds (only the cave set is used), a wood-panel bitmap font (needs a character-order map to be usable — currently substituting the "MedievalSharp" Google Font), the remaining fire VFX (Fire I/III, Napalm, Incendiary, Burn Debuff variants — four of the packs' effects are wired to skills, the rest aren't), and several sound files (`combat_music_1/2`, `helping_frog`, `player_getting_hit_0`, `sword-slash*`) with no assigned purpose yet.
- **Not deployed** — runs locally only; no public Vercel/Netlify link yet.
- **No automated tests** — correctness has been verified through manual Playwright-driven smoke checks during development, not a persisted test suite.

## Natural next steps

Roughly in likely priority order, not a commitment:
1. Wire up the remaining sound files — combat music during battle, sword-slash on hit, a potion sound on Bag, and a cast sound for Flame Arts.
2. Real Biology content (and Class 12 Physics, if an answer-keyed source turns up).
3. Deploy to a public URL for sharing/demoing.
4. PvP / Leaderboard / Guild — pick one to build out next.
5. Balance pass on `combat.ts` (focus gain, skill costs, dodge/stagger odds) and `dungeonLayout.ts` (tier budgets, sandbox ramp) once there's been real playtesting.
6. More enemy animations — only idle sheets are wired up; the packs also ship attack/hurt/move animations that could play on hit and on the enemy's counter-attack. The player characters already animate per action, so the enemies are the remaining half of that.
7. The Elementals packs also include run/roll/jump animations and several of the Leaf Ranger's projectiles (plain/diagonal arrows, beam extension, thorn hits) that the turn-based battle doesn't use yet.
