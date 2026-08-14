import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";

function PostureDrawing({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Head */}
      <ellipse cx="200" cy="105" rx="28" ry="32" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Messy hair */}
      <path d="M172 95c-2-12 8-28 20-32s22 2 30 8c6 5 8 14 6 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M176 88c4-8 12-16 22-18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M218 82c4 4 8 10 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Neck — tilted forward */}
      <path d="M192 136c-2 8-6 16-10 22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M208 134c0 8 2 14 0 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Spine curve — the question mark */}
      <path d="M182 158c-12 18-20 40-22 64s2 48 8 68c4 14 10 26 18 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="none" />
      {/* Shoulders hunched */}
      <path d="M178 162c-16 4-36 8-54 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M212 160c16 6 34 10 48 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Left arm reaching to laptop */}
      <path d="M124 166c-8 16-14 36-10 56s12 32 28 40" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Right arm reaching to laptop */}
      <path d="M260 166c10 16 16 34 14 52s-10 30-24 40" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Hands on keyboard area */}
      <path d="M142 262c8 4 18 6 28 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M250 258c-8 4-18 6-28 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Laptop — screen */}
      <path d="M130 268l40-60h60l40 60" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Laptop — base/keyboard */}
      <path d="M120 270h160" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M116 272c-4 2-6 6-4 10h176c2-4 0-8-4-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Screen glow lines */}
      <path d="M182 230h36" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      <path d="M178 240h44" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
      <path d="M184 250h32" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.2" />
      {/* Crossed legs */}
      <path d="M186 326c-14 12-34 28-56 36s-38 10-50 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M186 326c14 14 38 32 58 38s34 6 46 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Left foot */}
      <path d="M80 370c-6-2-12 0-14 4s0 8 6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Right foot */}
      <path d="M290 366c6-2 12-1 14 3s0 8-6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Floor shadow hint */}
      <ellipse cx="200" cy="390" rx="100" ry="8" stroke="currentColor" strokeWidth="1" opacity="0.15" />
    </svg>
  );
}

export function Posture() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const drawingY = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  return (
    <section
      id="posture"
      ref={ref}
      className="border-b rule-hair"
    >
      <Container className="grid min-h-[70vh] grid-cols-1 items-center gap-10 py-24 md:grid-cols-12">
        <SectionReveal className="md:col-span-6">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">
            § 03 · Confession
          </div>
          <h2 className="mt-4 font-serif text-5xl leading-[1.05] md:text-7xl">
            The line I'd never
            <br />
            say out loud.
          </h2>
          <p className="mt-8 max-w-md font-serif text-2xl italic leading-relaxed text-ink-soft">
            I haven't moved in four hours. My spine has become a question mark. But the logic is pure.
          </p>
          <p className="mt-6 text-sm text-ink-mute">
            Move to see. Sit to build. Repeat until the future arrives.
          </p>
        </SectionReveal>

        <motion.div
          style={{ y: drawingY }}
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center md:col-span-6"
        >
          <PostureDrawing className="w-full max-w-md text-ink dark:text-ink" />
        </motion.div>
      </Container>
    </section>
  );
}
