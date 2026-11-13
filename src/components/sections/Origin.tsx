import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { projectCount, numberWord } from "../../data/projects";
import postureDrawing from "@/assets/posture-drawing.webp";

export function Origin({ isPage = false }: { isPage?: boolean }) {
  const TitleTag = isPage ? "h1" : "h2";
  return (
    <section id="origin" className="py-20 md:py-28" style={{ borderTop: "1px solid var(--hairline)" }}>
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
        <SectionReveal className="lg:col-span-7 space-y-6">
          <p className="t-label">V ── ORIGIN</p>
          <TitleTag className="t-display-2" style={{ fontStyle: "italic" }}>
            What is forthe.tech?
          </TitleTag>

          <div className="space-y-5 t-body" style={{ color: "var(--fg-muted)" }}>
            <p>
              The wall between having an idea and building it came down. I&rsquo;ve been walking
              through the gap ever since.
            </p>

            <p>
              I work a full-time operations role in Dubai. I can&rsquo;t follow every launch, so I
              filter. I watch what ships, study how things work, and build focused tools.
              That&rsquo;s how I learn.
            </p>

            <p>
              This is where those builds live. Not an agency portfolio. Not a vanity deck. An open
              ledger, kept for the tech.
            </p>
          </div>

          <div style={{ borderLeft: "2px solid var(--fg)", paddingLeft: "24px", paddingTop: "8px", paddingBottom: "8px", margin: "24px 0" }}>
            <p className="t-display-3" style={{ fontStyle: "italic", color: "var(--fg)" }}>
              &ldquo;I haven&rsquo;t moved in four hours. My spine has become a question mark. But
              the logic is pure.&rdquo;
            </p>
          </div>

          <div className="pt-4" style={{ borderTop: "1px solid var(--hairline)" }}>
            <p className="t-label">{numberWord(projectCount)} documented builds · forthe.tech · Dubai, UAE.</p>
          </div>
        </SectionReveal>

        <SectionReveal className="flex items-center justify-center lg:col-span-5">
          <img
            src={postureDrawing}
            width={448}
            height={448}
            loading="lazy"
            decoding="async"
            className="w-full max-w-sm dark:invert"
            alt="Line drawing of a person sitting cross-legged on the floor, hunched over a laptop"
          />
        </SectionReveal>
      </Container>
    </section>
  );
}
