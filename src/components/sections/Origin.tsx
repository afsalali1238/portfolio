import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { projectCount, numberWord } from "../../data/projects";
import postureDrawing from "@/assets/posture-drawing.webp";

export function Origin({ isPage = false }: { isPage?: boolean }) {
  const TitleTag = isPage ? "h1" : "h2";
  return (
    <section id="origin" className="py-20 md:py-28 border-t rule-hair">
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
        <SectionReveal className="lg:col-span-7 space-y-6">
          <div className="text-sm font-medium text-ink-mute">Origin</div>
          <TitleTag className="font-serif text-4xl italic leading-tight text-ink md:text-5xl">
            What is forthe.tech?
          </TitleTag>

          <div className="space-y-5 text-base md:text-lg leading-relaxed text-ink-soft">
            <p>
              The wall between having an idea and building it came down. I&rsquo;ve been walking
              through the gap ever since.
            </p>

            <p>
              I have a full-time job and a family in Dubai. I can&rsquo;t follow every launch, so I
              filter. I watch what ships, I talk it through with people who see further, and then I
              build something small with it, for someone I know: my wife, my physio friends, me.
              That&rsquo;s how I learn.
            </p>

            <p>
              This is where those builds live. Not an agency portfolio. Not a vanity deck. An open
              ledger, kept for the tech.
            </p>
          </div>

          <div className="border-l-2 border-ink py-2 pl-6 my-6">
            <p className="font-serif text-xl italic text-ink md:text-2xl leading-snug">
              &ldquo;I haven&rsquo;t moved in four hours. My spine has become a question mark. But
              the logic is pure.&rdquo;
            </p>
          </div>

          <div className="pt-4 border-t rule-hair text-xs text-ink-mute">
            <span>{numberWord(projectCount)} documented builds · forthe.tech · Dubai, UAE.</span>
          </div>
        </SectionReveal>

        <SectionReveal className="flex items-center justify-center lg:col-span-5">
          {/* Static transparent line art; invert flips it to a light line on the dark theme. Zero parallax drift. */}
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
