export interface StorySegment {
  text: string;
  emphasis?: boolean;
  breakBefore?: boolean;
}

export type ParagraphKind = "lead" | "body" | "italic" | "emphasis" | "closing" | "signature";

export interface StoryParagraph {
  type: "paragraph";
  kind: ParagraphKind;
  segments: readonly StorySegment[];
}

export type StoryBlock = StoryParagraph | { type: "surfaces" };

export interface Movement {
  numeral: string;
  title: string;
  start: number;
  end: number;
  target: number;
  description: string;
  heading: readonly StorySegment[];
  blocks: readonly StoryBlock[];
  footnote?: string;
}

export interface Chapter {
  numeral: string;
  title: string;
  start: number;
  end: number;
  target: number;
  description: string;
}

const paragraph = (kind: ParagraphKind, ...segments: StorySegment[]): StoryParagraph => ({
  type: "paragraph",
  kind,
  segments,
});

export const PROLOGUE = {
  eyebrow: "A THESIS IN SIX MOVEMENTS",
  heading: [
    { text: "The Refraction" },
    { text: " of ", breakBefore: true },
    { text: "Thought.", emphasis: true },
  ],
  deck: ["Curiosity enters. Craft bends it.", "Reality catches the colour."],
  begin: "Begin reading",
} as const;

export const THESIS_PUBLISHED_AT = "2026-11-12";
export const THESIS_READ_TIME_MINUTES = 2;

export const MOVEMENTS: readonly Movement[] = [
  {
    numeral: "I",
    title: "The dark",
    start: 0.08,
    end: 0.22,
    target: 0.145,
    description: "A sudden ignition sends particles into the dark.",
    heading: [
      { text: "Every real thing" },
      { text: " begins in ", breakBefore: true },
      { text: "the dark.", emphasis: true },
    ],
    blocks: [
      paragraph("lead", { text: "Before a thing has form, it has a pressure." }),
      paragraph("body", {
        text: "A question gathers quietly. It returns at inconvenient moments. It asks for attention before it can explain why.",
      }),
      paragraph("emphasis", { text: "The first permission is simply to begin." }),
    ],
    footnote: "EVERY BEGINNING MAKES A SMALL CLAIM ON THE UNKNOWN.",
  },
  {
    numeral: "II",
    title: "The light",
    start: 0.22,
    end: 0.38,
    target: 0.29,
    description: "A single white beam travels through empty space.",
    heading: [
      { text: "An idea arrives" },
      { text: " before it can ", breakBefore: true },
      { text: "explain itself.", emphasis: true },
    ],
    blocks: [
      paragraph("body", {
        text: "It begins as attention: a question that refuses to leave you alone. Long before it becomes a plan, it asks to be noticed.",
      }),
      paragraph("italic", {
        text: "An idea is weightless while it remains private. It has not yet met consequence.",
      }),
      paragraph("body", {
        text: "Like light in empty space, it becomes visible when it meets something real.",
      }),
      paragraph("emphasis", { text: "So we place it in the world." }),
    ],
    footnote: "DIRECTION IS DISCOVERED BY CONTACT.",
  },
  {
    numeral: "III",
    title: "What we meet",
    start: 0.38,
    end: 0.54,
    target: 0.397,
    description: "The beam encounters reflection, collision, absorption, and glass.",
    heading: [
      { text: "What comes back" },
      { text: " depends on what", breakBefore: true },
      { text: " surrounds us.", breakBefore: true, emphasis: true },
    ],
    blocks: [
      paragraph("body", {
        text: "We bring our attention to people, places, and problems. What returns tells us less about our intention than about the surface it met.",
      }),
      { type: "surfaces" },
    ],
    footnote: "THE SURFACE CHANGES THE RETURN.",
  },
  {
    numeral: "IV",
    title: "The bend",
    start: 0.54,
    end: 0.72,
    target: 0.625,
    description: "Wavefronts compress and slow inside a glass prism.",
    heading: [
      { text: "To become visible," },
      { text: " light has to enter", breakBefore: true },
      { text: " what slows it.", breakBefore: true, emphasis: true },
    ],
    blocks: [
      paragraph("body", {
        text: "It slows as it enters glass. At the boundary, its change in speed bends an angled ray.",
      }),
      paragraph("body", {
        text: "The dense part is the work: returning to a question after the first answer has worn thin; making room for another person’s reality; staying long enough for the easy explanation to fail.",
      }),
      paragraph("italic", {
        text: "A real practice asks us to trade speed for depth.",
      }),
    ],
    footnote: "DEPTH HAS A COST. IT IS STILL WORTH PAYING.",
  },
  {
    numeral: "V",
    title: "The colours",
    start: 0.72,
    end: 0.88,
    target: 0.8,
    description: "White light separates into five spectral filaments.",
    heading: [
      { text: "White light was" },
      { text: " never ", breakBefore: true },
      { text: "only white.", emphasis: true },
    ],
    blocks: [
      paragraph("body", {
        text: "The colours were there all along. The glass did not invent them. It gave them a way to appear.",
      }),
      paragraph("body", {
        text: "People are not unfinished versions of one fixed thing. In the wrong conditions, whole registers of a life can remain unheard.",
      }),
      paragraph("body", {
        text: "When attention, place, and practice align, more of us becomes legible — first to ourselves, then to others.",
      }),
      paragraph(
        "closing",
        { text: "We do not always need to become someone else. " },
        { text: "We may need a truer medium.", emphasis: true },
      ),
    ],
    footnote: "REVELATION IS NOT REINVENTION.",
  },
  {
    numeral: "VI",
    title: "Becoming",
    start: 0.88,
    end: 1.001,
    target: 0.965,
    description: "Five colours emerge beyond the glass, unbounded.",
    heading: [
      { text: "What emerges" },
      { text: " is not what", breakBefore: true },
      { text: " entered.", breakBefore: true, emphasis: true },
    ],
    blocks: [
      paragraph("body", {
        text: "It has been slowed, bent, and asked to meet an edge. None of that erased the light. It made a different expression possible.",
      }),
      paragraph("body", {
        text: "Keep the work that can hold what you discover on the other side.",
      }),
      paragraph("closing", {
        text: "You were never meant to remain a single beam of light.",
      }),
      paragraph("signature", { text: "For the tech." }),
    ],
  },
];

