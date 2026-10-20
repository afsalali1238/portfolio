import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { projectCount, numberWord } from "../../data/projects";

export function About() {
  return (
    <section id="about" className="border-b rule-hair">
      <Container className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12 md:py-24">
        <SectionReveal className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 01 · Manifesto</div>
          <div className="mt-3 font-serif text-2xl italic text-ink-soft">forthe.tech</div>
        </SectionReveal>
        <SectionReveal className="md:col-span-9 space-y-6">
          <p className="font-serif text-3xl leading-snug md:text-4xl">
            The wall between having an idea and building it just came down.
            Since then, I’ve been building for the tech. Literally:{" "}
            <span className="italic">forthe.tech</span>.
          </p>
          <div className="max-w-2xl space-y-4 text-base leading-relaxed text-ink-soft">
            <p>
              For years, people with ideas hit the same wall: they could see the thing, but couldn't build it. Now they can. It feels like magic, and we’re lucky to live through it.
            </p>
            <p>
              It's also impossible to keep up with. Something "revolutionary" launches every morning; by dinner, it's irrelevant. Watching from the sidelines isn’t enough — but neither is being online 24 hours a day.
            </p>
            <p>
              So around a full-time job and family in Dubai, I filter. I don’t just read about new tools — I test them by building real things that solve real friction.
            </p>
            <p>
              I know my wife is a pharmacist, so I built PharmaRab and Provia. My friends are physios, so I built PhysioArab and kinē. Dubai's best food is next door, so I built NxtDoorChef. I collect mental models, so I built Doomscholar.
            </p>
            <p className="font-serif text-xl italic text-ink pt-2">
              Tech isn’t the moat. What it changes in someone’s daily life is. Nobody values how complex the build was; they value whether it actually helped.
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-mute pt-2">
              {numberWord(projectCount)} experiments · Built in public · Dubai
            </p>
          </div>
        </SectionReveal>
      </Container>
    </section>
  );
}
