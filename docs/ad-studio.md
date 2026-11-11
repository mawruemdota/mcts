# MCTS Brand Ad Studio

Brand-specific ad creation inside the existing **Creative Hub** (Creatives → Creative Hub → Ad Studio). The page uses the existing Creative Hub permission gate: administrators and users with `has_creative_hub_access`.

## The MCTS visual identity

The authoritative working reference for current MCTS campaigns is [MCTS Brand Guide v0.1](./MCTS-BRAND-GUIDE.md). It describes the **royal-blue and white** palette sampled from three uploaded references, logo treatment, typography directions, product-photography and cartoon layouts, and rules for accommodating future art styles. The brand-lock toggle defaults ON; if turned back on it restores the MCTS reference palette.

The Ad Studio includes a **Brand Guide** tab with a color reference panel, text descriptions of the three example ads, a style-notes field and a small reference-image library. Uploaded style images remain in the browser until exported as part of a project JSON file. **They are not sent into Core.GenerateImage**: the current provider is text-driven. For actual uploaded-reference-conditioned image generation, implement an authorized ComfyUI or Base44 image-gateway workflow that accepts reference images.

## Working without additional accounts

- Reference-derived MCTS royal-blue brand kit: palette, logo, font, brand voice and tagline. Colors are locked by default but can be unlocked for another brand/client.
- Four responsive templates: Spotlight, Editorial, Offer, Minimal.
- Square (1080×1080), feed portrait (1080×1350), story (1080×1920), landscape (1200×628).
- Local image/logo upload and image fit, scale and position sliders.
- **True-alpha PNG export**: enabling Transparent background clears the canvas; the gray checkerboard is preview-only. For isolated products, upload an image that already has transparent pixels. It does not remove a photo's existing background.
- Offline caption templates in English/Taglish; edit and copy. Optional AI captions and AI concept imagery via the existing Base44 integrations.
- Save/open a project JSON containing the design, product images, style references and style instructions. Smaller text-based preferences also persist locally in the browser; image uploads are session-only unless you save a project.
- Import Meta Business Suite CSV files with post-level metrics. The app displays top and weak posts, format-level results, and caveated pattern suggestions.

No new paid service is required for offline editing or CSV review. AI assistance requires the application's existing Base44 integration to work; errors fall back to offline captions.

## Optional authorized Facebook Page sync

The `api/facebook-posts.js` endpoint is compatible with a **Vercel Node.js serverless deployment** of this Vite app. It is not automatically deployed by Base44's Vite frontend build. Deploy an API-capable host with the endpoint at `/api/facebook-posts` or use CSV import in Base44-only hosting.

Set these **server-only environment variables** in the deployment platform (never commit them or put them in `VITE_*` variables):

| Variable | Meaning |
| --- | --- |
| `FB_PAGE_ID` | Numeric Facebook Page ID that you administer |
| `FB_PAGE_ACCESS_TOKEN` | Active Page access token, acquired through an authorized Meta app |
| `FB_STUDIO_KEY` | Long, randomly generated dashboard access key for server endpoint access |

The Page must be one you manage. Meta app review and access grants may be required for deployment. Request appropriate Page permissions such as `pages_show_list` and `pages_read_engagement`, and review current Meta requirements for any additional scopes. The current endpoint reads **Page-owned posts**, without comments written by other users. You do **not** need `pages_manage_posts` because it never posts content.

In the Ad Studio → Facebook Insights tab, enter the dashboard access key (NOT the Page token), then click Sync. The Page token stays in the server environment and is sent to Meta in an Authorization header. The dashboard key stays in component memory, not local storage.

**Production hardening:** The dashboard key is an MVP access gate, not a replacement for organization identity and authorization. Use HTTPS, a long random key, platform-level rate limits, and ideally a session-aware authentication layer. Restrict server endpoint access to staff. Rotate tokens if exposed. Do not provide a Page token to client-side JavaScript.

### Data/analytics limitations

- Page sync reads up to **50 recent Page-owned posts**, using Meta Graph API v26.0. The endpoint intentionally does **not** assert reach or ad metrics. Results are compared by raw interaction totals and labeled accordingly.
- To compare **engagement per reach**, export post-level data with reach and interactions from Meta Business Suite and import CSV. Engagement per reach is calculated only if *all* imported posts contain positive reach. If some are missing, all posts are compared by raw interactions instead.
- Performance differences can result from reach, post timing, promotion spend, audience and content, not just design. The app does not claim to predict conversion, ROAS or the optimal ad. Pattern recommendations require at least five posts.
- Meta can change API fields, versions and access policies. Check current docs at https://developers.facebook.com/docs/graph-api/reference/page/ and https://developers.facebook.com/docs/pages-api/ when configuring.
- **A Facebook Page URL by itself does not grant permission to read analytics.** The Page URL field is a reference for the brand kit, not a scraper.

### CSV import

1. In Meta Business Suite for your Page, open **Content** or **Insights**, choose a time range and export post-level data as CSV (subject to Meta's available export options).
2. The importer recognizes column labels including: `post type`, `post message`, `reach`, `reactions`, `comments`, `shares`, `clicks` and `engagement`/`interactions`.
3. The app reads the data locally in the browser. Nothing is uploaded to a server by the CSV importer.

## Development

```bash
npm ci
npm run dev
npm run build
node --test tests/adEngine.test.mjs
```

This feature reuses current dependencies. It does not change the app's main routing or existing Creative Hub access rules.

## Future enhancements

Versioned brand kits per client, human approval workflow, Ads Manager campaign metrics, direct content scheduler integration, **actual image-conditioned inference from uploaded style references**, shared server-side reference library, accessibility preflight, custom layout drag handles, and source-backed variant testing can be added incrementally.
