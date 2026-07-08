import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";

export function About() {
  return (
    <section id="about" className="border-b rule-hair">
      <Container className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12 md:py-24">
        <SectionReveal className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 01 · About</div>
        </SectionReveal>
        <SectionReveal className="md:col-span-9">
          <p className="font-serif text-3xl leading-snug md:text-4xl">
            I don't know a lot of things. But I know my wife is a pharmacist, so I built her
            PharmaRab and Provia. I know my friends are physios, so I built them PhysioArab. I know
            Dubai's best meals are homemade, so I built NxtDoorChef. I know craft deserves every
            rupee, so I built CraftersUnited. I know I'm curious about AI agents, so I built
            Incubator.
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft">
            Eleven small things for people I know. Nothing here is a product deck. Each piece exists
            because a real person — usually someone I love — was stuck on something a spreadsheet
            couldn't fix. The through-line is the pull, not the stack.
          </p>
        </SectionReveal>
      </Container>
    </section>
  );
}
