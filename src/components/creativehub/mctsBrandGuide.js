// Source of truth for MCTS campaign colors and creative rules.
// Palette derived approximately from three supplied 11 Nov 2026 JPEG ad references.
// Values are provisional until measured from an official brand/vector master.
export const MCTS_PALETTE = Object.freeze({
  primary: "#2355E5",   // Signature royal/electric blue
  accent: "#8CA0E3",    // Periwinkle / secondary blue
  dark: "#172851",      // Deep navy for contrast
  light: "#F5F8FC",     // Cool near-white
  white: "#FFFFFF",
  ink: "#172851",
});

export const MCTS_GUIDE = Object.freeze({
  version: "0.1-draft",
  name: "MCTS",
  businessName: "Marasigan Creatives & Tech Solutions",
  paletteStatus: "reference-estimated, awaiting master brand files",
  voice: "Clear, friendly and energetic. Natural English and Taglish. Benefit-first, no inflated claims.",
  suggestedHeadingFont: "Poppins ExtraBold or similarly rounded geometric sans",
  suggestedBodyFont: "Poppins Regular or Montserrat",
  preferredLogoPlacement: "Upper left with breathing room",
  signatureCTA: "Message mo na kami!",
  nonNegotiables: [
    "Keep the official logo geometry and proportions exactly. Never invent a replacement symbol.",
    "Lead with signature royal blue and white. Dark navy and periwinkle are supporting colors.",
    "Treat new references as layout/art direction only: do not copy their palette into MCTS creatives.",
    "Keep product prints, characters, faces and approved images accurate when supplied.",
    "Do not invent prices, offers, quality claims or technical features.",
    "Keep headings large, mobile-readable and short. Provide an obvious call to action.",
    "Use editable vector or canvas overlays for exact logos, text and numbers.",
    "Use true alpha for transparent exports, not a checkerboard baked into the image.",
    "Avoid stocky AI sheen, excessive glow, unnecessary shadows and visual clutter.",
  ],
});

export const MCTS_STYLE_REFERENCES = Object.freeze([
  {
    id: "mugs",
    title: "Product showcase · colored-inner mugs",
    sourceName: "IMG_1035.jpeg",
    category: "Real product photography",
    visualStructure: "Close-up product photo; logo in top-left; royal-blue circular features badge with white border; blue lower CTA footer; small accessory cutouts.",
    keep: "Realistic mug appearance, product details, hierarchy, photo-led composition.",
    adaptable: "Different product crop, badge position, campaign headline and accent arrangement.",
  },
  {
    id: "sticker-pack",
    title: "Sticker pack promotion",
    sourceName: "IMG_2931.jpeg",
    category: "Handheld product photography",
    visualStructure: "Hand-held product shot; royal-blue feature circle; compact price block; small white logo; royal-blue bottom CTA strip.",
    keep: "Visible real printing finish and product context; white/blue brand anchors.",
    adaptable: "Price placement, photo angle, illustrative framing and layout.",
  },
  {
    id: "event-services",
    title: "Event services · character illustration",
    sourceName: "IMG_2930.jpeg",
    category: "Illustrated service promotion",
    visualStructure: "Royal-blue top header with large friendly headline; three blue service pillars; minimal floating character illustrations; photographic examples; CTA at bottom.",
    keep: "Clean vector/cartoon style, strong legible hierarchy and brand-blue anchor.",
    adaptable: "Number of sections, characters, icons, offer emphasis and scene style.",
  },
]);

export function enforceMctsPalette(brand = {}) {
  return {
    ...brand,
    primary: MCTS_PALETTE.primary,
    accent: MCTS_PALETTE.accent,
    text: MCTS_PALETTE.white,
    light: MCTS_PALETTE.light,
  };
}

export function buildMctsCreativePrompt({ product = "", audience = "", benefit = "", style = "", objective = "", headline = "", offer = "", preserve = true }) {
  const facts = [product && `Subject: ${product}`, audience && `Audience: ${audience}`, benefit && `Verified benefit: ${benefit}`, objective && `Goal: ${objective}`].filter(Boolean).join(". ");
  return [
    "Generate one original campaign visual, not a collage of sample ads.",
    "Brand identity MCTS (Marasigan Creatives & Tech Solutions).",
    `Mandatory palette: dominant MCTS royal blue ${MCTS_PALETTE.primary}, white ${MCTS_PALETTE.white}; secondary periwinkle ${MCTS_PALETTE.accent} and deep navy ${MCTS_PALETTE.dark}. Allow natural colors in product photographs only. Do not replace MCTS colors with style reference colors.`,
    `Art direction: ${style || "clean, product-forward, friendly graphic advertising with restrained shapes and minimal shadows"}.`,
    facts,
    preserve ? "Preserve all actual product geometry, printed designs, faces and supplied logos; do not alter or invent details." : "Create a new stylized concept, but preserve recognizable approved brand identity.",
    "Leave safe open space for editable headline, pricing, logos and call to action. Do not render text, logos, watermarks or prices inside the AI-generated pixels.",
    headline && `Headline for the later text overlay (do not render): ${headline}`,
    offer && `Verified offer for the later text overlay (do not render): ${offer}`,
    "Avoid excessive gloss, lighting bloom, fake plastic finish, busy effects, distorted products and random text.",
  ].filter(Boolean).join("\n");
}
