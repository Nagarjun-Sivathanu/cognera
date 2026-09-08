import { animDurationMs, getCharacter, type CharacterAnim, type CharacterDef } from './characters'
import type { SpriteSheetDef } from '../types'

export type SkillKind = 'damage' | 'aoe' | 'burn' | 'buff' | 'stun'
export type VfxTarget = 'enemy' | 'all-enemies' | 'player'

export interface ActiveSkill {
  id: string
  characterId: string // which character can cast it
  name: string
  description: string
  kind: SkillKind
  cost: number // focus spent to cast
  unlockCost: number // skill points to learn
  power: number // multiplier on attack power (damage/aoe/burn) or buff strength
  turns?: number // duration for burn/buff
  heal?: number // fraction of max HP restored on cast
  anim: CharacterAnim // the caster's animation
  /**
   * How far through the animation the hit lands, 0-1. Damage is applied at this
   * point rather than instantly, so the swing connects before the numbers move.
   */
  impactAt?: number
  vfx?: SpriteSheetDef // optional effect drawn over the target
  vfxTarget?: VfxTarget
  vfxHeight?: number
}

const DEFAULT_IMPACT_AT = 0.75

/** When damage should land for a cast, in ms from the start of the animation. */
export function skillImpactMs(character: CharacterDef, skill: ActiveSkill): number {
  return animDurationMs(character, skill.anim) * (skill.impactAt ?? DEFAULT_IMPACT_AT)
}

// Effects from the fire packs, used by the Adventurer (whose own sheets have no
// spell art) and by the Leaf Ranger's arrow impacts.
const VFX = {
  fireball: {
    src: '/sprites/vfx/fireball.png',
    frameWidth: 96,
    frameHeight: 48,
    frameCount: 13,
    columns: 4,
  } satisfies SpriteSheetDef,
  meteor: {
    src: '/sprites/vfx/meteor.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 11,
  } satisfies SpriteSheetDef,
  burn: {
    src: '/sprites/vfx/burn.png',
    frameWidth: 16,
    frameHeight: 16,
    frameCount: 8,
  } satisfies SpriteSheetDef,
  buff: {
    src: '/sprites/vfx/buff.png',
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 12,
    columns: 3,
  } satisfies SpriteSheetDef,
  rangerPoison: {
    src: '/sprites/vfx/ranger-poison.png',
    frameWidth: 256,
    frameHeight: 128,
    frameCount: 8,
    content: { x: 114, y: 26, w: 64, h: 62 },
  } satisfies SpriteSheetDef,
  rangerEntangle: {
    src: '/sprites/vfx/ranger-entangle.png',
    frameWidth: 256,
    frameHeight: 128,
    frameCount: 8,
    content: { x: 114, y: 56, w: 79, h: 41 },
  } satisfies SpriteSheetDef,
  rangerShower: {
    src: '/sprites/vfx/ranger-shower.png',
    frameWidth: 256,
    frameHeight: 128,
    frameCount: 18,
    content: { x: 77, y: 5, w: 96, h: 122 },
  } satisfies SpriteSheetDef,
}

/**
 * Each character casts from its own school, animated with its own art. The
 * Elementals packs bake their spell effects into the attack animations, so those
 * skills need no separate VFX; the Adventurer and the Ranger's arrows use overlays.
 */
