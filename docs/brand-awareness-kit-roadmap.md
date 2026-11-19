# MCTS Brand Awareness Kit — Product Plan v1

**Project:** `mawruemdota/mcts`
**Status:** Planning / review; no production code changes in this plan.
**Product intent:** An internal MCTS brand-and-marketing workspace using the existing Creative Hub and Base44-backed application. Preserve existing management, inventory, jobs, and finance functions.

## 1. Product objective

Allow an MCTS team member to:
1. Start a campaign from a short brief.
2. Upload real product photos and choose approved brand assets.
3. Make several distinct social creatives with consistent MCTS identity.
4. Edit headlines, offers, logo placements, supporting text, and CTA without regenerating imagery.
5. Review and approve a final design and caption.
6. Add approved content to the existing calendar.
7. Evaluate performance from authorized Meta data or imported CSV, and use the findings to plan the next campaign.

Default to **MCTS branding**. Future support for client-specific brand work must be isolated from MCTS assets and require an explicit brand switch.

## 2. Existing modules (verified in source; not a deployed functional test)

- `src/pages/CreativeHub.jsx`: Ad Studio, watermark tool, Post Schedule.
- `src/components/creativehub/AdStudio.jsx`: design controls, four templates, brand guide, AI caption drafts, AI concept-image generation, Facebook insights.
- `src/components/creativehub/BrandGuidePanel.jsx`: palette and rules, campaign style references.
- `src/components/creativehub/mctsBrandGuide.js`: MCTS color rules and prompt composition.
- `src/components/creativehub/adEngine.js`: canvas rendering, exports, post metrics.
- `src/components/creativehub/PostCalendar.jsx`: planned posts with platform/date/caption/image/status.
- `src/components/creativehub/WatermarkTool.jsx`: applies a logo/watermark to uploaded images.

### Known limitations

- MCTS palette `#2355E5`, `#8CA0E3`, `#172851`, `#F5F8FC`, white are **provisional**, estimated from JPEG ad references, pending approval against official artwork.
- Style references can be uploaded, but the current Base44 `GenerateImage` call uses text instructions; it does **not** consume those uploaded reference pixels.
- Campaign data are partly saved in browser storage and partly in exported JSON; local browser storage does not provide a shared team library.
- The existing calendar **records scheduled posts**; this is not equivalent to verified automatic posting on Facebook/Instagram.
- The Facebook sync endpoint depends on a separately deployed and authorized server component.
- The current four templates differ in layout but do not form a categorized visual template library.

## 3. Planned navigation

**Brand Awareness Kit**
- **Overview:** New campaign, recent drafts, ready-for-review items, scheduled posts.
- **Brand Library:** Approved logo variants, palette, typography, copy rules, reusable assets; admin approval and versioning.
- **Create Content:** Campaign brief -> design choices -> editable creative -> caption suggestions -> exports.
- **Templates:** Product Showcase, Promotions, Service Explainer, Portfolio/Finished Work, Educational Tips, Testimonials, Seasonal Campaign, Announcements.
- **Content Calendar:** Draft / For Review / Approved / Scheduled / Published; internal scheduling first.
- **Insights:** CSV import first, authorized Facebook/Instagram connector second.

A compact watermark utility remains available from Create Content.

## 4. Standard campaign brief

Required: campaign name, product/service, intended platform, post goal, audience, headline, approved product photo(s).
Optional: approved price/offer with validity dates, key benefit, CTA, URL, reference style, deadline, assigned designer.

The UI should not fabricate prices, testimonials, services, delivery promises, discounts, or product appearances.

## 5. Visual-design rules

