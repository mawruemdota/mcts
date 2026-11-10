// Client-only design and analysis helpers. No tokens or network calls here.
export const AD_FORMATS = {
  square: { label: "Square · 1080 × 1080", width: 1080, height: 1080 },
  portrait: { label: "Feed · 1080 × 1350", width: 1080, height: 1350 },
  story: { label: "Story · 1080 × 1920", width: 1080, height: 1920 },
  landscape: { label: "Landscape · 1200 × 628", width: 1200, height: 628 },
};

export const MCTS_BRAND = {
  name: "MCTS",
  tagline: "Marasigan Creatives & Tech Solutions",
  voice: "Confident, concise, approachable. Natural English or Taglish. No exaggerated claims.",
  primary: "#02343D",
  accent: "#20B7B0",
  text: "#FFFFFF",
  light: "#F2F7F6",
  font: "Montserrat",
  pageUrl: "",
};

export const STARTER_BRIEF = {
  product: "Custom printing & creative solutions",
  audience: "Businesses, events, and creators",
  objective: "Inquiries",
  headline: "MAKE IT YOURS.",
  benefit: "Print, branding, and event-ready creative work.",
  offer: "",
  cta: "MESSAGE US",
  details: "",
  hashtags: "#MCTS #CustomPrinting #CreativeSolutions",
  link: "",
};

export const STARTER_DESIGN = {
  format: "portrait",
  template: "spotlight",
  transparent: false,
  showBrand: true,
  showBenefit: true,
  showCta: true,
  showOffer: true,
  imageScale: 100,
  imageFit: "contain",
  imageShiftX: 0,
  imageShiftY: 0,
  headlineSize: 100,
};

export const hexColor = (hex, fallback) => /^#[0-9a-f]{6}$/i.test(hex || "") ? hex : fallback;
const clip = (value, a, b) => Math.min(b, Math.max(a, Number(value) || 0));
const fontFamily = name => ({Montserrat: "'Montserrat', Arial, sans-serif", Arial: "Arial, sans-serif", Georgia: "Georgia, serif", Inter: "Inter, Arial, sans-serif"})[name] || "Arial, sans-serif";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

function coverImage(ctx, img, x, y, w, h, scale = 100, dx = 0, dy = 0) {
  if (!img?.naturalWidth || !img?.naturalHeight) return;
  const factor = Math.max(w / img.naturalWidth, h / img.naturalHeight) * clip(scale, 60, 180) / 100;
  const iw = img.naturalWidth * factor, ih = img.naturalHeight * factor;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(img, x + (w - iw) / 2 + dx, y + (h - ih) / 2 + dy, iw, ih);
  ctx.restore();
}

function containImage(ctx, img, x, y, w, h) {
  if (!img?.naturalWidth || !img?.naturalHeight) return;
  const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

function lines(ctx, text, maxWidth, maxLines = 5) {
  const result = [];
  for (const paragraph of String(text || "").split("\n")) {
    if (!paragraph.trim()) continue;
    let line = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      const next = line ? line + " " + word : word;
      if (line && ctx.measureText(next).width > maxWidth) {
        result.push(line);
        line = word;
      } else line = next;
    }
    if (line) result.push(line);
  }
  if (result.length > maxLines) {
    const trimmed = result.slice(0, maxLines);
    let tail = trimmed[maxLines - 1] + "…";
    while (tail.length > 1 && ctx.measureText(tail).width > maxWidth) tail = tail.slice(0, -2) + "…";
    trimmed[maxLines - 1] = tail;
    return trimmed;
  }
  return result;
}

function writeLines(ctx, text, x, top, maxWidth, fontSize, color, options = {}) {
  const { weight = 700, family = "Arial, sans-serif", lineHeight = 1.09, maxLines = 4, align = "left" } = options;
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${weight} ${fontSize}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  const items = lines(ctx, text, maxWidth, maxLines);
  items.forEach((line, index) => ctx.fillText(line, x, top + index * fontSize * lineHeight));
  ctx.restore();
  return items.length * fontSize * lineHeight;
}

