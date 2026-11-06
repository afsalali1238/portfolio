# Video Generation Handoff: "The Man Behind" — Matrix Digital-Rain Sequence

**Project:** `forthe.tech`
**Target Route:** `/the-man-behind` (`src/routes/the-man-behind.tsx`, `src/components/sections/MatrixSilhouette.tsx`)
**Purpose:** Production handoff prompt for state-of-the-art AI video generators (**Kling AI, Runway Gen-3 Alpha, Google Veo 2, Luma Dream Machine, Sora, and ComfyUI**). Translates the viral chimpanzee AK-47 sequence into the exact Matrix terminal digital-rain aesthetic matching `forthe.tech`'s visual language.

---

## 1. Master Video Generation Prompt (Copy & Paste)

```markdown
Cinematic volumetric 3D Matrix digital rain visual of a wild chimpanzee holding an AK-47 assault rifle.

The entire subject and environment are rendered purely out of falling monospace alphanumeric characters, hexadecimal code (0-9, A-F, #, $, @, &), and green phosphor glyphs against a deep void pitch-black background (#050a07).

Scene Choreography & Motion Sequence:
- 00:00 - 00:03 (Triumph): The chimpanzee stands tall in silhouette, holding the AK-47 rifle high above its head with both hands in triumphant celebration, shifting weight and posturing aggressively as dense streams of emerald-green digital rain (#10b981) flow downwards across its muscular silhouette, delineating its hairy shoulders, arms, ears, and the mechanical geometry of the banana magazine and barrel.
- 00:03 - 00:05 (The Transition): The chimp swiftly brings the rifle down from overhead, slamming the stock into its shoulder and racking the charging bolt. Its silhouette hunkers down into a firing stance, teeth bared in an aggressive grin traced in bright neon mint green (#6ee7b7).
- 00:05 - 00:08 (Full Auto Fire): The chimpanzee pulls the trigger and fires rapid bursts into the forward frame. Violent weapon recoil shakes the digital code streams. Each muzzle flash is an explosion of blinding white-green phosphor data particles (#ecfdf5, #34d399) that illuminates the chimpanzee's digital face. Ejected brass shell casings tumble through the air, fragmenting into disintegrating green ASCII code blocks and glowing hex particles.

Cinematography & Style:
Slow push-in frontal shot, centered framing, 35mm anamorphic cyberpunk lens, CRT scanline micro-texture, subtle chromatic aberration on green glyphs, glowing bloom falloff, high dynamic contrast, 24fps, photorealistic fluid primate motion translated into digital matrix stream simulation.
```

---

## 2. Midjourney / Flux Initial Keyframe Prompt (Image-to-Video Anchor)

If you use **Image-to-Video (I2V)** on Kling, Runway, or Luma for maximum control:

```markdown
A wild chimpanzee standing centered, triumphantly holding an AK-47 rifle high over its head, rendered entirely as a dense 3D Matrix digital code silhouette, glowing emerald green (#10b981) and mint green (#34d399) monospace hexadecimal characters raining downwards, dark pitch-black background with subtle vertical phosphor terminal trails, high-contrast chiaroscuro lighting, cyberpunk terminal art, CRT scanlines, 8k resolution, cinematic lighting --ar 16:9 --style raw
```

---

## 3. Camera, Lighting & Particle Direction Deck

| Attribute | Specification |
| :--- | :--- |
| **Color Grading** | Dominant Matrix emerald `#10b981`, deep shadow moss `#064e3b`, muzzle highlight white-mint `#ecfdf5` / `#34d399`, background pure OLED black `#050807`. |
| **Typography / Code Texture** | Cryptographic hex pairs (`0x7F`, `AF`, `9C`), punctuation (`#`, `@`, `%`, `*`), and monospace numbers cascading at variable velocities. |
| **Primate Motion Fidelity** | Heavy primate weight shifts, realistic muscle flexing under the rain streams, authentic AK-47 muzzle rise, and recoil shockwaves sending ripples through the matrix grid. |
| **Muzzle Flash FX** | Volumetric shockwave emitting exploding clusters of glowing characters rather than standard fire smoke, dissolving into digital residue. |
| **Negative Prompt** | `photorealistic human, cartoon, smooth plastic skin, 3D clay render, colorful daylight, solid realistic fur, low resolution, blurry, jittery frame, neon pink/purple colors, text watermark`. |

---

## 4. Platform-Specific Settings

- **Kling 1.5 / 2.0 (Recommended for gun mechanics & animal motion):**
  - Mode: **Professional**
  - Motion Relevance / Creativity: **0.75**
  - Duration: **10s**
  - Camera Movement: **Zoom In (Speed 2)**
- **Runway Gen-3 Alpha:**
  - Camera Control: `Fixed / Slow Zoom In`
  - Motion: `5`
- **Luma Dream Machine:**
  - Add prompt: `seamless fluid motion, explosive recoil, glowing matrix phosphor particles`.

---

## 5. Next Step / Integration Option

Once the video is generated (`.mp4` / `.webm`), integrate it directly into `/the-man-behind` as an auto-playing, seamlessly looping HTML5 video background using CSS `mix-blend-mode: screen`, or pipe it through the existing canvas particle shader.
