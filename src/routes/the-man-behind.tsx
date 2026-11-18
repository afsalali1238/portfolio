import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Container } from "../components/layout/Container";
import { SectionReveal } from "../components/animations/SectionReveal";
import { PageShell } from "../components/site/PageShell";
import { MatrixSilhouette } from "../components/sections/MatrixSilhouette";
import { seo } from "../lib/site";
import { Mail, Copy, Check, ArrowUpRight, Github, BookOpen } from "lucide-react";

export const Route = createFileRoute("/the-man-behind")({
  head: () => ({
    ...seo({
      title: "The Man Behind · forthe.tech",
      description:
        "Get in touch with the builder behind forthe.tech. Dubai, United Arab Emirates (UTC+4).",
      path: "/the-man-behind",
      image: "/og/the-man-behind.png",
    }),
  }),
  component: TheManBehindPage,
});

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
        <h1 className="sr-only">The Man Behind</h1>

        {/* 2. Full-Bleed Borderless Matrix Experience (No box, edge-to-edge immersion) */}
        <div className="relative w-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
          <MatrixSilhouette />
        </div>

        {/* 3. Post-Matrix Content & Direct Reach */}
        <Container className="max-w-5xl mt-12">
          {/* Contact Channels & Direct Reach */}
          <div
            className="mt-0"
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}
          >
            {/* Left: Email & Direct Connect */}
            <SectionReveal className="space-y-6">
              <div
                style={{
                  border: "1px solid var(--hairline)",
                  backgroundColor: "var(--bg)",
                  padding: "24px",
                  borderRadius: "4px",
                }}
              >
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
                  <p
                    className="t-label"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "var(--fg-muted)",
                    }}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: "var(--lit)", animation: "pulse 2s infinite" }}
                    />
                    <span>Available for advisory &amp; architecture</span>
                  </p>
                </div>
              </div>
            </SectionReveal>

            {/* Right: Direct Reach Channels */}
            <SectionReveal className="space-y-4">
              <div
                style={{
                  border: "1px solid var(--hairline)",
                  backgroundColor: "var(--bg)",
                  padding: "24px",
                  borderRadius: "4px",
                }}
              >
                <h3 className="t-display-3">Find me on</h3>
                <div className="space-y-3 mt-4">
                  <a
                    href="https://www.linkedin.com/in/afsalali1238/"
                    target="_blank"
                    rel="noreferrer"
                    className="card-row group"
                    style={{ padding: "12px", borderRadius: "4px", borderColor: "var(--hairline)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-md"
                        style={{ backgroundColor: "var(--bg-raised)", color: "var(--fg)" }}
                      >
                        <span className="font-serif font-bold text-xs">in</span>
                      </div>
                      <div>
                        <div className="t-small" style={{ fontWeight: "500", color: "var(--fg)" }}>
                          LinkedIn
                        </div>
                        <div className="t-label" style={{ color: "var(--fg-muted)" }}>
                          Professional network & updates
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      style={{ color: "var(--fg-muted)" }}
                    />
                  </a>

                  <a
                    href="https://x.com/afsallali"
                    target="_blank"
                    rel="noreferrer"
                    className="card-row group"
                    style={{ padding: "12px", borderRadius: "4px", borderColor: "var(--hairline)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-md"
                        style={{ backgroundColor: "var(--bg-raised)", color: "var(--fg)" }}
                      >
                        <span className="font-serif font-bold">𝕏</span>
                      </div>
                      <div>
                        <div className="t-small" style={{ fontWeight: "500", color: "var(--fg)" }}>
                          X (Twitter)
                        </div>
                        <div className="t-label" style={{ color: "var(--fg-muted)" }}>
                          Real-time dispatches & thoughts
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      style={{ color: "var(--fg-muted)" }}
                    />
                  </a>

                  <a
                    href="https://github.com/afsalali1238"
                    target="_blank"
                    rel="noreferrer"
                    className="card-row group"
                    style={{ padding: "12px", borderRadius: "4px", borderColor: "var(--hairline)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-md"
                        style={{ backgroundColor: "var(--bg-raised)", color: "var(--fg)" }}
                      >
                        <Github className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="t-small" style={{ fontWeight: "500", color: "var(--fg)" }}>
                          GitHub
                        </div>
                        <div className="t-label" style={{ color: "var(--fg-muted)" }}>
                          Source code & experiments
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      style={{ color: "var(--fg-muted)" }}
                    />
                  </a>

                  <a
                    href="https://substack.com/@afsalali"
                    target="_blank"
                    rel="noreferrer"
                    className="card-row group"
                    style={{ padding: "12px", borderRadius: "4px", borderColor: "var(--hairline)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-md"
                        style={{ backgroundColor: "var(--bg-raised)", color: "var(--fg)" }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="t-small" style={{ fontWeight: "500", color: "var(--fg)" }}>
                          Substack
                        </div>
                        <div className="t-label" style={{ color: "var(--fg-muted)" }}>
                          Long-form writing & dispatches
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      style={{ color: "var(--fg-muted)" }}
                    />
                  </a>

                  <a
                    href="https://medium.com/@afsalali1238"
                    target="_blank"
                    rel="noreferrer"
                    className="card-row group"
                    style={{ padding: "12px", borderRadius: "4px", borderColor: "var(--hairline)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-md"
                        style={{ backgroundColor: "var(--bg-raised)", color: "var(--fg)" }}
                      >
                        <span className="font-serif font-bold text-xs">M</span>
                      </div>
                      <div>
                        <div className="t-small" style={{ fontWeight: "500", color: "var(--fg)" }}>
                          Medium
                        </div>
                        <div className="t-label" style={{ color: "var(--fg-muted)" }}>
                          Tech articles & deep dives
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      style={{ color: "var(--fg-muted)" }}
                    />
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
