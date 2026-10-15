import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ARTWORKS } from '../lib/artworks'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { lockScroll } from '../lib/scroll'
import { ShaderCanvas } from './ShaderCanvas'

type Props = {
  index: number
  from: HTMLElement
  onClose: () => void
}

const insetOf = (el: HTMLElement | null) => {
  if (!el) return 'inset(50% 50% 50% 50%)'
  const r = el.getBoundingClientRect()
  return `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px)`
}

/**
 * Full-screen viewing room. It grows out of the clicked frame, keeps the work
 * alive at full resolution, and folds back into the frame it came from.
 */
export function ViewingRoom({ index: initial, from, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const curtain = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const [index, setIndex] = useState(initial)
  const busy = useRef(false)
  const art = ARTWORKS[index]
  const reduced = prefersReducedMotion()

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    lockScroll(true)
    const q = gsap.utils.selector(el)
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
    tl.fromTo(el, { clipPath: insetOf(from) }, { clipPath: 'inset(0px 0px 0px 0px)', duration: reduced ? 0.01 : 1.1, ease: 'expo.inOut' })
      .from(q('[data-in]'), { yPercent: 110, duration: reduced ? 0.01 : 1, stagger: 0.05 }, reduced ? 0 : 0.7)
      .from(q('[data-fade]'), { autoAlpha: 0, y: 18, duration: 0.8, stagger: 0.05 }, reduced ? 0 : 0.85)
    closeBtn.current?.focus({ preventScroll: true })
    return () => {
      tl.kill()
    }
    // Opening runs once per visit.
  }, [])

  const close = useCallback(() => {
    if (busy.current) return
    busy.current = true
    const el = root.current
    const target = document.querySelectorAll<HTMLElement>('[data-work] [data-frame]')[index] ?? from
    gsap.to(el, {
      clipPath: insetOf(target),
      duration: reduced ? 0.01 : 0.9,
      ease: 'expo.inOut',
      onComplete: () => {
        lockScroll(false)
        target.focus({ preventScroll: true })
        onClose()
      },
    })
  }, [from, index, onClose, reduced])

  const step = useCallback(
    (dir: 1 | -1) => {
      if (busy.current) return
      busy.current = true
      const next = (index + dir + ARTWORKS.length) % ARTWORKS.length
      const c = curtain.current
      if (reduced || !c) {
        setIndex(next)
        busy.current = false
        return
      }
      gsap
        .timeline({ onComplete: () => void (busy.current = false) })
        .set(c, { transformOrigin: dir > 0 ? 'left center' : 'right center' })
        .fromTo(c, { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: 'expo.in' })
        .call(() => setIndex(next))
        .set(c, { transformOrigin: dir > 0 ? 'right center' : 'left center' })
        .to(c, { scaleX: 0, duration: 0.7, ease: 'expo.out' }, '+=0.05')
        .from(root.current!.querySelectorAll('[data-in]'), { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.04 }, '<')
    },
    [index, reduced],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'Tab' && root.current) {
        const items = Array.from(root.current.querySelectorAll<HTMLElement>('button'))
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, step])

  // Swipe between works on touch screens.
  useEffect(() => {
    const el = root.current?.querySelector<HTMLElement>('[data-stage]')
    if (!el) return
    let x0 = 0
    let y0 = 0
    const down = (e: PointerEvent) => {
      x0 = e.clientX
      y0 = e.clientY
    }
    const up = (e: PointerEvent) => {
      const dx = e.clientX - x0
      if (e.pointerType !== 'mouse' && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - y0)) step(dx < 0 ? 1 : -1)
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerup', up)
    }
  }, [step])

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-title"
      className="fixed inset-0 z-[75] grid grid-rows-[minmax(0,1.15fr)_auto] bg-ink text-bone lg:grid-cols-[minmax(0,1.7fr)_minmax(24rem,1fr)] lg:grid-rows-1"
    >
      <div data-stage data-cursor="Explorer" className="relative overflow-hidden">
        <ShaderCanvas key={art.id} shader={art.shader} seed={index + 10} maxDpr={2} label={`${art.title} ${art.aside}, œuvre générative en plein écran`} />
        <span className="crop tl top-[var(--gutter)] left-[var(--gutter)]" />
        <span className="crop tr top-[var(--gutter)] right-[var(--gutter)]" />
        <span className="crop bl bottom-[var(--gutter)] left-[var(--gutter)]" />
        <span className="crop br right-[var(--gutter)] bottom-[var(--gutter)]" />
        <p data-fade className="mono absolute bottom-[calc(var(--gutter)+1.75rem)] left-[calc(var(--gutter)+1.75rem)] flex items-center gap-2 text-bone">
          <span className="size-1.5 animate-[blink_1.2s_steps(1)_infinite] rounded-full bg-acid" aria-hidden />
          En direct · {art.gesture}
        </p>
      </div>

      <div className="flex flex-col gap-6 overflow-y-auto border-line px-[var(--gutter)] pt-6 pb-[calc(var(--gutter)+env(safe-area-inset-bottom))] lg:border-l lg:pt-[calc(var(--header-h)+2rem)]">
        <div className="flex items-center justify-between">
          <span className="overflow-hidden">
            <span data-in className="mono block text-acid">
              {art.code} · {index + 1}/{ARTWORKS.length}
            </span>
          </span>
          <button
            ref={closeBtn}
            type="button"
            onClick={close}
            data-cursor="Fermer"
            className="mono flex min-h-11 items-center gap-3 px-1 text-bone hover:text-acid lg:fixed lg:top-[calc(var(--gutter)*0.6)] lg:right-[var(--gutter)]"
          >
            Fermer <kbd className="hidden border border-line px-1.5 py-0.5 text-bone-dim lg:inline">Échap</kbd>
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        <h2 id="room-title" className="display text-[clamp(3rem,7vw,7rem)]">
          <span className="block overflow-hidden pb-[0.05em]">
            <span data-in className="block">{art.title}</span>
          </span>
          <span className="block overflow-hidden pb-[0.1em]">
            <span data-in className="serif-i block text-[0.7em] text-acid">{art.aside}</span>
          </span>
        </h2>

        <p data-fade className="max-w-[46ch] text-lg leading-relaxed text-bone">
          {art.statement}
        </p>

        <dl data-fade className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t border-line pt-5 text-sm">
          <dt className="mono text-bone-dim">Médium</dt>
          <dd>{art.medium}</dd>
          <dt className="mono text-bone-dim">Format</dt>
          <dd>{art.format}</dd>
          <dt className="mono text-bone-dim">Durée</dt>
          <dd>{art.duration}</dd>
          <dt className="mono text-bone-dim">Année</dt>
          <dd className="tabular-nums">{art.year}</dd>
        </dl>

        <div data-fade className="mt-auto flex gap-3 pt-2">
          <RoomButton label="Œuvre précédente" onClick={() => step(-1)} dir={-1} />
          <RoomButton label="Œuvre suivante" onClick={() => step(1)} dir={1} />
        </div>
      </div>

      <div ref={curtain} aria-hidden className="pointer-events-none absolute inset-0 z-10 scale-x-0 bg-acid" />
    </div>
  )
}

function RoomButton({ label, onClick, dir }: { label: string; onClick: () => void; dir: 1 | -1 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-cursor={dir > 0 ? 'Suivante' : 'Précédente'}
      className={`group mono flex min-h-12 flex-1 items-center gap-3 border border-line px-4 transition-colors duration-300 hover:border-acid hover:bg-acid hover:text-ink ${
        dir > 0 ? 'justify-end' : ''
      }`}
    >
      {dir < 0 && <Arrow flip />}
      {label}
      {dir > 0 && <Arrow />}
    </button>
  )
}

function Arrow({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="18"
      height="12"
      viewBox="0 0 18 12"
      fill="none"
      aria-hidden
      className={`transition-transform duration-500 ease-[var(--ease-expo)] ${flip ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
    >
      <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
