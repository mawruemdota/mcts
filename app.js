import {BRAND, FORMATS, LAYOUTS, STARTER, COLOR_RULES, makeCaptions, renderAd} from "./engine.mjs";
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const viewNames={home:"Overview",create:"Create advertisements",library:"Content library",queue:"Posting queue",brand:"Brand guide",insights:"Insights"};
const clone=x=>JSON.parse(JSON.stringify(x));
let state={brief:clone(STARTER),photos:[],featured:0,references:[],logo:null,chosen:"showcase",generated:false,transparent:false,preserve:true,captions:makeCaptions(STARTER),captionIndex:0,caption:makeCaptions(STARTER)[0],id:null};
let projects=[],activeView="create",drawTimer=null,toastTimer=null,renderCounter=0;
const imageCache=new Map();
function notify(message){const el=$("#toast");el.textContent=message;el.classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("visible"),4500);}
function imageFromData(data){if(!data)return Promise.resolve(null);if(imageCache.has(data))return imageCache.get(data);const p=new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=data;});imageCache.set(data,p);return p;}
const jpgFormats=new Set(["image/jpeg","image/png","image/webp","image/svg+xml"]);
const imageToData=file=>new Promise((resolve,reject)=>{
  if(!jpgFormats.has(file.type))return reject(Error("Please choose a PNG, JPG, WebP or SVG image."));
  if(file.size>5*1024*1024)return reject(Error("Each image must be 5 MB or smaller."));
  const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error("Could not read the file."));reader.readAsDataURL(file);
});
function updateForms(){
  $$("[data-brief]").forEach(input=>{const name=input.dataset.brief;input.value=state.brief[name]??"";});
  $("#preserve-product").checked=state.preserve;
  $("#transparent-toggle").checked=state.transparent;
  $("#output-dimensions").textContent=`${FORMATS[state.brief.format]?.width||1080} × ${FORMATS[state.brief.format]?.height||1080}`;
  updateAssets();updateReferences();updateCaptionTabs();
}
function showView(view){
  activeView=view;$$(".view").forEach(v=>{v.hidden=v.id!==`view-${view}`;v.classList.toggle("active",!v.hidden);});
  $$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $("#page-title").textContent=viewNames[view]||view;
  $("#sidebar").classList.remove("open");
  if(view==="home")renderStats();
  if(view==="library")renderLibrary();
  if(view==="queue")renderQueue();
  window.scrollTo({top:0,behavior:"instant"});
}
function updateAssets(){
  const grid=$("#asset-grid");grid.replaceChildren();
  state.photos.forEach((asset,i)=>{
    const tile=document.createElement("button");tile.type="button";tile.className="asset-tile "+(i===state.featured?"featured":"");
    tile.title="Use as featured photo";tile.setAttribute("aria-label",`Make ${asset.name} the featured photo`);
    const img=document.createElement("img");img.src=asset.data;img.alt=asset.name;tile.append(img);
    if(i===state.featured){const badge=document.createElement("span");badge.className="tile-tag";badge.textContent="Featured";tile.append(badge);}
    tile.addEventListener("click",()=>{state.featured=i;updateAssets();scheduleDraw();});
    const del=document.createElement("button");del.type="button";del.className="asset-remove";del.textContent="×";del.setAttribute("aria-label",`Remove ${asset.name}`);
    del.addEventListener("click",e=>{e.stopPropagation();state.photos.splice(i,1);state.featured=Math.min(state.featured,Math.max(0,state.photos.length-1));updateAssets();scheduleDraw();});
    const box=document.createElement("div");box.style.position="relative";box.append(tile,del);grid.append(box);
  });
  const logo=$(".mini-upload small");if(logo)logo.textContent=state.logo?state.logo.name:"Use your official PNG/SVG";
}
function updateReferences(){
  const box=$("#reference-list");box.replaceChildren();
  state.references.forEach((ref,i)=>{
    const item=document.createElement("span");item.className="reference-chip";
    const name=document.createElement("span");name.textContent=ref.name.length>25?ref.name.slice(0,22)+"…":ref.name;
    const remove=document.createElement("button");remove.type="button";remove.textContent="×";remove.setAttribute("aria-label",`Remove reference ${ref.name}`);
    remove.addEventListener("click",()=>{state.references.splice(i,1);updateReferences();});
    item.append(name,remove);box.append(item);
  });
}
async function addImages(files,field,max){
  let added=0;
  for(const file of [...files].slice(0,max)){
    if(state[field].length>=max)break;
    try{const data=await imageToData(file);state[field].push({name:file.name,data});added++;}
    catch(e){notify(e.message);}
  }
  if(added)notify(`${added} image${added===1?"":"s"} added.`);
  updateAssets();updateReferences();scheduleDraw();
}
async function loadLogo(file){
  if(!file)return;try{state.logo={name:file.name,data:await imageToData(file)};updateAssets();scheduleDraw();notify("Official logo loaded.");}catch(e){notify(e.message);}
}
function makeSampleGrid(){
  const box=$("#sample-grid");box.replaceChildren();
  LAYOUTS.forEach(item=>{
    const button=document.createElement("button");button.className="sample-card"+(item.id===state.chosen?" active":"");button.type="button";button.dataset.layout=item.id;
    button.setAttribute("aria-label",`Select ${item.title} design`);
    const canvas=document.createElement("canvas");canvas.setAttribute("aria-hidden","true");
    const meta=document.createElement("div");meta.className="sample-meta";
    const b=document.createElement("b");b.textContent=item.title;const small=document.createElement("small");small.textContent=item.id===state.chosen?"Selected":"Preview";meta.append(b,small);
    button.append(canvas,meta);
    button.addEventListener("click",()=>{state.chosen=item.id;$$(".sample-card").forEach(t=>t.classList.toggle("active",t.dataset.layout===item.id));$$(".sample-card small").forEach(t=>t.textContent=t.closest(".sample-card").dataset.layout===item.id?"Selected":"Preview");scheduleDraw();});
    box.append(button);
  });
}
async function draw(){
  const version=++renderCounter;
  const featured=state.photos[state.featured]?.data;
  const [img,logo]=await Promise.all([imageFromData(featured),imageFromData(state.logo?.data)]);
  if(version!==renderCounter)return;
  const params={format:state.brief.format,brief:state.brief,photo:img,logo,transparent:state.transparent};
  try{
    for(const item of LAYOUTS){
      const canvas=$(`[data-layout="${item.id}"] canvas`);
      if(canvas)renderAd(canvas,{...params,layout:item.id});
    }
    renderAd($("#main-canvas"),{...params,layout:state.chosen});
    const data=FORMATS[state.brief.format]||FORMATS.square;
    $("#output-dimensions").textContent=`${data.width} × ${data.height}`;
    $("#active-layout-name").textContent=LAYOUTS.find(x=>x.id===state.chosen)?.title||"Product Spotlight";
  }catch(e){console.error(e);notify("Could not render ad preview.");}
}
function scheduleDraw(){clearTimeout(drawTimer);drawTimer=setTimeout(draw,90);}
function generateLayouts(){
  state.generated=true;makeSampleGrid();scheduleDraw();notify("Four editable design layouts are ready. Select a sample to refine.");
}
function fileName(prefix,format){return `${prefix.replace(/[^a-z0-9_-]/gi,"-").slice(0,42)}-${format}.png`;}
async function download(transparent=false){
  const [img,logo]=await Promise.all([imageFromData(state.photos[state.featured]?.data),imageFromData(state.logo?.data)]);
  const canvas=document.createElement("canvas");
  try{
    renderAd(canvas,{format:state.brief.format,layout:state.chosen,brief:state.brief,photo:img,logo,transparent});
    canvas.toBlob(blob=>{
      if(!blob){notify("PNG export failed.");return;}
      const link=document.createElement("a");const url=URL.createObjectURL(blob);
      link.href=url;link.download=fileName("mcts-"+state.chosen+(transparent?"-transparent":""),state.brief.format);
      document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    },"image/png");
  }catch(e){notify("PNG export failed: "+e.message);}
}
function updateCaptionTabs(){
  const tabs=$("#caption-tabs");tabs.replaceChildren();
  state.captions.forEach((text,i)=>{
    const button=document.createElement("button");button.className="caption-tab"+(i===state.captionIndex?" active":"");
    button.textContent="Option "+(i+1);button.type="button";
    button.addEventListener("click",()=>{state.captionIndex=i;state.caption=state.captions[i];updateCaptionTabs();});
    tabs.append(button);
  });
  $("#caption-editor").value=state.caption||"";
}
function generateCaptions(){state.captions=makeCaptions(state.brief);state.captionIndex=0;state.caption=state.captions[0];updateCaptionTabs();notify("Three truthful, editable caption drafts prepared.");}
function openDB(){return new Promise((resolve,reject)=>{
  if(!("indexedDB" in window))return reject(Error("IndexedDB is unavailable in this browser."));
  const req=indexedDB.open("mcts-social-studio",1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains("projects"))req.result.createObjectStore("projects",{keyPath:"id"});};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});}
