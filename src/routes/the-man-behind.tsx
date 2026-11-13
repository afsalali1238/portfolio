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

  return <span className="tabular-nums" style={{ color: "var(--fg)", fontWeight: "500" }}>{timeStr || "Loading GST..."}</span>;
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
        {/* 1. Header Title & Location Section - Instrument page (dark-only) */}
        <Container className="max-w-5xl">
          <SectionReveal className="space-y-4">
            <p className="t-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="inline-block h-2 w-2 rounded-full bg-live" style={{ backgroundColor: "var(--lit)", animation: "pulse 2s infinite" }} />
              Contact & Identity
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <h1 className="t-display-1">The Man Behind.</h1>
                <p className="t-lede mt-2">Builder, operator, and experimenter based in Dubai.</p>
              </div>

              {/* Location & Time badge */}
              <div style={{ 
                border: "1px solid var(--hairline)", 
                backgroundColor: "var(--bg-raised)", 
                padding: "16px", 
                borderRadius: "4px" 
              }}>
                <div className="t-label" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--fg-muted)" }}>
                  <MapPin className="h-3.5 w-3.5" style={{ color: "var(--fg)" }} />
                  <span>Dubai, United Arab Emirates</span>
                </div>
                <div className="t-label mt-2" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--fg-muted)" }}>
                  <Clock className="h-3.5 w-3.5" style={{ color: "var(--lit)" }} />
                  <span>GST (UTC+4):</span>
                  <DubaiLiveClock />
                </div>
              </div>
            </div>
          </SectionReveal>
        </Container>

        {/* 2. Full-Bleed Borderless Matrix Experience (No box, edge-to-edge immersion) */}
        <div className="mt-8 relative w-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
          <MatrixSilhouette />
        </div>

        {/* 3. Post-Matrix Content & Direct Reach */}
        <Container className="max-w-5xl mt-12">
          {/* Builder Manifesto Quote */}
          <SectionReveal>
            <p className="t-display-3" style={{ 
              fontStyle: "italic", 
              color: "var(--fg-muted)", 
              borderLeft: "2px solid var(--lit)", 
              paddingLeft: "24px", 
              paddingTop: "8px", 
              paddingBottom: "8px",
              margin: "0"
            }}>
              &ldquo;Giving an operations guy modern AI tools is like handing a chimpanzee an AK-47:
              zero committees, lethal execution speed, and software built purely out of
              curiosity.&rdquo;
            </p>
          </SectionReveal>

          {/* Contact Channels & Direct Reach */}
          <div className="mt-12" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
            {/* Left: Email & Direct Connect */}
            <SectionReveal className="space-y-6">
              <div style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--bg)", padding: "24px", borderRadius: "4px" }}>
                <h2 className="t-display-2">Let&rsquo;s talk tech.</h2>
                <p className="t-body mt-2" style={{ color: "var(--fg-muted)" }}>
                  Whether you have an idea, want to talk about software workflows, or want to
                  discuss building focused tools &mdash; feel free to reach out.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <a
                    href={`mailto:${email}`}
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Send Email ({email})</span>
                    <ArrowUpRight className="h-4 w-4 opacity-75" />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn-secondary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" style={{ color: "var(--lit)" }} />
                        <span style={{ color: "var(--lit)" }}>Email Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" style={{ color: "var(--fg-muted)" }} />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-4" style={{ borderTop: "1px solid var(--hairline)" }}>
                  <p className="t-label" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--fg-muted)" }}>
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--lit)", animation: "pulse 2s infinite" }} />
                    <span>Available for collaborations & architecture advisory.</span>
                  </p>
                </div>
              </div>
            </SectionReveal>

            {/* Right: Direct Reach Channels */}
            <SectionReveal className="space-y-4">
              <div style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--bg)", padding: "24px", borderRadius: "4px" }}>
                <h3 className="t-display-3">Find me on</h3>
                <div className="space-y-3 mt-4">
                  <a
                    href="https://linkedin.com/in/afsalali"
                    target="_blank"
                    rel="noreferrer"
                    className="card-row group"
                    style={{ padding: "12px", borderRadius: "4px", borderColor: "var(--hairline)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "var(--bg-raised)", color: "var(--fg)" }}>
                        <span className="font-serif font-bold text-xs">in</span>
                      </div>
                      <div>
                        <div className="t-small" style={{ fontWeight: "500", color: "var(--fg)" }}>LinkedIn</div>
                        <div className="t-label" style={{ color: "var(--fg-muted)" }}>Professional network & updates</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: "var(--fg-muted)" }} />
                  </a>

                  <a
                    href="https://x.com/afsallali"
                    target="_blank"
                    rel="noreferrer"
                    className="card-row group"
                    style={{ padding: "12px", borderRadius: "4px", borderColor: "var(--hairline)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "var(--bg-raised)", color: "var(--fg)" }}>
                        <span className="font-serif font-bold">𝕏</span>
                      </div>
                      <div>
                        <div className="t-small" style={{ fontWeight: "500", color: "var(--fg)" }}>X (Twitter)</div>
                        <div className="t-label" style={{ color: "var(--fg-muted)" }}>Real-time dispatches & thoughts</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: "var(--fg-muted)" }} />
                  </a>

                  <a
                    href="https://github.com/afsalali1238"
                    target="_blank"
                    rel="noreferrer"
                    className="card-row group"
                    style={{ padding: "12px", borderRadius: "4px", borderColor: "var(--hairline)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "var(--bg-raised)", color: "var(--fg)" }}>
                        <Github className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="t-small" style={{ fontWeight: "500", color: "var(--fg)" }}>GitHub</div>
                        <div className="t-label" style={{ color: "var(--fg-muted)" }}>Source code & experiments</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: "var(--fg-muted)" }} />
                  </a>

                  <a
                    href="https://substack.com/@afsalali"
                    target="_blank"
                    rel="noreferrer"
                    className="card-row group"
                    style={{ padding: "12px", borderRadius: "4px", borderColor: "var(--hairline)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "var(--bg-raised)", color: "var(--fg)" }}>
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="t-small" style={{ fontWeight: "500", color: "var(--fg)" }}>Substack</div>
                        <div className="t-label" style={{ color: "var(--fg-muted)" }}>Long-form writing & dispatches</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: "var(--fg-muted)" }} />
                  </a>

                  <a
                    href="https://medium.com/@afsalali1238"
                    target="_blank"
                    rel="noreferrer"
                    className="card-row group"
                    style={{ padding: "12px", borderRadius: "4px", borderColor: "var(--hairline)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "var(--bg-raised)", color: "var(--fg)" }}>
                        <span className="font-serif font-bold text-xs">M</span>
                      </div>
                      <div>
                        <div className="t-small" style={{ fontWeight: "500", color: "var(--fg)" }}>Medium</div>
                        <div className="t-label" style={{ color: "var(--fg-muted)" }}>Tech articles & deep dives</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: "var(--fg-muted)" }} />
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