export const CHAPTERS: readonly Chapter[] = [
  {
    numeral: "00",
    title: "Prologue",
    start: 0,
    end: MOVEMENTS[0].start,
    target: 0,
    description: "A point of possibility rests in a dark coordinate field.",
  },
  ...MOVEMENTS.map(({ numeral, title, start, end, target, description }) => ({
    numeral,
    title,
    start,
    end,
    target,
    description,
  })),
];

export function chapterAt(progress: number) {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) if (progress >= CHAPTERS[i].start) return i;
  return 0;
}

export function surfaceAt(progress: number) {
  if (progress < 0.413) return 0;
  if (progress < 0.45) return 1;
  if (progress < 0.485) return 2;
  return 3;
}

export const SURFACE_TARGETS = [0.397, 0.431, 0.468, 0.516] as const;

export const SURFACES = [
  {
    label: "Mirror",
    lead: "Some places return our image exactly.",
    detail: "They can be kind, but they do not change the direction of the light.",
    material: "SILVER",
    status: "REFLECTION · NO CHANGE",
  },
  {
    label: "Wall",
    lead: "Some places answer with force.",
    detail: "The impact stings. Still, resistance can reveal an edge we had not seen.",
    material: "STONE",
    status: "COLLISION · ENERGY LOST",
  },
  {
    label: "Void",
    lead: "Some places take without receiving.",
    detail: "You can keep pouring light in and never find a surface that answers back.",
    material: "MATTE BLACK",
    status: "ABSORPTION · NO RETURN",
  },
  {
    label: "Glass",
    lead: "A few places alter the path.",
    detail: "The right medium does not flatter us. It gives our energy a new direction.",
    material: "OPTICAL GLASS",
    status: "A DIFFERENT POSSIBILITY",
  },
] as const;

export const PHYSICS_NOTE =
  "This is a metaphor, not a physics textbook. The optical engine uses Snell’s law and Cauchy’s equation; spectral separation is exaggerated after emergence. Light can refract at a boundary as it enters or leaves a medium, depending on the refractive indices on either side.";

export function segmentsText(segments: readonly StorySegment[]) {
  return segments
    .map((segment) => segment.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function paragraphText(paragraph: StoryParagraph) {
  return segmentsText(paragraph.segments);
}

export function movementPlainText(movement: Movement) {
  const paragraphs = movement.blocks.flatMap((block) =>
    block.type === "paragraph"
      ? [paragraphText(block)]
      : SURFACES.flatMap((surface) => [surface.label, surface.lead, surface.detail]),
  );
  return [
    segmentsText(movement.heading),
    ...paragraphs,
    ...(movement.footnote ? [movement.footnote] : []),
  ];
}

export function publishedDateLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${THESIS_PUBLISHED_AT}T00:00:00.000Z`));
}
