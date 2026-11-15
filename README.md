# MCTS Social Studio — clean GitHub Pages edition

This is the dedicated **Social Studio** website served directly from the `gh-pages` branch of `mawruemdota/mcts`. This publishing branch has **no MCTS business management code, Base44 SDK, payroll, invoices, or unrelated assets**. Its source is plain HTML, CSS and JavaScript with no build requirement.

The original `main` branch is deliberately preserved because it contains an existing business-management application. The independent Pages branch is the safe separation; do not delete `main` unless you intentionally want to retire that original application.

## Start / publish

1. In GitHub go to `mawruemdota/mcts` → **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose branch **`gh-pages`**, folder **`/(root)`**, then **Save**.
4. GitHub should serve the site at `https://mawruemdota.github.io/mcts/` after Pages is enabled and its deployment finishes.

The URL is the intended GitHub Pages URL. It is not evidence of successful activation until Settings → Pages or a real site check confirms publication.

This branch includes `.nojekyll` so the static HTML and ES module files can be served directly. No npm installation, compilation, GitHub Actions build, or JavaScript keys are needed.

## Working features (no server required)

- Upload up to eight PNG/JPG/WebP product photographs (5 MB max each); choose a featured image.
- Upload the official brand logo, with up to six additional style reference images per project.
- Create **four original layout compositions** with an accurate, unaltered product photograph using the Canvas engine. Choose a layout, update text, and download PNG.
- Select square, portrait, story, or landscape dimensions, and export real transparency outside designed elements.
- Brand guide fixed to the reference-derived royal-blue and white palette.
- Generate three editable **template-driven** English/Taglish caption options from user-entered facts (no invented offers).
- Save and reopen projects in browser IndexedDB, including uploaded images and a thumbnail; mark a project approved.
- Add dates to approved projects as **manual posting plans**; these dates do NOT trigger automatic publishing.
- Import Meta post-performance CSV in the browser to compare engagement volume or, when all posts include positive reach, engagement / reach.

No cloud sync, sign-in or cross-device synchronization is included; projects remain on the current browser/device, and clearing site data may erase them. Export the downloaded PNGs and keep copies of important source photos.

## What it deliberately DOES NOT claim

GitHub Pages is static hosting. It **cannot** safely host private access tokens, perform background jobs, or run GPU models. This MVP **does not**:
- Create AI-synthesized scenes or perform image-to-image reasoning over reference uploads.
- Auto-post or schedule Facebook / Instagram posts.
- Access live private Facebook Page Insights, or store social account credentials.
- Use the uploaded reference images as model inputs.

Four generated ad samples are distinct **deterministic visual layouts**, not four neural-network image generations. The `preserve product` toggle makes the behavior explicit; photo pixels are drawn without AI alterations in both settings.

## Backend plan (later phases)

1. Run ComfyUI and an appropriately licensed image-editing model on a GPU service.
2. Provide a secure upload / generation job endpoint behind authenticated serverless functions. Upload product photos/references and retrieve four generated scenes. Keep scene artwork separate from exact logo/headline/offer overlays.
3. Add database auth and storage, ideally Supabase, for cross-device saved projects, brand kits, campaign history and review permissions.
4. Add Meta OAuth, Page-scoped permissions, media hosting, scheduled worker and publication receipts. Require approved status and audit logs before posting.
5. Add data ingestion for authorized Meta insights and performance reports.

Only after a real backend is operational should the UI offer automatic publishing or claim image-model inference.

## Brand system

Working JPEG-estimated palette:
- Royal blue `#2355E5`
- White `#FFFFFF`
- Periwinkle `#8CA0E3`
- Navy `#172851`
- Off-white `#F5F8FC`

Typography direction: rounded geometric headings (Poppins-like) and legible body. Brand examples: product showcase, handheld sticker photo, three-column illustrated services. Official logo master and exact color specifications should be approved before print.

## File layout

```text
gh-pages/
  index.html       Single-page workspace shell
  styles.css       Responsive design system
  app.js           UI, local projects, editing and planning
  engine.mjs       Brand rules, layouts and caption helpers
  favicon.svg      Site icon (letter mark, not official logo)
  .nojekyll        Disable Jekyll for direct static assets
  tests/engine.test.mjs  Pure JS regression checks
  README.md
```

Run locally with `python3 -m http.server 8000` or another static HTTP server from this branch; do not open `file://` because ES module import rules vary.

Check JS syntax with `node --check app.js && node --check engine.mjs` and run `node --test tests/engine.test.mjs`.

## Safety and privacy

- Never commit Page tokens, Instagram tokens, API keys, passwords, or sensitive customer data to this public branch.
- GitHub Pages websites are public. IndexedDB is per-browser but does not provide an authentication boundary; only upload content you are comfortable using on that device.
- Image uploads and CSV analysis happen locally in the browser. There are no network calls in the app JavaScript.
- A professional publishing integration needs a secure separate backend with role controls and Meta authorization.
