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
      -> Tier map for that subject (Easy / Medium / Moderate / Hard, scattered, level-gated, no path)
        -> Battle (top: battlefield: player + staggered enemy formation.
                    bottom: command panel [Bag/Stagger/Dodge/Wind Up/Retreat] + quiz panel)
          -> Result screen (XP / loot / skill points) -> back to tier map
  Sandbox / PvP / Leaderboard / Guild tiles exist but are "Coming Soon" placeholders.
```

## Architecture at a glance

- **Stack**: Vite + React + TypeScript + Tailwind CSS v4 + Zustand. No backend — everything is client-side, persisted to `localStorage` via `src/services/saveService.ts` (already behind a `SaveService` interface so a real backend can be swapped in later without touching game logic).
- **State**: `src/store/gameStore.ts` is the single Zustand store — screen navigation (`view`), the active run, combat resolution, and all player-state mutations live here.
- **Content pipeline**:
  - `src/data/questions.json` — hand-written Biology placeholders (no real Biology dataset yet).
  - `src/data/questions-jee.json` — generated output of `scripts/convert_questions.py`, which converts the raw dataset in `Question data set/` (real JEE-style Math/Physics/Chemistry questions) into the game's schema. Re-run the script if the raw dataset changes.
  - `src/game/dungeonLayout.ts` — builds the subject → tier dungeon list at module load (one random-difficulty-tier-per-subject was the old model; now every subject gets all four tiers as fixed sub-dungeons).
- **Art**: `public/sprites/` holds only the specific files actually used by the game (player, 10 enemies, cave backgrounds, fight-scene GIFs), sliced/cropped from the much larger raw pack in `Assets/` (gitignored — too large and mostly unused to track). `src/components/SpriteSheet.tsx` is the generic frame-stepping animator everything renders through.
- **Audio**: `src/game/audio.ts` — thin wrapper over `HTMLAudioElement` for one-shot SFX and a single looping BGM track at a time. Raw sound sources live in `sounds/` (gitignored); the served copies are in `public/sounds/`.
- **Combat tuning**: difficulty-budget/tier constants live in `src/game/dungeonLayout.ts` (`TIER_CONFIG`); damage/action-chance constants (dodge %, stagger %, wind-up multipliers, heal fraction) live in `src/game/combat.ts` — both are the places to retune balance after playtesting.

## What's built and working

- Full navigation flow above, verified end to end.
- Turn-based combat where damage scales with player attack power (gear/level/skills), so a leveled-up player can one-shot weak enemies.
- Battle actions: Attack (default), Bag (heal), Stagger (stun chance), Dodge (evasion chance), Wind Up (risk/reward damage modifier), Retreat.
- Randomized loot (5 rarities, tier-weighted odds) and a small passive skill tree.
- Real question content: 942 converted JEE-style Math/Physics/Chemistry questions plus a handful of Biology placeholders.
- Sound: background music that switches with navigation, and SFX for hits/damage/deathblow/menu clicks.
- Local save/load of player progress (level, XP, gear, inventory, potions, skill points, subject accuracy stats).

## Known gaps / deliberate placeholders

- **Sandbox, PvP, Leaderboard, Guild** — UI tiles exist, nothing behind them yet.
- **No accounts/backend** — progress is per-browser (`localStorage`) only; not shared across devices.
- **Biology has no real dataset** — still using the original 4 hand-written placeholder questions.
- **Class 12 Physics has almost no content** — both source files (Current Electricity, Electrostatics) had no answer keys in the raw data, so nothing could be converted from them. Only the two Class 11 Physics chapters (Circular Motion, Fluid Mechanics) are populated.
- **Unused assets sitting ready**: the player's modular equipment layers (so gear could visually change the character), a 196-icon weapon sheet (for inventory art), fire-skill VFX (for hit impacts or a future skill tree), the horse+rider set (needs layering work), a wood-panel bitmap font (needs a character-order map to be usable — currently substituting the "MedievalSharp" Google Font), and several sound files (`combat_music_1/2`, `helping_frog`, `player_getting_hit_0`, `sword-slash*`) with no assigned purpose yet.
- **Not deployed** — runs locally only; no public Vercel/Netlify link yet.
- **No automated tests** — correctness has been verified through manual Playwright-driven smoke checks during development, not a persisted test suite.

## Natural next steps

Roughly in likely priority order, not a commitment:
1. Wire up the remaining sound files (combat music, sword-slash, potion sound) once their intended use is confirmed.
2. Real Biology content (and Class 12 Physics, if an answer-keyed source turns up).
3. Visual polish: equip-able gear actually changing the player sprite, item icons in the inventory.
4. Deploy to a public URL for sharing/demoing.
5. Sandbox / PvP / Leaderboard / Guild — pick one to build out next.
6. Balance pass on the numbers in `combat.ts` / `dungeonLayout.ts` once there's been real playtesting.
