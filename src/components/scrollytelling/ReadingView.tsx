import { Fragment, forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { Icon } from "../Icons";
import { lockDocumentScroll } from "./scrollLock";
import {
  CHAPTERS,
  MOVEMENTS,
  PHYSICS_NOTE,
  PROLOGUE,
  SURFACES,
  type Movement,
  type StorySegment,
} from "./story";

export interface ReadingHandle {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
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

function paragraphClass(kind: string) {
  if (kind === "body") return undefined;
  if (kind === "lead") return "reading-lead";
  if (kind === "emphasis") return "reading-emphasis";
  if (kind === "signature") return "reading-signature";
  return `reading-${kind}`;
}

function StoryPaper({
  onChapter,
  onClose,
  titleId,
}: {
  onChapter?: (index: number) => void;
  onClose?: () => void;
  titleId: string;
}) {
  return (
    <div className="reading-paper">
      <header className="reading-header">
        {onClose ? (
          <button
            className="icon-button"
            aria-label="Close reading view"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" />
          </button>
        ) : (
          <a className="reading-home-link" href="/">
            For the tech.
          </a>
        )}
      </header>
      <div className="reading-intro">
        <h2 id={titleId}>{renderSegments(PROLOGUE.heading)}</h2>
        <p className="reading-deck">
          {PROLOGUE.deck[0]}
          <br />
          {PROLOGUE.deck[1]}
        </p>
      </div>
      {MOVEMENTS.map((movement, index) => (
        <ReadableMovement
          key={movement.numeral}
          movement={movement}
          index={index}
          onChapter={onChapter}
        />
      ))}
      <footer className="reading-note">
        <span className="eyebrow">A NOTE ON THE EXPERIMENT</span>
        <p>{PHYSICS_NOTE}</p>
        {onClose && (
          <button className="text-link" onClick={onClose}>
            Back to the light <Icon name="arrow" size={14} />
          </button>
        )}
      </footer>
    </div>
  );
}

function ReadableMovement({
  movement,
  index,
  onChapter,
}: {
  movement: Movement;
  index: number;
  onChapter?: (index: number) => void;
}) {
  const chapterIndex = index + 1;
  return (
    <section className="reading-chapter" aria-labelledby={`reading-movement-${movement.numeral}`}>
      {onChapter ? (
        <button className="reading-chapter-link" onClick={() => onChapter(chapterIndex)}>
          <span>{CHAPTERS[chapterIndex].numeral}</span>
          <span>{CHAPTERS[chapterIndex].title}</span>
          <Icon name="arrow" size={14} />
        </button>
      ) : (
        <div className="reading-chapter-link">
          <span>{CHAPTERS[chapterIndex].numeral}</span>
          <span>{CHAPTERS[chapterIndex].title}</span>
        </div>
      )}
      <h3 className="reading-movement-heading" id={`reading-movement-${movement.numeral}`}>
        {renderSegments(movement.heading)}
      </h3>
      {movement.blocks.map((block, blockIndex) =>
        block.type === "surfaces" ? (
          <div className="reading-surfaces" key={`surfaces-${blockIndex}`}>
            {SURFACES.map((surface) => (
              <div className="reading-surface" key={surface.label}>
                <h4>{surface.label}</h4>
                <p className="reading-surface-lead">{surface.lead}</p>
                <p>{surface.detail}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className={paragraphClass(block.kind)} key={`paragraph-${blockIndex}`}>
            {renderSegments(block.segments)}
          </p>
        ),
      )}
      {movement.footnote && <p className="reading-footnote">{movement.footnote}</p>}
    </section>
  );
}

export function ReducedMotionReading() {
  return (
    <article className="reduced-motion-view" aria-labelledby="reduced-reading-title">
      <StoryPaper titleId="reduced-reading-title" />
    </article>
  );
}

export const ReadingView = forwardRef<
  ReadingHandle,
  { onOpenChange: (open: boolean) => void; onChapter: (index: number) => void }
>(function ReadingView({ onOpenChange, onChapter }, ref) {
  const dialog = useRef<HTMLDialogElement>(null);
  const restoreScroll = useRef<(() => void) | null>(null);
  const release = useCallback(() => {
    if (!restoreScroll.current) return;
    const restore = restoreScroll.current;
    restoreScroll.current = null;
    restore();
    onOpenChange(false);
  }, [onOpenChange]);
  const close = useCallback(() => {
    if (dialog.current?.open) dialog.current.close();
    release();
  }, [release]);
  useEffect(
    () => () => {
      restoreScroll.current?.();
      restoreScroll.current = null;
    },
    [],
  );
  useImperativeHandle(
    ref,
    () => ({
      open() {
        if (!dialog.current || dialog.current.open) return;
        try {
          dialog.current.showModal();
        } catch {
          return;
        }
        restoreScroll.current = lockDocumentScroll(document);
        onOpenChange(true);
      },
      close,
      isOpen() {
        return !!dialog.current?.open;
      },
    }),
    [onOpenChange, close],
  );

  return (
    <dialog
      className="reading-dialog"
      ref={dialog}
      aria-labelledby="reading-title"
      onKeyDown={(event) => {
        if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
          ),
        ].filter((element) => element.getClientRects().length > 0 && !element.closest("[inert]"));
        const first = controls[0],
          last = controls[controls.length - 1];
        if (!first) return;
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === event.currentTarget)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last || document.activeElement === event.currentTarget)
        ) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => {
        if (!dialog.current?.open) release();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
    >
      <StoryPaper
        titleId="reading-title"
        onClose={close}
        onChapter={(index) => {
          close();
          onChapter(index);
        }}
      />
    </dialog>
  );
});
