import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../lib/motion'
import { Chars } from './Chars'

type Props = {
  /** The 3D scene has compiled; the aperture may open. */
  ready: boolean
  onReveal: (amount: number) => void
  onHeroIn: () => void
  onDone: () => void
}

const hole = (w: number, h: number) => {
  const x1 = 50 - w / 2
  const x2 = 50 + w / 2
  const y1 = 50 - h / 2
  const y2 = 50 + h / 2
  return `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${x1}% ${y1}%, ${x2}% ${y1}%, ${x2}% ${y2}%, ${x1}% ${y2}%, ${x1}% ${y1}%)`
}

/**
 * Opening sequence: a counter loads the room, FRAME rises, then the black
 * screen tears open into a picture frame onto the live sculpture and keeps
 * opening until the frame is the whole viewport.
 */
export function Intro({ ready, onReveal, onHeroIn, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const waiting = useRef(false)
  const readyRef = useRef(ready)
  readyRef.current = ready

  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      const q = gsap.utils.selector(el)
      const mobile = window.innerWidth < 768
      const win = { w: 0, h: 0 }
      const frame = q('[data-frame]')[0] as HTMLElement
      const apply = () => {
        el.style.clipPath = hole(win.w, win.h)
        frame.style.left = `${50 - win.w / 2}%`
        frame.style.top = `${50 - win.h / 2}%`
        frame.style.width = `${win.w}%`
        frame.style.height = `${win.h}%`
      }
      apply()

      if (prefersReducedMotion()) {
        onReveal(1)
        onHeroIn()
        gsap.to(el, { autoAlpha: 0, duration: 0.5, delay: 0.3, onComplete: onDone })
        return
      }

      const counter = { v: 0 }
      const num = q('[data-count]')[0] as HTMLElement
      const t = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.current = t

      t.to(counter, {
        v: 100,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          num.textContent = String(Math.round(counter.v)).padStart(3, '0')
        },
      })
        .fromTo(q('[data-bar]'), { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
        .from(q('[data-word] [data-char]'), { yPercent: 115, duration: 1, stagger: 0.07 }, 0.15)
        .from(q('[data-tag]'), { autoAlpha: 0, y: 12, duration: 0.8 }, 0.7)
        .addLabel('open', 1.55)
        .call(() => {
          if (!readyRef.current) {
            waiting.current = true
            t.pause()
          }
        }, undefined, 'open')
        .to(q('[data-meta]'), { autoAlpha: 0, duration: 0.4, ease: 'power2.out' }, 'open')
        .to(
          win,
          { w: mobile ? 66 : 30, h: mobile ? 40 : 48, duration: 1.05, ease: 'expo.inOut', onUpdate: apply },
          'open',
        )
        .to(q('[data-word]'), { y: mobile ? '-29vh' : '-33vh', scale: mobile ? 0.5 : 0.36, duration: 1.05, ease: 'expo.inOut' }, 'open')
        .to(q('[data-crop]'), { autoAlpha: 1, duration: 0.3, stagger: 0.05 }, 'open+=0.5')
        .call(() => onReveal(0.75), undefined, 'open+=0.2')
        .from(q('[data-sub] [data-char]'), { yPercent: 115, duration: 0.9, stagger: 0.025 }, 'open+=0.7')
        .addLabel('expand', 'open+=1.85')
        .to(win, { w: 150, h: 150, duration: 1.25, ease: 'expo.inOut', onUpdate: apply }, 'expand')
        .to(q('[data-word]'), { y: '-70vh', scale: 0.6, duration: 1.25, ease: 'expo.inOut' }, 'expand')
        .to(q('[data-sub]'), { y: '30vh', duration: 1.25, ease: 'expo.inOut' }, 'expand')
        .call(() => onReveal(1), undefined, 'expand')
        .call(onHeroIn, undefined, 'expand+=0.55')
        .call(onDone)
    },
    { scope: root },
  )

  useEffect(() => {
    if (ready && waiting.current) {
      waiting.current = false
      tl.current?.play()
    }
  }, [ready])

  // A slow GPU must never trap the visitor behind a closed door.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (waiting.current) {
        waiting.current = false
        tl.current?.play()
      }
    }, 4000)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const skip = () => {
    const t = tl.current
    if (!t) return
    waiting.current = false
    t.timeScale(5).play()
  }

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[80] overflow-hidden bg-ink text-bone"
      role="dialog"
      aria-label="Ouverture de FRAME"
    >
      <div data-frame className="pointer-events-none absolute">
        <span data-crop className="crop tl invisible -top-3 -left-3 opacity-0" />
        <span data-crop className="crop tr invisible -top-3 -right-3 opacity-0" />
        <span data-crop className="crop bl invisible -bottom-3 -left-3 opacity-0" />
        <span data-crop className="crop br invisible -right-3 -bottom-3 opacity-0" />
      </div>

      <div className="absolute inset-0 grid place-items-center">
        <div data-word aria-hidden className="display text-[clamp(4.5rem,21vw,22rem)] leading-[0.8] will-change-transform">
          <Chars text="FRAME" />
        </div>
      </div>

      <p
        data-sub
        className="serif-i absolute inset-x-0 top-[73%] text-center text-[clamp(1.6rem,4vw,3.4rem)] leading-none md:top-[77%]"
      >
        <Chars text="Beyond the Screen" />
      </p>

      <div data-meta className="absolute inset-x-[var(--gutter)] bottom-[calc(var(--gutter)+env(safe-area-inset-bottom))]">
        <div className="mb-3 flex items-end justify-between gap-6">
          <p data-tag className="mono max-w-[22ch] text-bone-dim">
            Galerie digitale expérimentale
          </p>
          <p className="mono text-bone">
            Ouverture <span data-count className="text-acid">000</span>
          </p>
        </div>
        <div className="h-px w-full bg-line">
          <div data-bar className="h-full origin-left bg-acid" />
        </div>
      </div>

      <button
        type="button"
        onClick={skip}
        data-cursor="Passer"
        className="mono absolute top-[calc(var(--gutter)+env(safe-area-inset-top))] right-[var(--gutter)] min-h-11 px-1 text-bone-dim transition-colors hover:text-acid"
      >
        Passer l’intro
      </button>
    </div>
  )
}
