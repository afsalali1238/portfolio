import { useState } from "react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { NFT_MOMENTS, NFT_JOURNEY_STATS, type NFTCategory } from "../../data/nft-journey";
import { TrendingDown, Flame, DollarSign, Award } from "lucide-react";

export function NFTJourney() {
  const [filter, setFilter] = useState<NFTCategory>("all");

  const filteredMoments = NFT_MOMENTS.filter((m) => {
    if (filter === "all") return true;
    return m.category === filter;
  });

  return (
    <section
      id="crypto-journey"
      aria-labelledby="journey-heading"
      className="py-20 md:py-28 border-t rule-hair"
    >
      <Container>
        <SectionReveal className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-mute">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500/80" />
            The Journey · Honest Ledgers
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 id="journey-heading" className="font-serif text-4xl text-ink md:text-5xl">
                Paperhands, Diamond Hands, & Paid Tuition.
              </h2>
              <p className="mt-3 max-w-2xl text-base text-ink-soft md:text-lg">
                Before I focused on building quiet software for real clinics and daily workflows, I
                spent nights in the NFT trenches. Here is the unvarnished post-mortem of illiquid
                JPEGs, panic dumps, and the expensive lessons that shaped my engineering discipline.
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg border rule-hair bg-paper-deep/50 p-3 text-xs">
              <div className="space-y-0.5">
                <div className="text-ink-mute flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  Estimated Tuition
                </div>
                <div className="tabular-nums text-sm font-semibold text-ink">
                  {NFT_JOURNEY_STATS.totalBurnedEstimate}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-ink-mute flex items-center gap-1">
                  <Flame className="h-3 w-3 text-amber-500" />
                  Gas Burned
                </div>
                <div className="tabular-nums text-sm font-semibold text-ink">
                  {NFT_JOURNEY_STATS.ethBurned}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-ink-mute flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-emerald-500" />
                  Max Paperhand Miss
                </div>
                <div className="tabular-nums text-sm font-semibold text-ink">~$35k+</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-ink-mute flex items-center gap-1">
                  <Award className="h-3 w-3 text-blue-500" />
                  Held to $0 Rate
                </div>
                <div className="tabular-nums text-sm font-semibold text-ink">
                  {NFT_JOURNEY_STATS.zeroHoldRate}
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>

        {/* Filter Pills */}
        <SectionReveal className="mt-8 flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: "All Scars & Stories" },
              { id: "diamond", label: "💎 Diamond Handed ($0)" },
              { id: "paperhand", label: "🧻 Paperhanded Too Early" },
              { id: "gas", label: "⛽ Gas War Casualties" },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "bg-ink text-paper shadow-sm"
                    : "border rule-hair bg-paper-deep/30 text-ink-soft hover:bg-paper-deep hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </SectionReveal>

        {/* Cards Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredMoments.map((item) => (
            <SectionReveal
              key={item.id}
              className="group flex flex-col justify-between rounded-lg border rule-hair bg-paper p-6 transition-all duration-200 hover:border-ink/40 hover:bg-paper-deep/20"
            >
              <div className="space-y-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono text-ink-mute">
                      {item.chain} · {item.year}
                    </span>
                    <h3 className="font-serif text-2xl text-ink group-hover:text-ink transition-colors">
                      {item.name}
                    </h3>
                    <div className="text-xs text-ink-mute">{item.collection}</div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      item.category === "diamond"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        : item.category === "paperhand"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>

                {/* Numbers row */}
                <div className="grid grid-cols-3 gap-2 rounded-md border rule-hair bg-paper-deep/60 p-3 text-xs font-mono">
                  <div>
                    <span className="text-ink-mute block text-[10px] uppercase">Bought At</span>
                    <span className="text-ink font-medium">{item.buyPrice}</span>
                  </div>
                  <div>
                    <span className="text-ink-mute block text-[10px] uppercase">
                      {item.category === "paperhand" ? "Sold At" : "Exit / Floor"}
                    </span>
                    <span className="text-ink font-medium">{item.exitPrice}</span>
                  </div>
                  <div>
                    <span className="text-ink-mute block text-[10px] uppercase">PnL Impact</span>
                    <span
                      className={`font-semibold ${
                        item.pnlType === "loss"
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {item.pnl}
                    </span>
                  </div>
                </div>

                {/* Story */}
                <p className="text-sm leading-relaxed text-ink-soft">{item.story}</p>
              </div>

              {/* Lesson Callout */}
              <div className="mt-6 border-t rule-hair pt-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
                  The Hard Lesson
                </div>
                <p className="mt-1 font-serif text-sm italic text-ink">
                  &ldquo;{item.lesson}&rdquo;
                </p>
              </div>
            </SectionReveal>
          ))}
        </div>

        {/* Narrative closing transition */}
        <SectionReveal className="mt-12 rounded-lg border rule-hair bg-paper-deep/30 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <h4 className="font-serif text-xl text-ink">
                Why document these losses on a tech portfolio?
              </h4>
              <p className="text-sm leading-relaxed text-ink-soft">
                Losing real money on illiquid digital tokens was the greatest product education I
                ever had. It cured me of vaporware roadmaps, vanity vanity metrics, and community
                echo-chambers. It grounded me in one core principle:
                <strong className="text-ink font-medium">
                  {" "}
                  build quiet software that solves an immediate, painful problem for someone real
                  today.
                </strong>
              </p>
            </div>
            <div className="shrink-0 font-mono text-xs text-ink-mute border-l-2 border-ink pl-4 py-1">
              Ledger verified: <br />
              Zero hype · 100% utility focus
            </div>
          </div>
        </SectionReveal>
      </Container>
    </section>
  );
}
