import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { CHAPTERS } from "./story";
import { clamp } from "./opticsEngine";

/**
 * Legacy contract kept for the retired pinned-stage runtime (`useStageRuntime`).
 * The native-flow index below is self-driven and exposes no imperative handle.
 */
export interface RailHandle {
  update: (progress: number) => void;
}

/** The active chapter flips just below the 88 px sticky header, never underneath it. */
const ACTIVE_LINE = 120;

function sectionFor(index: number) {
  if (index === 0) return document.getElementById("prologue");
  return document.getElementById(`movement-${CHAPTERS[index].numeral}`);
}

/**
 * Chapter index for the native reading flow: eight stops (prologue + seven movements)
 * that seek by section, track the active movement, and retire themselves once the
 * essay leaves the viewport. Real anchors, so the jump still works without JavaScript.
 */
export function ChapterRail() {
  const root = useRef<HTMLElement>(null);
  const stops = useRef<(HTMLAnchorElement | null)[]>([]);
  const reader = useRef<HTMLElement | null>(null);
  const tops = useRef<number[]>([]);
  const layoutKey = useRef("");
  const activeRef = useRef(0);
  const visibleRef = useRef(true);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);

  // Section offsets in document pixels; re-measured only when the layout signature changes.
  const measure = useCallback(() => {
    const section = reader.current;
    if (!section) return [];
    const key = `${section.offsetHeight}:${window.innerWidth}x${window.innerHeight}`;
    if (key !== layoutKey.current) {
      layoutKey.current = key;
      tops.current = [...section.querySelectorAll<HTMLElement>("#prologue, .flow-movement")].map(
        (element) => element.getBoundingClientRect().top + window.scrollY,
      );
    }
    return tops.current;
  }, []);

  useEffect(() => {
    const section = root.current?.closest<HTMLElement>(".immersive-reader") ?? null;
    reader.current = section;
    if (!section) return;

    let frame = 0;
    const sync = () => {
      frame = 0;
      const sectionTops = measure();
      if (!sectionTops.length) return;

      const line = window.scrollY + ACTIVE_LINE;
      let next = 0;
      for (let i = 0; i < sectionTops.length; i++) if (line >= sectionTops[i]) next = i;
      if (next !== activeRef.current) {
        activeRef.current = next;
        setActive(next);
      }

      const readerRect = section.getBoundingClientRect();
      const span = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = clamp((window.scrollY - (readerRect.top + window.scrollY)) / span, 0, 1);
      root.current?.style.setProperty("--rail-progress", progress.toFixed(4));

      // The index belongs to the essay: retire it once the notebook owns the screen.
      // (A plain intersection test is not enough — the reader's tail keeps
      // intersecting well into the notebook.)
      const inEssay = readerRect.bottom > window.innerHeight * 0.5;
      if (inEssay !== visibleRef.current) {
        visibleRef.current = inEssay;
        setVisible(inEssay);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [measure]);

  const scrollTo = useCallback((index: number) => {
    const target = sectionFor(index);
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "instant" : "smooth", block: "start" });
  }, []);

  const focusHeading = useCallback((index: number) => {
    const heading = sectionFor(index)?.querySelector<HTMLElement>("h1, h2");
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }, []);

  const seek = (event: ReactMouseEvent<HTMLAnchorElement>, index: number) => {
    event.preventDefault();
    scrollTo(index);
    focusHeading(index);
  };

  const stopKeyDown = (event: ReactKeyboardEvent<HTMLAnchorElement>, index: number) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    event.stopPropagation();
    const next = clamp(index + (event.key === "ArrowDown" ? 1 : -1), 0, CHAPTERS.length - 1);
    stops.current[next]?.focus();
    scrollTo(next);
  };

  return (
    <nav
      className="chapter-rail"
      aria-label="Manifesto chapters"
      data-active={active}
      data-visible={visible}
      ref={root}
    >
      <span className="rail-caption">INDEX</span>
      <div className="rail-track">
        <div className="rail-line" aria-hidden="true">
          <span />
        </div>
        {CHAPTERS.map((chapter, index) => (
          <a
            key={chapter.numeral}
            ref={(element) => {
              stops.current[index] = element;
            }}
            className={`rail-stop ${index === 0 ? "rail-origin" : ""}`}
            href={index === 0 ? "#prologue" : `#movement-${chapter.numeral}`}
            data-section={index === 0 ? "prologue" : `movement-${chapter.numeral}`}
            data-active={index === active}
            aria-current={index === active ? "step" : undefined}
            aria-label={
              index === 0 ? chapter.title : `Chapter ${chapter.numeral}: ${chapter.title}`
            }
            onClick={(event) => seek(event, index)}
            onKeyDown={(event) => stopKeyDown(event, index)}
          >
            <span className="rail-dot" />
            <span className="rail-numeral">{chapter.numeral}</span>
            <span className="rail-label">{chapter.title}</span>
          </a>
        ))}
      </div>
      <span className="rail-end">END</span>
    </nav>
  );
}
