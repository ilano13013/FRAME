import { lazy, Suspense, useEffect, useRef, useState, type MutableRefObject } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../lib/motion'
import { scrollToTarget } from '../lib/scroll'
import type { SculptureInput } from '../three/input'
import { Chars } from './Chars'
import { useMagnetic } from '../hooks/useMagnetic'

const Sculpture = lazy(() => import('../three/Sculpture'))

type Props = {
  input: MutableRefObject<SculptureInput>
  revealed: boolean
  onReady: () => void
}

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

const MIN_W = 240
const charClass = 'font-[family-name:var(--font-display-var)] text-bone transition-[font-variation-settings] duration-300 ease-out'
const MAX_W = 900

export function Hero({ input, revealed, onReady }: Props) {
  const section = useRef<HTMLElement>(null)
  const cta = useRef<HTMLButtonElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const [webgl] = useState(hasWebGL)
  const [active, setActive] = useState(true)
  const [compact] = useState(() => window.innerWidth < 768)
  useMagnetic(cta, 0.3)

  // No WebGL means no scene to wait for.
  useEffect(() => {
    if (!webgl) onReady()
  }, [webgl, onReady])

  // Stop the render loop entirely once the hero is off screen.
  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Pointer: steer the sculpture, drag to spin it, click to send a shockwave,
  // and let the letters swell in weight as the pointer approaches them.
  useEffect(() => {
    const el = section.current
    if (!el) return
    const letters = Array.from(el.querySelectorAll<HTMLElement>('[data-line] [data-char]')).filter(
      (l) => !l.closest('.serif-i'),
    )
    const centres: { x: number; y: number }[] = []
    const measure = () => {
      letters.forEach((l, i) => {
        const r = l.getBoundingClientRect()
        centres[i] = { x: r.left + r.width / 2, y: r.top + r.height / 2 + window.scrollY }
      })
    }
    let last = { x: 0, y: 0, t: performance.now() }
    let dragging = false
    let travelled = 0
    let raf = 0
    let pointer = { x: -9999, y: -9999 }
    const fine = window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion()

    const paint = () => {
      raf = 0
      const radius = Math.max(window.innerWidth * 0.22, 220)
      letters.forEach((l, i) => {
        const c = centres[i]
        if (!c) return
        const d = Math.hypot(pointer.x - c.x, pointer.y - (c.y - window.scrollY))
        if (pointer.x < -999) {
          l.style.removeProperty('font-variation-settings')
          return
        }
        const k = Math.max(0, 1 - d / radius)
        const w = MIN_W + (MAX_W - MIN_W) * Math.pow(k, 0.7)
        l.style.fontVariationSettings = `'wght' ${Math.round(w)}`
      })
    }

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const i = input.current
      i.px = ((e.clientX - r.left) / r.width) * 2 - 1
      i.py = -(((e.clientY - r.top) / r.height) * 2 - 1)
      const now = performance.now()
      const dist = Math.hypot(e.clientX - last.x, e.clientY - last.y)
      const dt = Math.max(now - last.t, 1)
      i.speed = Math.min(1, i.speed + (dist / dt) * 0.05)
      if (dragging) {
        i.dragX += e.clientX - last.x
        i.dragY += e.clientY - last.y
        travelled += dist
      }
      last = { x: e.clientX, y: e.clientY, t: now }
      if (readout.current) {
        readout.current.textContent = `X ${i.px >= 0 ? '+' : '−'}${Math.abs(i.px).toFixed(2)}  Y ${i.py >= 0 ? '+' : '−'}${Math.abs(i.py).toFixed(2)}`
      }
      if (fine) {
        pointer = { x: e.clientX, y: e.clientY }
        if (!raf) raf = requestAnimationFrame(paint)
      }
    }
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('button, a')) return
      dragging = true
      travelled = 0
      last = { x: e.clientX, y: e.clientY, t: performance.now() }
    }
    const up = () => {
      if (dragging && travelled < 8) input.current.pulse = 1
      dragging = false
    }
    const leave = () => {
      dragging = false
      pointer = { x: -9999, y: -9999 }
      if (fine && !raf) raf = requestAnimationFrame(paint)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    document.fonts?.ready.then(measure)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    el.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      el.removeEventListener('pointerleave', leave)
    }
  }, [input])

  // Entrance once the aperture opens, then scroll choreography.
  useGSAP(
    () => {
      if (!revealed) return
      const q = gsap.utils.selector(section)
      if (prefersReducedMotion()) {
        gsap.set(q('[data-char], [data-fade]'), { clearProps: 'all' })
        return
      }
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.fromTo(
        q('[data-line="a"] [data-char]'),
        { yPercent: 120, rotate: 6 },
        { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.05 },
      )
        .fromTo(
          q('[data-line="b"] [data-char]'),
          { yPercent: 120, rotate: -6 },
          { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.05 },
          0.12,
        )
        .fromTo(q('[data-fade]'), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08 }, 0.5)

      gsap.timeline({
        scrollTrigger: {
          trigger: section.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
          onUpdate: (self) => {
            input.current.scroll = self.progress
          },
        },
      })
        .to(q('[data-line="a"]'), { xPercent: -18, ease: 'none' }, 0)
        .to(q('[data-line="b"]'), { xPercent: 14, ease: 'none' }, 0)
        .to(q('[data-fade]'), { autoAlpha: 0, ease: 'none', duration: 0.4 }, 0)
    },
    { scope: section, dependencies: [revealed] },
  )

  // Depth sandwich: BEYOND sits behind the sculpture, SCREEN passes in front of it.
  const typeLayer = (layer: 'back' | 'front') => (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-[var(--gutter)] top-[calc(var(--header-h)+2vh)] bottom-[14vh] flex flex-col justify-between md:bottom-[9vh]"
    >
      <div className={`display text-[clamp(4.2rem,15.5vw,17rem)] whitespace-nowrap ${layer === 'front' ? 'invisible' : ''}`}>
        <span data-line="a" className="block">
          <Chars text="Beyond" charClassName={charClass} />
        </span>
      </div>
      <div className="display flex flex-col items-end justify-end gap-[0.04em] text-[clamp(4.2rem,15.5vw,17rem)] whitespace-nowrap md:flex-row md:gap-[0.12em]">
        <span data-line="b" className={`serif-i mb-[0.08em] block text-[0.42em] leading-none text-acid ${layer === 'front' ? 'invisible' : ''}`}>
          <Chars text="the" />
        </span>
        <span data-line="b" className={`block ${layer === 'back' ? 'invisible' : ''}`}>
          <Chars text="Screen" charClassName={charClass} />
        </span>
      </div>
    </div>
  )

  return (
    <section
      ref={section}
      id="sculpture"
      data-room="00|Sculpture"
      className="relative h-[100svh] min-h-[560px] touch-pan-y overflow-hidden select-none"
      data-cursor="Glisser"
    >
      <h1 className="sr-only">FRAME — Beyond the Screen, galerie digitale expérimentale</h1>

      <div className="absolute inset-0">
        {typeLayer('back')}
      </div>

      <div className="absolute inset-0">
        {webgl ? (
          <Suspense fallback={null}>
            <SculptureMount input={input} active={active} compact={compact} onReady={onReady} />
          </Suspense>
        ) : (
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 size-[46vmin] -translate-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff_0%,#bdbcb6_18%,#3a3a37_48%,#0b0b0a_70%,#c6ff1a_100%)]"
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0">{typeLayer('front')}</div>

      <div className="absolute inset-x-[var(--gutter)] bottom-[calc(var(--gutter)+env(safe-area-inset-bottom))] grid grid-cols-1 items-end gap-5 md:grid-cols-[1fr_auto_1fr]">
        <div data-fade className="max-w-[34ch]">
          <p className="text-[0.95rem] leading-snug text-bone">
            Une galerie qui commence là où l’écran s’arrête. Sculpture chromée, calculée en temps réel.
          </p>
        </div>
        <p data-fade className="mono hidden items-center gap-3 text-bone-dim md:flex">
          <DragIcon />
          Glisser pour tourner · Cliquer pour frapper
        </p>
        <div data-fade className="flex items-center justify-between gap-4 md:justify-end">
          <span ref={readout} className="mono hidden text-bone-dim tabular-nums md:inline" aria-hidden>
            X +0.00  Y +0.00
          </span>
          <button
            ref={cta}
            type="button"
            data-cursor="Entrer"
            onClick={() => scrollToTarget('#galerie')}
            className="group mono relative inline-flex min-h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-acid px-5 font-semibold whitespace-nowrap text-ink md:w-auto"
          >
            <span className="relative z-10">Entrer dans la galerie</span>
            <ArrowDown />
            <span className="absolute inset-0 translate-y-full rounded-full bg-bone transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-y-0" />
          </button>
        </div>
      </div>
    </section>
  )
}

function SculptureMount({
  input,
  active,
  compact,
  onReady,
}: {
  input: MutableRefObject<SculptureInput>
  active: boolean
  compact: boolean
  onReady: () => void
}) {
  // The lazy chunk resolving means three.js is parsed; give the GPU two frames
  // to compile the scene before the intro opens onto it.
  useEffect(() => {
    let a = 0
    let b = 0
    a = requestAnimationFrame(() => {
      b = requestAnimationFrame(onReady)
    })
    return () => {
      cancelAnimationFrame(a)
      cancelAnimationFrame(b)
    }
  }, [onReady])
  return <Sculpture input={input} active={active} compact={compact} />
}

function DragIcon() {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden>
      <path d="M1 7h20M1 7l4-4M1 7l4 4M21 7l-4-4M21 7l-4 4" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11" cy="7" r="2.2" fill="#c6ff1a" />
    </svg>
  )
}

function ArrowDown() {
  return (
    <svg className="relative z-10 transition-transform duration-500 group-hover:translate-y-0.5" width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <path d="M6 0v12M1 7l5 5 5-5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
