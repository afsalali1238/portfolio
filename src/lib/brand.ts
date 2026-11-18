/**
 * forthe.tech brand system: the single source of truth for the identity.
 *
 * Everything here is transcribed from `forthe.tech — Brand Guide v1` (design/brand/).
 * `scripts/generate-brand.mjs` builds every file in `public/brand/`, the favicons, and the app
 * icons from these values, and `src/lib/brand.test.ts` fails if a checked-in asset drifts.
 * Change the identity here, never by hand-editing an exported SVG.
 */

/** Guide §3 · Colour. Ink and bone carry the page; colour appears only in the mark and the full stop. */
export const BRAND_COLOURS = {
  ink: "#0B0C0E",
  bone: "#EEEAE1",
  clay: "#D96346",
  gold: "#CBA666",
  slate: "#899FCC",
  clayDeep: "#AE4024",
  goldDeep: "#906A21",
  slateDeep: "#496297",
  grey: "#9A9EA5",
  line: "#55585E",
} as const;

/**
 * Guide §1 · The mark. Light in, bent twice, out: glass n 1.505 at 590 nm, apex 55°. The beam
 * enters rising 16.5° and leaves as three rays at −4°, −16.5° and −29°. Nothing is drawn inside
 * the glass. The small cut (heavier stroke, shorter rays) is for renderings under 24 px tall.
 */
export const MARK_CUTS = {
  standard: {
    viewBox: "-2.01 1.9 44.13 29.2",
    strokeWidth: 2.2,
    beam: "M0.09 21.70L9.20 19.00",
    rays: ["M23.60 16.69L39.44 17.80", "M24.80 19.00L40.02 23.51", "M26.00 21.31L39.89 29.00"],
  },
  small: {
    viewBox: "0.42 1.45 41.22 30.1",
    strokeWidth: 3.1,
    beam: "M2.97 20.84L9.20 19.00",
    rays: ["M23.28 16.07L37.84 17.09", "M24.80 19.00L38.79 23.14", "M26.32 21.93L39.09 29.00"],
  },
} as const;

/** The prism outline shared by both cuts. */
export const PRISM_PATH = "M17 4L30 29L4 29Z";

/** Guide: below 24 px use the small cut; never smaller than 16 px. */
export const MARK_SMALL_CUT_BELOW_PX = 24;
export const MARK_MIN_PX = 16;
/** Guide: no lockup below 14 px type; use the mark alone. */
export const LOCKUP_MIN_TYPE_PX = 14;

/**
 * "for the tech." in DM Sans 600, supplied as outlines so it never falls back to another face.
 * Units are font units (1000/em); the baseline is y = 0.
 */
