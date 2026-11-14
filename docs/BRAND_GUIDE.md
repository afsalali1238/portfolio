# forthe.tech · Brand Guide (v1)

> **Curiosity enters. Craft bends it.**  
> One mark, one name, one idea.

The mark is light bent twice by glass, drawn as it behaves in a prism. The name is lowercase and ends in a full stop.

---

## 1. The Mark

**"Light in, bent twice, out. Physics, so it can be defended."**

Drawn from real optics:
- **Substrate glass**: Index of refraction $n = 1.505$ at $\lambda = 590\text{ nm}$, apex angle $55^\circ$.
- **Incident ray**: Enters the left facet rising $+16.5^\circ$, runs level inside the prism.
- **Refracted spectral rays**: Leave the right facet falling:
  - **Ray 1 (Clay)**: $-4^\circ$ (bent least)
  - **Ray 2 (Gold)**: $-16.5^\circ$
  - **Ray 3 (Slate)**: $-29^\circ$ (bent most)
- **Glass interior rule**: *Nothing is drawn inside the glass.* Clear glass shows no internal beam; light exists in the air, not as ink inside the glass.

### Optical Cuts & Sizing
- **Standard cut** ($\ge 24\text{ px}$):
  - `viewBox="-2.01 1.9 44.13 29.2"`, `stroke-width="2.2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
  - Incident beam: `M0.09 21.70L9.20 19.00`
  - Prism: `M17 4L30 29L4 29Z`
  - Ray 1: `M23.60 16.69L39.44 17.80`
  - Ray 2: `M24.80 19.00L40.02 23.51`
  - Ray 3: `M26.00 21.31L39.89 29.00`
- **Small cut** ($< 24\text{ px}$, down to $16\text{ px}$ minimum):
  - `viewBox="0.42 1.45 41.22 30.1"`, `stroke-width="3.1"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
  - Thicker optical stroke and trimmed extremities prevent clipping and counter clogging at small display scales.
- **Minimum size**: Never render the mark smaller than $16\text{ px}$ in height.
- **Clear space**: $X$, the cap height of the wordmark, on all four sides.

---

## 2. Palette & Colour

**"Calm ground. Colour is earned."**

Ink and bone carry the page; colour appears only in the mark and the full stop.

| Role | Name | Hex | Usage |
|:---|:---|:---|:---|
| Ground | **Ink** | `#0B0C0E` | Native obsidian background |
| Text, light ground | **Bone** | `#EEEAE1` | Light ground, primary typographic ink |
| Ray one & full stop | **Clay** | `#D96346` | Ray 1 on ink, wordmark full stop (5.4 : 1 contrast) |
| Ray two | **Gold** | `#CBA666` | Ray 2 on ink |
| Ray three | **Slate** | `#899FCC` | Ray 3 on ink |
| Ray one (on bone) | **Clay deep** | `#AE4024` | Ray 1 & full stop on bone ground (> 4 : 1 contrast) |
| Ray two (on bone) | **Gold deep** | `#906A21` | Ray 2 on bone ground (> 4 : 1 contrast) |
| Ray three (on bone) | **Slate deep** | `#496297` | Ray 3 on bone ground (> 4 : 1 contrast) |
| Labels | **Grey** | `#9A9EA5` | Uppercase tracked mono labels on ink |
| Rules & outlines | **Line** | `#55585E` | Boundaries, borders, structural hairline rules |

**Rules:**
- Rays only in clay, gold and slate, or all one colour.
- Never use random accent colors or arbitrary gradients.

---

## 3. The Four Canonical Versions

1. **Colour on ink** (Primary):
   - Background: `#0B0C0E`
   - Incident & prism: `#EEEAE1`
   - Rays: `#D96346` (Clay), `#CBA666` (Gold), `#899FCC` (Slate)
   - Usage: Header, footer, OG share cards, site interface.
2. **One colour on ink**:
   - Background: `#0B0C0E`
   - Incident, prism, and all rays: `#EEEAE1`
   - Usage: Stamps, embroidery, single-colour print.
3. **Colour on bone**:
   - Background: `#EEEAE1`
   - Incident & prism: `#0B0C0E`
   - Rays: `#AE4024` (Clay deep), `#906A21` (Gold deep), `#496297` (Slate deep)
   - Usage: Light grounds, printed ephemera, editorial papers.
4. **One colour on bone**:
   - Background: `#EEEAE1`
   - Incident, prism, and all rays: `#0B0C0E`
   - Usage: Invoices, legal documents, black-and-white print.

---

## 4. Typography

**"Three voices, no more."**

All three font families are self-hosted in `@fontsource/*` packages for offline reliability and zero external tracking.

1. **Display · Instrument Serif**
   - Font: `Instrument Serif` (400, italic)
   - Scale: Big lines, $44\text{ px}$ and up.
   - Rule: Use italic for the second clause (e.g. *"Curiosity enters. Craft bends it."* or *"For the tech. Not because anyone asked."*).
2. **UI & Body · DM Sans**
   - Font: `DM Sans`
   - Weights: `400` for body text at 16–18 px; `600` (SemiBold) for section titles and the wordmark.
   - Note: Never use 700 (Bold) for the wordmark — it bloats the counters.
   - Rule: Wordmark is outlined in logo SVG files; live text only inside the site. Never fall back to Arial for the wordmark.
3. **Labels · IBM Plex Mono**
   - Font: `IBM Plex Mono`
   - Weights: `400` / `500`
   - Scale: 12 to 14 px, uppercase, `0.12em` tracking (`letter-spacing: 0.12em`), Grey (`#9A9EA5`) on ink.

---

## 5. Rules & Brand Voice

**"Say less. Show the bend."**

### Do
- Use the stacked lockup for square posts and title slides.
- Use the mark alone where the name is close by.
- Keep the full stop in clay (`#D96346` on ink, `#AE4024` on bone), or the matching single colour.
- Place on ink (`#0B0C0E`) or bone (`#EEEAE1`) grounds only.

### Don't
- **No glow, no gradient, no extra rays.**
- **No recolouring individual rays** in one-colour versions.
- **No stretching, rotating or outlining** the mark.
- **No lockup below 14 px type**; use the mark alone.
- **Never draw a beam inside the glass.**

### Voice
- **Plain, curious, exact.**
- Short sentences. One idea each.
- Say what was built and what it does.
- Curiosity first, craft second, hype never.
- Lowercase name, full stop included: `for the tech.`
