import { useRef } from 'react'
import { ScrollTrigger, gsap, useGSAP, prefersReducedMotion } from '../lib/motion'

const WORDS = ['Beyond the Screen', 'Chrome', 'Temps réel', 'Œuvres calculées', 'Aucune vitre']

/** A ribbon that leans into the scroll: the faster you move, the harder it skews. */
export function Marquee() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const skew = gsap.quickTo(root.current, 'skewX', { duration: 0.5, ease: 'power3.out' })
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => skew(gsap.utils.clamp(-14, 14, self.getVelocity() / -260)),
        onLeave: () => skew(0),
        onLeaveBack: () => skew(0),
      })
      return () => st.kill()
    },
    { scope: root },
  )

  const row = (
    <div className="flex shrink-0 items-center">
      {WORDS.map((w, i) => (
        <span key={i} className="flex items-center">
          <span className={i % 2 ? 'serif-i px-[0.5em] normal-case' : 'display px-[0.5em]'}>{w}</span>
          <Star />
        </span>
      ))}
    </div>
  )

  return (
    <div aria-hidden className="relative overflow-hidden border-y border-ink bg-acid py-4 text-ink">
      <div ref={root} className="text-[clamp(1.8rem,4.6vw,4.4rem)] leading-none">
        <div className="marquee-track flex w-max">
          {row}
          {row}
        </div>
      </div>
    </div>
  )
}

function Star() {
  return (
    <svg className="size-[0.6em] shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 0l2.2 9.8L24 12l-9.8 2.2L12 24l-2.2-9.8L0 12l9.8-2.2z" fill="currentColor" />
    </svg>
  )
}
