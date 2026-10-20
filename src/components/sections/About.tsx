import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { projectCount, numberWord } from "../../data/projects";

export function About() {
  return (
    <section id="about" className="border-b rule-hair">
      <Container className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12 md:py-24">
        <SectionReveal className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 01 · Manifesto</div>
          <div className="mt-3 font-serif text-2xl italic text-ink-soft">The Energy Ledger</div>
          <p className="mt-4 text-xs text-ink-mute leading-relaxed">
            On publishing, tokens as currency, and why every prompt is a debt to the grid.
          </p>
        </SectionReveal>
        <SectionReveal className="md:col-span-9 space-y-8">
          <p className="font-serif text-3xl leading-snug md:text-4xl text-ink">
            The wall between imagining a tool and making it exist just collapsed.
            Since then, I’ve been documenting the fallout. Literally:{" "}
            <span className="italic">forthe.tech</span>.
          </p>

          <div className="max-w-2xl space-y-5 text-base leading-relaxed text-ink-soft">
            <p>
              For decades, the limiting factor was syntax. People had clear, painful visions for things that ought to exist, and were stopped dead by the compiler. That barrier is gone. It feels miraculous, and we have the strange privilege of standing inside the shift.
            </p>

            <p>
              It also arrives with an unspoken debt.
            </p>

            <p>
              <strong className="font-medium text-ink">AI tokens are the new currency, and every token is an IOU on energy.</strong> A frontier model returning a breezy greeting burns the watt-hours that could have kept a reading lamp lit in your room for minutes. Silicon doesn’t run on magic; it runs on transformers, cooling towers, and diverted river water. We are transacting directly in joules.
            </p>

            <p>
              Which makes the current spectacle absurd. You cannot preach ESG and energy conservation in a quarterly slide deck while aimlessly firing millions of throwaway inference tokens to generate corporate noise. That is hypocrisy disguised as innovation.
            </p>

            <p>
              If every generation is a withdrawal from the grid, then aimless generation is pollution. The only moral defense of using this much power is <strong className="font-medium text-ink">intention</strong>: building things that genuinely lighten the weight of someone’s day.
            </p>

            <p>
              So around a full-time job and family in Dubai, I don’t just read release notes — I document real artifacts. I spent energy building Provia and PharmaRab because my wife was drowning in licensing exams. I spent it on PhysioArab and kinē because therapist friends needed clinical tools that didn’t exist. I spent it on Doomscholar to map ideas that matter.
            </p>

            <div className="border-l-2 border-ink pl-4 py-1 my-6">
              <p className="font-serif text-xl italic text-ink">
                Tech is never the moat. What it alters in someone’s real, physical day is.
                Nobody remembers how complex your pipeline was; they only remember whether it helped.
              </p>
            </div>

            <p className="text-xs uppercase tracking-[0.24em] text-ink-mute pt-2">
              {numberWord(projectCount)} documented builds · forthe.tech · Dubai
            </p>
          </div>
        </SectionReveal>
      </Container>
    </section>
  );
}
