import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { RefractionEngine } from "../../components/refraction/RefractionEngine";
import { PageShell } from "../../components/site/PageShell";
import { seo } from "../../lib/site";

export const Route = createFileRoute("/lab/refraction")({
  head: () =>
    seo({
      title: "Refraction Engine · forthe.tech",
      description:
        "A hands-on 2D optical ray-tracing instrument: adjust incident angle, refractive index, and surface response.",
      path: "/lab/refraction",
      image: "/og/home.png",
    }),
  component: RefractionLabPage,
});

function RefractionLabPage() {
  return (
    <PageShell>
      <Container className="max-w-6xl py-10 md:py-16">
        <Link
          to="/thesis"
          className="inline-flex min-h-9 items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-mute transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Thesis
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-accent-ink">
              Independent laboratory view
            </p>
            <h1 className="mt-3 font-serif text-5xl leading-[0.94] tracking-tight text-ink md:text-7xl">
              Refraction,
              <br />
              measured.
            </h1>
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-ink-mute">
            A 2D interface model using finite segment intersections, vector Snell&rsquo;s law, and
            five Cauchy-dispersed wavelength bands.
          </p>
        </div>

        <RefractionEngine standalone className="mt-10" />
      </Container>
    </PageShell>
  );
}