- Match final official MCTS palette and logo dimensions; never infer official specifications from JPEGs once master artwork is provided.
- Use real product photos without changing product graphics, dimensions, or labels.
- Render exact logos, captions, prices, and CTAs as editable overlay elements.
- Offer transparent PNG when meaningful, but never mislabel a photo with an opaque background as transparent.
- Avoid generic AI-looking elements: excessive glows, gradient clutter, fake 3D product effects, placeholder prose.
- Support 1080x1080, 1080x1350, 1080x1920, and landscape formats.
- Preview should match the exported image, with robust text wrapping and safe margins.
- Export PNG and an editable project file. Consider other formats only after checking renderer support.

## 6. Implementation roadmap and acceptance criteria

### Sprint 1 — Brand foundation

- Confirm logo masters, exact colors, approved typefaces, tagline, CTA, icon use, photography direction, and sample posts.
- Build a centrally managed **approved** asset library. Until shared storage is implemented, label device-only assets clearly rather than implying team sync.
- Preserve locked MCTS defaults; client campaigns cannot silently override them.
- Create a Brand Guide page with actual examples, not only text descriptions.

**Done when:** A new designer can find the same approved assets and use the same locked identity across devices, with clearly marked draft versus approved resources.

### Sprint 2 — Ad creation and templates

- Make the creation flow short: Campaign Brief -> Select Template -> Upload Product Images -> Edit -> Generate Variants -> Export.
- Offer at least 6 visually distinct, ready-to-use branded templates with thumbnails and meaningful controls.
- Make headline, offer, price, CTA, logo, and image placement editable independently.
- Preserve original photos and logo geometry.
- Let the user save/reopen multiple named projects.

**Done when:** A designer can produce at least 3 different, correctly branded exports from one product photo without a separate design editor.

### Sprint 3 — Image reference and AI pipeline

- Connect an image-generation/editing backend that accepts actual uploaded reference images, if approved and configured.
- Distinguish **concept generation** from image editing and photo-safe layout composition.
- Do not claim reference fidelity or photo preservation until tests verify it.
- Keep image-generation keys and credentials server-side. Show clear errors and a manual fallback.

**Done when:** Test input images and style references produce reproducible, acceptable output under documented constraints; generated designs still have editable text/logo overlays.

### Sprint 4 — Review and posting

- Introduce role-checked status transitions: Draft -> For Review -> Approved -> Scheduled -> Published.
- Store asset/caption version, reviewer, approval date, scheduling date and platform.
- Link approved output to existing `SocialMediaPost` records with access checks.
- Auto-publishing requires a verified Meta Graph API integration with proper permissions, server-side tokens, error feedback and logs. Otherwise, use manual publish and confirmation.

**Done when:** Staff cannot publish unapproved creative through the internal workflow and the app accurately distinguishes planned versus posted content.

### Sprint 5 — Measurement and continuous improvement

- Import post-level reach/interactions from CSV, and optionally from authorized live Page endpoints.
- Compare like-for-like formats over a meaningful sample; note missing reach, paid spend, and other confounders.
- Generate testable ideas for future campaigns rather than unsupported claims about causal effectiveness.

**Done when:** A marketing operator can inspect a campaign's metrics and turn findings into a new brief.

## 7. Engineering constraints

- Work in a feature/review branch, not `main`.
- Keep the existing Base44 authentication and current operational routes unchanged.
- Verify that reads/writes for brand assets, drafts, and approvals are enforced server-side, not only hidden in the UI.
- Never commit user Page tokens or API keys into the public GitHub repository.
- Maintain desktop-first authoring and functional mobile preview.
- Add smoke tests for campaign save/load, color-lock enforcement, transparent output, export sizes, and calendar transitions.

## 8. Decisions requiring owner confirmation

1. Is the initial kit **MCTS-only**, or must version 1 also support customer brands?
2. Supply/confirm final logo files, exact color values, font choices, and approved visual references.
3. Should sharing between MCTS staff use the existing Base44 data layer or a new storage/backend system?
4. Should posting initially remain manual after approval, or is Facebook/Instagram auto-publishing a v1 requirement?

No existing functionality is removed or altered by this planning document.