export const WORDMARK = {
  viewBox: "0 -760 5494.4 780",
  path: "M92.0 0V-403H20.0V-504H92.0V-559Q92.0 -617 111.5 -652.5Q131.0 -688 168.0 -704.0Q205.0 -720 256.0 -720H316.0V-618H274.0Q241.0 -618 226.5 -604.5Q212.0 -591 212.0 -558V-504H326.0V-403H212.0V0Z M622.0 12Q550.0 12 492.5 -21.5Q435.0 -55 402.5 -114.5Q370.0 -174 370.0 -251Q370.0 -330 403.0 -389.5Q436.0 -449 493.5 -482.5Q551.0 -516 623.0 -516Q695.0 -516 752.5 -482.5Q810.0 -449 842.5 -390.0Q875.0 -331 875.0 -252Q875.0 -173 842.0 -114.0Q809.0 -55 751.5 -21.5Q694.0 12 622.0 12ZM622.0 -91Q658.0 -91 687.5 -109.0Q717.0 -127 735.0 -163.0Q753.0 -199 753.0 -252Q753.0 -305 735.5 -340.5Q718.0 -376 688.5 -394.0Q659.0 -412 623.0 -412Q588.0 -412 558.0 -394.0Q528.0 -376 510.0 -340.5Q492.0 -305 492.0 -252Q492.0 -199 510.0 -163.0Q528.0 -127 557.5 -109.0Q587.0 -91 622.0 -91Z M970.0 0V-504H1077.0L1088.0 -410Q1106.0 -443 1133.0 -466.5Q1160.0 -490 1196.5 -503.0Q1233.0 -516 1277.0 -516V-389H1235.0Q1205.0 -389 1178.0 -381.5Q1151.0 -374 1131.5 -357.5Q1112.0 -341 1101.0 -312.5Q1090.0 -284 1090.0 -241V0Z M1737.2 0Q1686.2 0 1648.7 -16.0Q1611.2 -32 1590.2 -69.0Q1569.2 -106 1569.2 -169V-403H1483.2V-504H1569.2L1583.2 -637H1689.2V-504H1826.2V-403H1689.2V-169Q1689.2 -131 1705.7 -116.5Q1722.2 -102 1761.2 -102H1823.2V0Z M1917.2 0V-720H2037.2V-426Q2062.2 -467 2105.2 -491.5Q2148.2 -516 2202.2 -516Q2264.2 -516 2307.2 -490.5Q2350.2 -465 2372.7 -415.5Q2395.2 -366 2395.2 -292V0H2276.2V-281Q2276.2 -346 2248.7 -380.0Q2221.2 -414 2165.2 -414Q2129.2 -414 2100.2 -396.5Q2071.2 -379 2054.2 -346.5Q2037.2 -314 2037.2 -267V0Z M2736.2 12Q2661.2 12 2604.2 -20.5Q2547.2 -53 2515.2 -112.0Q2483.2 -171 2483.2 -248Q2483.2 -328 2514.7 -388.0Q2546.2 -448 2603.7 -482.0Q2661.2 -516 2737.2 -516Q2811.2 -516 2866.2 -483.0Q2921.2 -450 2951.2 -394.5Q2981.2 -339 2981.2 -270V-248Q2981.2 -236 2979.2 -223H2601.2Q2604.2 -185 2619.2 -156Q2636.2 -122 2666.7 -104.5Q2697.2 -87 2735.2 -87Q2777.2 -87 2804.7 -105.0Q2832.2 -123 2845.2 -153H2967.2Q2953.2 -106 2921.2 -68.5Q2889.2 -31 2842.2 -9.5Q2795.2 12 2736.2 12ZM2603.2 -300H2860.2Q2858.2 -355 2823.2 -386.5Q2788.2 -418 2736.2 -418Q2699.2 -418 2668.2 -401.0Q2637.2 -384 2619.2 -351Q2607.2 -329 2603.2 -300Z M3462.39 0Q3411.39 0 3373.89 -16.0Q3336.39 -32 3315.39 -69.0Q3294.39 -106 3294.39 -169V-403H3208.39V-504H3294.39L3308.39 -637H3414.39V-504H3551.39V-403H3414.39V-169Q3414.39 -131 3430.89 -116.5Q3447.39 -102 3486.39 -102H3548.39V0Z M3865.39 12Q3790.39 12 3733.39 -20.5Q3676.39 -53 3644.39 -112.0Q3612.39 -171 3612.39 -248Q3612.39 -328 3643.89 -388.0Q3675.39 -448 3732.89 -482.0Q3790.39 -516 3866.39 -516Q3940.39 -516 3995.39 -483.0Q4050.39 -450 4080.39 -394.5Q4110.4 -339 4110.4 -270V-248Q4110.4 -236 4108.4 -223H3730.39Q3733.39 -185 3748.39 -156Q3765.39 -122 3795.89 -104.5Q3826.39 -87 3864.39 -87Q3906.39 -87 3933.89 -105.0Q3961.39 -123 3974.39 -153H4096.4Q4082.39 -106 4050.39 -68.5Q4018.39 -31 3971.39 -9.5Q3924.39 12 3865.39 12ZM3732.39 -300H3989.39Q3987.39 -355 3952.39 -386.5Q3917.39 -418 3865.39 -418Q3828.39 -418 3797.39 -401.0Q3766.39 -384 3748.39 -351Q3736.39 -329 3732.39 -300Z M4438.4 12Q4364.4 12 4305.9 -21.5Q4247.4 -55 4214.9 -114.5Q4182.4 -174 4182.4 -250Q4182.4 -329 4214.9 -388.5Q4247.4 -448 4305.9 -482.0Q4364.4 -516 4439.4 -516Q4533.4 -516 4597.4 -466.5Q4661.4 -417 4679.4 -331H4553.4Q4543.4 -369 4511.9 -391.0Q4480.4 -413 4437.4 -413Q4400.4 -413 4369.9 -394.0Q4339.4 -375 4321.9 -339.0Q4304.4 -303 4304.4 -252Q4304.4 -213 4314.4 -183.0Q4324.4 -153 4342.9 -132.5Q4361.4 -112 4385.4 -101.0Q4409.4 -90 4437.4 -90Q4466.4 -90 4489.9 -99.5Q4513.4 -109 4529.9 -128.0Q4546.4 -147 4553.4 -173H4679.4Q4661.4 -89 4597.4 -38.5Q4533.4 12 4438.4 12Z M4773.4 0V-720H4893.4V-426Q4918.4 -467 4961.4 -491.5Q5004.4 -516 5058.4 -516Q5120.4 -516 5163.4 -490.5Q5206.4 -465 5228.9 -415.5Q5251.4 -366 5251.4 -292V0H5132.4V-281Q5132.4 -346 5104.9 -380.0Q5077.4 -414 5021.4 -414Q4985.4 -414 4956.4 -396.5Q4927.4 -379 4910.4 -346.5Q4893.4 -314 4893.4 -267V0Z",
  stop: { cx: 5409.4, cy: -85, r: 85 },
  /** DM Sans cap height in font units: the guide's clear-space unit X. */
  capHeight: 700,
} as const;

/** Horizontal lockup geometry, in wordmark font units. */
export const LOCKUP = {
  viewBox: "-40 -1220 7920 1340",
  mark: { x: 0, y: -1178, width: 1919, height: 1270 },
  wordmarkX: 2339,
} as const;

/** Guide §2 · Versions: four versions, one drawing. */
export type BrandVersion = "on-ink-colour" | "on-ink-mono" | "on-bone-colour" | "on-bone-mono";

