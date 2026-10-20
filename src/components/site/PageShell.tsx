import {
  MotionConfig,
  AnimatePresence,
  motion,
  useScroll,
  useSpring,
  useMotionValueEvent,
} from "motion/react";
import { useState, type ReactNode } from "react";
import { ArrowUp } from "lucide-react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

/**
 * Every page: skip link, shared header, main, shared footer (which holds contact).
 * No page-level fade — content paints on first frame; sections reveal on their own.
 */
export function PageShell({
  children,
  readingProgress = false,
}: {
  children: ReactNode;
  readingProgress?: boolean;
}) {
  return (
    // reducedMotion="user" makes every Motion animation below defer to the OS setting.
    <MotionConfig reducedMotion="user">
      <div className="min-h-svh bg-paper text-ink grain">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="pointer-events-none fixed inset-0 grain-overlay opacity-40" />
        {readingProgress && <ReadingProgress />}
        <div className="relative">
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </div>
        <BackToTop />
      </div>
    </MotionConfig>
  );
}

function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.2 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="fixed left-0 right-0 top-0 z-50 h-[2px] bg-ink"
    />
  );
}

function BackToTop() {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setVisible(latest > 0.2);
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border rule-hair bg-paper transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute"
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
