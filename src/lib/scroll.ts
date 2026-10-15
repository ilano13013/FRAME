import Lenis from 'lenis'
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion'

let lenis: Lenis | null = null

export function startSmoothScroll() {
  if (lenis || prefersReducedMotion()) return lenis
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(2, -10 * t), touchMultiplier: 1.4 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  return lenis
}

export function scrollToTarget(target: string | number, immediate = false) {
  const offset = 0
  if (lenis) {
    lenis.scrollTo(target as string, { offset, immediate, duration: 1.6 })
    return
  }
  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' })
    return
  }
  document.querySelector(target)?.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' })
}

export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop()
    else lenis.start()
  }
  document.body.classList.toggle('is-locked', locked)
}
