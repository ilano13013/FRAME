import { useEffect, useRef, useState, type RefObject } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion, useGSAP } from '../lib/motion'
import { lockScroll, scrollToTarget } from '../lib/scroll'
import { useMagnetic } from '../hooks/useMagnetic'

const LINKS = [
  { id: 'sculpture', room: '00', label: 'Sculpture', note: 'Chrome en temps réel' },
  { id: 'galerie', room: '01', label: 'Galerie', note: 'Trois œuvres génératives' },
  { id: 'manifeste', room: '02', label: 'Manifeste', note: 'Pourquoi retirer la vitre' },
  { id: 'sortie', room: '03', label: 'Sortie', note: 'Revoir l’ouverture' },
]

export function Nav({ visible }: { visible: boolean }) {
  const header = useRef<HTMLElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const menuBtn = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [room, setRoom] = useState({ index: '00', name: 'Sculpture' })
  useMagnetic(menuBtn, 0.4)

  // Which room are we standing in?
  useEffect(() => {
    const rooms = Array.from(document.querySelectorAll<HTMLElement>('[data-room]'))
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const [index, name] = (e.target as HTMLElement).dataset.room!.split('|')
          setRoom({ index, name })
        })
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    rooms.forEach((r) => io.observe(r))
    return () => io.disconnect()
  }, [visible])

  // Hide on the way down, return on the way up; thread a progress line.
  useGSAP(
    () => {
      if (!visible) return
      gsap.fromTo(header.current, { yPercent: -120 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', delay: 0.2 })
      const st = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`
          if (self.scroll() < 160) gsap.to(header.current, { yPercent: 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' })
          else gsap.to(header.current, { yPercent: self.direction > 0 ? -120 : 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' })
        },
      })
      return () => st.kill()
    },
    { dependencies: [visible] },
  )

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[65] h-0.5">
        <div ref={bar} className="h-full origin-left scale-x-0 bg-acid" />
      </div>
      <header
        ref={header}
        className={`fixed inset-x-0 top-0 z-[60] text-bone mix-blend-difference ${visible ? '' : 'invisible'}`}
      >
        <nav
          aria-label="Principale"
          className="grid h-[var(--header-h)] grid-cols-[1fr_auto] items-center px-[var(--gutter)] pt-[env(safe-area-inset-top)] md:grid-cols-[1fr_auto_1fr]"
        >
          <a
            href="#sculpture"
            onClick={(e) => {
              e.preventDefault()
              scrollToTarget(0)
            }}
            data-cursor="Haut"
            className="flex min-h-11 w-fit items-center gap-3"
            aria-label="FRAME, retour en haut"
          >
            <Mark />
            <span className="font-display text-base font-bold tracking-[-0.02em]">FRAME</span>
          </a>

          <p className="mono hidden items-center gap-3 md:flex" aria-live="polite">
            <span className="text-bone-dim">Salle</span>
            <span key={room.index} className="inline-block animate-[roomIn_0.6s_var(--ease-expo)]">
              {room.index} · {room.name}
            </span>
          </p>

          <div className="flex justify-end">
            <button
              ref={menuBtn}
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="menu"
              data-cursor="Ouvrir"
              className="mono flex min-h-11 items-center gap-3 px-1"
            >
              Menu
              <span className="flex w-7 flex-col gap-[5px]" aria-hidden>
                <span className="h-px w-full bg-current" />
                <span className="h-px w-2/3 self-end bg-current" />
              </span>
            </button>
          </div>
        </nav>
      </header>
      <Menu open={open} onClose={() => setOpen(false)} origin={menuBtn} />
    </>
  )
}

function Menu({ open, onClose, origin }: { open: boolean; onClose: () => void; origin: RefObject<HTMLButtonElement | null> }) {
  const root = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const pending = useRef<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [clock, setClock] = useState('')

  useEffect(() => {
    if (open) setMounted(true)
  }, [open])

  useEffect(() => {
    const tick = () =>
      setClock(new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris' }).format(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  useGSAP(
    () => {
      const el = root.current
      if (!el || !mounted) return
      const q = gsap.utils.selector(el)
      const b = origin.current?.getBoundingClientRect()
      const cx = b ? b.left + b.width / 2 : window.innerWidth
      const cy = b ? b.top + b.height / 2 : 0
      const r = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy))
      const fast = prefersReducedMotion()
      tl.current = gsap
        .timeline({ paused: true, defaults: { ease: 'expo.out' } })
        .fromTo(
          el,
          { clipPath: `circle(0px at ${cx}px ${cy}px)` },
          { clipPath: `circle(${r}px at ${cx}px ${cy}px)`, duration: fast ? 0.01 : 1, ease: 'expo.inOut' },
        )
        .fromTo(q('[data-link]'), { yPercent: 110 }, { yPercent: 0, duration: fast ? 0.01 : 1, stagger: 0.06 }, fast ? 0 : 0.45)
        .fromTo(q('[data-meta]'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.05 }, fast ? 0 : 0.6)
    },
    { dependencies: [mounted], scope: root },
  )

  useEffect(() => {
    const t = tl.current
    if (!t || !mounted) return
    if (open) {
      lockScroll(true)
      t.timeScale(1).play()
      root.current?.querySelector<HTMLElement>('[data-link-btn]')?.focus({ preventScroll: true })
    } else {
      t.timeScale(1.6).reverse()
      t.eventCallback('onReverseComplete', () => {
        lockScroll(false)
        setMounted(false)
        // Scroll only once the page is unlocked, or the smooth scroller ignores it.
        if (pending.current) scrollToTarget(pending.current)
        pending.current = null
      })
      origin.current?.focus({ preventScroll: true })
    }
  }, [open, mounted, origin])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && root.current) {
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
  }, [open, onClose])

  if (!mounted) return null

  const go = (id: string) => {
    pending.current = `#${id}`
    onClose()
  }

  return (
    <div
      ref={root}
      id="menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[70] flex flex-col bg-acid text-ink [clip-path:circle(0px_at_100%_0%)]"
    >
      <div className="flex h-[var(--header-h)] items-center justify-between px-[var(--gutter)] pt-[env(safe-area-inset-top)]">
        <span data-meta className="mono">Paris {clock}</span>
        <button type="button" onClick={onClose} data-cursor="Fermer" className="mono flex min-h-11 items-center gap-3 px-1">
          Fermer
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <ul className="flex flex-1 flex-col justify-center gap-[1vh] px-[var(--gutter)]">
        {LINKS.map((l) => (
          <li key={l.id} className="overflow-hidden border-b border-ink/20">
            <div data-link>
              <button
                type="button"
                data-link-btn
                data-cursor="Aller"
                onClick={() => go(l.id)}
                className="group flex w-full items-baseline justify-between gap-6 py-[1.2vh] text-left"
              >
                <span className="relative block overflow-hidden">
                  <span className="display block text-[clamp(2.8rem,10vw,9rem)] transition-transform duration-700 ease-[var(--ease-expo)] group-hover:-translate-y-full group-focus-visible:-translate-y-full">
                    {l.label}
                  </span>
                  <span
                    aria-hidden
                    className="serif-i absolute inset-0 block translate-y-full text-[clamp(2.8rem,10vw,9rem)] leading-[0.84] transition-transform duration-700 ease-[var(--ease-expo)] group-hover:translate-y-0 group-focus-visible:translate-y-0"
                  >
                    {l.label.toLowerCase()}
                  </span>
                </span>
                <span className="mono hidden shrink-0 text-right sm:block">
                  Salle {l.room}
                  <br />
                  <span className="opacity-70">{l.note}</span>
                </span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-end justify-between gap-4 px-[var(--gutter)] pb-[calc(var(--gutter)+env(safe-area-inset-bottom))]">
        <p data-meta className="mono max-w-[30ch]">
          Galerie ouverte en permanence. Aucune œuvre n’est stockée, toutes sont calculées.
        </p>
        <p data-meta className="serif-i text-3xl leading-none">Beyond the Screen</p>
      </div>
    </div>
  )
}

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="1" y="1" width="20" height="20" stroke="currentColor" strokeWidth="1.6" />
      <rect x="7" y="7" width="8" height="8" fill="#c6ff1a" />
    </svg>
  )
}
