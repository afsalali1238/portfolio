import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, Image as ImageIcon, ChevronRight, ChevronLeft } from "lucide-react";
import type { Project } from "../../data/projects";

type Media = NonNullable<Project["media"]>;

export function ExplainerVideo({
  media,
  title,
  stills,
}: {
  media: Media;
  title: string;
  stills?: string[];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [videoAvailable, setVideoAvailable] = useState(true);

  // Gallery mode for projects with multiple reference stills
  const galleryStills = stills && stills.length > 0 ? stills : [media.poster];
  const currentImage = galleryStills[activeStep % galleryStills.length] || media.poster;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && videoAvailable) {
          v.play()
            .then(() => setPlaying(true))
            .catch(() => {
              // Video might not exist or autoplay blocked
              setPlaying(false);
            });
        } else {
          v.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.35 },
    );

    io.observe(v);
    return () => io.disconnect();
  }, [videoAvailable]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const handleVideoError = () => {
    setVideoAvailable(false);
  };

  const frameClass =
    media.kind === "mobile"
      ? "mx-auto w-[290px] max-w-full aspect-[9/16] rounded-[2.25rem] border-[6px] border-ink shadow-lg"
      : "w-full aspect-video rounded-xl border rule-hair shadow-sm";

  return (
    <figure className="grid gap-8 md:grid-cols-12 md:items-center">
      {/* Visual Canvas / Frame */}
      <div
        className={`relative overflow-hidden bg-paper-deep/80 ${frameClass} ${
          media.kind === "mobile" ? "md:col-span-5" : "md:col-span-7"
        }`}
      >
        {videoAvailable ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted={!media.sound}
            loop
            playsInline
            preload="metadata"
            poster={media.poster}
            onError={handleVideoError}
            aria-label={`${title}: ${media.steps.join(" ")}`}
          >
            {media.webm && <source src={media.webm} type="video/webm" />}
            <source src={media.video} type="video/mp4" />
          </video>
        ) : (
          <div className="relative h-full w-full">
            <img
              src={currentImage}
              alt={`${title} explainer screenshot ${activeStep + 1}`}
              className="h-full w-full object-cover transition-opacity duration-300"
              loading="lazy"
            />
            {galleryStills.length > 1 && (
              <div className="absolute inset-x-0 bottom-4 flex items-center justify-between px-4">
                <button
                  type="button"
                  onClick={() =>
                    setActiveStep(
                      (prev) => (prev - 1 + galleryStills.length) % galleryStills.length,
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/75 text-paper backdrop-blur-sm transition-transform hover:scale-105"
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex gap-1.5 rounded-full bg-ink/60 px-2.5 py-1 backdrop-blur-sm">
                  {galleryStills.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        idx === activeStep % galleryStills.length ? "bg-accent-ink" : "bg-paper/50"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => (prev + 1) % galleryStills.length)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/75 text-paper backdrop-blur-sm transition-transform hover:scale-105"
                  aria-label="Next screenshot"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Video Controls & Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
          {media.sound && (
            <span className="flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-medium text-paper backdrop-blur-sm">
              <Volume2 className="h-3 w-3" /> Audio On
            </span>
          )}
          {!videoAvailable && galleryStills.length > 1 && (
            <span className="flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-medium text-paper backdrop-blur-sm">
              <ImageIcon className="h-3 w-3" /> Still {activeStep + 1} of {galleryStills.length}
            </span>
          )}
        </div>

        {videoAvailable && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink/85 text-paper backdrop-blur-sm transition-all hover:scale-105 hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink"
            aria-label={playing ? "Pause explainer" : "Play explainer"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
          </button>
        )}
      </div>

      {/* Step-by-Step Flow Explanation */}
      <figcaption className={media.kind === "mobile" ? "md:col-span-7" : "md:col-span-5"}>
        <div className="flex items-center justify-between border-b rule-hair pb-2 text-xs font-semibold uppercase tracking-wider text-ink-mute">
          <span>Walkthrough &amp; Interaction</span>
          <span>{media.kind === "mobile" ? "Mobile View" : "Desktop View"}</span>
        </div>
        <ol className="mt-5 space-y-3.5">
          {media.steps.map((step, i) => (
            <li
              key={step}
              onClick={() => setActiveStep(i)}
              className={`group flex cursor-pointer items-start gap-3.5 rounded-lg p-2.5 transition-colors ${
                activeStep === i
                  ? "bg-paper-deep text-ink"
                  : "text-ink-soft hover:bg-paper-deep/50 hover:text-ink"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs transition-colors ${
                  activeStep === i
                    ? "bg-ink font-semibold text-paper"
                    : "bg-paper-deep text-ink-mute group-hover:text-ink"
                }`}
              >
                {i + 1}
              </span>
              <span className="pt-0.5 text-sm leading-relaxed md:text-base">{step}</span>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
