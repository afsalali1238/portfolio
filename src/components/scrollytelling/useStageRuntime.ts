import { useEffect, type RefObject } from 'react'
import type { OpticsHandle } from './OpticsCanvas'
import type { EditorialHandle } from './EditorialBeats'
import type { RailHandle } from './ChapterRail'
import type { TelemetryHandle } from './Telemetry'
import { SoundDirector } from './soundDirector'
import { CHAPTERS, chapterAt } from './story'
import { dampedStep, measureTrack, progressAt, scrollAt, type TrackMetrics } from './runtimeMath'

interface RuntimeRefs {
  track: RefObject<HTMLDivElement | null>
  stage: RefObject<HTMLDivElement | null>
  canvas: RefObject<OpticsHandle | null>
  editorial: RefObject<EditorialHandle | null>
  rail: RefObject<RailHandle | null>
  telemetry: RefObject<TelemetryHandle | null>
  progressText: RefObject<HTMLSpanElement | null>
  chapterText: RefObject<HTMLSpanElement | null>
  sound: RefObject<SoundDirector | null>
  motion: RefObject<{ target: number; current: number; tilt: number; targetTilt: number }>
  reduced: RefObject<boolean>
  readerOpen: RefObject<boolean>
  forceDraw: RefObject<boolean>
  wake: RefObject<() => void>
  onChapter: (chapter: number) => void
  onReducedMotion: (reduced: boolean) => void
  seek: (progress: number) => void
}

