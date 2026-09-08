import type { SpriteSheetDef } from '../types'

export type SkillKind = 'damage' | 'aoe' | 'burn' | 'buff'
export type VfxTarget = 'enemy' | 'all-enemies' | 'player'

export interface ActiveSkill {
  id: string
  name: string
  description: string
  kind: SkillKind
  cost: number // focus spent to cast
  unlockCost: number // skill points to learn
  power: number // multiplier on attack power (damage/aoe/burn) or buff strength
  turns?: number // duration for burn/buff
  heal?: number // fraction of max HP restored on cast
  vfx: SpriteSheetDef
  vfxTarget: VfxTarget
  vfxHeight: number // rendered height of the effect in px
}

// Sheets measured from the fire packs; several wrap one animation across rows.
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
}

export const activeSkills: ActiveSkill[] = [
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Blast the current enemy for 2x your attack.',
    kind: 'damage',
    cost: 40,
    unlockCost: 2,
    power: 2,
    vfx: VFX.fireball,
    vfxTarget: 'enemy',
    vfxHeight: 130,
  },
  {
    id: 'ignite',
    name: 'Ignite',
    description: 'Set the enemy alight - it burns at the start of your next 3 turns.',
    kind: 'burn',
    cost: 30,
    unlockCost: 2,
    power: 0.6,
    turns: 3,
    vfx: VFX.burn,
    vfxTarget: 'enemy',
    vfxHeight: 90,
  },
  {
    id: 'meteor',
    name: 'Meteor Shower',
    description: 'Rain meteors on every enemy in the encounter for 1.5x your attack.',
    kind: 'aoe',
    cost: 75,
    unlockCost: 3,
    power: 1.5,
    vfx: VFX.meteor,
    vfxTarget: 'all-enemies',
    vfxHeight: 150,
  },
  {
    id: 'ember-guard',
    name: 'Ember Guard',
    description: 'Heal 30% of max HP and gain +50% attack for 3 turns.',
    kind: 'buff',
    cost: 60,
    unlockCost: 3,
    power: 0.5,
    turns: 3,
    heal: 0.3,
    vfx: VFX.buff,
    vfxTarget: 'player',
    vfxHeight: 170,
  },
]

export function getActiveSkill(id: string): ActiveSkill | undefined {
  return activeSkills.find((s) => s.id === id)
}

/** Attack multiplier granted while Ember Guard is up. */
export const BUFF_ATTACK_MULTIPLIER = 1.5
