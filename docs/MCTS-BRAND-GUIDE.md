# MCTS visual brand guide

**Status:** Working draft v0.1 — extracted from the three advertising references supplied on 11 November 2026. These are visual estimates **not confirmed official Pantone/CMYK/logo masters**. Confirm against the original design source files before print production.

## 1. Brand identity and approach

Brand: **MCTS — Marasigan Creatives & Tech Solutions**

Personality: **Bold, friendly, creative, energetic and practical.** The design should feel like an actual Filipino printing/creative-services business: high-quality real products, clean information and natural English/Taglish call-to-action.

The identity must stay recognizable even as the campaign changes from product photography to pixel art, cartoon illustrations, minimal layouts, 3D elements or future styles.

**Fixed brand identity ≠ fixed art style.** A new uploaded inspiration image may change composition, art technique, illustration density, treatment, props or mood, but MUST NOT change brand colors, distort the logo, or fabricate product details.

## 2. Proposed color tokens

Sampled approximately from exported JPEGs. Changes should be deliberate and approved in the Brand Guide.

| Role | HEX | Usage |
| --- | --- | --- |
| **Signature royal blue** | **`#2355E5`** | Primary panels, headers, footer bars, badges, anchor accents |
| **White** | **`#FFFFFF`** | Negative space, bold white copy on royal blue, logo variant |
| **Periwinkle blue** | **`#8CA0E3`** | Secondary surfaces and grid motifs; not a replacement for royal blue |
| **Deep navy** | **`#172851`** | Dark illustrations, borders and readable text on pale backgrounds |
| **Cool off-white** | **`#F5F8FC`** | Quiet backgrounds and negative space |

For product photographs, retain actual material colors: white ceramic, wood grain, human skin, printed artwork and physical product colors must remain truthful. Character illustrations may introduce small accent colors (e.g., pink) if the main brand impression stays royal blue + white.

**Avoid**: replacing the blue with another brand's palette, heavy teal gradients, rainbow UI, arbitrary neon/glow effects, color-shifting the product, or overusing secondary accents.

Suggested distribution (guideline rather than a pixel quota): strong recognizable blue anchor in each post; substantial white/light-space balance; small navy/periwinkle details.

## 3. Logo

- Use the provided official logo asset as-is; **do not recreate, redraw, hallucinate or stretch it**.
- Preferred color variants seen in references: solid royal blue on white/light surfaces, and white on royal-blue/dark surfaces.
- Typical placement is upper-left with adequate breathing room; other placements may be chosen for an intentional composition.
- Maintain aspect ratio and clear space. Never add text into or around the symbol to reinterpret it.
- For a production-ready guide, acquire the original SVG/AI/vector or transparent PNG before finalizing geometric clear-space measurements.

## 4. Typography

Reference appearance: geometric, round, chunky sans-serif headings with softer supporting copy. **Exact typefaces cannot be established reliably from JPEG samples.**

Working suggestions:
- Headings: **Poppins ExtraBold/Black** or another closely matched geometric sans; uppercase or sentence case based on campaign.
- Supporting text: **Poppins Medium/Regular**, with **Montserrat** as an alternative.
- Numbers and prices: bold, large and correctly spelled; exact price text should be overlaid in the editable layout, never rendered by a diffusion model.
- Ensure strong contrast, avoid ultra-thin caption fonts, crowded lines, many font families or excessive effects.

## 5. Layout and creative patterns

### A. Product showcase — mug reference (`IMG_1035.jpeg`)

- Real photograph dominates, with clear view of the printable item and visible print.
- One compact royal-blue feature circle, white ring, readable claim list.
- Small logo upper-left; lower blue message strip with Taglish CTA.
- Optional cutout accessory/photo inset. Keep it small and avoid visual clutter.
- Adapts well to mugs, tumblers, apparel, printed merchandise.

### B. Product offer — sticker pack reference (`IMG_2931.jpeg`)

- Product physically presented in hand, clearly showing finish and print quality.
- Inset circular badge for features with white frame; verified price placed separately.
- Same royal-blue CTA footer and compact white logo.
- Adapts well to stickers, prints, packages and custom orders.

### C. Illustrated services — event services (`IMG_2930.jpeg`)

