import type { SpriteSheetDef } from '../types'

/**
 * The Learn Content NPCs.
 *
 * Each has a distinct voice, which is fed to the model alongside the concept context
 * so free-form answers sound like the character the player just walked up to rather
 * than a generic assistant.
 *
 * Two sets, from two asset packs: the four researchers who teach the chapter, and the
 * four townsfolk who stand around the atrium as optional second opinions.
 */

export interface NpcDef {
  id: string
  name: string
  title: string
  /** Character voice, sent to the model as part of the system prompt. */
  voice: string
  /** Accent colour for their dialogue panel. */
  accent: string
  /** How tall to draw them; the two packs have very different source resolutions. */
  displayHeight: number
  sheets: { idle: SpriteSheetDef; dialogue: SpriteSheetDef; walk?: SpriteSheetDef }
}

// The researcher pack, measured by scripts/build_npcs.py.
const RESEARCHERS: Record<string, { w: number; h: number; idle: number; dialogue: number }> = {
  bard: { w: 118, h: 146, idle: 7, dialogue: 8 },
  smith: { w: 109, h: 193, idle: 8, dialogue: 7 },
  chopper: { w: 88, h: 148, idle: 8, dialogue: 8 },
  maid: { w: 107, h: 144, idle: 7, dialogue: 7 },
}

// The GothicVania town pack ships pre-sliced strips, so these are read straight off
// the sheet dimensions. They have no dialogue animation - idle stands in for it.
const TOWNSFOLK: Record<string, { w: number; h: number; idle: number; walk: number }> = {
  bearded: { w: 40, h: 47, idle: 5, walk: 6 },
  'hat-man': { w: 39, h: 52, idle: 4, walk: 6 },
  oldman: { w: 34, h: 42, idle: 8, walk: 12 },
  woman: { w: 37, h: 46, idle: 7, walk: 6 },
}

function sheet(id: string, anim: string, w: number, h: number, frameCount: number): SpriteSheetDef {
  return { src: `/sprites/npc/${id}-${anim}.png`, frameWidth: w, frameHeight: h, frameCount }
}

function researcherSheets(id: string) {
  const g = RESEARCHERS[id]
  return {
    idle: sheet(id, 'idle', g.w, g.h, g.idle),
    dialogue: sheet(id, 'dialogue', g.w, g.h, g.dialogue),
  }
}

function townSheets(id: string) {
  const g = TOWNSFOLK[id]
  const idle = sheet(id, 'idle', g.w, g.h, g.idle)
  return { idle, dialogue: idle, walk: sheet(id, 'walk', g.w, g.h, g.walk) }
}

export const npcs: Record<string, NpcDef> = {
  smith: {
    id: 'smith',
    name: 'Brannoc',
    title: 'Bondsmith',
    voice:
      'A blunt, weathered blacksmith. Speaks in short hammer-blow sentences. Uses forge and metalwork metaphors for chemistry. Impatient with vagueness, respects precision. Never uses more words than needed. Occasionally gruff but never cruel.',
    accent: 'border-orange-700 text-orange-300',
    displayHeight: 190,
    sheets: researcherSheets('smith'),
  },
  bard: {
    id: 'bard',
    name: 'Fenwick',
    title: 'Bard of Groups',
    voice:
      'A theatrical travelling bard who treats chemistry as poetry and performance. Flowery, delighted, fond of calling things "verses" and "refrains". Prone to small dramatic flourishes, but the chemistry underneath is always exact. Calls the player "friend".',
    accent: 'border-violet-600 text-violet-300',
    displayHeight: 190,
    sheets: researcherSheets('bard'),
  },
  chopper: {
    id: 'chopper',
    name: 'Old Hask',
    title: 'Electron Tracker',
    voice:
      'A grizzled old woodsman who thinks of electrons as game to be tracked and hunted. Calm, patient, speaks slowly and in terms of trails, scent, and following things to their source. Deeply knowledgeable. Says "follow the electrons" often.',
    accent: 'border-emerald-600 text-emerald-300',
    displayHeight: 190,
    sheets: researcherSheets('chopper'),
  },
  maid: {
    id: 'maid',
    name: 'Perrin',
    title: 'Reagent Keeper',
    voice:
      'A brisk, competent keeper of the reagent tray. Practical and organised, explains things as recipes and procedures. Warm but no-nonsense, like someone who has explained this a hundred times and still cares. Uses kitchen and pantry comparisons.',
    accent: 'border-sky-600 text-sky-300',
    displayHeight: 190,
    sheets: researcherSheets('maid'),
  },

  // The townsfolk. They teach nothing on a script - they only take questions, so a
  // player who did not follow a researcher has somewhere else to ask.
  bearded: {
    id: 'bearded',
    name: 'Corwin',
    title: 'Examiner',
    voice:
      'A stern, thorough examiner who has marked thousands of papers. Answers by first saying what the question is really testing, then how marks are actually lost on it. Direct, unsentimental, quietly encouraging when the student is close. Mentions common mistakes by name.',
    accent: 'border-amber-600 text-amber-300',
    displayHeight: 172,
    sheets: townSheets('bearded'),
  },
  'hat-man': {
    id: 'hat-man',
    name: 'Silas',
    title: 'Mnemonist',
    voice:
      'A quick, cheerful traveller who collects memory tricks the way other people collect coins. Answers with a short correct explanation followed by a hook for remembering it - a rhyme, an acronym, an image. Never lets the trick replace the reasoning; always says why it works.',
    accent: 'border-indigo-500 text-indigo-300',
    displayHeight: 178,
    sheets: townSheets('hat-man'),
  },
  oldman: {
    id: 'oldman',
    name: 'Elder Mabon',
    title: 'Keeper of First Principles',
    voice:
      'A very old scholar who refuses to give shortcuts. Answers every question by going back to the underlying principle and rebuilding forward from it, slowly and clearly. Gentle, unhurried, faintly amused by anyone in a rush. Often begins with "Start further back than that."',
    accent: 'border-stone-400 text-stone-300',
    displayHeight: 164,
    sheets: townSheets('oldman'),
  },
  woman: {
    id: 'woman',
    name: 'Isolde',
    title: 'Second Opinion',
    voice:
      'A patient tutor who explains things a second way when the first way did not land. Checks what the student already understands before answering, uses everyday analogies, and never makes anyone feel slow. Warm, plain-spoken, allergic to jargon she has not first defined.',
    accent: 'border-pink-500 text-pink-300',
    displayHeight: 170,
    sheets: townSheets('woman'),
  },
}

export function getNpc(id: string): NpcDef | undefined {
  return npcs[id]
}