export function renderCreative(canvas, { brand, brief, design, photo, logo }) {
  if (!canvas) return;
  const fmt = AD_FORMATS[design.format] || AD_FORMATS.portrait;
  canvas.width = fmt.width; canvas.height = fmt.height;
  const ctx = canvas.getContext("2d", { alpha: true });
  const W = fmt.width, H = fmt.height, k = Math.min(W / 1080, H / 1080);
  const px = v => Math.round(v * k);
  const primary = hexColor(brand.primary, "#02343D");
  const accent = hexColor(brand.accent, "#20B7B0");
  const text = hexColor(brand.text, "#FFFFFF");
  const light = hexColor(brand.light, "#F2F7F6");
  const family = fontFamily(brand.font);
  const margin = Math.max(42, px(76));
  const mode = design.template;
  ctx.clearRect(0, 0, W, H);

  if (!design.transparent) {
    ctx.fillStyle = mode === "clean" ? light : primary;
    ctx.fillRect(0, 0, W, H);
  }

  // Product imagery remains untouched. A transparent upload retains its original alpha.
  const artX = mode === "editorial" ? W * .08 : mode === "offer" ? W * .10 : W * .53;
  const artY = mode === "editorial" ? H * .49 : mode === "offer" ? H * .53 : H * .19;
  const artW = mode === "editorial" || mode === "offer" ? W * .84 : W * .42;
  const artH = mode === "editorial" ? H * .33 : mode === "offer" ? H * .29 : H * .56;

  if (photo) {
    if (!design.transparent) {
      ctx.save();
      ctx.fillStyle = mode === "clean" ? "#E0ECEA" : "rgba(255,255,255,.07)";
      roundRect(ctx, artX, artY, artW, artH, px(25)); ctx.fill();
      ctx.restore();
    }
    if (design.imageFit === "cover") {
      coverImage(ctx, photo, artX, artY, artW, artH, design.imageScale, px(design.imageShiftX), px(design.imageShiftY));
    } else {
      const factor = Math.min(artW / photo.naturalWidth, artH / photo.naturalHeight) * clip(design.imageScale, 60, 180) / 100;
      const dw = photo.naturalWidth * factor, dh = photo.naturalHeight * factor;
      ctx.drawImage(photo, artX + (artW - dw) / 2 + px(design.imageShiftX), artY + (artH - dh) / 2 + px(design.imageShiftY), dw, dh);
    }
  } else if (!design.transparent && mode !== "clean") {
    // Deliberate graphic accent instead of inventing a product photo.
    ctx.save();
    ctx.strokeStyle = accent; ctx.globalAlpha = .50; ctx.lineWidth = px(3);
    ctx.beginPath(); ctx.arc(artX + artW / 2, artY + artH / 2, Math.min(artW, artH) * .37, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(artX + artW / 2, artY + artH / 2, Math.min(artW, artH) * .23, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  const ink = mode === "clean" && !design.transparent ? primary : text;
  const isWide = W / H > 1.45;
  const top = isWide ? H * .22 : H * .27;
  const available = isWide ? W * .48 : (mode === "spotlight" || mode === "clean") ? W * .53 : W - margin * 2;
  const headline = String(brief.headline || brief.product || "YOUR HEADLINE").trim();
  const titleTop = mode === "editorial" || mode === "offer" ? H * .22 : top;
  const headlineSize = px(clip(design.headlineSize, 62, 140) * (isWide ? .88 : 1));
  const titleHeight = writeLines(ctx, headline, margin, titleTop, available, headlineSize, ink, {
    weight: 800, family, lineHeight: 1.02, maxLines: 4,
  });

  if (mode === "editorial" && !design.transparent) {
    ctx.fillStyle = accent;
    ctx.fillRect(margin, H * .155, W * .14, px(6));
  }
  const shouldShowBenefit = design.showBenefit && brief.benefit;
  const benefitY = Math.min(titleTop + titleHeight + px(35), mode === "offer" || mode === "editorial" ? H * .44 : H * .72);
  if (shouldShowBenefit) {
    writeLines(ctx, brief.benefit, margin, benefitY, available, px(isWide ? 28 : 32), ink, {
      weight: 500, family, lineHeight: 1.27, maxLines: 3,
    });
  }

  if (design.showOffer && brief.offer) {
    ctx.save();
    ctx.fillStyle = accent;
    const offerY = mode === "spotlight" || mode === "clean" ? H * .73 : H * .13;
    ctx.font = `700 ${px(29)}px ${family}`;
    const label = brief.offer.slice(0, 75);
    const pillWidth = Math.min(W - margin * 2, ctx.measureText(label).width + px(44));
    roundRect(ctx, margin, offerY, pillWidth, px(63), px(12)); ctx.fill();
    ctx.fillStyle = primary; ctx.textBaseline = "middle";
    ctx.fillText(label, margin + px(22), offerY + px(31));
    ctx.restore();
  }

  if (design.showBrand) {
    if (logo) containImage(ctx, logo, margin, px(55), px(130), px(106));
    else writeLines(ctx, brand.name || "YOUR BRAND", margin, px(75), W * .63, px(36), ink, { weight: 800, family, maxLines: 1 });
    if (brand.tagline && !logo && !isWide) writeLines(ctx, brand.tagline, margin, px(125), W * .72, px(21), ink, { weight: 500, family, maxLines: 2 });
  }

  if (design.showCta && brief.cta) {
    const cta = String(brief.cta).slice(0, 48);
    const bY = H - Math.max(px(132), H * .105);
    ctx.save();
    ctx.font = `800 ${px(isWide ? 28 : 31)}px ${family}`;
    const boxW = Math.min(W - margin * 2, ctx.measureText(cta).width + px(64));
    ctx.fillStyle = accent;
    roundRect(ctx, margin, bY, boxW, px(76), px(15)); ctx.fill();
    ctx.fillStyle = primary; ctx.textBaseline = "middle";
    ctx.fillText(cta, margin + px(32), bY + px(38));
    ctx.restore();
  }

  // Fine rule as a final editorial detail; never paint an opaque full-area background in transparency mode.
  ctx.fillStyle = accent;
  ctx.fillRect(W - margin - px(72), H - px(75), px(72), px(6));
}

function clean(value) { return String(value || "").trim(); }
function tags(input) {
  const all = clean(input).split(/[\s,]+/).map(t => t.replace(/[^#\p{L}\p{N}_]/gu, "")).filter(Boolean);
  return [...new Set(all.map(t => t.startsWith("#") ? t : "#" + t))].slice(0, 8).join(" ");
}
export function captionDrafts(brand, brief, language = "English") {
  const product = clean(brief.product) || "our work";
  const benefit = clean(brief.benefit);
  const offer = clean(brief.offer);
  const cta = clean(brief.cta) || "Message us to inquire";
  const suffix = tags(brief.hashtags);
  const isTaglish = language === "Taglish";
  const end = [cta, brief.link && clean(brief.link), suffix].filter(Boolean).join("\n");
  const sentence = [benefit, offer].filter(Boolean).join("\n");
  return [
    [clean(brief.headline) || product, sentence, end].filter(Boolean).join("\n\n"),
    [isTaglish ? `Looking for ${product}? Tara, usap tayo.` : `Looking for ${product}?`,
      sentence || (isTaglish ? "Tell us what you have in mind." : "Tell us about your project."),
      end].filter(Boolean).join("\n\n"),
    [isTaglish ? `Your idea, your style. ${product}.` : `Make space for ${product}.`,
      benefit, offer, end].filter(Boolean).join("\n\n"),
  ];
}

export function parseCSV(raw) {
  const text = String(raw || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); if (row.some(v => v.trim())) rows.push(row);
      row = []; cell = "";
    } else cell += ch;
  }
  row.push(cell); if (row.some(v => v.trim())) rows.push(row);
  if (!rows.length) return [];
  if (/^sep=/i.test(rows[0][0] || "")) rows.shift();
  const header = rows.shift().map(v => v.toLowerCase().replace(/[^a-z0-9]+/g, ""));
  return rows.map(cells => Object.fromEntries(header.map((col, index) => [col, cells[index] || ""])));
}

const field = (row, aliases) => {
  for (const key of aliases) if (row[key] !== undefined && row[key] !== "") return row[key];
  return "";
};
const count = value => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value || "").replace(/[,\s]/g, "");
  return /^(\d+(\.\d+)?)(k|m)$/i.test(raw) ? Number(RegExp.$1) * (RegExp.$3.toLowerCase() === "k" ? 1e3 : 1e6) : Math.max(0, Number(raw) || 0);
};
export function normalizePosts(inputRows = []) {
  return inputRows.map((row, index) => {
    const message = clean(field(row, ["message", "postmessage", "description", "caption", "text", "posttext", "title"]));
    const type = clean(field(row, ["posttype", "contenttype", "mediatype", "type", "format"])) || "Unknown";
    const reachRaw = field(row, ["reach", "postreach", "people reached", "people reached".replace(/[^a-z0-9]/g,""), "organicreach"]);
    const reach = count(reachRaw);
    const reactions = count(field(row, ["reactions", "postreactions", "likes", "reactionscount", "totalreactions"]));
    const comments = count(field(row, ["comments", "commentcount", "postcomments"]));
    const shares = count(field(row, ["shares", "sharecount", "postshares"]));
    const clicks = count(field(row, ["clicks", "linkclicks", "postclicks"]));
    const provided = field(row, ["engagement", "engagements", "postengagements", "interactions", "contentinteractions"]);
    const engagement = provided !== "" ? count(provided) : reactions + comments + shares + clicks;
    const date = clean(field(row, ["createdtime", "createdat", "publishdate", "publisheddate", "date", "published"]));
    const id = clean(field(row, ["postid", "id", "permalink", "posturl"])) || `import-${index + 1}`;
    return { id, message, type, reach, hasReach: reachRaw !== "" && reach > 0, reactions, comments, shares, clicks, engagement, date };
  }).filter(post => post.message || post.engagement || post.date || post.type !== "Unknown");
}

const median = numbers => {
  const a = [...numbers].sort((x,y)=>x-y);
  return a.length ? (a[Math.floor((a.length-1)/2)] + a[Math.floor(a.length/2)])/2 : 0;
};

export function analyzePosts(posts = []) {
  const usable = posts.filter(p => Number.isFinite(p.engagement));
  const comparable = usable.filter(p => p.hasReach && p.reach > 0);
  // When some posts lack reach, use interaction volume for EVERY post to keep the comparison consistent.
  const useRate = comparable.length === usable.length && usable.length > 0;
  const scored = usable.map(p => ({ ...p, score: useRate ? 100 * p.engagement / p.reach : p.engagement }));
  const ranked = [...scored].sort((a,b) => b.score - a.score);
  const med = median(scored.map(p => p.score));
  const group = new Map();
  scored.forEach(p => {
    const key = p.type.toLowerCase();
    const item = group.get(key) || { type: p.type, score: 0, count: 0 };
    item.score += p.score; item.count++;
    group.set(key, item);
  });
  const formats = [...group.values()].map(x=>({...x, average: x.score/x.count})).sort((a,b)=>b.average-a.average);
  const reliable = scored.length >= 5;
  const recommendations = [];
  if (reliable && formats.length >= 2 && formats[0].count >= 2) {
    recommendations.push(`${formats[0].type} currently leads by average ${useRate ? "engagement per reach" : "interaction volume"} in this sample. Test another version rather than assuming format caused the result.`);
  }
  if (reliable) {
    const top = ranked.slice(0, Math.max(2, Math.ceil(ranked.length/3)));
    const topLength = median(top.map(p=>p.message.length).filter(Boolean));
    const bottom = ranked.slice(-Math.max(2, Math.ceil(ranked.length/3)));
    const lowLength = median(bottom.map(p=>p.message.length).filter(Boolean));
    if (topLength && lowLength && Math.abs(topLength-lowLength)>50) {
      recommendations.push(topLength < lowLength ? "Shorter captions appear in stronger posts. Test a concise hook." : "Longer captions appear in stronger posts. Test a more descriptive explanation.");
    }
    recommendations.push("Compare posts with similar spend and distribution before making campaign decisions.");
  }
  return { count: scored.length, useRate, median: med, ranked, formats, reliable, recommendations, metric: useRate ? "Engagement / reach (%)" : "Total interactions (not reach-normalized)" };
}