- Bold royal-blue top bar, playful two-level headline.
- Blue modular blocks/cards; simplified floating cartoon characters with navy outline accents.
- Supporting actual event photos placed below the illustrated services.
- Small footer CTA; sufficient white negative space to balance blue areas.
- Adapts well to photobooths, photoman, event games and other services.

### Compositional guardrails

- Design for square/portrait feed first, with mobile-readable text.
- Establish hierarchy: product/service → one headline → key benefits or offer → CTA.
- Use 1–3 feature callouts, not many simultaneous badges unless necessary.
- For photographic ads, prefer true photos, believable material texture and simple graphic overlays.
- For illustrated ads, prefer intentionally simplified vectors and consistent outline weight; floating poses are allowed, natural visual energy without AI sheen.
- Use shadows only where they clarify separation of real photographed objects or restrained product cutouts; avoid heavy default drop shadows.

## 6. Brand voice and CTA

Approachable, direct, lightly playful, naturally bilingual. Selected reference phrases:

- **“Message mo na kami!”** — recurring call to action.
- **“Kami bahala!”** — confident service proposition (campaign-specific, not an official slogan).
- Product claims and price lines only when supplied/verified.

Examples of tonal approach, not mandatory copy:
- “Custom prints? Kami bahala.”
- “Your design, your event — made ready for print.”
- “Send your peg. We'll work on the details.”

Use English and Taglish naturally; never invent promotions, discounts, material properties, guarantees, social proof, rates, or service inclusions.

## 7. Flexible styles vs locked identity

| May change with each uploaded style | Should remain locked for MCTS |
| --- | --- |
| Photographic / vector / cartoon / pixel / collage approach | Signature royal blue + white as primary visual identity |
| Art direction, layout proportions, image crop, character poses | Exact official logo, if supplied |
| Decorative graphics, badge shape, arrangement | Accurate product photos, shapes and approved graphics |
| Heading treatment and campaign-specific typography | Brand readability, contrast and coherent hierarchy |
| Scene, background props, texture, lighting | Exact prices, dates, claims and CTA copy |

Never assume uploaded style references grant rights to use the artist's assets; generate original compositions inspired by broad visual characteristics.

## 8. AI design generator contract

**Inputs**: product photos, optionally transparent cutouts, exact logo PNG/SVG, selected references, brief facts, output size, preserve/creative mode, desired number of alternatives.

**Generation**:
1. Keep MCTS colors locked unless intentionally editing the approved Brand Guide.
2. Read reference styles as *art direction*, not a new color palette.
3. Use image-conditioned editing for actual references where backend supports it; otherwise clearly disclose that only textual reference notes inform generation.
4. For commercial product advertising, default to **preserve** mode; no changes to product design, print artwork or material.
5. Generate distinct concept images, with open areas for accurate graphic overlays.
6. Add editable logo, headline, offer, benefits and CTA **after** image generation.
7. Show a gallery of alternative concepts for selection and refinement, then export PNG/JPG, with true-alpha assets where appropriate.

**Current site limitation**: the existing Base44 Core.GenerateImage integration is text-prompt based. Uploaded style references can be displayed and carried in a saved project, but image-conditioned generation requires an additional supported gateway/ComfyUI workflow. Do not label a prompt-only generation as reference-conditioned.

## 9. Approval and maintenance

Version: **0.1 — provisional**. Brand colors and fonts are proposed from screenshot JPEGs only. To finalize, obtain:
1. Official vector logo/transparent image;
2. Original color specification or editable design file;
3. Confirmed typeface(s);
4. Approved examples of product-accurate image edits.

Change palette centrally in `src/components/creativehub/mctsBrandGuide.js` and in the site branding controls; do not let individual style prompts silently override it.

### Original reference descriptions

- `IMG_1035.jpeg` — ceramic mugs with colored inside, royal-blue feature circle, bright blue bottom CTA.
- `IMG_2931.jpeg` — sticker sheet held in hand, periwinkle backing, royal-blue features circle and bottom CTA.
- `IMG_2930.jpeg` — illustrated three-column event services, blue header/panels, white field and actual event photo insets.

The reference JPEGs are supplied in the ChatGPT conversation. This repository guide stores their **design descriptions**, not copies of their original pixels.
