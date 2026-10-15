import { useCallback, useEffect, useRef, useState } from 'react'
import { Intro } from './components/Intro'
import { Hero } from './components/Hero'
import { Nav } from './components/Nav'
import { Marquee } from './components/Marquee'
import { Gallery } from './components/Gallery'
import { ViewingRoom } from './components/ViewingRoom'
import { Manifesto } from './components/Manifesto'
import { Footer } from './components/Footer'
import { Cursor } from './components/Cursor'
import { createSculptureInput } from './three/input'
import { gsap, ScrollTrigger } from './lib/motion'
import { lockScroll, scrollToTarget, startSmoothScroll } from './lib/scroll'

export default function App() {
  const input = useRef(createSculptureInput())
  const [intro, setIntro] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [heroIn, setHeroIn] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [room, setRoom] = useState<{ index: number; from: HTMLElement } | null>(null)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    lockScroll(playing)
  }, [playing])

  const onReady = useCallback(() => setSceneReady(true), [])
  const onReveal = useCallback((amount: number) => {
    gsap.to(input.current, { reveal: amount, duration: 1.4, ease: 'expo.out' })
  }, [])
  const onHeroIn = useCallback(() => setHeroIn(true), [])
  const onDone = useCallback(() => {
    setPlaying(false)
    startSmoothScroll()
    ScrollTrigger.refresh()
  }, [])

  const replay = () => {
    scrollToTarget(0, true)
    input.current.reveal = 0
    setHeroIn(false)
    setPlaying(true)
    setIntro((n) => n + 1)
  }

  return (
    <>
      <a
        href="#galerie"
        className="mono fixed top-3 left-3 z-[95] -translate-y-20 bg-acid px-4 py-3 text-ink focus-visible:translate-y-0"
      >
        Aller à la galerie
      </a>
      <Cursor />
      <Nav visible={!playing} />
      <main>
        <Hero input={input} revealed={heroIn} onReady={onReady} />
        <Marquee />
        <Gallery onOpen={(index, from) => setRoom({ index, from })} />
        <Manifesto />
      </main>
      <Footer onReplay={replay} />
      {room && <ViewingRoom index={room.index} from={room.from} onClose={() => setRoom(null)} />}
      {playing && <Intro key={intro} ready={sceneReady} onReveal={onReveal} onHeroIn={onHeroIn} onDone={onDone} />}
      <div aria-hidden className="grain" />
    </>
  )
}
