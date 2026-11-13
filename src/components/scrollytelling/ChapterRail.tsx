import { forwardRef, useImperativeHandle, useRef } from 'react'
import { CHAPTERS, chapterAt } from './story'

export interface RailHandle {
  update: (progress: number) => void
}

export const ChapterRail = forwardRef<RailHandle, { onSeek: (progress: number) => void }>(
  function ChapterRail({ onSeek }, ref) {
    const root = useRef<HTMLElement>(null)
    const buttons = useRef<(HTMLButtonElement | null)[]>([])
    const previous = useRef(-1)
    useImperativeHandle(
      ref,
      () => ({
        update(progress) {
          const index = chapterAt(progress)
          if (root.current) {
            root.current.style.setProperty('--rail-progress', String(progress))
            if (previous.current !== index) root.current.dataset.active = String(index)
          }
          if (previous.current === index) return
          previous.current = index
          buttons.current.forEach((button, i) => {
            if (!button) return
            button.dataset.active = String(i === index)
            if (i === index) button.setAttribute('aria-current', 'step')
            else button.removeAttribute('aria-current')
          })
        },
      }),
      [],
    )

    return (
      <nav className="chapter-rail" ref={root} aria-label="Manifesto chapters" data-active="0">
        <span className="rail-caption">INDEX</span>
        <div className="rail-line">
          <span />
        </div>
        {CHAPTERS.map((chapter, index) => (
          <button
            key={chapter.numeral}
            ref={(el) => {
              buttons.current[index] = el
            }}
            className={`rail-stop ${index === 0 ? 'rail-origin' : ''}`}
            aria-label={`${index === 0 ? '' : 'Chapter ' + chapter.numeral + ': '}${chapter.title}`}
            data-active={index === 0}
            onClick={() => onSeek(chapter.target)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                event.stopPropagation()
                const next = Math.max(
                  0,
                  Math.min(CHAPTERS.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)),
                )
                buttons.current[next]?.focus()
                onSeek(CHAPTERS[next].target)
              }
            }}
          >
            <span className="rail-dot" />
            <span className="rail-numeral">{chapter.numeral}</span>
            <span className="rail-label">{chapter.title}</span>
          </button>
        ))}
        <span className="rail-end">END</span>
      </nav>
    )
  },
)
