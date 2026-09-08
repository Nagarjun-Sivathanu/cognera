// Sound effects (one-shot) and background music (looping, one track at a time).
// Only the effects the user has explicitly assigned a meaning to are wired up;
// combat_music_1/2, helping_frog, player_getting_hit_0, and the sword-slash
// files exist in public/sounds but aren't used yet pending direction.

export const SFX = {
  mobGettingHit: '/sounds/mob_getting_hit.mp3',
  bossGettingHit: '/sounds/boss_getting_hit.mp3',
  mobDoingDamage: '/sounds/mob_doing_dmg.mp3',
  playerDeathblow: '/sounds/player_getting_hit_deathblow.mp3',
  menuClick: '/sounds/menu_click.mp3',
  frogCroak: '/sounds/frog_croak.mp3',
} as const

export const BGM = {
  cave: '/sounds/cave_0.mp3',
  menu: '/sounds/menu_song.mp3',
} as const

const sfxTemplates: Record<string, HTMLAudioElement> = {}

export function playSfx(src: string, volume = 0.8) {
  try {
    if (!sfxTemplates[src]) sfxTemplates[src] = new Audio(src)
    const node = sfxTemplates[src].cloneNode(true) as HTMLAudioElement
    node.volume = volume
    void node.play().catch(() => {})
  } catch {
    // audio is best-effort; never let it break gameplay
  }
}

let currentBgm: HTMLAudioElement | null = null
let currentBgmSrc: string | null = null

export function playBgm(src: string, volume = 0.35) {
  if (currentBgmSrc === src) return
  currentBgm?.pause()
  try {
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = volume
    void audio.play().catch(() => {})
    currentBgm = audio
    currentBgmSrc = src
  } catch {
    currentBgm = null
    currentBgmSrc = null
  }
}

export function stopBgm() {
  currentBgm?.pause()
  currentBgm = null
  currentBgmSrc = null
}
