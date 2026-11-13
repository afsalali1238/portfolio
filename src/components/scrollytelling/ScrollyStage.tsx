import { useCallback, useRef, useState } from "react";
import { Brand, Icon } from "../Icons";
import { OpticsCanvas, type OpticsHandle } from "./OpticsCanvas";
import { EditorialBeats, type EditorialHandle } from "./EditorialBeats";
import { ChapterRail, type RailHandle } from "./ChapterRail";
import { Telemetry, type TelemetryHandle } from "./Telemetry";
import { ReducedMotionReading } from "./ReadingView";
import { useStageRuntime } from "./useStageRuntime";
import { measureTrack, scrollAt } from "./runtimeMath";
import { clamp } from "./opticsEngine";
import {
  CHAPTERS,
  MOVEMENTS,
  PHYSICS_NOTE,
  PROLOGUE,
  movementPlainText,
  segmentsText,
} from "./story";

export function ScrollyStage() {
  const track = useRef<HTMLDivElement>(null),
    stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<OpticsHandle>(null),
    editorial = useRef<EditorialHandle>(null);
  const rail = useRef<RailHandle>(null),
    telemetry = useRef<TelemetryHandle>(null);
  const chapterText = useRef<HTMLSpanElement>(null);
  const motion = useRef({ target: 0, current: 0, tilt: 0, targetTilt: 0 });
  const reduced = useRef(false),
    forceDraw = useRef(true);
  const wake = useRef<() => void>(() => {});
  const [activeChapter, setActiveChapter] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const seek = useCallback((progress: number) => {
    if (!track.current || !stage.current) return;
    const metrics = measureTrack(track.current, stage.current);
    window.scrollTo({
      top: scrollAt(progress, metrics),
      behavior: reduced.current ? "instant" : "smooth",
    });
    wake.current();
  }, []);
  const ignite = useCallback(() => {
    canvas.current?.ignite();
    forceDraw.current = true;
    wake.current();
  }, []);
  const begin = useCallback(() => {
    ignite();
    seek(CHAPTERS[1].target);
  }, [ignite, seek]);
  const goDiscussion = useCallback(() => {
    const discussion = document.getElementById("discussion");
    discussion?.scrollIntoView({ behavior: reduced.current ? "instant" : "smooth" });
    discussion?.focus({ preventScroll: true });
  }, []);

  useStageRuntime({
    track,
    stage,
    canvas,
    editorial,
    rail,
    telemetry,
    chapterText,
    motion,
    reduced,
    forceDraw,
    wake,
    onChapter: setActiveChapter,
    onReducedMotion: setReducedMotion,
    seek,
  });

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
            const box = stage.current?.getBoundingClientRect();
            if (box) {
              // Horizontal touch drags steer the beam without stealing vertical document scroll.
              const axis =
                event.pointerType === "touch"
                  ? (event.clientX - box.left) / box.width
                  : (event.clientY - box.top) / box.height;
              motion.current.targetTilt = clamp((axis - 0.5) * 2, -1, 1);
              wake.current();
            }
          }}
          onPointerLeave={() => {
            motion.current.targetTilt = 0;
            wake.current();
          }}
          onClick={(event) => {
            if (
              motion.current.current < 0.22 &&
              !(event.target as HTMLElement).closest("a,button,dialog")
            )
              ignite();
          }}
        >
          {!reducedMotion && <OpticsCanvas ref={canvas} />}
          <div className="stage-scrim" />
          <div className="paper-grain" />

          <header className="site-header site-header-minimal">
            <Brand />
          </header>

          <button
            className="field-trigger"
            aria-hidden="true"
            tabIndex={-1}
            onClick={ignite}
            disabled={activeChapter > 1}
          />
          <ChapterRail ref={rail} onSeek={seek} />
          <EditorialBeats
            ref={editorial}
            onBegin={begin}
            onSeek={seek}
            onDiscussion={goDiscussion}
          />
          <Telemetry ref={telemetry} />
          <div className="stage-footer" aria-label="Reading navigation">
            <span className="footer-chapter">
              <span ref={chapterText}>PROLOGUE</span>
            </span>
            <button
              className="scroll-prompt"
              onClick={() => seek(activeChapter < 6 ? CHAPTERS[activeChapter + 1].target : 0)}
            >
              {activeChapter === 0
                ? "BEGIN READING"
                : activeChapter === 6
                  ? "RETURN TO THE BEGINNING"
                  : "CONTINUE READING"}
              <Icon name={activeChapter === 6 ? "restart" : "down"} size={13} />
            </button>
          </div>
          <div className="scroll-progress-line">
            <span />
          </div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {CHAPTERS[activeChapter].title}. {CHAPTERS[activeChapter].description}
          </p>
        </div>
      </section>
      <ReducedMotionReading />
      <noscript>
        <style>{".scroll-track{display:none!important}"}</style>
        <article className="no-script-reader">
          <p className="eyebrow">FOR THE TECH. / THE MANIFESTO</p>
          <h1>{segmentsText(PROLOGUE.heading)}</h1>
          <p>{PROLOGUE.deck.join(" ")}</p>
          {MOVEMENTS.map((movement) => {
            const [heading, ...paragraphs] = movementPlainText(movement);
            return (
              <section key={movement.numeral}>
                <h2>{movement.title}</h2>
                <h3>{heading}</h3>
                {paragraphs.map((text, index) => (
                  <p key={`${movement.numeral}-${index}`}>{text}</p>
                ))}
              </section>
            );
          })}
          <section className="no-script-experiment-note">
            <h2>A note on the experiment</h2>
            <p>{PHYSICS_NOTE}</p>
          </section>
        </article>
      </noscript>
    </>
  );
}
