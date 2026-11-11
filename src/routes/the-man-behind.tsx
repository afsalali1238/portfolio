import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Container } from "../components/layout/Container";
import { SectionReveal } from "../components/animations/SectionReveal";
import { PageShell } from "../components/site/PageShell";
import { MatrixSilhouette } from "../components/sections/MatrixSilhouette";
import { seo, AUTHOR } from "../lib/site";
import {
  Mail,
  Copy,
  Check,
  ArrowUpRight,
  Clock,
  MapPin,
  MessageSquare,
  Github,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/the-man-behind")({
  head: () => ({
    ...seo({
      title: "The Man Behind · forthe.tech",
      description:
        "Get in touch with Afsal Ali, the builder behind forthe.tech. Dubai, United Arab Emirates (UTC+4).",
      path: "/the-man-behind",
      image: "/og/home.png",
    }),
  }),
  component: TheManBehindPage,
});

function DubaiLiveClock() {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Dubai",
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTimeStr(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="tabular-nums text-ink font-semibold">{timeStr || "Loading GST..."}</span>;
}

function TheManBehindPage() {
  const [copied, setCopied] = useState(false);
  const email = "here@forthe.tech";

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageShell>
      <div className="pb-24 pt-10 md:pt-14">
        {/* 1. Header Title & Location Section */}
        <Container className="max-w-5xl">
          <SectionReveal className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-mute">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Contact &amp; Identity
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="font-serif text-5xl leading-tight text-ink md:text-6xl">
                  The Man Behind.
                </h1>
                <p className="mt-2 text-base text-ink-soft">
                  Builder, operator, and experimenter based in Dubai.
                </p>
              </div>

              {/* Location & Time badge */}
              <div className="flex flex-col gap-2 rounded-lg border rule-hair bg-paper-deep/60 p-4 text-xs backdrop-blur-sm">
                <div className="flex items-center gap-2 text-ink-mute">
                  <MapPin className="h-3.5 w-3.5 text-ink" />
                  <span>Dubai, United Arab Emirates</span>
                </div>
                <div className="flex items-center gap-2 text-ink-mute">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  <span>GST (UTC+4):</span>
                  <DubaiLiveClock />
                </div>
              </div>
            </div>
          </SectionReveal>
        </Container>

        {/* 2. Full-Bleed Borderless Matrix Experience (No box, edge-to-edge immersion) */}
        <div className="mt-8 relative w-full overflow-hidden bg-black">
          <MatrixSilhouette />
        </div>

        {/* 3. Post-Matrix Content & Direct Reach */}
        <Container className="max-w-5xl mt-12">
          {/* Builder Manifesto Quote */}
          <SectionReveal>
            <p className="font-serif text-xl italic text-ink-soft border-l-2 border-emerald-500/60 pl-5 py-2 leading-relaxed">
              &ldquo;Giving an operations guy modern AI tools is like handing a chimpanzee an
              AK-47: zero committees, lethal execution speed, and software built purely out of
              curiosity.&rdquo;
            </p>
          </SectionReveal>

          {/* Contact Channels & Direct Reach */}
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left: Email & Direct Connect */}
            <SectionReveal className="space-y-6 lg:col-span-7">
              <div className="rounded-xl border rule-hair bg-paper p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="font-serif text-3xl text-ink">Let&rsquo;s talk tech.</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    Whether you have an idea, want to talk about software workflows, or want to
                    discuss building focused tools — feel free to reach out.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-6 text-sm font-medium text-paper transition-all hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Send Email ({email})</span>
                    <ArrowUpRight className="h-4 w-4 opacity-75" />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border rule-hair bg-paper-deep/50 px-4 text-sm font-medium text-ink transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-500">Email Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-ink-mute" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="border-t rule-hair pt-4 text-xs text-ink-mute flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Available for collaborations &amp; architecture advisory.</span>
                </div>
              </div>
            </SectionReveal>

            {/* Right: Direct Reach Channels */}
            <SectionReveal className="space-y-4 lg:col-span-5">
              <div className="rounded-xl border rule-hair bg-paper p-6 space-y-4">
                <h3 className="font-serif text-xl text-ink">Find me on</h3>
                <div className="space-y-2">
                  <a
                    href="https://linkedin.com/in/afsalali"
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-lg border rule-hair p-3.5 transition-colors hover:bg-paper-deep"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-paper-deep text-ink">
                        <span className="font-serif font-bold text-xs">in</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-ink">LinkedIn</div>
                        <div className="text-xs text-ink-mute">
                          Professional network &amp; updates
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-ink-mute transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
                  </a>

                  <a
                    href="https://x.com/afsallali"
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-lg border rule-hair p-3.5 transition-colors hover:bg-paper-deep"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-paper-deep text-ink">
                        <span className="font-serif font-bold">𝕏</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-ink">X (Twitter)</div>
                        <div className="text-xs text-ink-mute">
                          Real-time dispatches &amp; thoughts
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-ink-mute transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
                  </a>

                  <a
                    href="https://github.com/afsalali1238"
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-lg border rule-hair p-3.5 transition-colors hover:bg-paper-deep"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-paper-deep text-ink">
                        <Github className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-ink">GitHub</div>
                        <div className="text-xs text-ink-mute">Source code &amp; experiments</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-ink-mute transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
                  </a>

                  <a
                    href="https://substack.com/@afsalali"
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-lg border rule-hair p-3.5 transition-colors hover:bg-paper-deep"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-paper-deep text-ink">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-ink">Substack</div>
                        <div className="text-xs text-ink-mute">
                          Long-form writing &amp; dispatches
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-ink-mute transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
                  </a>

                  <a
                    href="https://medium.com/@afsalali1238"
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-lg border rule-hair p-3.5 transition-colors hover:bg-paper-deep"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-paper-deep text-ink">
                        <span className="font-serif font-bold text-xs">M</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-ink">Medium</div>
                        <div className="text-xs text-ink-mute">Tech articles &amp; deep dives</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-ink-mute transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
                  </a>
                </div>
              </div>
            </SectionReveal>
          </div>
        </Container>
      </div>
    </PageShell>
  );
}
