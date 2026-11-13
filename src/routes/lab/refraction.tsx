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
      <Container className="py-10 md:py-16">
        <Link
          to="/thesis"
          className="inline-flex min-h-9 items-center gap-1.5 t-label transition-colors hover:is-lit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Thesis
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end">
          <div>
            <p className="t-label">LAB ── REFRACTION</p>
            <h1 className="t-display-1 mt-3">
              Refraction,
              <br />
              measured.
            </h1>
          </div>
          <p className="t-small" style={{ color: "var(--fg-muted)" }}>
            A 2D interface model using finite segment intersections, vector Snell&rsquo;s law, and
            five Cauchy-dispersed wavelength bands.
          </p>
        </div>

        <RefractionEngine standalone className="mt-10" />
      </Container>
    </PageShell>
  );
}
