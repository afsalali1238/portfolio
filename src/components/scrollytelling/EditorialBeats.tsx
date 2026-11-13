import { forwardRef, useImperativeHandle, useRef } from 'react'
import { CHAPTERS, SURFACES, chapterAt, surfaceAt } from './story'
import { smoothstep } from './opticsEngine'
import { Icon } from '../Icons'

export interface EditorialHandle {
  update: (progress: number) => void
}
interface Props {
  onBegin: () => void
  onSeek: (progress: number) => void
  onDiscussion: () => void
}

export const EditorialBeats = forwardRef<EditorialHandle, Props>(function EditorialBeats(
  { onBegin, onSeek, onDiscussion },
  ref,
) {
  const beats = useRef<(HTMLElement | null)[]>([])
  const container = useRef<HTMLDivElement>(null)
  const previousChapter = useRef(-1)
  const previousProgress = useRef(NaN)
  const surfaces = useRef<HTMLDivElement>(null)
  const surfacePanels = useRef<(HTMLDivElement | null)[]>([])
  useImperativeHandle(
    ref,
    () => ({
      update(progress) {
        if (previousProgress.current === progress) return
        previousProgress.current = progress
        const active = chapterAt(progress)
        const chapterChanged = previousChapter.current !== active
        const moveFocus =
          chapterChanged &&
          beats.current.some(
            (beat, index) => index !== active && beat?.contains(document.activeElement),
          )
        if (chapterChanged) {
          if (container.current) container.current.scrollTop = 0
          previousChapter.current = active
        }
        CHAPTERS.forEach((chapter, i) => {
          const element = beats.current[i]
          if (!element) return
          const entrance =
            i === 0 ? 1 : smoothstep(chapter.start - 0.007, chapter.start + 0.013, progress)
          const exit = i === 6 ? 0 : smoothstep(chapter.end - 0.018, chapter.end + 0.002, progress)
          const opacity = entrance * (1 - exit)
          element.style.opacity = opacity.toFixed(4)
          element.style.visibility = opacity < 0.003 ? 'hidden' : 'visible'
          element.style.transform = `translateY(${((1 - entrance) * 22 - exit * 16).toFixed(2)}px)`
          element.style.pointerEvents = opacity > 0.7 ? 'auto' : 'none'
          if (chapterChanged) {
            element.inert = active !== i
            element.setAttribute('aria-hidden', String(active !== i))
          }
        })
        if (moveFocus) {
          const heading = beats.current[active]?.querySelector<HTMLElement>('h1,h2')
          if (heading) {
            heading.tabIndex = -1
            heading.focus({ preventScroll: true })
          }
        }
        const surface = surfaceAt(progress)
        if (surfaces.current) surfaces.current.dataset.surface = String(surface)
        surfacePanels.current.forEach((panel, i) => {
          if (!panel) return
          panel.style.opacity = surface === i ? '1' : '0'
          panel.style.transform = `translateY(${surface === i ? 0 : 8}px)`
          panel.setAttribute('aria-hidden', String(surface !== i))
        })
      },
    }),
    [],
  )

  const attach = (index: number) => (element: HTMLElement | null) => {
    beats.current[index] = element
  }
  const chapterLabel = (index: number) => (
    <div className="beat-eyebrow">
      <span className="chapter-number">{CHAPTERS[index].numeral}</span>
      <span className="eyebrow-line" />
      <span>{CHAPTERS[index].title}</span>
    </div>
  )

  return (
    <div className="editorial" ref={container} role="region" aria-label="The manifesto">
      <article className="beat beat-prologue" ref={attach(0)}>
        <p className="prologue-eyebrow">
          <span className="status-dot" />A THESIS IN SIX MOVEMENTS
        </p>
        <h1>
          The Refraction
          <br />
          of <em>Thought.</em>
        </h1>
        <p className="prologue-deck">
          Curiosity enters. Craft bends it.
          <br />
          Reality catches the colour.
        </p>
        <button className="begin-button" onClick={onBegin}>
          <span className="circle-arrow">
            <Icon name="down" size={17} />
          </span>
          <span>
            Begin the experiment<span className="button-subline">SCROLL OR TAP TO IGNITE</span>
          </span>
        </button>
        <div className="prologue-colophon">
          <span>THOUGHT → CRAFT → REALITY</span>
          <span className="colophon-dash" />
          EST. IN CURIOSITY
        </div>
      </article>

      <article
        className="beat"
        ref={attach(1)}
        aria-hidden="true"
        inert
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        {chapterLabel(1)}
        <h2>
          Every real thing
          <br />
          begins in <em>the dark.</em>
        </h2>
        <p className="lead-copy">Just like the universe.</p>
        <p>Out of nothing, a sudden ignition. It happened when the right conditions met.</p>
        <p className="editorial-emphasis">Nobody asked for it.</p>
        <div className="beat-footnote">
          <span>01</span> NOTHING → SOMETHING
        </div>
      </article>

      <article
        className="beat"
        ref={attach(2)}
        aria-hidden="true"
        inert
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        {chapterLabel(2)}
        <h2>
          There is a light
          <br />
          in <em>each of us.</em>
        </h2>
        <p>
          It arrives before it has a name.
          <br />A question. An itch. A what if.
        </p>
        <p className="italic-copy">An idea in your head costs nothing and proves nothing.</p>
        <p>Like light in empty space, it is invisible until it touches something real.</p>
        <p className="editorial-emphasis">So we shine.</p>
        <div className="beat-footnote">
          <span>02</span> MOVE YOUR CURSOR. FIND A DIRECTION.
        </div>
      </article>

      <article
        className="beat beat-surfaces"
        ref={attach(3)}
        aria-hidden="true"
        inert
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        {chapterLabel(3)}
        <h2>
          What comes back
          <br />
          depends on what
          <br />
          <em>surrounds us.</em>
        </h2>
        <p>We shine on people. On places. On problems.</p>
        <div className="surfaces" ref={surfaces} data-surface="0">
          <div className="surface-tabs" role="group" aria-label="Explore the four surfaces">
            {SURFACES.map((surface, index) => (
              <button
                key={surface.label}
                className={`surface-tab surface-tab-${index}`}
                onClick={() => onSeek([0.397, 0.431, 0.468, 0.516][index])}
              >
                <span>0{index + 1}</span>
                {surface.label}
              </button>
            ))}
          </div>
          <div className="surface-panels">
            {SURFACES.map((surface, index) => (
              <div
                key={surface.label}
                ref={(el) => {
                  surfacePanels.current[index] = el
                }}
                className="surface-panel"
                style={{ opacity: index === 0 ? 1 : 0 }}
                aria-hidden={index !== 0}
              >
                <p className="surface-lead">{surface.lead}</p>
                <p className={index === 3 ? 'italic-copy' : ''}>{surface.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="beat-footnote">
          <span>03</span> THE SURFACE CHANGES EVERYTHING.
        </div>
      </article>

      <article
        className="beat beat-density"
        ref={attach(4)}
        aria-hidden="true"
        inert
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        {chapterLabel(4)}
        <h2>
          Light only refracts
          <br />
          when it enters a<br />
          <em>denser medium.</em>
        </h2>
        <p>
          It slows down.
          <br />
          <strong>Slowing down is what bends it.</strong>
        </p>
        <p>
          The density is the work. The 1 AM rebuild. The fourth draft. The hours beside someone
          else’s problem, until it becomes yours.
        </p>
        <p className="italic-copy">
          To make anything real, you must surrender the easy, straight line.
        </p>
        <div className="beat-footnote">
          <span>04</span> RESISTANCE IS NOT THE OPPOSITE OF PROGRESS.
        </div>
      </article>

      <article
        className="beat beat-colours"
        ref={attach(5)}
        aria-hidden="true"
        inert
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        {chapterLabel(5)}
        <h2>
          White light was
          <br />
          never <em>only white.</em>
        </h2>
        <p>The colours were in it all along. The glass didn’t add them. It revealed them.</p>
        <p>
          People are like this. In the wrong room, you remain quiet and unseparated. But inside the
          honest medium, you disperse into colour.
        </p>
        <p className="closing-thought">
          Sometimes we don’t need to change ourselves. <em>We need the right medium.</em>
        </p>
        <div className="beat-footnote">
          <span>05</span> REVELATION, NOT REINVENTION.
        </div>
      </article>

      <article
        className="beat beat-becoming"
        ref={attach(6)}
        aria-hidden="true"
        inert
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        {chapterLabel(6)}
        <h2>
          The light that comes out
          <br />
          is not the light
          <br />
          <em>that went in.</em>
        </h2>
        <p>
          It slowed. It bent. It paid the toll of density.
          <br />
          This place holds what came out the other side.
        </p>
        <p className="closing-thought">
          You were never meant to remain
          <br />a single beam of light.
        </p>
        <p className="signature">For the tech.</p>
        <button className="text-link closing-link" onClick={onDiscussion}>
          Leave a thought <Icon name="arrow" size={15} />
        </button>
      </article>
    </div>
  )
})
