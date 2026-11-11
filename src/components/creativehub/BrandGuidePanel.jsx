import React from "react";
import { BookOpen, Lock, Unlock, Upload, X, CheckCircle2, AlertTriangle, ImagePlus } from "lucide-react";
import { MCTS_GUIDE, MCTS_PALETTE, MCTS_STYLE_REFERENCES } from "./mctsBrandGuide";

const palette = [
  ["Signature blue", "primary"],
  ["White", "white"],
  ["Periwinkle", "accent"],
  ["Deep navy", "dark"],
  ["Cool off-white", "light"],
];

export default function BrandGuidePanel({
  locked, onLocked, styleNotes, onStyleNotes,
  references, onAddReferences, onRemoveReference,
}) {
  return <div className="space-y-5">
    <div className="rounded-2xl border border-blue-100 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="flex items-center gap-2 text-lg font-black text-[#172851]"><BookOpen className="h-5 w-5"/>MCTS Brand Guide <span className="text-xs font-semibold text-slate-400">v0.1</span></div>
          <p className="mt-2 text-sm text-slate-600">Brand colors stay recognizable. Future style references may change the look, layout and illustrative approach, not the official identity.</p></div>
        <button onClick={() => onLocked(!locked)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-[#2355E5]">
          {locked ? <Lock className="h-4 w-4"/> : <Unlock className="h-4 w-4"/>}
          {locked ? "Brand colors locked" : "Brand colors unlocked"}
        </button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {palette.map(([name,key])=><div key={key} className="min-w-0 overflow-hidden rounded-xl border border-slate-200">
          <div className="h-20" style={{backgroundColor:MCTS_PALETTE[key]}} />
          <div className="p-2"><div className="truncate text-xs font-bold text-[#172851]">{name}</div><code className="text-xs text-slate-500">{MCTS_PALETTE[key]}</code></div>
        </div>)}
      </div>
      <p className="mt-3 text-xs text-slate-500">Colors sampled from the uploaded JPEG advertisements; these are working values pending verification against the original design files.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-[#F5F8FC] p-4">
          <h3 className="text-sm font-bold text-[#172851]">Never change automatically</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">{MCTS_GUIDE.nonNegotiables.slice(0,6).map(v=><li key={v} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2355E5]"/>{v}</li>)}</ul>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-[#172851]">Can change with a reference</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">Art direction, image composition, photography vs. vector, pixel-art treatment, character poses, typography treatment, badge shapes, spacing, decorative patterns and layout hierarchy.</p>
          <h4 className="mt-4 text-sm font-bold text-[#172851]">Type and copy</h4>
          <p className="mt-2 text-sm text-slate-700">Proposed rounded geometric heading font: Poppins ExtraBold or a close equivalent. Body: Poppins or Montserrat. Natural English and Taglish. A recurring reference CTA is “Message mo na kami!”</p>
        </div>
      </div>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      <h3 className="text-lg font-black text-[#172851]">Reference library</h3>
      <p className="mt-1 text-sm text-slate-600">The three reference ads define these initial composition families. Upload reference files below for a campaign's next art direction.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {MCTS_STYLE_REFERENCES.map(ref=><div key={ref.id} className="rounded-xl border border-slate-200 p-4">
          <div className="mb-2 h-1.5 w-12 rounded bg-[#2355E5]"/>
          <h4 className="text-sm font-bold text-[#172851]">{ref.title}</h4>
          <p className="mt-1 text-xs font-medium text-[#2355E5]">{ref.category}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">{ref.visualStructure}</p>
          <p className="mt-2 text-xs text-slate-400">{ref.sourceName}</p>
        </div>)}
      </div>
      <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-blue-300 bg-blue-50 p-4 hover:bg-blue-100">
        <ImagePlus className="h-6 w-6 text-[#2355E5]"/>
        <span className="flex-1 text-sm font-semibold text-[#172851]">Add your style reference images <span className="block text-xs font-normal text-slate-500">Up to 6 images, max 2 MB each. Included in exported project JSON, not automatically uploaded.</span></span>
        <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={e=>{onAddReferences(e.target.files);e.target.value="";}}/>
      </label>
      {references.length>0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{references.map((ref,i)=><div key={i} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <img src={ref.data} alt={ref.name} className="aspect-square w-full object-cover"/>
        <button aria-label={`Remove ${ref.name}`} onClick={()=>onRemoveReference(i)} className="absolute right-2 top-2 rounded-full bg-white p-1 text-slate-700 shadow"><X className="h-4 w-4"/></button>
        <p className="truncate p-2 text-xs text-slate-600">{ref.name}</p>
      </div>)}</div>}
      <label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold tracking-wide text-slate-600">How should the next ad look?</span>
        <textarea value={styleNotes} onChange={e=>onStyleNotes(e.target.value)} rows={4} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Example: Make this like a playful illustrated campaign with floating characters, but retain MCTS royal blue and white. Keep the original product unchanged."/>
      </label>
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0"/>Existing Base44 image generation reads the written style notes, not the pixels of these uploaded references. True reference-image-conditioned generation requires a connected image-editing backend (such as ComfyUI). Uploaded images here are for your brief and saved project.</div>
    </div>
  </div>;
}