let dbPromise;
function database(){return dbPromise||=openDB();}
async function dbAction(mode,action){
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction("projects",mode),store=tx.objectStore("projects");
    const result=action(store);
    tx.oncomplete=()=>resolve(result?.result);
    tx.onerror=()=>reject(tx.error||Error("Storage failed"));
    tx.onabort=()=>reject(tx.error||Error("Storage aborted"));
  });
}
async function refreshProjects(){try{projects=(await dbAction("readonly",store=>store.getAll()))||[];projects.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));}catch(e){projects=[];notify("This browser cannot save drafts locally.");}}
async function makeThumbnail(){
  const img=await imageFromData(state.photos[state.featured]?.data),logo=await imageFromData(state.logo?.data);
  const cv=document.createElement("canvas");renderAd(cv,{brief:state.brief,format:"square",layout:state.chosen,photo:img,logo});
  return cv.toDataURL("image/jpeg",.55);
}
async function saveDraft(status){
  const existing=projects.find(p=>p.id===state.id);
  const nextStatus=status||(existing?.status||"draft");
  const now=new Date().toISOString();
  const record={
    id:state.id||((crypto?.randomUUID?.()||String(Date.now()))),
    brief:clone(state.brief),photos:clone(state.photos),featured:state.featured,references:clone(state.references),
    logo:clone(state.logo),chosen:state.chosen,transparent:state.transparent,preserve:state.preserve,
    captions:clone(state.captions),caption:state.caption,captionIndex:state.captionIndex,
    status:nextStatus,scheduledAt:existing?.scheduledAt||"",createdAt:existing?.createdAt||now,updatedAt:now,
    thumbnail:await makeThumbnail()
  };
  try{await dbAction("readwrite",store=>store.put(record));state.id=record.id;await refreshProjects();renderStats();notify(nextStatus==="approved"?"Approved and saved to your local library.":"Project saved locally.");return record;}
  catch(e){notify("Save failed—browser storage may be full. Try fewer or smaller photos.");return null;}
}
async function removeDraft(id){
  if(!confirm("Delete this local project? This cannot be undone."))return;
  try{await dbAction("readwrite",store=>store.delete(id));if(state.id===id)state.id=null;await refreshProjects();renderLibrary();renderQueue();renderStats();notify("Project deleted.");}catch(e){notify("Could not remove project.");}
}
function hydrate(record){
  state={
    brief:{...clone(STARTER),...clone(record.brief)},photos:clone(record.photos||[]),featured:record.featured||0,
    references:clone(record.references||[]),logo:clone(record.logo||null),chosen:record.chosen||"showcase",
    generated:true,transparent:Boolean(record.transparent),preserve:record.preserve!==false,
    captions:clone(record.captions||makeCaptions(record.brief)),captionIndex:record.captionIndex||0,
    caption:record.caption||makeCaptions(record.brief)[0],id:record.id
  };
  updateForms();makeSampleGrid();showView("create");scheduleDraw();notify("Project loaded for editing.");
}
function dateLabel(value){
  if(!value)return "Not planned";const d=new Date(value);return Number.isNaN(d.getTime())?"Invalid date":new Intl.DateTimeFormat("en-PH",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(d);
}
function statusName(status){return status==="approved"?"Approved":status==="queued"?"Planned (manual)":"Draft";}
function cardButtons(record,includeDelete=true){
  const actions=document.createElement("div");actions.className="action-row";
  const edit=document.createElement("button");edit.className="button button-primary";edit.textContent="Edit design";edit.addEventListener("click",()=>hydrate(record));actions.append(edit);
  if(includeDelete){const del=document.createElement("button");del.className="button button-outline";del.textContent="Delete";del.addEventListener("click",()=>removeDraft(record.id));actions.append(del);}
  return actions;
}
function renderLibrary(){
  const box=$("#library-grid");box.replaceChildren();
  if(!projects.length){box.innerHTML='<div class="empty-state">No saved creatives yet. Generate an ad and select Save draft to start your library.</div>';return;}
  projects.forEach(record=>{
    const card=document.createElement("article");card.className="library-card";
    const preview=document.createElement("div");preview.className="library-preview";
    if(record.thumbnail){const img=document.createElement("img");img.src=record.thumbnail;img.alt="Saved ad preview";preview.append(img);}
    const title=document.createElement("h4");title.textContent=record.brief.product||"Untitled creative";
    const caption=document.createElement("p");caption.textContent="Last edited "+dateLabel(record.updatedAt);
    const badge=document.createElement("span");badge.className="status-chip "+record.status;badge.textContent=statusName(record.status);
    card.append(preview,title,caption,badge,cardButtons(record));box.append(card);
  });
}
function renderQueue(){
  const box=$("#queue-list");box.replaceChildren();
  const approved=projects.filter(p=>p.status==="approved"||p.status==="queued");
  if(!approved.length){box.innerHTML='<div class="empty-state">No approved content yet. Approve a design in Create Ads to add it here.</div>';return;}
  approved.forEach(record=>{
    const card=document.createElement("article");card.className="queue-card";
    const details=document.createElement("div");
    const title=document.createElement("h4");title.textContent=record.brief.product||"Untitled creative";
    const meta=document.createElement("p");meta.textContent=`${statusName(record.status)} · ${dateLabel(record.scheduledAt)}`;
    details.append(title,meta);
    const actions=document.createElement("div");actions.className="queue-actions";
    const date=document.createElement("input");date.type="datetime-local";date.className="schedule-input";date.value=record.scheduledAt||"";date.setAttribute("aria-label","Manual publishing reminder date");
    const plan=document.createElement("button");plan.className="button button-primary";plan.textContent="Save plan";
    plan.addEventListener("click",async()=>{
      if(!date.value){notify("Choose a planning date and time.");return;}
      record.scheduledAt=date.value;record.status="queued";record.updatedAt=new Date().toISOString();
      try{await dbAction("readwrite",store=>store.put(record));await refreshProjects();renderQueue();notify("Manual posting reminder saved. No automatic publishing will occur.");}catch(e){notify("Could not save posting plan.");}
    });
    const edit=document.createElement("button");edit.className="button button-outline";edit.textContent="Open";edit.addEventListener("click",()=>hydrate(record));
    actions.append(date,plan,edit);card.append(details,actions);box.append(card);
  });
}
function renderStats(){
  const statuses=[["Draft creatives",projects.filter(x=>x.status==="draft").length],["Approved",projects.filter(x=>x.status==="approved").length],["Manual posting plans",projects.filter(x=>x.status==="queued").length]];
  const box=$("#stat-grid");box.replaceChildren();statuses.forEach(([title,n])=>{const item=document.createElement("article");item.className="stat-card";item.innerHTML=`<b>${n}</b><span>${escapeHTML(title)}</span>`;box.append(item);});
}
function renderBrand(){
  const swatches=[["Primary blue",BRAND.primary],["White",BRAND.white],["Periwinkle",BRAND.periwinkle],["Navy",BRAND.navy],["Off-white",BRAND.light]];
  const box=$("#swatch-grid");box.replaceChildren();
  swatches.forEach(([name,hex])=>{const item=document.createElement("div");item.className="swatch";item.innerHTML=`<div class="swatch-color" style="background:${hex}"></div><div class="swatch-info"><b>${escapeHTML(name)}</b><span>${hex}</span></div>`;box.append(item);});
  const rules=$("#brand-rules");rules.replaceChildren();COLOR_RULES.forEach(rule=>{const el=document.createElement("div");el.className="brand-rule";el.textContent=rule;rules.append(el);});
}
function parseCSV(raw){
  const text=raw.replace(/^\uFEFF/,""),rows=[];let row=[],field="",inside=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'&&inside&&text[i+1]==='"'){field+='"';i++;}
    else if(c==='"')inside=!inside;
    else if(c===","&&!inside){row.push(field);field="";}
    else if((c==="\n"||c==="\r")&&!inside){if(c==="\r"&&text[i+1]==="\n")i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field="";}
    else field+=c;
  }
  row.push(field);if(row.some(v=>v.trim()))rows.push(row);
  const names=(rows.shift()||[]).map(v=>v.toLowerCase().replace(/[^a-z0-9]/g,""));
  return rows.map(r=>Object.fromEntries(names.map((n,i)=>[n,r[i]||""])));
}
function parseMetric(value){return Math.max(0,Number(String(value||"0").replace(/,/g,""))||0);}
function analyzeCSV(records){
  return records.map((r,i)=>{
    const get=(...keys)=>keys.map(k=>r[k]).find(v=>v!==undefined&&v!=="")??"";
    const title=get("postmessage","message","caption","description","title")||"Post "+(i+1);
    const type=get("posttype","type","mediatype","contenttype")||"Post";
    const reachValue=get("reach","postreach","organicreach");const reach=parseMetric(reachValue);
    const engagementValue=get("engagement","engagements","contentinteractions","interactions");
    const count=engagementValue!==""?parseMetric(engagementValue):["reactions","likes","comments","shares","clicks"].reduce((sum,k)=>sum+parseMetric(r[k]),0);
    return {title,type,reach,hasReach:reachValue!==""&&reach>0,count};
  });
}
function showInsights(data){
  const box=$("#insights-output");box.replaceChildren();
  const posts=analyzeCSV(data);
  if(!posts.length){box.innerHTML='<div class="empty-state">No usable posts found.</div>';return;}
  const useRates=posts.every(p=>p.hasReach);
  const ranked=posts.map(p=>({...p,score:useRates?p.count/p.reach*100:p.count})).sort((a,b)=>b.score-a.score);
  const note=document.createElement("p");note.className="field-help";
  note.textContent=`${posts.length} posts imported. Ranked by ${useRates?"interactions ÷ reach (%)":"raw interactions because reach is missing for one or more posts"}. Paid boosts, posting times and audience differences may affect results.`;box.append(note);
  ranked.slice(0,6).forEach((p,i)=>{
    const row=document.createElement("div");row.className="insights-row";
    const left=document.createElement("span");left.textContent=`${i+1}. ${p.type} — ${p.title.slice(0,90)}`;
    const right=document.createElement("strong");right.textContent=useRates?p.score.toFixed(2)+"%":p.score.toFixed(0)+" interactions";
    row.append(left,right);box.append(row);
  });
}
function resetProject(){
  if(state.photos.length&&!confirm("Start a fresh creative? Unsaved changes will be lost."))return;
  state={brief:clone(STARTER),photos:[],featured:0,references:[],logo:null,chosen:"showcase",generated:false,transparent:false,preserve:true,captions:makeCaptions(STARTER),captionIndex:0,caption:makeCaptions(STARTER)[0],id:null};
  updateForms();makeSampleGrid();draw();showView("create");notify("Fresh creative ready.");
}
function initEvents(){
  $$("[data-view]").forEach(el=>el.addEventListener("click",()=>showView(el.dataset.view)));
  $("#menu-toggle").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  $("#top-create").addEventListener("click",resetProject);$("#home-create").addEventListener("click",resetProject);
  $("#reset-brief").addEventListener("click",resetProject);
  $$("[data-brief]").forEach(input=>input.addEventListener("input",()=>{state.brief[input.dataset.brief]=input.value;scheduleDraw();}));
  $("#preserve-product").addEventListener("change",e=>{state.preserve=e.target.checked;notify("Product images are kept as uploaded. Generative product editing is not active.");});
  $("#transparent-toggle").addEventListener("change",e=>{state.transparent=e.target.checked;scheduleDraw();});
  $("#asset-input").addEventListener("change",async e=>{await addImages(e.target.files,"photos",8);e.target.value="";});
  $("#reference-input").addEventListener("change",async e=>{await addImages(e.target.files,"references",6);e.target.value="";});
  $("#logo-input").addEventListener("change",async e=>{await loadLogo(e.target.files?.[0]);e.target.value="";});
  const drop=$("#upload-drop");
  ["dragenter","dragover"].forEach(evt=>drop.addEventListener(evt,e=>{e.preventDefault();drop.classList.add("dragging");}));
  ["dragleave","drop"].forEach(evt=>drop.addEventListener(evt,e=>{e.preventDefault();drop.classList.remove("dragging");}));
  drop.addEventListener("drop",e=>addImages(e.dataTransfer.files,"photos",8));
  $("#generate").addEventListener("click",generateLayouts);
  $("#download-png").addEventListener("click",()=>download(false));
  $("#download-alpha").addEventListener("click",()=>download(true));
  $("#save-draft").addEventListener("click",()=>saveDraft("draft"));
  $("#approve-draft").addEventListener("click",async()=>{const result=await saveDraft("approved");if(result)showView("queue");});
  $("#make-captions").addEventListener("click",generateCaptions);
  $("#caption-editor").addEventListener("input",e=>{state.caption=e.target.value;state.captions[state.captionIndex]=e.target.value;});
  $("#copy-caption").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(state.caption);notify("Caption copied.");}catch{notify("Clipboard unavailable. Select text and copy manually.");}});
  $("#csv-input").addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error("CSV must be under 5 MB.");showInsights(parseCSV(await file.text()));notify("CSV analyzed locally.");}catch(err){notify(err.message)}e.target.value="";});
}
async function boot(){
  initEvents();renderBrand();await refreshProjects();renderStats();updateForms();makeSampleGrid();draw();showView("create");
}
boot();
