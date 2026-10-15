import { useRef } from 'react'
import { scrollToTarget } from '../lib/scroll'
import { useMagnetic } from '../hooks/useMagnetic'

export function Footer({ onReplay }: { onReplay: () => void }) {
  const replay = useRef<HTMLButtonElement>(null)
  const top = useRef<HTMLButtonElement>(null)
  useMagnetic(replay, 0.3)
  useMagnetic(top, 0.3)

  return (
    <footer id="sortie" data-room="03|Sortie" className="relative overflow-hidden bg-ink px-[var(--gutter)] pt-[18vh] pb-[calc(var(--gutter)+env(safe-area-inset-bottom))]">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="display max-w-[12ch] text-[clamp(3rem,8vw,8rem)]">
          Entrez <span className="serif-i text-acid">dans</span> le cadre.
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            ref={replay}
            type="button"
            onClick={onReplay}
            data-cursor="Rejouer"
            className="mono min-h-12 rounded-full bg-acid px-6 font-semibold text-ink transition-colors hover:bg-bone"
          >
            Revoir l’ouverture
          </button>
          <button
            ref={top}
            type="button"
            onClick={() => scrollToTarget(0)}
            data-cursor="Haut"
            className="mono min-h-12 rounded-full border border-line px-6 text-bone transition-colors hover:border-bone"
          >
            Remonter à la sculpture
          </button>
        </div>
      </div>

      <p aria-hidden className="display mt-[12vh] flex justify-between text-[clamp(4rem,21vw,26rem)] leading-[0.78]">
        {Array.from('FRAME').map((c, i) => (
          <span
            key={i}
            className="outline-text transition-colors duration-500 hover:[--outline-fill:var(--color-acid)] hover:[--outline-stroke:var(--color-acid)]"
            style={{ transitionDelay: `${i * 30}ms` }}
          >
            {c}
          </span>
        ))}
      </p>

      <div className="mono mt-8 flex flex-col gap-2 border-t border-line pt-5 text-bone-dim sm:flex-row sm:justify-between">
        <span>FRAME — Beyond the Screen</span>
        <span>Première salle · 2026</span>
        <span>Rendu temps réel WebGL</span>
      </div>
    </footer>
  )
}
