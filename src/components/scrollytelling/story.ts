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
      paragraph("lead", { text: "Just like the universe." }),
      paragraph("body", {
        text: "Out of nothing, a sudden ignition. It happened when the right conditions met.",
      }),
      paragraph("emphasis", { text: "Nobody asked for it." }),
    ],
    footnote: "NOTHING → SOMETHING",
  },
  {
    numeral: "II",
    title: "The light",
    start: 0.22,
    end: 0.38,
    target: 0.29,
    description: "A single white beam travels through empty space.",
    heading: [
      { text: "There is a light" },
      { text: " in ", breakBefore: true },
      { text: "each of us.", emphasis: true },
    ],
    blocks: [
      paragraph("body", {
        text: "It arrives before it has a name. A question. An itch. A what if.",
      }),
      paragraph("italic", { text: "An idea in your head costs nothing and proves nothing." }),
      paragraph("body", {
        text: "Like light in empty space, it is invisible until it touches something real.",
      }),
      paragraph("emphasis", { text: "So we shine." }),
    ],
    footnote: "MOVE YOUR CURSOR. FIND A DIRECTION.",
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
      paragraph("body", { text: "We shine on people. On places. On problems." }),
      { type: "surfaces" },
    ],
    footnote: "THE SURFACE CHANGES EVERYTHING.",
  },
  {
    numeral: "IV",
    title: "The bend",
    start: 0.54,
    end: 0.72,
    target: 0.625,
    description: "Wavefronts compress and slow inside a glass prism.",
    heading: [
      { text: "Light bends when it enters" },
      { text: " a ", breakBefore: true },
      { text: "denser medium.", emphasis: true },
    ],
    blocks: [
      paragraph("body", {
        text: "It slows as it enters glass. At the boundary, its change in speed bends an angled ray.",
      }),
      paragraph("body", {
        text: "The density is the work. The 1 AM rebuild. The fourth draft. The hours beside someone else’s problem, until it becomes yours.",
      }),
      paragraph("italic", {
        text: "To make anything real, you must surrender the easy, straight line.",
      }),
    ],
    footnote: "RESISTANCE IS NOT THE OPPOSITE OF PROGRESS.",
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
        text: "The colours were in it all along. The glass didn’t add them. It revealed them.",
      }),
      paragraph("body", {
        text: "People are like this. In the wrong room, you remain quiet and unseparated.",
      }),
      paragraph("body", {
        text: "But inside the honest medium, you disperse into colour.",
      }),
      paragraph(
        "closing",
        { text: "Sometimes we don’t need to change ourselves. " },
        { text: "We need the right medium.", emphasis: true },
      ),
    ],
    footnote: "REVELATION, NOT REINVENTION.",
  },
  {
    numeral: "VI",
    title: "Becoming",
    start: 0.88,
    end: 1.001,
    target: 0.965,
    description: "Five colours emerge beyond the glass, unbounded.",
    heading: [
      { text: "The light that comes out" },
      { text: " is not the light", breakBefore: true },
      { text: " that went in.", breakBefore: true, emphasis: true },
    ],
    blocks: [
      paragraph("body", { text: "It slowed. It bent. It paid the toll of density." }),
      paragraph("body", { text: "This place holds what came out the other side." }),
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
    lead: "Some mirror us.",
    detail: "We arrive open and leave exactly as we came.",
    material: "SILVER",
    status: "REFLECTION · NO CHANGE",
  },
  {
    label: "Wall",
    lead: "Some throw us back hard.",
    detail: "It stings, and it tempts us to dim. That is the nature of the wall.",
    material: "STONE",
    status: "COLLISION · ENERGY LOST",
  },
  {
    label: "Void",
    lead: "Some absorb us.",
    detail: "Everything we pour in disappears without a sound.",
    material: "MATTE BLACK",
    status: "ABSORPTION · NO RETURN",
  },
  {
    label: "Glass",
    lead: "And a few refract.",
    detail: "Finding the right medium is the play.",
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
