import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { projectCount, numberWord } from "../../data/projects";

export function About() {
  return (
    <section id="about" className="pb-16 pt-8 md:pb-24 md:pt-12 border-t rule-hair">
      <Container className="grid grid-cols-1 gap-10 md:grid-cols-12">
        <SectionReveal className="md:col-span-3">
          <div className="text-sm font-medium text-ink-mute">Origin</div>
          <h2 className="mt-3 font-serif text-4xl italic leading-tight text-ink md:text-5xl">
            What is forthe.tech?
          </h2>
          <p className="mt-4 text-xs text-ink-mute leading-relaxed">
            The collapsing wall between imagining software and making it exist, documented in
            public.
          </p>
        </SectionReveal>
        <SectionReveal className="md:col-span-9 space-y-8">
          <p className="font-serif text-3xl leading-snug md:text-4xl text-ink">
            For the tech. Not because it&rsquo;s my job. Not because anyone asked. Just curious.
          </p>

          <div className="max-w-2xl space-y-5 text-base leading-relaxed text-ink-soft">
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

            <div className="border-l-2 border-ink pl-4 py-1 my-6">
              <p className="font-serif text-xl italic text-ink">
                For the tech. For better or worse.
              </p>
            </div>

            <div className="pt-4 border-t rule-hair text-xs text-ink-mute">
              <span>{numberWord(projectCount)} documented builds · forthe.tech · Dubai, UAE.</span>
            </div>
          </div>
        </SectionReveal>
      </Container>
    </section>
  );
}