export const activeSkills: ActiveSkill[] = [
  // --- Adventurer: Flame Arts (borrowed effects, no spell animations of its own)
  {
    id: 'fireball',
    characterId: 'hero',
    name: 'Fireball',
    description: 'Blast the current enemy for 2x your attack.',
    kind: 'damage',
    cost: 40,
    unlockCost: 2,
    power: 2,
    anim: 'attack',
    vfx: VFX.fireball,
    vfxTarget: 'enemy',
    vfxHeight: 130,
  },
  {
    id: 'ignite',
    characterId: 'hero',
    name: 'Ignite',
    description: 'Set the enemy alight - it burns for 3 turns.',
    kind: 'burn',
    cost: 30,
    unlockCost: 2,
    power: 0.6,
    turns: 3,
    anim: 'attack',
    vfx: VFX.burn,
    vfxTarget: 'enemy',
    vfxHeight: 90,
  },
  {
    id: 'meteor',
    characterId: 'hero',
    name: 'Meteor Shower',
    description: 'Rain meteors on every enemy for 1.5x your attack.',
    kind: 'aoe',
    cost: 75,
    unlockCost: 3,
    power: 1.5,
    anim: 'attack',
    vfx: VFX.meteor,
    vfxTarget: 'all-enemies',
    vfxHeight: 150,
  },
  {
    id: 'ember-guard',
    characterId: 'hero',
    name: 'Ember Guard',
    description: 'Heal 30% of max HP and gain +50% attack for 3 turns.',
    kind: 'buff',
    cost: 60,
    unlockCost: 3,
    power: 0.5,
    turns: 3,
    heal: 0.3,
    anim: 'defend',
    vfx: VFX.buff,
    vfxTarget: 'player',
    vfxHeight: 170,
  },

  // --- Fire Knight: Emberblade
  {
    id: 'knight-cleave',
    characterId: 'fire-knight',
    name: 'Ember Cleave',
    description: 'A burning overhead swing for 2.1x your attack.',
    kind: 'damage',
    cost: 35,
    unlockCost: 2,
    power: 2.1,
    anim: 'attack2',
  },
  {
    id: 'knight-wheel',
    characterId: 'fire-knight',
    name: 'Flame Wheel',
    description: 'Spin through the whole pack for 1.6x your attack each.',
    kind: 'aoe',
    cost: 70,
    unlockCost: 3,
    power: 1.6,
    anim: 'attack3',
  },
  {
    id: 'knight-inferno',
    characterId: 'fire-knight',
    name: 'Inferno Blade',
    description: 'A blazing greatsword arc for 3.2x your attack.',
    kind: 'damage',
    cost: 85,
    unlockCost: 3,
    power: 3.2,
    anim: 'special',
  },

  // --- Ground Monk: Stone Path
  {
    id: 'monk-palm',
    characterId: 'ground-monk',
    name: 'Iron Palm',
    description: 'A grounded strike for 2.1x your attack.',
    kind: 'damage',
    cost: 35,
    unlockCost: 2,
    power: 2.1,
    anim: 'attack2',
  },
  {
    id: 'monk-spikes',
    characterId: 'ground-monk',
    name: 'Stone Spikes',
    description: 'Erupt spikes under every enemy for 1.6x your attack.',
    kind: 'aoe',
    cost: 70,
    unlockCost: 3,
    power: 1.6,
    anim: 'attack3',
  },
  {
    id: 'monk-meditate',
    characterId: 'ground-monk',
    name: 'Meditation',
    description: 'Centre yourself: heal 35% of max HP and gain +50% attack for 3 turns.',
    kind: 'buff',
    cost: 55,
    unlockCost: 2,
    power: 0.5,
    turns: 3,
    heal: 0.35,
    anim: 'meditate',
  },
  {
    id: 'monk-wrath',
    characterId: 'ground-monk',
    name: "Mountain's Wrath",
    description: 'Split the ground open for 2.2x your attack on everything.',
    kind: 'aoe',
    cost: 90,
    unlockCost: 4,
    power: 2.2,
    anim: 'special',
  },

  // --- Leaf Ranger: Wild Hunt
  {
    id: 'ranger-poison',
    characterId: 'leaf-ranger',
    name: 'Poison Arrow',
    description: 'A tipped shot that poisons the enemy for 3 turns.',
    kind: 'burn',
    cost: 35,
    unlockCost: 2,
    power: 0.7,
    turns: 3,
    anim: 'attack2',
    vfx: VFX.rangerPoison,
    vfxTarget: 'enemy',
    vfxHeight: 110,
  },
  {
    id: 'ranger-entangle',
    characterId: 'leaf-ranger',
    name: 'Entangling Shot',
    description: 'Roots snare the enemy - its next attack whiffs.',
    kind: 'stun',
    cost: 40,
    unlockCost: 2,
    power: 0,
    anim: 'attack',
    vfx: VFX.rangerEntangle,
    vfxTarget: 'enemy',
    vfxHeight: 90,
  },
  {
    id: 'ranger-volley',
    characterId: 'leaf-ranger',
    name: 'Arrow Volley',
    description: 'A falling volley hits every enemy for 1.6x your attack.',
    kind: 'aoe',
    cost: 70,
    unlockCost: 3,
    power: 1.6,
    anim: 'attack3',
    vfx: VFX.rangerShower,
    vfxTarget: 'all-enemies',
    vfxHeight: 170,
  },
  {
    id: 'ranger-beam',
    characterId: 'leaf-ranger',
    name: 'Verdant Beam',
    description: 'A charged shot of raw green light for 3.2x your attack.',
    kind: 'damage',
    cost: 85,
    unlockCost: 3,
    power: 3.2,
    anim: 'special',
  },

  // --- Wind Hashashin: Windcraft
  {
    id: 'wind-flurry',
    characterId: 'wind-hashashin',
    name: 'Blade Flurry',
    description: 'A chain-blade rush for 2.1x your attack.',
    kind: 'damage',
    cost: 35,
    unlockCost: 2,
    power: 2.1,
    anim: 'attack2',
  },
  {
    id: 'wind-cyclone',
    characterId: 'wind-hashashin',
    name: 'Cyclone',
    description: 'A whirlwind tears through every enemy for 1.7x your attack.',
    kind: 'aoe',
    cost: 70,
    unlockCost: 3,
    power: 1.7,
    anim: 'attack3',
  },
  {
    id: 'wind-dash',
    characterId: 'wind-hashashin',
    name: 'Gale Dash',
    description: 'Cross the room and back before it lands: 3.3x your attack.',
    kind: 'damage',
    cost: 85,
    unlockCost: 3,
    power: 3.3,
    anim: 'special',
  },
]

export function getActiveSkill(id: string): ActiveSkill | undefined {
  return activeSkills.find((s) => s.id === id)
}

export function skillsForCharacter(characterId: string): ActiveSkill[] {
  return activeSkills.filter((s) => s.characterId === characterId)
}

/** Skills the player has learned *and* can cast as their current character. */
export function usableSkills(characterId: string, unlocked: string[]): ActiveSkill[] {
  return skillsForCharacter(characterId).filter((s) => unlocked.includes(s.id))
}

export function schoolName(characterId: string): string {
  return getCharacter(characterId).skillSchool
}

/** Attack multiplier granted while an attack buff is up. */
export const BUFF_ATTACK_MULTIPLIER = 1.5
