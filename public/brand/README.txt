forthe.tech brand pack v1
Source of truth: design/brand/forthe.tech-brand-guide-v1.html (Brand Guide v1).
Geometry and colour live in src/lib/brand.ts; regenerate with `node scripts/generate-brand.mjs`.
Do not hand-edit these files.

svg/   Four versions of each drawing, transparent backgrounds:
         on-ink-colour  primary: header, footer, share cards
         on-ink-mono    stamps, embroidery, single-colour print
         on-bone-colour deeper rays for light grounds
         on-bone-mono   invoices, documents, black print
       mark_*        the prism, standard cut (24 px tall and up)
       mark-small_*  heavier stroke, shorter rays, for 16-23 px
       wordmark_*    "for the tech." in DM Sans 600, as outlines
       lockup_*      mark + wordmark on one baseline
png/   favicon-32, app-icon-180, avatar-512 (on ink) and 1600 px lockups.
tokens.css  colours and font stacks.

Mark: light in, bent twice, out. Glass n 1.505 at 590 nm, apex 55 degrees. Nothing drawn inside the glass.
Sizes: small cut below 24 px; never below 16 px; no lockup below 14 px type, use the mark alone.
Clear space: X, the cap height of the wordmark, on all sides.
Colour: rays only in clay, gold and slate, or all one colour. Ink and bone carry the page;
colour appears only in the mark and the full stop.
Don't: glow, gradients, extra rays, recolouring single rays in mono versions, stretching,
rotating, outlining the mark, or drawing a beam inside the glass. Place on ink or bone only.
Type: Instrument Serif (display, 44 px and up), DM Sans (400 body, 600 titles and wordmark),
IBM Plex Mono (labels, 12-14 px, upper case, 0.12 em, grey on ink). Self-host all three.
Name: lower case, full stop included: for the tech.
