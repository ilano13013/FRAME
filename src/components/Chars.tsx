import type { CSSProperties } from 'react'

type Props = {
  text: string
  className?: string
  charClassName?: string
  style?: CSSProperties
  /** Wrap every letter in an overflow mask so it can rise into view. */
  masked?: boolean
}

/** Splits a word into letter spans while screen readers still get the whole word. */
export function Chars({ text, className = '', charClassName = '', style, masked = true }: Props) {
  return (
    <span className={className} style={style} aria-label={text} role="text">
      {Array.from(text).map((char, i) =>
        masked ? (
          <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.06em] align-bottom">
            <span data-char className={`inline-block will-change-transform ${charClassName}`}>
              {char === ' ' ? ' ' : char}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden data-char className={`inline-block ${charClassName}`}>
            {char === ' ' ? ' ' : char}
          </span>
        ),
      )}
    </span>
  )
}
