import { Fragment, forwardRef, useImperativeHandle, useRef } from "react";
import {
  CHAPTERS,
  MOVEMENTS,
  PROLOGUE,
  SURFACES,
  SURFACE_TARGETS,
  chapterAt,
  segmentsText,
  surfaceAt,
  type ParagraphKind,
  type StorySegment,
} from "./story";
import { smoothstep } from "./opticsEngine";
import { Icon } from "../Icons";

export interface EditorialHandle {
  update: (progress: number) => void;
}
interface Props {
  onBegin: () => void;
  onSeek: (progress: number) => void;
  onDiscussion: () => void;
}

function renderSegments(segments: readonly StorySegment[]) {
  return segments.map((segment, index) => (
    <Fragment key={`${segment.text}-${index}`}>
      {segment.breakBefore && <br />}
      {segment.emphasis ? (
        <em>{segment.breakBefore ? segment.text.trimStart() : segment.text}</em>
      ) : segment.breakBefore ? (
        segment.text.trimStart()
      ) : (
        segment.text
      )}
    </Fragment>
  ));
}

function paragraphClass(kind: ParagraphKind) {
  if (kind === "body") return undefined;
  if (kind === "lead") return "lead-copy";
  if (kind === "emphasis") return "editorial-emphasis";
  if (kind === "closing") return "closing-thought";
  if (kind === "signature") return "signature";
  return "italic-copy";
}

export const EditorialBeats = forwardRef<EditorialHandle, Props>(function EditorialBeats(
  { onBegin, onSeek, onDiscussion },
  ref,
) {
  const beats = useRef<(HTMLElement | null)[]>([]);
  const container = useRef<HTMLDivElement>(null);
  const previousChapter = useRef(-1);
  const previousProgress = useRef(NaN);
  const surfaces = useRef<HTMLDivElement>(null);
  const surfacePanels = useRef<(HTMLDivElement | null)[]>([]);
  const surfaceTabs = useRef<(HTMLButtonElement | null)[]>([]);
  useImperativeHandle(
    ref,
    () => ({
      update(progress) {
        if (previousProgress.current === progress) return;
        previousProgress.current = progress;
        const active = chapterAt(progress);
        const chapterChanged = previousChapter.current !== active;
        const moveFocus =
          chapterChanged &&
          beats.current.some(
            (beat, index) => index !== active && beat?.contains(document.activeElement),
          );
        if (chapterChanged) {
          if (container.current) container.current.scrollTop = 0;
          previousChapter.current = active;
        }
        CHAPTERS.forEach((chapter, i) => {
          const element = beats.current[i];
          if (!element) return;
          const entrance =
            i === 0 ? 1 : smoothstep(chapter.start - 0.007, chapter.start + 0.013, progress);
          const exit = i === 6 ? 0 : smoothstep(chapter.end - 0.018, chapter.end + 0.002, progress);
          const opacity = entrance * (1 - exit);
          element.style.opacity = opacity.toFixed(4);
          element.style.visibility = opacity < 0.003 ? "hidden" : "visible";
          element.style.transform = `translateY(${((1 - entrance) * 22 - exit * 16).toFixed(2)}px)`;
          element.style.pointerEvents = opacity > 0.7 ? "auto" : "none";
          if (chapterChanged) {
            element.inert = active !== i;
            element.setAttribute("aria-hidden", String(active !== i));
          }
        });
        if (moveFocus) {
          const heading = beats.current[active]?.querySelector<HTMLElement>("h1,h2");
          if (heading) {
            heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
          }
        }
        const surface = surfaceAt(progress);
        if (surfaces.current) surfaces.current.dataset.surface = String(surface);
        surfaceTabs.current.forEach((tab, index) => {
          tab?.setAttribute("aria-pressed", String(surface === index));
        });
        surfacePanels.current.forEach((panel, i) => {
          if (!panel) return;
          panel.style.opacity = surface === i ? "1" : "0";
          panel.style.transform = `translateY(${surface === i ? 0 : 8}px)`;
          panel.setAttribute("aria-hidden", String(surface !== i));
        });
      },
    }),
    [],
  );

  const attach = (index: number) => (element: HTMLElement | null) => {
    beats.current[index] = element;
  };
  const chapterLabel = (index: number) => (
    <div className="beat-eyebrow">
      <span className="chapter-number">{CHAPTERS[index].numeral}</span>
      <span className="eyebrow-line" />
      <span>{CHAPTERS[index].title}</span>
    </div>
  );

  return (
    <div className="editorial" ref={container} role="region" aria-label="The manifesto">
      <article className="beat beat-prologue" ref={attach(0)}>
        <p className="prologue-eyebrow">
          <span className="status-dot" />
          {PROLOGUE.eyebrow}
        </p>
        <h1>{renderSegments(PROLOGUE.heading)}</h1>
        <p className="prologue-deck">
          {PROLOGUE.deck[0]}
          <br />
          {PROLOGUE.deck[1]}
        </p>
        <button className="begin-button" onClick={onBegin}>
          <span className="circle-arrow">
            <Icon name="down" size={17} />
          </span>
          <span>{PROLOGUE.begin}</span>
        </button>
      </article>

      {MOVEMENTS.map((movement, movementIndex) => {
        const chapterIndex = movementIndex + 1;
        return (
          <article
            key={movement.numeral}
            className={`beat beat-movement-${movementIndex + 1}${movementIndex === 2 ? " beat-surfaces" : ""}${movementIndex === 3 ? " beat-density" : ""}${movementIndex === 4 ? " beat-colours" : ""}${movementIndex === 5 ? " beat-becoming" : ""}`}
            ref={attach(chapterIndex)}
            aria-hidden="true"
            inert
            style={{ opacity: 0, visibility: "hidden" }}
          >
            {chapterLabel(chapterIndex)}
            <h2>{renderSegments(movement.heading)}</h2>
            {movement.blocks.map((block, blockIndex) =>
              block.type === "surfaces" ? (
                <div
                  className="surfaces"
                  key={`surfaces-${blockIndex}`}
                  ref={surfaces}
                  data-surface="0"
                >
                  <div className="surface-tabs" role="group" aria-label="Explore the four surfaces">
                    {SURFACES.map((surface, index) => (
                      <button
                        key={surface.label}
                        ref={(element) => {
                          surfaceTabs.current[index] = element;
                        }}
                        className={`surface-tab surface-tab-${index}`}
                        aria-pressed={index === 0}
                        onClick={() => onSeek(SURFACE_TARGETS[index])}
                      >
                        <span aria-hidden="true">0{index + 1}</span>
                        {surface.label}
                      </button>
                    ))}
                  </div>
                  <div className="surface-panels">
                    {SURFACES.map((surface, index) => (
                      <div
                        key={surface.label}
                        ref={(element) => {
                          surfacePanels.current[index] = element;
                        }}
                        className="surface-panel"
                        style={{ opacity: index === 0 ? 1 : 0 }}
                        aria-hidden={index !== 0}
                      >
                        <p className="surface-lead">{surface.lead}</p>
                        <p className={index === 3 ? "italic-copy" : undefined}>{surface.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className={paragraphClass(block.kind)} key={`paragraph-${blockIndex}`}>
                  {renderSegments(block.segments)}
                </p>
              ),
            )}
            {movement.footnote && (
              <div className="beat-footnote">
                <span>{String(movementIndex + 1).padStart(2, "0")}</span>
                {movement.footnote}
              </div>
            )}
            {movementIndex === MOVEMENTS.length - 1 && (
              <button className="text-link closing-link" onClick={onDiscussion}>
                Write it down <Icon name="arrow" size={15} />
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
});