interface VersionInk {
  /** Prism outline, incoming beam, and wordmark letters. */
  body: string;
  /** Rays one to three, in order. */
  rays: readonly [string, string, string];
  /** The wordmark full stop. */
  stop: string;
}

const C = BRAND_COLOURS;

export const BRAND_VERSIONS: Record<BrandVersion, VersionInk> = {
  // Primary: header, footer, share cards.
  "on-ink-colour": { body: C.bone, rays: [C.clay, C.gold, C.slate], stop: C.clay },
  // Stamps, embroidery, single-colour print.
  "on-ink-mono": { body: C.bone, rays: [C.bone, C.bone, C.bone], stop: C.bone },
  // Deeper rays for light grounds.
  "on-bone-colour": { body: C.ink, rays: [C.clayDeep, C.goldDeep, C.slateDeep], stop: C.clayDeep },
  // Invoices, documents, black print.
  "on-bone-mono": { body: C.ink, rays: [C.ink, C.ink, C.ink], stop: C.ink },
};

export const BRAND_VERSION_NAMES = Object.keys(BRAND_VERSIONS) as BrandVersion[];

type Cut = keyof typeof MARK_CUTS;

function markInner(cut: Cut, version: BrandVersion): string {
  const g = MARK_CUTS[cut];
  const v = BRAND_VERSIONS[version];
  const strokes = [
    `<path d="${g.beam}" stroke="${v.body}"/>`,
    ...g.rays.map((d, i) => `<path d="${d}" stroke="${v.rays[i]}"/>`),
    `<path d="${PRISM_PATH}" stroke="${v.body}"/>`,
  ].join("");
  return `<g fill="none" stroke-width="${g.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${strokes}</g>`;
}

function wordmarkInner(version: BrandVersion): string {
  const v = BRAND_VERSIONS[version];
  const { cx, cy, r } = WORDMARK.stop;
  return `<path d="${WORDMARK.path}" fill="${v.body}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${v.stop}"/>`;
}

const SVG_NS = 'xmlns="http://www.w3.org/2000/svg"';

/** Standalone mark, transparent background. */
export function markSvg(version: BrandVersion, cut: Cut = "standard"): string {
  return `<svg ${SVG_NS} viewBox="${MARK_CUTS[cut].viewBox}">${markInner(cut, version)}</svg>\n`;
}

/** Standalone outlined wordmark, transparent background. */
export function wordmarkSvg(version: BrandVersion): string {
  return `<svg ${SVG_NS} viewBox="${WORDMARK.viewBox}">${wordmarkInner(version)}</svg>\n`;
}

/** Horizontal lockup: the mark, then the wordmark, on one baseline. */
export function lockupSvg(version: BrandVersion): string {
  const m = LOCKUP.mark;
  const mark = `<svg x="${m.x}" y="${m.y}" width="${m.width}" height="${m.height}" viewBox="${MARK_CUTS.standard.viewBox}">${markInner("standard", version)}</svg>`;
  return `<svg ${SVG_NS} viewBox="${LOCKUP.viewBox}">${mark}<g transform="translate(${LOCKUP.wordmarkX} 0)">${wordmarkInner(version)}</g></svg>\n`;
}

/**
 * Square app tile: the mark centred on a solid ground, used for the favicon, PWA icons, Apple
 * touch icon, and the Person avatar. \`inset\` is the clear space on each side as a fraction of
 * the tile edge (0.18 matches the supplied app icon).
 */
export function tileSvg(version: BrandVersion, cut: Cut = "standard", inset = 0.18): string {
  const ground = version.startsWith("on-ink") ? C.ink : C.bone;
  const [vx, vy, vw, vh] = MARK_CUTS[cut].viewBox.split(" ").map(Number);
  const side = Math.max(vw, vh) / (1 - inset * 2);
  const r = (n: number) => Number(n.toFixed(3));
  const x = r(vx - (side - vw) / 2);
  const y = r(vy - (side - vh) / 2);
  const s = r(side);
  return `<svg ${SVG_NS} viewBox="${x} ${y} ${s} ${s}"><rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${ground}"/>${markInner(cut, version)}</svg>\n`;
}

/** Public URLs of the generated pack, so components never hard-code a legacy file name. */
export const BRAND_ASSETS = {
  lockup: (v: BrandVersion = "on-ink-colour") => `/brand/svg/lockup_${v}.svg`,
  mark: (v: BrandVersion = "on-ink-colour") => `/brand/svg/mark_${v}.svg`,
  markSmall: (v: BrandVersion = "on-ink-colour") => `/brand/svg/mark-small_${v}.svg`,
  wordmark: (v: BrandVersion = "on-ink-colour") => `/brand/svg/wordmark_${v}.svg`,
  avatar: "/brand/png/avatar-512.png",
} as const;

/** Intrinsic aspect ratios (width / height) of the exported drawings. */
export const BRAND_ASPECT = {
  lockup: 7920 / 1340,
  mark: 44.13 / 29.2,
  markSmall: 41.22 / 30.1,
  wordmark: 5494.4 / 780,
} as const;
