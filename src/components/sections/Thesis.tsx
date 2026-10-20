import { motion } from "motion/react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";

export function Thesis() {
  const notes = [
    { k: "Currency", v: "Tokens are energy IOUs. In time, economies will clear directly in compute." },
    { k: "Physics", v: "A single 'hello' burns the watt-hours an LED reading lamp uses for minutes." },
    { k: "Hypocrisy", v: "Preaching ESG while firing millions of aimless prompts is vanity pollution." },
    { k: "Moat", v: "Not your pipeline complexity. Only what changes in someone's daily life." },
  ];

  return (
    <section id="thesis" className="bg-paper-deep/40 py-20 md:py-28">
      <Container className="grid grid-cols-1 gap-10 md:grid-cols-12">
        <SectionReveal className="md:col-span-3">
          <div className="text-sm font-medium text-ink-mute">Thesis</div>
          <div className="mt-3 font-serif text-2xl italic text-ink-soft">The Energy Ledger</div>
          <p className="mt-4 text-xs text-ink-mute leading-relaxed">
            On AI tokens as currency, the thermodynamic debt of a prompt, and the moral requirement of building with intention.
          </p>
        </SectionReveal>

        <SectionReveal className="md:col-span-9 space-y-8">
          <p className="font-serif text-3xl leading-snug md:text-4xl text-ink">
            AI tokens are the new currency.
            <br className="hidden sm:inline" />
            And every token is an <span className="italic">IOU on physical energy</span>.
          </p>

          <div className="max-w-2xl space-y-5 text-base leading-relaxed text-ink-soft">
            <p>
              We speak about artificial intelligence as though it floats weightlessly in the cloud. It doesn’t. Silicon runs on high-voltage substations, cooling towers, and diverted river water. We are transacting directly in joules.
            </p>

            <p>
              A frontier model returning a breezy <strong className="font-medium text-ink">&ldquo;hello&rdquo;</strong> consumes the watt-hours that could have kept an LED reading lamp burning in your room for minutes. Every generation is a physical withdrawal from the power grid. People will increasingly transact in tokens, and compute will serve as the reserve currency of the intelligent economy.
            </p>

            <p>
              Which exposes an uncomfortable truth: <strong className="font-medium text-ink">people who lecture about ESG, sustainability goals, and energy conservation while aimlessly burning AI tokens are being hypocrites.</strong> Firing off millions of automated inference cycles to produce corporate sludge, bloated slide decks, and speculative noise is not innovation; it is digital pollution.
            </p>

            <p>
              If every prompt incurs a thermodynamic debt, the only moral justification for using this much power is <strong className="font-medium text-ink">absolute intention</strong>: building software that solves genuine, tangible human friction.
            </p>

            <div className="rounded-sm border rule-hair bg-paper/60 p-6 space-y-3 text-sm">
              <div className="text-xs font-medium text-ink-mute">Intention over novelty</div>
              <ul className="space-y-2.5 text-ink-soft">
                <li>
                  <strong className="text-ink font-medium">My wife is a pharmacist:</strong> so I spent energy building <span className="text-ink font-serif italic text-base">PharmaRab</span> and <span className="text-ink font-serif italic text-base">Provia</span> to help her and her colleagues conquer grueling licensing exams.
                </li>
                <li>
                  <strong className="text-ink font-medium">My friends are physiotherapists:</strong> so I spent energy building <span className="text-ink font-serif italic text-base">PhysioArab</span> and <span className="text-ink font-serif italic text-base">kinē</span> to build clinical rehabilitation tools that therapists needed.
                </li>
                <li>
                  <strong className="text-ink font-medium">Dubai’s finest cooking was hidden next door:</strong> so I built <span className="text-ink font-serif italic text-base">NxtDoorChef</span> to connect neighbors directly to authentic home kitchens.
                </li>
                <li>
                  <strong className="text-ink font-medium">I collect mental models:</strong> so I built <span className="text-ink font-serif italic text-base">Doomscholar</span> to map frameworks that survive the hype cycles.
                </li>
              </ul>
            </div>

            <div className="border-l-2 border-ink pl-4 py-1 my-6">
              <p className="font-serif text-2xl italic leading-snug text-ink">
                Tech isn’t the moat. What it changes in someone’s daily life is.
              </p>
              <p className="mt-2 text-sm text-ink-mute">
                Nobody values how complex your build pipeline was. They only value whether it helped.
              </p>
            </div>

            {/* Field notes / Curiosities breakdown */}
            <div className="pt-6">
              <div className="text-xs font-medium text-ink-mute mb-4">
                Field Notes & Principles
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {notes.map((n, i) => (
                  <motion.div
                    key={n.k}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-lg bg-paper/80 p-5"
                  >
                    <div className="text-xs font-medium text-ink-mute">{n.k}</div>
                    <div className="mt-1.5 font-serif text-lg leading-snug text-ink">
                      {n.v}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>
      </Container>
    </section>
  );
}
