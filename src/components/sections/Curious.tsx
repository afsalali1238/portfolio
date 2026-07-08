import { motion } from "motion/react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";

export function Curious() {
  const notes = [
    { k: "Reading", v: "How agents disagree without collapsing." },
    { k: "Playing", v: "Cozy sims with weather but no failure." },
    { k: "Trying", v: "Non-linear syllabi for adult learners." },
    { k: "Avoiding", v: "Anything called a growth loop." },
  ];
  return (
    <section className="border-b rule-hair bg-paper-deep/60">
      <Container className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12">
        <SectionReveal className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 02 · Curious</div>
          <div className="mt-3 font-serif text-2xl italic">Field notes.</div>
        </SectionReveal>
        <div className="md:col-span-9">
          <dl className="divide-y divide-[color:var(--rule)] border-y rule-hair">
            {notes.map((n, i) => (
              <motion.div
                key={n.k}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-12 gap-4 py-4"
              >
                <dt className="col-span-3 text-[11px] uppercase tracking-[0.24em] text-ink-mute md:col-span-2">
                  {n.k}
                </dt>
                <dd className="col-span-9 font-serif text-xl leading-snug md:col-span-10">{n.v}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
