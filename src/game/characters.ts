import type { ContentBox, SpriteSheetDef } from '../types'

export type CharacterAnim =
  | 'idle'
  | 'attack'
  | 'attack2'
  | 'attack3'
  | 'special'
  | 'meditate'
  | 'defend'
  | 'hurt'
  | 'death'

/**
 * Characters aren't interchangeable skins - each trades attack against survivability,
 * which is what makes swapping mid-battle a real decision rather than a costume change.
 */
export interface CharacterStats {
  attack: number // multiplier on attack power
  hp: number // multiplier on max HP
  /** One-line summary of the trade-off, shown in the picker. */
  role: string
}

export interface CharacterDef {
  id: string
  name: string
  blurb: string
  /** What this character's active skills are called as a set. */
  skillSchool: string
  stats: CharacterStats
  /** Rendered height of the anchor box, in px. */
  displayHeight: number
  /**
   * Only the original hero has modular armour layers drawn to match its frames.
   * The Elementals characters come with their own baked-in outfits, so equipment
   * is stat-only for them rather than being forced on top of the art.
   */
  wearsEquipment: boolean
  sheets: Partial<Record<CharacterAnim, SpriteSheetDef>>
  /** Head crop used for the portrait, in frame-local px of the idle sheet. */
  avatarCrop: ContentBox
  /**
   * Ranged characters fire a projectile that crosses the battlefield on a basic
   * attack, so the shot visibly connects instead of stopping at the bow.
   */
  projectile?: {
    flight: SpriteSheetDef
    impact: SpriteSheetDef
    height: number // rendered height of the projectile
    impactHeight: number
    /** Where in the attack animation the shot is released, 0-1. */
    releaseAt: number
  }
}

// The Elementals packs are all 288x128 frames with the body centred in frame and
// the feet on a common floor line, so every animation shares one anchor box.
// Numbers come from scripts/build_characters.py.
function elementals(
  id: string,
  anchor: ContentBox,
  frames: Partial<Record<CharacterAnim, number>>,
): Partial<Record<CharacterAnim, SpriteSheetDef>> {
  const sheets: Partial<Record<CharacterAnim, SpriteSheetDef>> = {}
  for (const [anim, frameCount] of Object.entries(frames) as [CharacterAnim, number][]) {
    sheets[anim] = {
      src: `/sprites/characters/${id}/${anim}.png`,
      frameWidth: 288,
      frameHeight: 128,
      frameCount,
      row: 0,
      content: anchor,
    }
  }
  return sheets
}

/** Head box for an Elementals character: the top of the body, centred in frame. */
function elementalsAvatar(anchor: ContentBox): ContentBox {
  const size = Math.round(anchor.h * 0.5)
  return { x: 144 - Math.round(size / 2), y: anchor.y - 1, w: size, h: size }
}

/**
 * One zoom shared by every Elementals character, so their real size differences show
 * on screen - the Knight genuinely towers over the Monk in the source art. The
 * Adventurer is from a different pack drawn at a different scale and keeps its own.
 */
const ELEMENTALS_ZOOM = 3.75
const elementalsHeight = (anchor: ContentBox) => Math.round(anchor.h * ELEMENTALS_ZOOM)

const FIRE_KNIGHT_ANCHOR: ContentBox = { x: 100, y: 83, w: 88, h: 44 }
const GROUND_MONK_ANCHOR: ContentBox = { x: 130, y: 86, w: 28, h: 35 }
const LEAF_RANGER_ANCHOR: ContentBox = { x: 118, y: 83, w: 52, h: 44 }
const WIND_HASHASHIN_ANCHOR: ContentBox = { x: 122, y: 90, w: 44, h: 37 }

// The original Monster Pack hero: fewer animations, but the only one that can wear
// the modular armour layers.
const HERO_BODY: ContentBox = { x: 54, y: 49, w: 19, h: 31 }

