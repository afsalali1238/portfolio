import { useCallback, useRef, useState } from 'react'
import { Brand, Icon } from '../Icons'
import { OpticsCanvas, type OpticsHandle } from './OpticsCanvas'
import { EditorialBeats, type EditorialHandle } from './EditorialBeats'
import { ChapterRail, type RailHandle } from './ChapterRail'
import { Telemetry, type TelemetryHandle } from './Telemetry'
import { ReadingView, type ReadingHandle } from './ReadingView'
import type { SoundDirector } from './soundDirector'
import { useStageRuntime } from './useStageRuntime'
import { measureTrack, scrollAt } from './runtimeMath'
import { clamp } from './opticsEngine'
import { CHAPTERS, FULL_TEXT } from './story'

const SCENE_DESCRIPTIONS = [
  'A point of possibility rests in a dark coordinate field.',
  'A sudden ignition sends particles into the dark.',
  'A single white beam travels through empty space.',
  'The beam encounters reflection, collision, absorption, and glass.',
  'Wavefronts compress and slow inside a glass prism.',
  'White light separates into five spectral filaments.',
  'Five colours emerge beyond the glass, unbounded.',
]

export function ScrollyStage() {
  const track = useRef<HTMLDivElement>(null),
    stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<OpticsHandle>(null),
    editorial = useRef<EditorialHandle>(null)
  const rail = useRef<RailHandle>(null),
    telemetry = useRef<TelemetryHandle>(null),
    reading = useRef<ReadingHandle>(null)
  const progressText = useRef<HTMLSpanElement>(null),
    chapterText = useRef<HTMLSpanElement>(null)
  const sound = useRef<SoundDirector | null>(null)
  const motion = useRef({ target: 0, current: 0, tilt: 0, targetTilt: 0 })
  const reduced = useRef(false),
    readerOpen = useRef(false),
    forceDraw = useRef(true)
  const wake = useRef<() => void>(() => {})
  const [activeChapter, setActiveChapter] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [soundPending, setSoundPending] = useState(false)
  const soundRequest = useRef(false)
  const [soundNotice, setSoundNotice] = useState('')
  const [reducedMotion, setReducedMotion] = useState(false)

  const seek = useCallback((progress: number) => {
    if (!track.current || !stage.current) return
    const metrics = measureTrack(track.current, stage.current)
    window.scrollTo({
      top: scrollAt(progress, metrics),
      behavior: reduced.current ? 'instant' : 'smooth',
    })
    wake.current()
  }, [])
  const ignite = useCallback(() => {
    canvas.current?.ignite()
    sound.current?.ignition()
    forceDraw.current = true
    wake.current()
  }, [])
  const begin = useCallback(() => {
    ignite()
    seek(CHAPTERS[1].target)
  }, [ignite, seek])
  const openChange = useCallback((open: boolean) => {
    readerOpen.current = open
    forceDraw.current = true
    wake.current()
  }, [])
  const goDiscussion = useCallback(() => {
    const discussion = document.getElementById('discussion')
    discussion?.scrollIntoView({ behavior: reduced.current ? 'instant' : 'smooth' })
    discussion?.focus({ preventScroll: true })
  }, [])

  useStageRuntime({
    track,
    stage,
    canvas,
    editorial,
    rail,
    telemetry,
    progressText,
    chapterText,
    sound,
    motion,
    reduced,
    readerOpen,
    forceDraw,
    wake,
    onChapter: setActiveChapter,
    onReducedMotion: setReducedMotion,
    seek,
  })

  const toggleSound = async () => {
    const director = sound.current
    if (!director || soundRequest.current) return
    soundRequest.current = true
    setSoundPending(true)
    const requested = !soundEnabled
    try {
      director.update(motion.current.current)
      const result = await director.setEnabled(requested)
      if (sound.current !== director) return
      setSoundEnabled(result)
      setSoundNotice(requested && !result ? 'Audio is unavailable in this browser.' : '')
      if (result) director.ignition()
    } finally {
      soundRequest.current = false
      if (sound.current === director) setSoundPending(false)
    }
  }

  return (
    <>
      <section
        className="scroll-track"
        ref={track}
        aria-label="The Refraction of Thought, an interactive manifesto"
      >
        <div
          className="pinned-stage"
          ref={stage}
          data-chapter={activeChapter}
          data-reduced-motion={reducedMotion}
          onPointerMove={(event) => {
            const box = stage.current?.getBoundingClientRect()
            if (box) {
              // Horizontal touch drags steer the beam without stealing vertical document scroll.
              const axis =
                event.pointerType === 'touch'
                  ? (event.clientX - box.left) / box.width
                  : (event.clientY - box.top) / box.height
              motion.current.targetTilt = clamp((axis - 0.5) * 2, -1, 1)
              wake.current()
            }
          }}
          onPointerLeave={() => {
            motion.current.targetTilt = 0
            wake.current()
          }}
          onClick={(event) => {
            if (
              motion.current.current < 0.22 &&
              !(event.target as HTMLElement).closest('a,button,dialog')
            )
              ignite()
          }}
        >
          <OpticsCanvas ref={canvas} />
          <div className="stage-scrim" />
          <div className="paper-grain" />

          <header className="site-header">
            <Brand onClick={() => seek(0)} />
            <nav className="header-nav" aria-label="Page navigation">
              <span className="current-page">
                <span className="status-dot" />
                THE THESIS
              </span>
              <button className="read-button" onClick={() => reading.current?.open()}>
                <span>Read the words</span>
                <Icon name="arrow" size={13} />
              </button>
            </nav>
            <button
              className="sound-button"
              onClick={toggleSound}
              disabled={soundPending}
              aria-busy={soundPending}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'Mute ambient sound' : 'Enable ambient sound'}
            >
              <Icon name={soundEnabled ? 'sound' : 'mute'} size={15} />
              <span>SOUND {soundEnabled ? 'ON' : 'OFF'}</span>
              <span className={`sound-indicator ${soundEnabled ? 'is-on' : ''}`} />
            </button>
          </header>
          <div className="instrument-meta">
            <span>EXPERIMENT Nº 001</span>
            <span className="instrument-meta-right">
              ON CURIOSITY, CRAFT & BECOMING
              <span className="meta-square" />
            </span>
          </div>
          <span className="margin-note">INDEPENDENT THOUGHT. MADE REAL.</span>

          <button
            className="field-trigger"
            aria-label="Ignite the coordinate field"
            onClick={ignite}
            disabled={activeChapter > 1}
            tabIndex={activeChapter > 1 ? -1 : 0}
          />
          <EditorialBeats
            ref={editorial}
            onBegin={begin}
            onSeek={seek}
            onDiscussion={goDiscussion}
          />
          <ChapterRail ref={rail} onSeek={seek} />
          <Telemetry ref={telemetry} />
          <div className="stage-footer">
            <span className="footer-chapter">
              <span className="footer-plus">+</span>
              <span ref={chapterText}>00 / PROLOGUE</span>
            </span>
            <button
              className="scroll-prompt"
              onClick={() => seek(activeChapter < 6 ? CHAPTERS[activeChapter + 1].target : 0)}
            >
              {activeChapter === 0
                ? 'SCROLL TO REFRACT'
                : activeChapter === 6
                  ? 'RETURN TO ORIGIN'
                  : 'CONTINUE THE THOUGHT'}
              <Icon name={activeChapter === 6 ? 'restart' : 'down'} size={13} />
            </button>
            <span className="footer-progress">
              <span className="progress-label">SCROLL PROGRESS</span>
              <span className="progress-readout">
                R <span ref={progressText}>0.000</span>
                <span className="progress-total"> / 1.000</span>
              </span>
            </span>
          </div>
          <div className="scroll-progress-line">
            <span />
          </div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {CHAPTERS[activeChapter].title}. {SCENE_DESCRIPTIONS[activeChapter]}
          </p>
          {soundNotice && (
            <p className="sound-notice" role="status">
              {soundNotice}
            </p>
          )}
        </div>
      </section>
      <ReadingView
        ref={reading}
        onOpenChange={openChange}
        onChapter={(index) => seek(CHAPTERS[index].target)}
      />
      <noscript>
        <style>{'.scroll-track{display:none!important}'}</style>
        <article className="no-script-reader">
          <p className="eyebrow">FOR THE TECH. / THE MANIFESTO</p>
          <h1>The Refraction of Thought.</h1>
          <p>Curiosity enters. Craft bends it. Reality catches the colour.</p>
          {FULL_TEXT.map((chapter) => (
            <section key={chapter.title}>
              <h2>{chapter.title}</h2>
              {chapter.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
        </article>
      </noscript>
    </>
  )
}
