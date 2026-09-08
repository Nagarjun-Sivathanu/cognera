/**
 * The Frog Wizard's tutorial script.
 *
 * Content is kept here rather than in the component so the wording can be edited
 * without touching layout. Every beat carries an emotion, which drives the frog's
 * pose and how the text is set - that's the whole personality system.
 */

export type FrogEmotion =
  | 'neutral'
  | 'happy'
  | 'smug'
  | 'angry'
  | 'excited'
  | 'deadpan'
  | 'proud'

export interface TutorialBeat {
  emotion: FrogEmotion
  text: string
  /** Optional heading shown above the bubble, marking a new section. */
  chapter?: string
}

export const tutorialScript: TutorialBeat[] = [
  {
    chapter: 'Introductions',
    emotion: 'smug',
    text: "Oh. A new one. Sit down, Traveller — I'm the Frog Wizard, and I'll be the voice in your ear while you flail about down here.",
  },
  {
    emotion: 'neutral',
    text: "Here's the shape of it: this is a dungeon crawler where the sword is your brain. Every enemy stands between you and a question. Answer well and it dies. Answer badly and, well. You'll find out.",
  },

  {
    chapter: 'How a fight works',
    emotion: 'neutral',
    text: 'Each turn you get one question. Get it RIGHT and your character swings — damage scales off your attack power, so a well-geared Traveller can delete a rabbit in one hit.',
  },
  {
    emotion: 'deadpan',
    text: 'Get it wrong and the enemy hits you instead. No shield, no mercy, no partial credit. Your HP hits zero and the run ends.',
  },
  {
    emotion: 'happy',
    text: "Every question you answer is also quietly recorded, buddy. I'm keeping notes. On you. Forever.",
  },

  {
    chapter: 'Your options in battle',
    emotion: 'neutral',
    text: "You're not limited to just answering. There's a row of buttons under the battlefield, and most people ignore them until they die. Don't be most people.",
  },
  {
    emotion: 'excited',
    text: "WIND UP! Arm it, and if your NEXT answer is correct you hit for nearly double. If it's wrong you take extra damage. It's a bet, Traveller. Bet when you're sure.",
  },
  {
    emotion: 'neutral',
    text: 'DODGE skips the fight for a turn — roughly half the time you take no damage at all, and sometimes you leave the thing off-balance so its next swing whiffs too. Good when your HP is looking tragic.',
  },
  {
    emotion: 'happy',
    text: "BAG drinks a potion and heals a healthy chunk of your maximum HP. You start with one. You get more for clearing dungeons. Try not to hoard them until you're dead, that's a classic.",
  },
  {
    emotion: 'smug',
    text: "SWAP changes which character you're fighting as, mid-battle. They have different attack and HP multipliers, so you can duck into the tanky Monk when things go sideways. Three-turn cooldown, and your HP clamps to the new body's maximum — swap into something frail while wounded and that's on you.",
  },
  {
    emotion: 'proud',
    text: "Then there's your skill school — Flame Arts, Emberblade, Stone Path, whatever your hero calls it. Those cost FOCUS.",
  },
  {
    emotion: 'excited',
    text: "And Focus ONLY fills when you answer correctly — faster the longer your streak runs. Which means the flashiest thing you can do in this game is powered entirely by actually knowing the material. I didn't design that. I just enjoy it.",
  },
  {
    emotion: 'deadpan',
    text: "RETREAT ends the run. You keep the XP from whatever you already killed, you get no loot, and you walk away breathing. It's not glamorous. It beats the alternative.",
  },

  {
    chapter: 'Getting stronger',
    emotion: 'neutral',
    text: 'XP comes from every enemy you put down, and enough of it levels you up. Levels raise your attack and your maximum HP. Simple, honest progress.',
  },
  {
    emotion: 'happy',
    text: 'CLEAR a dungeon and you get the good stuff: skill points, a potion, and a loot roll. Die instead and you get... the XP you earned. And my sympathy, which is worth less.',
  },
  {
    emotion: 'neutral',
    text: 'Loot comes in five rarities, Common through Legendary, and the harder the tier the better your odds. Gear goes in seven slots and six of them actually show up on your character, so you can see yourself getting richer.',
  },
  {
    emotion: 'smug',
    text: "Skill points buy passive upgrades, or unlock your active skills. Spend them in the Character screen. Spend them on something, at least — I've watched Travellers die with twelve unspent.",
  },

  {
    chapter: 'Where to fight',
    emotion: 'neutral',
    text: 'Dungeon Mode goes Subject, then Chapter, then difficulty tier. Pick Total Revision to mix a whole subject, or one chapter to drill it specifically. That second option is how you fix a weakness, buddy.',
  },
  {
    emotion: 'neutral',
    text: 'Four tiers: Easy, Medium, Moderate, Hard. Higher tiers throw bigger packs of nastier things at you, and pay out accordingly. They are all unlocked. Whether that was wise is between you and your HP bar.',
  },
  {
    emotion: 'excited',
    text: "SANDBOX MODE is the endless one! Pick a subject or take everything at once, then survive wave after wave — each one harder than the last. There's no clear condition. You go until you fall, and you're paid for how deep you got.",
  },

  {
    chapter: 'My desk',
    emotion: 'proud',
    text: "See the frog button at the top of the screen? That's me. That's my desk. Every question you've ever missed is filed there, along with worked solutions and revision notes for each chapter.",
  },
  {
    emotion: 'happy',
    text: "And when you turn a chapter around — when the thing that kept killing you stops killing you — I'll tell you. I keep track of that too. It's the only part of this job I actually like.",
  },
  {
    emotion: 'smug',
    text: "That's everything, Traveller. Go get something wrong so I have material to work with.",
  },
]

/** How each emotion is set: font, casing, colour, and the frog's own posture. */
export const emotionStyles: Record<
  FrogEmotion,
  { text: string; frog: string; label: string }
> = {
  neutral: {
    text: 'text-stone-900',
    frog: '',
    label: 'explaining',
  },
  happy: {
    text: 'font-medieval text-emerald-800 text-[1.05em]',
    frog: 'animate-frog-bounce',
    label: 'delighted',
  },
  smug: {
    text: 'italic lowercase text-indigo-900',
    frog: '-rotate-6',
    label: 'smug',
  },
  angry: {
    text: 'font-bold uppercase tracking-wide text-red-700',
    frog: 'animate-frog-shake',
    label: 'annoyed',
  },
  excited: {
    text: 'font-medieval uppercase text-amber-700 text-[1.1em] tracking-wide',
    frog: 'animate-frog-bounce scale-110',
    label: 'excited',
  },
  deadpan: {
    text: 'font-mono text-[0.95em] text-stone-600',
    frog: 'grayscale',
    label: 'deadpan',
  },
  proud: {
    text: 'font-medieval text-amber-800 text-[1.05em]',
    frog: 'scale-105',
    label: 'proud',
  },
}
