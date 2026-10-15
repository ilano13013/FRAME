import { useEffect, type RefObject } from 'react'
import { gsap, isFinePointer, prefersReducedMotion } from '../lib/motion'

/** Pulls an element toward the pointer while it hovers, then springs it back. */
export function useMagnetic<T extends HTMLElement>(ref: RefObject<T | null>, strength = 0.35) {
  useEffect(() => {
    const el = ref.current
    if (!el || !isFinePointer() || prefersReducedMotion()) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'expo.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'expo.out' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const leave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' })
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [ref, strength])
}
