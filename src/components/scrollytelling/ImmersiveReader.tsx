import { Fragment, useRef } from "react";
import { Brand, Icon } from "../Icons";
import { OpticsCanvas, type OpticsHandle } from "./OpticsCanvas";
import { useReadingAtmosphere } from "./useReadingAtmosphere";
import {
  MOVEMENTS,
  PHYSICS_NOTE,
  PROLOGUE,
  SURFACES,
  type ParagraphKind,
  type StorySegment,
} from "./story";

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
  if (kind === "lead") return "flow-lead";
  if (kind === "emphasis") return "flow-emphasis";
  if (kind === "closing") return "flow-closing";
  if (kind === "signature") return "flow-signature";
  return "flow-italic";
}

/** A native, selectable essay flow with an optical field that follows the reader instead of directing them. */
export function ImmersiveReader() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<OpticsHandle>(null);
  const { reducedMotion, steer, ignite } = useReadingAtmosphere({ root, canvas });

  return (
    <section
      className="immersive-reader"
      ref={root}
      aria-label="The Refraction of Thought, an immersive essay"
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return;
        steer(((event.clientX / window.innerWidth) * 2 - 1) * 0.38);
      }}
      onPointerLeave={() => steer(0)}
    >
      <div className="immersive-reader-stage">
        {!reducedMotion && <OpticsCanvas ref={canvas} />}
        <div className="stage-scrim" />
        <div className="paper-grain" />
        <header className="site-header site-header-minimal">
          <Brand />
        </header>
      </div>

      <article className="reading-flow" aria-labelledby="thesis-title">
        <section className="flow-opening">
          <p className="flow-kicker">{PROLOGUE.eyebrow}</p>
          <h1 id="thesis-title">{renderSegments(PROLOGUE.heading)}</h1>
          <p className="flow-deck">
            {PROLOGUE.deck[0]}
            <br />
            {PROLOGUE.deck[1]}
          </p>
          {!reducedMotion && (
            <button
              className="flow-field-action"
              type="button"
              onClick={ignite}
              aria-label="Release the spectrum in the optical field"
            >
              <span className="field-action-mark" aria-hidden="true" />
              <span>Release the spectrum</span>
              <span className="field-action-hint">Tap / click</span>
            </button>
          )}
          <p className="flow-invitation">
            <Icon name="down" size={15} />
            <span>{PROLOGUE.begin}</span>
          </p>
        </section>

        {MOVEMENTS.map((movement) => (
          <section
            className="flow-movement"
            id={`movement-${movement.numeral.toLowerCase()}`}
            key={movement.numeral}
            aria-labelledby={`movement-${movement.numeral.toLowerCase()}-title`}
          >
            <header className="flow-chapter-label">
              <span>{movement.numeral}</span>
              <span>{movement.title}</span>
            </header>
            <h2 id={`movement-${movement.numeral.toLowerCase()}-title`}>
              {renderSegments(movement.heading)}
            </h2>
            <div className="flow-copy">
              {movement.blocks.map((block, blockIndex) =>
                block.type === "surfaces" ? (
                  <div className="flow-surfaces" key={`surfaces-${blockIndex}`}>
                    {SURFACES.map((surface) => (
                      <article className="flow-surface" key={surface.label}>
                        <h3>{surface.label}</h3>
                        <p className="flow-surface-lead">{surface.lead}</p>
                        <p>{surface.detail}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={paragraphClass(block.kind)} key={`paragraph-${blockIndex}`}>
                    {renderSegments(block.segments)}
                  </p>
                ),
              )}
            </div>
            {movement.footnote && <p className="flow-footnote">{movement.footnote}</p>}
          </section>
        ))}

        <footer className="flow-closing">
          <span className="flow-kicker">A note on the experiment</span>
          <p>{PHYSICS_NOTE}</p>
          <a className="flow-discussion-link" href="#discussion">
            Write it down <Icon name="arrow" size={15} />
          </a>
        </footer>
      </article>
    </section>
  );
}
