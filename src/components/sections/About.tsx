import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { projectCount, numberWord } from "../../data/projects";

export function About() {
  return (
    <section id="about" className="border-b rule-hair">
      <Container className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12 md:py-24">
        <SectionReveal className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 01 · Origin</div>
          <div className="mt-3 font-serif text-2xl italic text-ink-soft">What is forthe.tech?</div>
          <p className="mt-4 text-xs text-ink-mute leading-relaxed">
            The collapsing wall between imagining software and making it exist, documented in public.
          </p>
        </SectionReveal>
        <SectionReveal className="md:col-span-9 space-y-8">
          <p className="font-serif text-3xl leading-snug md:text-4xl text-ink">
            The wall between having an idea and building it just came down.
            Since then, I’ve been building for the tech. Literally:{" "}
            <span className="italic">forthe.tech</span>.
          </p>

          <div className="max-w-2xl space-y-5 text-base leading-relaxed text-ink-soft">
            <p>
              For years, people with ideas hit the exact same wall: they could see the product with complete clarity, but they couldn’t write the syntax to build it. They were stopped cold at the terminal.
            </p>

            <p>
              Now they can build. It feels like magic, and we are fortunate to live through the collapse of that barrier.
            </p>

            <p>
              It is also impossible to keep up with. Something &ldquo;revolutionary&rdquo; launches every morning; by dinner, it’s already irrelevant. An entire micro-industry gets wiped out by a Tuesday model checkpoint. Products built over five years become a forgotten checkbox in someone else’s release notes. Then comes the corporate cycle: panic layoffs, followed by quiet rehiring once the hallucinated code and astronomical AI bills arrive.
            </p>

            <p>
              Watching from the sidelines isn’t enough. But being online twenty-four hours a day isn’t an answer either.
            </p>

            <p>
              <strong className="font-medium text-ink">So I filter.</strong> Around a full-time job and family in Dubai, I follow what’s shipping. Then I talk it through with people who see further. Between them, I can sort what’s real from the noise.
            </p>

            <p>
              And I don’t just read about new tools — I test them. When one launches, I build something with it that solves genuine friction in real life. That’s how I learn.
            </p>

            <p>
              I’ve been building things with different tools for a while, so I started documenting them in one place. Not as an agency portfolio or a curated vanity deck, but as an <strong className="font-medium text-ink">open publishing ledger</strong>.
            </p>

            <div className="border-l-2 border-ink pl-4 py-1 my-6">
              <p className="font-serif text-xl italic text-ink">
                For the tech. For better or worse.
              </p>
            </div>

            <p className="text-xs uppercase tracking-[0.24em] text-ink-mute pt-2">
              {numberWord(projectCount)} documented builds · forthe.tech · Dubai, UAE
            </p>
          </div>
        </SectionReveal>
      </Container>
    </section>
  );
}
