import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, Upload, Sparkles, Copy, RotateCcw, FileJson, Image as ImageIcon, BarChart3, WandSparkles, Layers, Palette, CheckCircle2, AlertCircle, Link2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AD_FORMATS, MCTS_BRAND, STARTER_BRIEF, STARTER_DESIGN, renderCreative, captionDrafts, parseCSV, normalizePosts, analyzePosts } from "./adEngine";

const input = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500";
const label = "block text-xs font-bold tracking-wide text-slate-600 mb-1.5";
const panel = "rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm";
const primaryBtn = "inline-flex items-center justify-center gap-2 rounded-lg bg-[#02343D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#075561] disabled:opacity-50";
const secondaryBtn = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const STORAGE_KEY = "mcts-ad-studio-v1";
const TEMPLATES = [
  { id: "spotlight", name: "Spotlight", detail: "Bold product-first ad" },
  { id: "editorial", name: "Editorial", detail: "Clean storytelling" },
  { id: "offer", name: "Offer", detail: "Promotion-led" },
  { id: "clean", name: "Minimal", detail: "Clear and understated" },
];
const TONES = ["Direct", "Friendly", "Professional", "Playful"];

function loadDraft() {
  try {
    const result = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      brand: { ...MCTS_BRAND, ...result.brand },
      brief: { ...STARTER_BRIEF, ...result.brief },
      design: { ...STARTER_DESIGN, ...result.design },
    };
  } catch {
    return { brand: MCTS_BRAND, brief: STARTER_BRIEF, design: STARTER_DESIGN };
  }
}
function saveFile(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function fileToDataUrl(file, onComplete) {
  if (!file) return;
  if (!file.type.startsWith("image/")) throw Error("Upload a PNG, JPG, or WebP image.");
  if (file.size > 12 * 1024 * 1024) throw Error("Image must be 12 MB or smaller.");
  const reader = new FileReader();
  reader.onload = () => onComplete(String(reader.result || ""));
  reader.onerror = () => onComplete("");
  reader.readAsDataURL(file);
}
function InputField({ name, value, onChange, textarea = false, placeholder, rows = 2 }) {
  return <label className="block"><span className={label}>{name}</span>{textarea
    ? <textarea className={input + " resize-y"} rows={rows} placeholder={placeholder} value={value || ""} onChange={e => onChange(e.target.value)} />
    : <input className={input} placeholder={placeholder} value={value || ""} onChange={e => onChange(e.target.value)} />}</label>;
}
function Switch({ checked, onChange, children }) {
  return <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700"><input type="checkbox" className="accent-teal-600 h-4 w-4" checked={Boolean(checked)} onChange={e => onChange(e.target.checked)} />{children}</label>;
}
function UploadField({ title, description, onFile, accept = "image/png,image/jpeg,image/webp" }) {
  return <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 px-3 py-3 hover:border-teal-500">
    <Upload className="h-5 w-5 text-teal-700" />
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{title}</span><span className="block text-xs text-slate-500">{description}</span></span>
    <input type="file" className="sr-only" accept={accept} onChange={e => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
  </label>;
}
function ColorField({ name, value, onChange }) {
  return <label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={e => onChange(e.target.value)} className="h-9 w-10 rounded border border-slate-200 bg-white p-1" /><span className="min-w-0 truncate">{name}<span className="block font-normal text-slate-500">{value}</span></span></label>;
}

export default function AdStudio() {
  const [initial] = useState(loadDraft);
  const [brand, setBrand] = useState(initial.brand);
  const [brief, setBrief] = useState(initial.brief);
  const [design, setDesign] = useState(initial.design);
  const [photoData, setPhotoData] = useState("");
  const [logoData, setLogoData] = useState("");
  const [photoImage, setPhotoImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [section, setSection] = useState("design");
  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState("Direct");
  const [captions, setCaptions] = useState(() => captionDrafts(initial.brand, initial.brief));
  const [selectedCaption, setSelectedCaption] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState("");
  const [posts, setPosts] = useState([]);
  const [dashboardKey, setDashboardKey] = useState("");
  const [importName, setImportName] = useState("");
  const canvasRef = useRef(null);
  const jsonFileRef = useRef(null);
  const result = useMemo(() => analyzePosts(posts), [posts]);

  const setB = (key, value) => setBrand(prev => ({ ...prev, [key]: value }));
  const setC = (key, value) => setBrief(prev => ({ ...prev, [key]: value }));
  const setD = (key, value) => setDesign(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ brand, brief, design })); } catch { /* Private browsing or storage quota */ }
  }, [brand, brief, design]);

  useEffect(() => {
    let active = true;
    if (!photoData) { setPhotoImage(null); return; }
    const img = new Image();
    img.onload = () => { if (active) setPhotoImage(img); };
    img.onerror = () => { if (active) { setPhotoImage(null); setStatus("Could not load the selected product image."); } };
    img.src = photoData;
    return () => { active = false; };
  }, [photoData]);

  useEffect(() => {
    let active = true;
    if (!logoData) { setLogoImage(null); return; }
    const img = new Image();
    img.onload = () => { if (active) setLogoImage(img); };
    img.onerror = () => { if (active) { setLogoImage(null); setStatus("Could not load the logo."); } };
    img.src = logoData;
    return () => { active = false; };
  }, [logoData]);

  useEffect(() => {
    renderCreative(canvasRef.current, { brand, brief, design, photo: photoImage, logo: logoImage });
  }, [brand, brief, design, photoImage, logoImage]);

  const uploadImage = (file, setter) => {
    try { fileToDataUrl(file, setter); } catch (err) { setStatus(err.message); }
  };
  const savePNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCreative(canvas, { brand, brief, design, photo: photoImage, logo: logoImage });
    canvas.toBlob(blob => {
      if (!blob) { setStatus("Export failed. Try uploading the image directly."); return; }
      const stem = (brand.name || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "brand";
      saveFile(`${stem}-ad-${design.format}${design.transparent ? "-transparent" : ""}.png`, blob);
      setStatus("PNG exported with " + (design.transparent ? "real transparency." : "a solid background."));
    }, "image/png");
  };
  const downloadProject = () => {
    const content = { version: 1, brand, brief, design, photoData, logoData, language, tone, captions };
    saveFile("ad-studio-project.json", new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }));
  };
  const importProject = async (file) => {
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024) throw Error("Project file is too large.");
      const value = JSON.parse(await file.text());
      if (value.version !== 1 || !value.brand || !value.brief || !value.design) throw Error("Unrecognized project file.");
      setBrand({ ...MCTS_BRAND, ...value.brand }); setBrief({ ...STARTER_BRIEF, ...value.brief });
      setDesign({ ...STARTER_DESIGN, ...value.design });
      setPhotoData(typeof value.photoData === "string" && value.photoData.startsWith("data:image/") ? value.photoData : "");
      setLogoData(typeof value.logoData === "string" && value.logoData.startsWith("data:image/") ? value.logoData : "");
      setCaptions(Array.isArray(value.captions) ? value.captions.map(String).slice(0, 3) : captionDrafts(value.brand, value.brief));
      setLanguage(value.language === "Taglish" ? "Taglish" : "English");
      setTone(TONES.includes(value.tone) ? value.tone : "Direct");
      setStatus("Project imported.");
    } catch(err) { setStatus(err.message || "Could not import project."); }
  };
  const generateCaptions = async () => {
    setBusy(true); setStatus("");
    try {
      const perfNote = result.reliable ? `Sample: ${result.count} posts. ${result.metric}. ${result.recommendations.join(" ")}` : "No reliable post analysis available.";
      const prompt = [
        "You are an in-house advertising copywriter. Return exactly three distinct, usable social captions in JSON. Never invent prices, discounts, testimonials, guarantees, deadlines, qualifications, or results. Only use facts explicitly provided. No markdown code fences.",
        `Brand: ${JSON.stringify(brand.name)}. Brand voice: ${JSON.stringify(brand.voice)}. Tone: ${tone}. Language: ${language}.`,
        `Creative brief: ${JSON.stringify(brief)}.`,
        `Observational performance context (do not claim causation): ${perfNote}`,
        "Version 1: direct and minimal; version 2: benefit-led; version 3: conversational. Each should include a truthful CTA and no more than 6 relevant hashtags from the brief. Output {captions: [string,string,string]}.",
      ].join("\n");
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type: "object", properties: { captions: { type: "array", items: { type: "string" } } }, required: ["captions"] },
      });
      const list = (response?.captions || []).filter(x => typeof x === "string" && x.trim()).slice(0, 3);
      if (!list.length) throw Error("No captions were returned.");
      setCaptions(list); setSelectedCaption(0); setStatus("AI caption suggestions are ready. Review all claims before posting.");
    } catch {
      setCaptions(captionDrafts(brand, brief, language)); setSelectedCaption(0);
      setStatus("AI assistance unavailable. Generated three editable rule-based captions instead.");
    } finally { setBusy(false); }
  };
  const generateImage = async () => {
    setBusy(true); setStatus("");
    try {
      const prompt = `Professional advertising product image for ${brand.name}. Subject: ${brief.product}. Intended audience: ${brief.audience}. ${brief.benefit}. Minimal high-end studio treatment, genuine materials, clean composition. Brand palette ${brand.primary} and ${brand.accent}. NO readable words, logos, watermarks, prices, or UI. Do not invent identifiable people or pretend this shows a real product if not provided.`;
      const response = await base44.integrations.Core.GenerateImage({ prompt });
      const url = response?.url;
      if (!url) throw Error("No image returned.");
      // Fetch into a local data URL so canvas export is origin-clean; never draw a tainted URL.
      const fileResponse = await fetch(url, { mode: "cors" });
      if (!fileResponse.ok) throw Error("Cannot fetch image for export.");
      const blob = await fileResponse.blob();
      if (!blob.type.startsWith("image/")) throw Error("Unexpected image format.");
      if (blob.size > 12 * 1024 * 1024) throw Error("Generated image too large.");
      fileToDataUrl(new File([blob], "generated.png", { type: blob.type }), setPhotoData);
      setStatus("Concept image added. Replace with a real product photo for accurate advertising.");
    } catch(err) { setStatus("Image assistance unavailable: " + err.message + " Upload an image instead."); }
    finally { setBusy(false); }
  };
  const importCSV = async file => {
    if (!file) return;
    try {
      if (file.size > 6 * 1024 * 1024) throw Error("CSV must be smaller than 6 MB.");
      const rows = parseCSV(await file.text());
      const normalized = normalizePosts(rows);
      if (!normalized.length) throw Error("No recognizable post rows. Include post text/type and interaction columns.");
      setPosts(normalized); setSource("csv"); setImportName(file.name);
      setStatus(`Read ${normalized.length} post rows from ${file.name}. These are your imported data, not a live Page connection.`);
    } catch(err) { setStatus(err.message); }
  };
  const syncFacebook = async () => {
    if (!dashboardKey.trim()) { setStatus("Enter the server-side dashboard access key to connect."); return; }
    setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/facebook-posts", { headers: { "x-studio-key": dashboardKey }, cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(payload.error || `Connection failed (${response.status})`);
      const normalized = normalizePosts(payload.posts || []);
      if (!normalized.length) throw Error("Page returned no posts.");
      setPosts(normalized); setSource("facebook"); setImportName(payload.page || "Connected Page");
      setStatus(`Synced ${normalized.length} posts from your authorized Page. Facebook fetch does not include post reach in this version; rankings use interaction volume.`);
    } catch(err) { setStatus("Facebook sync: " + err.message + ". CSV import remains available."); }
    finally { setBusy(false); }
  };
  const copyCaption = async () => {
    try { await navigator.clipboard.writeText(captions[selectedCaption] || ""); setStatus("Caption copied."); }
    catch { setStatus("Clipboard blocked. Select the caption text and copy manually."); }
  };
  const reset = () => {
    setBrand(MCTS_BRAND); setBrief(STARTER_BRIEF); setDesign(STARTER_DESIGN);
    setPhotoData(""); setLogoData(""); setCaptions(captionDrafts(MCTS_BRAND, STARTER_BRIEF));
    setStatus("Reset to the editable MCTS starter kit.");
  };

  return <div className="space-y-5">
    <div className="rounded-2xl bg-[#02343D] p-5 text-white md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><div className="text-xs font-bold uppercase tracking-[.22em] text-teal-300">MCTS Creative Hub</div><h2 className="mt-2 text-2xl font-black md:text-3xl">Brand Ad Studio</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-200">Create consistent, on-brand ads, refine captions, and learn from actual Page post performance.</p></div>
        <div className="flex gap-2"><button className="rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10" onClick={downloadProject}><FileJson className="mr-1 inline h-4 w-4" />Save project</button>
          <button className="rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10" onClick={() => jsonFileRef.current?.click()}>Open project</button>
          <input ref={jsonFileRef} className="sr-only" type="file" accept="application/json,.json" onChange={e => { importProject(e.target.files?.[0]); e.target.value = ""; }} /></div>
      </div>
    </div>
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {[["design","Design",Layers],["captions","Captions",WandSparkles],["insights","Facebook Insights",BarChart3]].map(([id,title,Icon])=>
        <button key={id} onClick={()=>setSection(id)} className={`flex min-w-fit flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold ${section===id ? "bg-white text-[#02343D] shadow-sm":"text-slate-600 hover:bg-white/60"}`}><Icon className="h-4 w-4"/>{title}</button>)}
    </div>
    {status && <div role="status" className="flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-[#02343D]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{status}<button className="ml-auto text-xs font-semibold underline" onClick={()=>setStatus("")}>Dismiss</button></div>}
    {section === "design" && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(350px,0.92fr)]">
      <div className="space-y-4">
        <div className={panel}><div className="mb-4 flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-bold text-[#02343D]"><Palette className="h-5 w-5"/>Brand kit</h3><span className="text-xs text-slate-500">Editable / saved locally</span></div>
          <div className="grid gap-3 sm:grid-cols-2"><InputField name="Brand name" value={brand.name} onChange={v=>setB("name",v)}/><InputField name="Tagline" value={brand.tagline} onChange={v=>setB("tagline",v)}/>
            <div><span className={label}>Font family</span><select className={input} value={brand.font} onChange={e=>setB("font",e.target.value)}>{["Montserrat","Inter","Arial","Georgia"].map(x=><option key={x}>{x}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3"><ColorField name="Primary" value={brand.primary} onChange={v=>setB("primary",v)}/><ColorField name="Accent" value={brand.accent} onChange={v=>setB("accent",v)}/></div>
            <div className="grid grid-cols-2 gap-3"><ColorField name="Text" value={brand.text} onChange={v=>setB("text",v)}/><ColorField name="Light BG" value={brand.light} onChange={v=>setB("light",v)}/></div>
            <UploadField title={logoData?"Replace logo":"Upload brand logo"} description="Transparent PNG recommended" onFile={f=>uploadImage(f,setLogoData)}/></div>
          <div className="mt-3"><InputField name="Brand voice rules" textarea value={brand.voice} onChange={v=>setB("voice",v)}/></div>
        </div>
        <div className={panel}><h3 className="mb-4 font-bold text-[#02343D]">Ad content</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField name="Product / service" value={brief.product} onChange={v=>setC("product",v)}/>
            <InputField name="Target audience" value={brief.audience} onChange={v=>setC("audience",v)}/>
            <InputField name="Headline" value={brief.headline} onChange={v=>setC("headline",v)}/>
            <InputField name="Offer or price (optional)" placeholder="Only enter confirmed offers" value={brief.offer} onChange={v=>setC("offer",v)}/>
            <InputField name="Call to action" value={brief.cta} onChange={v=>setC("cta",v)}/>
            <div><span className={label}>Goal</span><select className={input} value={brief.objective} onChange={e=>setC("objective",e.target.value)}>{["Inquiries","Awareness","Sales","Traffic","Engagement","Event registrations"].map(x=><option key={x}>{x}</option>)}</select></div>
            <div className="sm:col-span-2"><InputField name="Benefit / supporting text" textarea value={brief.benefit} onChange={v=>setC("benefit",v)}/></div>
          </div>
        </div>
        <div className={panel}><h3 className="mb-4 font-bold text-[#02343D]">Creative direction</h3>
          <div className="grid gap-2 sm:grid-cols-2">{TEMPLATES.map(t=><button key={t.id} onClick={()=>setD("template",t.id)} className={`rounded-xl border p-3 text-left ${design.template===t.id?"border-teal-600 bg-teal-50 ring-1 ring-teal-600":"border-slate-200 hover:border-teal-300"}`}><div className="text-sm font-bold text-[#02343D]">{t.name}</div><div className="text-xs text-slate-500">{t.detail}</div></button>)}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><div><span className={label}>Canvas size</span><select className={input} value={design.format} onChange={e=>setD("format",e.target.value)}>{Object.entries(AD_FORMATS).map(([id,value])=><option key={id} value={id}>{value.label}</option>)}</select></div>
            <UploadField title={photoData?"Replace image":"Upload product photo"} description="PNG cutouts preserve alpha" onFile={f=>uploadImage(f,setPhotoData)}/></div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
            <Switch checked={design.transparent} onChange={v=>setD("transparent",v)}>Transparent background</Switch>
            <Switch checked={design.showBrand} onChange={v=>setD("showBrand",v)}>Brand/logo</Switch>
            <Switch checked={design.showBenefit} onChange={v=>setD("showBenefit",v)}>Supporting text</Switch>
            <Switch checked={design.showOffer} onChange={v=>setD("showOffer",v)}>Offer</Switch>
            <Switch checked={design.showCta} onChange={v=>setD("showCta",v)}>CTA</Switch>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[["Headline size","headlineSize",62,140],["Image size","imageScale",60,180],["Image left / right","imageShiftX",-150,150],["Image up / down","imageShiftY",-150,150]].map(([name,key,min,max])=><label key={key} className="text-xs font-semibold text-slate-600">{name} · {design[key]}<input className="mt-1 w-full accent-teal-600" type="range" min={min} max={max} value={design[key]} onChange={e=>setD(key,Number(e.target.value))}/></label>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><button className={secondaryBtn} onClick={generateImage} disabled={busy}><Sparkles className="h-4 w-4"/>AI concept image</button>
            {photoData && <button className={secondaryBtn} onClick={()=>setPhotoData("")}>Remove photo</button>}
            {logoData && <button className={secondaryBtn} onClick={()=>setLogoData("")}>Remove logo</button>}</div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">AI concept images are not verified product photos. For cutouts, upload an actual transparent PNG. Logo is always overlaid unchanged.</p>
        </div>
      </div>
      <div className="min-w-0 space-y-4 xl:sticky xl:top-6 xl:self-start"><div className={panel}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-[#02343D]">Live preview</h3><span className="text-xs text-slate-500">{AD_FORMATS[design.format]?.width} × {AD_FORMATS[design.format]?.height}</span></div>
        <div className="mx-auto max-w-lg overflow-hidden rounded-lg border border-slate-200 shadow-sm" style={{backgroundColor:"#E8EEEE",backgroundImage:design.transparent?"linear-gradient(45deg,#cbd5d1 25%,transparent 25%),linear-gradient(-45deg,#cbd5d1 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#cbd5d1 75%),linear-gradient(-45deg,transparent 75%,#cbd5d1 75%)":undefined,backgroundSize:"24px 24px",backgroundPosition:"0 0,0 12px,12px -12px,-12px 0"}}>
          <canvas ref={canvasRef} className="block h-auto w-full" aria-label="Live advertising design preview" role="img"/>
        </div>
        <p className="mt-2 text-xs text-slate-500">{design.transparent?"Checkerboard is preview-only. The exported PNG has a transparent canvas.":"Solid-background preview."} Uploaded images retain their original backgrounds.</p>
        <div className="mt-4 flex flex-wrap gap-2"><button className={primaryBtn} onClick={savePNG}><Download className="h-4 w-4" />Export PNG</button><button className={secondaryBtn} onClick={()=>setSection("captions")}><WandSparkles className="h-4 w-4"/>Write caption</button><button className={secondaryBtn} onClick={reset}><RotateCcw className="h-4 w-4"/>Reset</button></div>
      </div><div className={panel}><h3 className="font-bold text-[#02343D]">Publish checklist</h3><ul className="mt-3 space-y-2 text-sm text-slate-700">
        <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700"/> Confirm offer, pricing and claims.</li>
        <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700"/> Use an original product photo or licensed artwork.</li>
        <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700"/> Check readability on mobile.</li>
        <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700"/> Review captions and CTA before posting.</li>
      </ul></div></div>
    </div>}
    {section === "captions" && <div className="grid gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
      <div className={panel}><h3 className="mb-4 font-bold text-[#02343D]">Caption brief</h3>
        <div className="space-y-3">
          <InputField name="Product or service" value={brief.product} onChange={v=>setC("product",v)}/>
          <InputField name="Primary benefit" textarea value={brief.benefit} onChange={v=>setC("benefit",v)}/>
          <InputField name="Confirmed offer (optional)" value={brief.offer} onChange={v=>setC("offer",v)}/>
          <InputField name="Call to action" value={brief.cta} onChange={v=>setC("cta",v)}/>
          <InputField name="Destination link (optional)" value={brief.link} onChange={v=>setC("link",v)}/>
          <InputField name="Hashtags" value={brief.hashtags} onChange={v=>setC("hashtags",v)}/>
          <div className="grid grid-cols-2 gap-3"><div><span className={label}>Language</span><select className={input} value={language} onChange={e=>setLanguage(e.target.value)}><option>English</option><option>Taglish</option></select></div>
          <div><span className={label}>Tone</span><select className={input} value={tone} onChange={e=>setTone(e.target.value)}>{TONES.map(t=><option key={t}>{t}</option>)}</select></div></div>
          <button className={primaryBtn+" w-full"} disabled={busy} onClick={generateCaptions}><Sparkles className="h-4 w-4"/>{busy?"Working…":"Generate 3 caption options"}</button>
          <button className={secondaryBtn+" w-full"} onClick={()=>{setCaptions(captionDrafts(brand,brief,language));setSelectedCaption(0);setStatus("Generated 3 editable template captions.");}}>Use offline suggestions</button>
          <p className="text-xs text-slate-500">AI assistance uses the application's existing Base44 integration when available. It never publishes content.</p>
        </div>
      </div>
      <div className={panel}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-[#02343D]">Editable caption options</h3><button className={secondaryBtn} onClick={copyCaption}><Copy className="h-4 w-4"/>Copy selected</button></div>
        <div className="mt-4 flex gap-2">{captions.map((_,i)=><button key={i} onClick={()=>setSelectedCaption(i)} className={`rounded-lg px-4 py-2 text-xs font-bold ${i===selectedCaption?"bg-[#02343D] text-white":"bg-slate-100 text-slate-600"}`}>Option {i+1}</button>)}</div>
        <textarea className={input+" mt-4 min-h-[350px] resize-y leading-relaxed"} value={captions[selectedCaption] || ""} onChange={e=>setCaptions(prev=>prev.map((item,i)=>i===selectedCaption?e.target.value:item))}/>
        <div className="mt-3 text-xs text-slate-500">Treat suggestions as drafts. Any referenced post-performance trends are observational, not guaranteed results.</div>
      </div>
    </div>}
    {section === "insights" && <div className="grid gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <div className={panel}><h3 className="flex items-center gap-2 font-bold text-[#02343D]"><BarChart3 className="h-5 w-5"/>Page performance</h3>
          <p className="mt-2 text-sm text-slate-600">Compare posts from a Page you manage. Analyze hooks, captions, content types and interactions before choosing a creative direction.</p>
          <div className="mt-4 space-y-3">
            <InputField name="Facebook Page URL (reference only)" value={brand.pageUrl} placeholder="https://www.facebook.com/yourpage" onChange={v=>setB("pageUrl",v)}/>
            <UploadField title="Import Meta insights CSV" description="Works now. Export post-level performance from Meta Business Suite." accept=".csv,text/csv,text/plain" onFile={importCSV}/>
          </div><p className="mt-3 text-xs text-slate-500">The Page URL alone does not grant data access. The CSV method uses only the file you provide.</p>
        </div>
        <div className={panel}><h3 className="flex items-center gap-2 font-bold text-[#02343D]"><Link2 className="h-5 w-5"/>Authorized Facebook connection</h3>
          <p className="mt-2 text-sm text-slate-600">If the server endpoint is deployed and configured with your own Page access token, import recent Page posts directly.</p>
          <div className="mt-3"><label className={label} htmlFor="ad-studio-key">Dashboard access key (not a Facebook token)</label><input id="ad-studio-key" className={input} type="password" autoComplete="off" value={dashboardKey} onChange={e=>setDashboardKey(e.target.value)} placeholder="Access key configured on the server"/></div>
          <button className={primaryBtn+" mt-3"} disabled={busy} onClick={syncFacebook}><RefreshCw className="h-4 w-4"/>Sync my Page</button>
          <p className="mt-3 text-xs text-slate-500">Page tokens stay on the server; this app does not store the access key. Requires Page permissions and a configured serverless backend. See setup instructions in GitHub.</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className={panel}><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-[#02343D]">Performance review</h3><span className="text-xs text-slate-500">{source==="facebook"?"Live import":source==="csv"?"CSV import":"No data"}</span></div>
          {!posts.length ? <div className="py-12 text-center"><BarChart3 className="mx-auto h-10 w-10 text-slate-300"/><p className="mt-3 text-sm text-slate-500">Import your Facebook Page results to see what performed well and what needs testing.</p></div> :
          <><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Posts analyzed</div><div className="mt-1 text-3xl font-black text-[#02343D]">{result.count}</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Median {result.useRate?"rate":"interactions"}</div><div className="mt-1 text-3xl font-black text-[#02343D]">{result.median.toFixed(result.useRate?2:0)}{result.useRate?"%":""}</div></div></div>
            <p className="mt-3 text-xs text-slate-500">{result.metric} · Source: {importName}. {result.reliable?"Pattern analysis enabled.":"Fewer than five posts: directional comparison only."}</p>
            <h4 className="mt-5 text-sm font-bold text-[#02343D]">Format breakdown</h4>
            <div className="mt-2 space-y-3">{result.formats.slice(0,6).map((f,i)=><div key={i}><div className="flex justify-between gap-3 text-xs text-slate-700"><span>{f.type} ({f.count})</span><span>{f.average.toFixed(result.useRate?2:0)}{result.useRate?"%":""} avg</span></div><div className="mt-1 h-2 rounded bg-slate-100"><div className="h-2 rounded bg-teal-500" style={{width:`${Math.max(2,(f.average/(result.formats[0]?.average||1))*100)}%`}}/></div></div>)}</div>
            <h4 className="mt-5 text-sm font-bold text-[#02343D]">Strongest posts in sample</h4>
            <div className="mt-2 space-y-2">{result.ranked.slice(0,3).map((p,i)=><div key={p.id+"-"+i} className="rounded-lg border border-slate-200 p-3"><p className="text-xs font-bold text-teal-700">{p.type} · {p.score.toFixed(result.useRate?2:0)}{result.useRate?"%":" interactions"}</p><p className="mt-1 line-clamp-3 text-sm text-slate-700">{p.message || "(No post text)"}</p></div>)}</div>
            <h4 className="mt-5 text-sm font-bold text-[#02343D]">Posts to review</h4>
            <div className="mt-2 space-y-2">{result.ranked.slice(-Math.min(2,result.count)).reverse().map((p,i)=><div key={p.id+"-low-"+i} className="rounded-lg border border-slate-200 p-3"><p className="text-xs font-bold text-slate-500">{p.type} · {p.score.toFixed(result.useRate?2:0)}{result.useRate?"%":" interactions"}</p><p className="mt-1 line-clamp-3 text-sm text-slate-700">{p.message || "(No post text)"}</p></div>)}</div>
          </>}
        </div>
        {result.recommendations.length > 0 && <div className={panel}><h3 className="font-bold text-[#02343D]">What to test next</h3><div className="mt-3 space-y-3">{result.recommendations.map((v,i)=><p key={i} className="border-l-2 border-teal-500 pl-3 text-sm text-slate-700">{v}</p>)}</div></div>}
        <div className={panel}><h3 className="font-bold text-[#02343D]">How to interpret this</h3><p className="mt-2 text-sm text-slate-600">Reach-normalized rates are used only when every imported post includes reach. Otherwise the app compares raw interaction volume and labels that limitation. It does not estimate sales, ROAS, or ad effectiveness from organic post interactions.</p></div>
      </div>
    </div>}
  </div>;
}
