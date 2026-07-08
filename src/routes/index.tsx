import { createFileRoute } from "@tanstack/react-router";
import { useScroll, useSpring, motion, AnimatePresence, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { Nav } from "../components/sections/Nav";
import { Hero } from "../components/sections/Hero";
import { Marquee } from "../components/sections/Marquee";
import { About } from "../components/sections/About";
import { Curious } from "../components/sections/Curious";
import { Posture } from "../components/sections/Posture";
import { Works } from "../components/sections/Works";
import { Colophon } from "../components/sections/Colophon";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-paper text-ink grain"
    >
      <div className="pointer-events-none fixed inset-0 grain-overlay opacity-40" />
      <ReadingProgress />
      <div className="relative">
        <Nav />
        <Hero />
        <Marquee />
        <About />
        <Curious />
        <Posture />
        <Works />
        <Colophon />
      </div>
      <BackToTop />
    </motion.div>
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
    setVisible(latest > 0.15);
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center border rule-hair bg-paper backdrop-blur shadow-sm transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute"
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