/** One owned clock. Scroll handlers only sample position; idle DOM is left untouched. */
export function useStageRuntime({
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
  onChapter,
  onReducedMotion,
  seek,
}: RuntimeRefs) {
  useEffect(() => {
    const trackElement = track.current,
      stageElement = stage.current
    if (!trackElement || !stageElement) return
    const director = new SoundDirector()
    sound.current = director
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
    const contrastMedia = window.matchMedia('(forced-colors: active)')
    let alive = true,
      visible = true,
      pageActive = true,
      forcedColors = contrastMedia.matches
    let frameId = 0,
      lastTime = 0,
      animationTime = 0,
      lastChapter = -1,
      lastTelemetryTime = 0
    let lastDOMProgress = NaN,
      lastTelemetryProgress = NaN,
      lastDrawnProgress = NaN
    let previousProgress = 0
    let metrics: TrackMetrics = measureTrack(trackElement, stageElement)
    const canRun = () => alive && pageActive && !document.hidden && visible && !readerOpen.current
    const immediate = () => reduced.current || forcedColors
    function pause() {
      if (frameId) cancelAnimationFrame(frameId)
      frameId = 0
      lastTime = 0
    }
    function schedule() {
      if (!frameId && canRun()) frameId = requestAnimationFrame(tick)
    }
    function reconcile() {
      director.setVisible(canRun())
      if (canRun()) schedule()
      else pause()
    }
    function sampleScroll() {
      motion.current.target = progressAt(window.scrollY, metrics)
      schedule()
    }
    function measure(preserve = false) {
      if (!trackElement!.offsetHeight || !stageElement!.clientHeight) return
      const next = measureTrack(trackElement!, stageElement!)
      const target = motion.current.target
      // Preserve the chapter on orientation/viewport changes, not a stale absolute pixel offset.
      if (
        preserve &&
        metrics.span > 0 &&
        next.span !== metrics.span &&
        visible &&
        target > 0 &&
        target < 1
      ) {
        window.scrollTo({ top: scrollAt(target, next), behavior: 'instant' })
      }
      metrics = next
      sampleScroll()
      forceDraw.current = true
      schedule()
    }
    function tick(now: number) {
      frameId = 0
      if (!canRun()) {
        lastTime = 0
        return
      }
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60
      lastTime = now
      animationTime += delta * 1000
      const state = motion.current,
        staticMotion = immediate()
      state.current = dampedStep(state.current, state.target, delta, staticMotion)
      state.tilt = dampedStep(state.tilt, state.targetTilt, delta, staticMotion)
      const p = state.current,
        chapter = chapterAt(p)
      if (chapter !== lastChapter) {
        lastChapter = chapter
        onChapter(chapter)
        if (chapterText.current)
          chapterText.current.textContent = `${CHAPTERS[chapter].numeral} / ${CHAPTERS[chapter].title.toUpperCase()}`
      }
      if (p >= 0.1 && previousProgress < 0.1) director.ignition()
      previousProgress = p
      if (!staticMotion || forceDraw.current || p !== lastDrawnProgress) {
        if (!forcedColors)
          canvas.current?.draw({
            progress: p,
            time: animationTime,
            delta,
            tilt: state.tilt,
            reducedMotion: staticMotion,
          })
        lastDrawnProgress = p
        forceDraw.current = false
      }
      if (p !== lastDOMProgress) {
        editorial.current?.update(p)
        rail.current?.update(p)
        stageElement!.style.setProperty('--scroll-progress', String(p))
        director.update(p)
        lastDOMProgress = p
      }
      if (
        p !== lastTelemetryProgress &&
        (staticMotion || now - lastTelemetryTime >= 80 || p === state.target)
      ) {
        telemetry.current?.update(p)
        if (progressText.current) progressText.current.textContent = p.toFixed(3)
        lastTelemetryProgress = p
        lastTelemetryTime = now
      }
      if (
        !staticMotion ||
        state.current !== state.target ||
        state.tilt !== state.targetTilt ||
        forceDraw.current
      )
        schedule()
    }
    const preference = () => {
      reduced.current = motionMedia.matches
      forcedColors = contrastMedia.matches
      onReducedMotion(reduced.current)
      // Stop an already-running native smooth scroll when the user requests less motion.
      if (immediate()) window.scrollTo({ top: window.scrollY, behavior: 'instant' })
      forceDraw.current = true
      reconcile()
    }
    const visibility = () => {
      forceDraw.current = true
      reconcile()
    }
    const pageHide = () => {
      pageActive = false
      reconcile()
    }
    const pageShow = () => {
      pageActive = true
      measure()
      forceDraw.current = true
      reconcile()
    }
    const resize = () => measure(true)
    const keyboard = (event: KeyboardEvent) => {
      const target = event.target
      if (
        !canRun() ||
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return
      if (
        target instanceof Element &&
        target.closest(
          'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="slider"]',
        )
      )
        return
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
      event.preventDefault()
      const next = Math.max(
        0,
        Math.min(
          CHAPTERS.length - 1,
          chapterAt(motion.current.target) + (event.key === 'ArrowRight' ? 1 : -1),
        ),
      )
      seek(CHAPTERS[next].target)
    }
    wake.current = () => {
      forceDraw.current = true
      reconcile()
    }
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting
        if (visible) measure()
        reconcile()
      },
      { threshold: 0 },
    )
    observer.observe(stageElement)
    const geometry = new ResizeObserver(resize)
    geometry.observe(trackElement)
    geometry.observe(stageElement)
    window.addEventListener('scroll', sampleScroll, { passive: true })
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('keydown', keyboard)
    window.addEventListener('pagehide', pageHide)
    window.addEventListener('pageshow', pageShow)
    document.addEventListener('visibilitychange', visibility)
    motionMedia.addEventListener('change', preference)
    contrastMedia.addEventListener('change', preference)
    measure()
    motion.current.current = motion.current.target
    previousProgress = motion.current.target
    preference()
    void document.fonts.ready.then(() => {
      if (alive) {
        measure()
        forceDraw.current = true
        reconcile()
      }
    })
    return () => {
      alive = false
      pause()
      observer.disconnect()
      geometry.disconnect()
      window.removeEventListener('scroll', sampleScroll)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', keyboard)
      window.removeEventListener('pagehide', pageHide)
      window.removeEventListener('pageshow', pageShow)
      document.removeEventListener('visibilitychange', visibility)
      motionMedia.removeEventListener('change', preference)
      contrastMedia.removeEventListener('change', preference)
      director.destroy()
      if (sound.current === director) sound.current = null
      wake.current = () => {}
    }
  }, [
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
    onChapter,
    onReducedMotion,
    seek,
  ])
}
