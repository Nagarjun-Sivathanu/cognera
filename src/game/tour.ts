import type { FrogEmotion } from './tutorial'

/**
 * First-run guided tour.
 *
 * Steps are grouped by the screen they belong to. The tour always shows the first
 * unfinished step matching the current view, so if the player navigates ahead - or
 * the game moves them on - the tour follows rather than getting stranded.
 */

export type TourView = 'hub' | 'subjects' | 'chapters' | 'list' | 'run'

export interface TourStep {
  id: string
  view: TourView
  /** Element to spotlight, as a `data-tour` value. Omit to dim the whole screen. */
  target?: string
  emotion: FrogEmotion
  text: string
  /**
   * When set, the step has no Next button - the player has to actually do the thing.
   * The tour moves on by itself once they land on the next screen.
   */
  waitForAction?: string
}

export const tourSteps: TourStep[] = [
  // --- Hub
  {
    id: 'welcome',
    view: 'hub',
    emotion: 'smug',
    text: "Oh. A new one. Sit down, Traveller — I'm the Frog Wizard, and I'll be the voice in your ear until you know what you're doing. This won't take long.",
  },
  {
    id: 'hub-dungeon',
    view: 'hub',
    target: 'mode-dungeon',
    emotion: 'neutral',
    text: 'This is Dungeon Mode — the main event. You pick a subject, then a chapter, then a difficulty, and then you fight things with your brain. Go on, click it.',
    waitForAction: 'Click Dungeon Mode to continue',
  },

  // --- Subject picker
  {
    id: 'subjects',
    view: 'subjects',
    target: 'subject-list',
    emotion: 'neutral',
    text: "Your subjects. No levels, no locks — just pick whichever one you're least afraid of. Every question you'll face comes from the one you choose here.",
    waitForAction: 'Pick a subject to continue',
  },

  // --- Chapter picker
  {
    id: 'chapters-total',
    view: 'chapters',
    target: 'total-revision',
    emotion: 'neutral',
    text: 'Total Revision mixes every chapter in the subject together. Good for a general beating.',
  },
  {
    id: 'chapters-single',
    view: 'chapters',
    target: 'chapter-list',
    emotion: 'proud',
    text: "Or drill ONE chapter on its own. That's the option that actually fixes a weakness, buddy — when I tell you later that a chapter keeps killing you, this is where you come. Pick something.",
    waitForAction: 'Pick a chapter to continue',
  },

  // --- Tier map
  {
    id: 'tiers',
    view: 'list',
    target: 'tier-nodes',
    emotion: 'neutral',
    text: "Four difficulty tiers. Easy throws you a couple of weak things; Hard throws packs of nasty ones and pays out far better loot. Hover any of them for the details — they're all unlocked, which is either freedom or a trap.",
  },
  {
    id: 'tiers-pick',
    view: 'list',
    target: 'tier-nodes',
    emotion: 'smug',
    text: "start with Easy. i know, i know — but let's not have you die during your own tutorial.",
    waitForAction: 'Enter a dungeon to continue',
  },

  // --- Battle
  {
    id: 'battle-question',
    view: 'run',
    target: 'question-panel',
    emotion: 'excited',
    text: "HERE'S THE WHOLE GAME, TRAVELLER! One question per turn. That's your sword.",
  },
  {
    id: 'battle-enemy',
    view: 'run',
    target: 'enemies',
    emotion: 'neutral',
    text: 'Answer correctly and your character swings at that. Damage scales off your attack power, so once you have decent gear you can delete the small ones in a single hit.',
  },
  {
    id: 'battle-player',
    view: 'run',
    target: 'player-panel',
    emotion: 'deadpan',
    text: 'Answer wrong and it hits you instead. That bar is all you have. It reaches zero and the run is over.',
  },
  {
    id: 'battle-focus',
    view: 'run',
    target: 'focus-bar',
    emotion: 'proud',
    text: "Focus. It fills ONLY when you answer correctly, and faster the longer your streak runs. It's what powers your special skills — which means the flashiest thing in this game is fuelled entirely by actually knowing the material.",
  },
  {
    id: 'battle-actions',
    view: 'run',
    target: 'action-buttons',
    emotion: 'neutral',
    text: "And you're not stuck just answering. Bag drinks a potion. Dodge skips a hit about half the time and sometimes staggers the thing. Wind Up bets on your next answer for nearly double damage — or extra pain if you're wrong. Swap changes which hero you're fighting as, on a cooldown. Retreat walks away with your XP intact.",
  },
  {
    id: 'battle-go',
    view: 'run',
    target: 'question-panel',
    emotion: 'happy',
    text: "Right — answer it. Whatever happens, happens. I'll be watching, and I'm keeping notes.",
    waitForAction: 'Answer the question to continue',
  },
  {
    id: 'desk',
    view: 'run',
    target: 'study-desk',
    emotion: 'proud',
    text: "That frog button is me. Every question you ever miss gets filed there with a worked solution and revision notes, and when a chapter finally stops beating you, I'll say so. That's the bit I'm here for.",
  },
  {
    id: 'farewell',
    view: 'run',
    emotion: 'smug',
    text: "That's everything. Go and get something wrong, Traveller — I need the material.",
  },
]

/** The step the tour should be showing, given progress and which screen is up. */
export function currentTourStep(stepIndex: number, view: string): { step: TourStep; index: number } | null {
  for (let i = stepIndex; i < tourSteps.length; i += 1) {
    if (tourSteps[i].view === view) return { step: tourSteps[i], index: i }
  }
  return null
}
