import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { ARTWORKS, type Artwork } from '../lib/artworks'
import { gsap, useGSAP } from '../lib/motion'
import { ShaderCanvas } from './ShaderCanvas'

type Props = { onOpen: (index: number, from: HTMLElement) => void }

// Editorial rhythm: every work gets its own format and vertical anchor.
const LAYOUT = [
  { frame: 'aspect-[4/5] lg:aspect-auto lg:h-[68vh] lg:w-[min(30vw,54vh)]', align: 'lg:self-start lg:mt-[16vh]' },
  { frame: 'aspect-[4/3] lg:aspect-auto lg:h-[54vh] lg:w-[min(50vw,80vh)]', align: 'lg:self-end lg:mb-[10vh]' },
  { frame: 'aspect-square lg:aspect-auto lg:h-[58vh] lg:w-[58vh]', align: 'lg:self-center lg:mt-[6vh]' },
]

export function Gallery({ onOpen }: Props) {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const el = track.current!
        const distance = () => el.scrollWidth - window.innerWidth
        const tween = gsap.to(el, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section.current,
            pin: true,
            scrub: 0.9,
            end: () => `+=${distance()}`,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        })
        // Inside the horizontal run each frame drifts against the scroll and
        // its caption lags a beat behind, so the wall feels deep.
        gsap.utils.toArray<HTMLElement>('[data-work]').forEach((work) => {
          gsap.fromTo(
            work.querySelector('[data-plate]'),
            { xPercent: 10 },
            {
              xPercent: -10,
              ease: 'none',
              scrollTrigger: { trigger: work, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
            },
          )
          gsap.from(work.querySelectorAll('[data-cap]'), {
            yPercent: 110,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.06,
            scrollTrigger: { trigger: work, containerAnimation: tween, start: 'left 75%' },
          })
        })
        gsap.to('[data-rail-fill]', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: section.current, start: 'top top', end: () => `+=${distance()}`, scrub: true },
        })
      })
      mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-work]').forEach((work) => {
          gsap.fromTo(
            work.querySelector('[data-frame]'),
            { clipPath: 'inset(18% 10% 18% 10%)' },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              ease: 'none',
              scrollTrigger: { trigger: work, start: 'top 92%', end: 'top 35%', scrub: 0.6 },
            },
          )
          gsap.from(work.querySelectorAll('[data-cap]'), {
            yPercent: 110,
            duration: 1,
            ease: 'expo.out',
            stagger: 0.06,
            scrollTrigger: { trigger: work, start: 'top 70%' },
          })
        })
      })
      return () => mm.revert()
    },
    { scope: section },
  )

  return (
    <section
      ref={section}
      id="galerie"
      data-room="01|Galerie"
      aria-labelledby="galerie-title"
      className="relative bg-ink lg:h-[100svh] lg:overflow-hidden motion-reduce:lg:h-auto motion-reduce:lg:overflow-x-auto"
    >
      <div
        ref={track}
        className="flex flex-col gap-[14vh] px-[var(--gutter)] py-[16vh] lg:h-full lg:w-max lg:flex-row lg:items-stretch lg:gap-[9vw] lg:py-0 lg:pr-[12vw]"
      >
        <header className="flex flex-col justify-center lg:w-[46vw] lg:shrink-0">
          <h2 id="galerie-title" className="display text-[clamp(3.6rem,10vw,10rem)]">
            Trois <span className="serif-i text-[0.62em] text-acid">œuvres</span>
            <span className="outline-text block pt-[0.08em] text-[0.62em]">vivantes</span>
          </h2>
          <p className="mt-8 max-w-[44ch] text-lg leading-relaxed text-bone-dim">
            Aucune n’est une image. Chacune est un programme qui dessine soixante fois par seconde et répond à votre
            présence. Survolez-les, puis entrez dans la salle de visionnage.
          </p>
          <div className="mono mt-10 hidden items-center gap-4 text-bone-dim lg:flex">
            <span>Défilez</span>
            <span className="relative h-px w-40 overflow-hidden bg-line">
              <span data-rail-fill className="absolute inset-0 origin-left scale-x-0 bg-acid" />
            </span>
            <span>3 œuvres</span>
          </div>
        </header>

        {ARTWORKS.map((art, i) => (
          <Work key={art.id} art={art} index={i} onOpen={onOpen} />
        ))}

        <aside className="flex flex-col justify-center lg:w-[34vw] lg:shrink-0" aria-label="Fin de la salle">
          <p className="display text-[clamp(2.6rem,6vw,6rem)] leading-[0.9]">
            Rien <span className="serif-i text-acid">n’est</span>
            <br />
            enregistré.
          </p>
          <p className="mt-6 max-w-[34ch] text-bone-dim">
            Fermez l’onglet et ces œuvres cessent d’exister. Revenez, elles recommencent autrement.
          </p>
        </aside>
      </div>
    </section>
  )
}

function Work({ art, index, onOpen }: { art: Artwork; index: number; onOpen: Props['onOpen'] }) {
  const frame = useRef<HTMLButtonElement>(null)
  const layout = LAYOUT[index]

  // Card tilts toward the pointer like a plate held in the hand.
  const tilt = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    gsap.to(e.currentTarget, { rotateY: x * 8, rotateX: -y * 8, duration: 0.8, ease: 'expo.out', transformPerspective: 900 })
  }
  const untilt = (e: ReactPointerEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, duration: 1.2, ease: 'expo.out' })
  }

  return (
    <article data-work className={`flex flex-col lg:shrink-0 lg:justify-center ${layout.align}`} aria-labelledby={`${art.id}-title`}>
      <button
        ref={frame}
        type="button"
        data-frame
        data-cursor="Voir"
        onClick={() => onOpen(index, frame.current!)}
        onPointerMove={tilt}
        onPointerLeave={untilt}
        aria-label={`Ouvrir ${art.title} ${art.aside} en salle de visionnage`}
        className={`group relative w-full overflow-hidden bg-ink-2 ${layout.frame}`}
      >
        <div data-plate className="absolute inset-[-12%] transition-transform duration-[1.4s] ease-[var(--ease-expo)] group-hover:scale-[1.04]">
          <ShaderCanvas shader={art.shader} seed={index} label={`${art.title} ${art.aside}, œuvre générative`} />
        </div>
        <span className="crop tl top-3 left-3 scale-50 opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100" />
        <span className="crop tr top-3 right-3 scale-50 opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100" />
        <span className="crop bl bottom-3 left-3 scale-50 opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100" />
        <span className="crop br right-3 bottom-3 scale-50 opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100" />
        <span className="mono absolute bottom-4 left-4 bg-ink/85 px-3 py-1.5 text-acid lg:hidden">
          Toucher pour entrer
        </span>
      </button>

      <div className="mt-5 grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-1">
        <span className="overflow-hidden">
          <span data-cap className="mono block text-acid">{art.code}</span>
        </span>
        <h3 id={`${art.id}-title`} className="overflow-hidden">
          <span data-cap className="block font-display text-[clamp(1.6rem,2.6vw,2.4rem)] leading-none font-bold tracking-[-0.03em] uppercase">
            {art.title} <span className="serif-i font-normal text-bone-dim">{art.aside}</span>
          </span>
        </h3>
        <span className="overflow-hidden">
          <span data-cap className="mono block text-bone-dim">{art.year}</span>
        </span>
        <span className="overflow-hidden">
          <span data-cap className="block text-sm text-bone-dim">{art.medium}</span>
        </span>
      </div>
    </article>
  )
}
