export type SculptureInput = {
  /** Pointer position over the hero, -1..1 on both axes. */
  px: number
  py: number
  /** Smoothed pointer speed, 0..~1. */
  speed: number
  /** Horizontal drag delta waiting to be turned into spin. */
  dragX: number
  dragY: number
  /** Click shock, decays every frame. */
  pulse: number
  /** Hero scroll progress 0..1. */
  scroll: number
  /** Intro reveal 0..1. */
  reveal: number
}

export const createSculptureInput = (): SculptureInput => ({
  px: 0,
  py: 0,
  speed: 0,
  dragX: 0,
  dragY: 0,
  pulse: 0,
  scroll: 0,
  reveal: 0,
})
