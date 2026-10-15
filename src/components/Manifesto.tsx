import { useRef } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../lib/motion'

// Words flagged with * are set in acid italics; the rest light up as you read.
const TEXT =
  'Un écran est une *fenêtre* que l’on a oublié d’ouvrir. FRAME retire la vitre. Ici, les œuvres ne sont pas des fichiers : elles *respirent*, recalculées à chaque image, et changent quand vous les regardez. Aucune n’existera deux fois de la *même* façon.'

export function Manifesto() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const q = gsap.utils.selector(root)
      gsap.fromTo(
        q('[data-word]'),
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: { trigger: q('[data-copy]')[0], start: 'top 78%', end: 'bottom 45%', scrub: 0.5 },
        },
      )
      gsap.fromTo(
        q('[data-sign]'),
        { xPercent: 30 },
        { xPercent: -10, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } },
      )
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      id="manifeste"
      data-room="02|Manifeste"
      aria-labelledby="manifeste-title"
      className="relative overflow-hidden bg-bone px-[var(--gutter)] py-[18vh] text-ink"
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
        <h2 id="manifeste-title" className="mono flex flex-col gap-2 self-start lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
          <span>Manifeste</span>
          <span className="opacity-60">Écrit pour la première salle, 2026</span>
        </h2>
        <p data-copy className="font-display text-[clamp(1.8rem,4.4vw,4.4rem)] leading-[1.06] font-semibold tracking-[-0.035em] text-balance">
          {TEXT.split(' ').map((w, i) => {
            const accent = w.startsWith('*')
            const clean = w.replace(/\*/g, '')
            return (
              <span key={i} data-word className={accent ? 'serif-i bg-acid px-[0.08em] font-normal text-[1.12em] box-decoration-clone' : ''}>
                {clean}{' '}
              </span>
            )
          })}
        </p>
      </div>
      <p data-sign aria-hidden className="display outline-text mt-[14vh] text-[clamp(5rem,22vw,24rem)] whitespace-nowrap [--outline-fill:var(--color-bone)] [--outline-stroke:var(--color-ink)]">
        Sans vitre
      </p>
    </section>
  )
}