export const characters: CharacterDef[] = [
  {
    id: 'hero',
    name: 'Adventurer',
    blurb: 'The classic. The only one who can wear your armour set.',
    skillSchool: 'Flame Arts',
    stats: { attack: 1, hp: 1, role: 'Balanced - the baseline, and the only one that shows your armour' },
    displayHeight: 140,
    wearsEquipment: true,
    avatarCrop: { x: 51, y: 46, w: 24, h: 24 },
    sheets: {
      idle: {
        src: '/sprites/player/idle.png',
        frameWidth: 128,
        frameHeight: 128,
        frameCount: 4,
        row: 0,
        content: HERO_BODY,
      },
      attack: {
        src: '/sprites/player/attack.png',
        frameWidth: 128,
        frameHeight: 128,
        frameCount: 6,
        row: 0,
        content: HERO_BODY,
      },
      death: {
        src: '/sprites/player/death.png',
        frameWidth: 128,
        frameHeight: 128,
        frameCount: 11,
        row: 0,
        content: HERO_BODY,
      },
    },
  },
  {
    id: 'fire-knight',
    name: 'Fire Knight',
    blurb: 'Heavy greatsword, heavier armour. Swings like a furnace door.',
    skillSchool: 'Emberblade',
    stats: { attack: 1.15, hp: 1.2, role: 'Heavy - hits hard and takes a beating' },
    displayHeight: elementalsHeight(FIRE_KNIGHT_ANCHOR),
    wearsEquipment: false,
    avatarCrop: elementalsAvatar(FIRE_KNIGHT_ANCHOR),
    sheets: elementals('fire-knight', FIRE_KNIGHT_ANCHOR, {
      idle: 8,
      attack: 11,
      attack2: 19,
      attack3: 28,
      special: 18,
      defend: 10,
      hurt: 6,
      death: 13,
    }),
  },
  {
    id: 'ground-monk',
    name: 'Ground Monk',
    blurb: 'No weapon, no armour, no problem. Fists and stone.',
    skillSchool: 'Stone Path',
    stats: { attack: 0.9, hp: 1.35, role: 'Tank - soaks damage, hits softly' },
    displayHeight: elementalsHeight(GROUND_MONK_ANCHOR),
    wearsEquipment: false,
    avatarCrop: elementalsAvatar(GROUND_MONK_ANCHOR),
    sheets: elementals('ground-monk', GROUND_MONK_ANCHOR, {
      idle: 6,
      attack: 6,
      attack2: 12,
      attack3: 23,
      special: 25,
      meditate: 16,
      defend: 13,
      hurt: 6,
      death: 18,
    }),
  },
  {
    id: 'leaf-ranger',
    name: 'Leaf Ranger',
    blurb: 'Longbow and a green cloak. Answers from a safe distance.',
    skillSchool: 'Wild Hunt',
    stats: { attack: 1.25, hp: 0.85, role: 'Ranged - strong damage, fragile' },
    displayHeight: elementalsHeight(LEAF_RANGER_ANCHOR),
    wearsEquipment: false,
    avatarCrop: elementalsAvatar(LEAF_RANGER_ANCHOR),
    projectile: {
      flight: {
        src: '/sprites/vfx/ranger-arrow.png',
        frameWidth: 256,
        frameHeight: 128,
        frameCount: 1,
        content: { x: 112, y: 62, w: 32, h: 3 },
      },
      impact: {
        src: '/sprites/vfx/ranger-arrow-hit.png',
        frameWidth: 256,
        frameHeight: 128,
        frameCount: 6,
        content: { x: 114, y: 56, w: 28, h: 12 },
      },
      height: 10,
      impactHeight: 46,
      releaseAt: 0.5,
    },
    sheets: elementals('leaf-ranger', LEAF_RANGER_ANCHOR, {
      idle: 12,
      attack: 10,
      attack2: 15,
      attack3: 12,
      special: 17,
      defend: 19,
      hurt: 6,
      death: 19,
    }),
  },
  {
    id: 'wind-hashashin',
    name: 'Wind Hashashin',
    blurb: 'Chain blades and misdirection. Fast, and never quite where you looked.',
    skillSchool: 'Windcraft',
    stats: { attack: 1.35, hp: 0.75, role: 'Glass cannon - biggest hits, thinnest skin' },
    displayHeight: elementalsHeight(WIND_HASHASHIN_ANCHOR),
    wearsEquipment: false,
    avatarCrop: elementalsAvatar(WIND_HASHASHIN_ANCHOR),
    sheets: elementals('wind-hashashin', WIND_HASHASHIN_ANCHOR, {
      idle: 8,
      attack: 8,
      attack2: 18,
      attack3: 26,
      special: 30,
      defend: 8,
      hurt: 6,
      death: 19,
    }),
  },
]

export const DEFAULT_CHARACTER_ID = 'hero'

export function getCharacter(id: string): CharacterDef {
  return characters.find((c) => c.id === id) ?? characters[0]
}

// Not every character has art for every animation (the original hero has no
// take-hit or block), so each one degrades to the closest thing it does have.
const ANIM_FALLBACK: Record<CharacterAnim, CharacterAnim[]> = {
  idle: [],
  attack: ['idle'],
  attack2: ['attack', 'idle'],
  attack3: ['attack2', 'attack', 'idle'],
  special: ['attack3', 'attack', 'idle'],
  meditate: ['defend', 'idle'],
  defend: ['idle'],
  hurt: ['idle'],
  death: ['hurt', 'idle'],
}

const ANIM_FPS: Record<CharacterAnim, number> = {
  idle: 8,
  attack: 14,
  attack2: 16,
  attack3: 16,
  special: 16,
  meditate: 12,
  defend: 12,
  hurt: 12,
  death: 10,
}

export interface ResolvedAnim {
  sheet: SpriteSheetDef
  anim: CharacterAnim
  fps: number
  /** Looping animations play forever; one-shots hold on their last frame. */
  playOnce: boolean
}

export function resolveAnim(character: CharacterDef, wanted: CharacterAnim): ResolvedAnim {
  const chain: CharacterAnim[] = [wanted, ...ANIM_FALLBACK[wanted]]
  const anim = chain.find((a) => character.sheets[a]) ?? 'idle'
  return {
    sheet: character.sheets[anim]!,
    anim,
    fps: ANIM_FPS[anim],
    // If we fell back to idle, loop it - a held idle frame looks broken.
    playOnce: anim !== 'idle',
  }
}

/** How long a character's animation runs, in ms. */
export function animDurationMs(character: CharacterDef, wanted: CharacterAnim): number {
  const { sheet, fps } = resolveAnim(character, wanted)
  return (sheet.frameCount / fps) * 1000
}
