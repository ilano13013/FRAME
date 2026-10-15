import { useEffect, useRef, useState } from 'react'
import { gsap, isFinePointer } from '../lib/motion'

/**
 * Two-part cursor: a precise acid dot and a lagging ring. Any element with
 * data-cursor="Label" swells the ring into a labelled disc.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [enabled] = useState(isFinePointer)

  useEffect(() => {
    if (!enabled || !dot.current || !ring.current) return
    document.documentElement.classList.add('has-cursor')
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'power3.out' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'power3.out' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'expo.out' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'expo.out' })
    let current = ''
    let shown = false

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (!shown) {
        shown = true
        gsap.to([dot.current, ring.current], { autoAlpha: 1, duration: 0.3 })
      }
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-cursor], a, button')
      const next = target ? target.dataset.cursor ?? '·' : ''
      if (next !== current) {
        current = next
        setLabel(next === '·' ? '' : next)
        gsap.to(ring.current, {
          scale: next ? (next === '·' ? 1.6 : 2.6) : 1,
          backgroundColor: next && next !== '·' ? '#c6ff1a' : 'rgba(198,255,26,0)',
          borderColor: next && next !== '·' ? '#c6ff1a' : '#f1eee6',
          duration: 0.45,
          ease: 'expo.out',
        })
        gsap.to(dot.current, { scale: next && next !== '·' ? 0 : 1, duration: 0.3 })
      }
    }
    const down = () => gsap.to(ring.current, { scale: '-=0.25', duration: 0.15, yoyo: true, repeat: 1 })
    const leave = () => {
      shown = false
      gsap.to([dot.current, ring.current], { autoAlpha: 0, duration: 0.3 })
    }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      <div
        ref={ring}
        className="invisible absolute top-0 left-0 -mt-5 -ml-5 grid size-10 place-items-center rounded-full border border-bone opacity-0"
      >
        <span className="mono text-[0.32rem] font-semibold tracking-[0.12em] text-ink">{label}</span>
      </div>
      <div ref={dot} className="invisible absolute top-0 left-0 -mt-[3px] -ml-[3px] size-1.5 rounded-full bg-acid opacity-0" />
    </div>
  )
}
