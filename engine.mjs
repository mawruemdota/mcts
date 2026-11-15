/* MCTS Social Studio — browser-safe drawing engine, no network calls or secrets. */
export const BRAND = Object.freeze({
  name:"MCTS", fullName:"Marasigan Creatives & Tech Solutions",
  primary:"#2355E5", blueDark:"#1745B8", periwinkle:"#8CA0E3",
  navy:"#172851", white:"#FFFFFF", light:"#F5F8FC",
  cta:"Message mo na kami!",
});
export const FORMATS = Object.freeze({
  square:{ label:"Square · 1080 × 1080",width:1080,height:1080 },
  portrait:{ label:"Portrait · 1080 × 1350",width:1080,height:1350 },
  story:{ label:"Story · 1080 × 1920",width:1080,height:1920 },
  landscape:{ label:"Landscape · 1200 × 628",width:1200,height:628 },
});
export const LAYOUTS = Object.freeze([
  {id:"showcase",title:"Product Spotlight",note:"Photo-first · bold blue"},
  {id:"studio",title:"Clean Studio",note:"Editorial · bright space"},
  {id:"badge",title:"Feature Circle",note:"Product details · circular accent"},
  {id:"services",title:"Service Stack",note:"Playful · modular blue"},
]);
export const STARTER = Object.freeze({
  product:"Custom printed mugs",headline:"Made for your moments.",
  benefit:"Personalized prints for gifts, teams and events.",
  offer:"",cta:"Message mo na kami!",audience:"Customers looking for personalized gifts",
  platform:"both",objective:"Inquiries",style:"Bold MCTS blue, friendly, clean, product-forward",
  format:"square",preserve:true,
});
export const COLOR_RULES = Object.freeze([
  "Signature royal blue and white are mandatory identity anchors.",
  "The exact official logo must be overlaid from the uploaded original file.",
  "Never invent prices, discounts, printing specifications or guarantees.",
  "Preserve real product artwork, color and proportions.",
  "Use short, mobile-readable headlines and a direct CTA.",
  "Allow changing art style without replacing the brand's colors."
]);
function safeText(v, max=300){return String(v ?? "").trim().slice(0,max)}
export function makeCaptions(brief){
  const product=safeText(brief.product)||"our creative services";
  const benefit=safeText(brief.benefit);
  const offer=safeText(brief.offer);
  const cta=safeText(brief.cta)||BRAND.cta;
  const head=safeText(brief.headline);
  const tail=[offer,cta,"#MCTS #CustomPrinting #Creatives"].filter(Boolean).join("\n");
  return [
    [head||product,benefit,tail].filter(Boolean).join("\n\n"),
    [`Looking for ${product.toLowerCase()}?`,benefit,`Send us your idea. ${cta}`,offer,"#MCTS #SupportLocal"].filter(Boolean).join("\n\n"),
    [`${product} — made for your next project.`,benefit,offer,cta,"#MCTS #PrintAndDesign"].filter(Boolean).join("\n\n")
  ];
}
export function validHex(value){return typeof value==="string" && /^#[0-9a-f]{6}$/i.test(value)}
export function palette(custom={},locked=true){
  if(locked) return BRAND;
  return {...BRAND,...Object.fromEntries(["primary","navy","periwinkle","white","light"].filter(x=>validHex(custom[x])).map(x=>[x,custom[x]]))};
}
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));
function rr(ctx,x,y,w,h,r,fill){if(w<=0||h<=0)return;ctx.beginPath();ctx.roundRect(x,y,w,h,Math.max(0,Math.min(r,w/2,h/2)));if(fill)ctx.fill();}
function font(size,weight=700){return `${weight} ${Math.round(size)}px "Poppins","Montserrat",Arial,sans-serif`}
function drawText(ctx,text,x,y,width,size,color,options={}){
  const {weight=700,maxLines=3,align="left",line=1.1}=options;
  ctx.save();ctx.font=font(size,weight);ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline="top";
  const result=[];
  for(const paragraph of safeText(text,500).split("\n")){
    let item="";
    for(const word of paragraph.split(/\s+/).filter(Boolean)){
      const candidate=item?item+" "+word:word;
      if(item&&ctx.measureText(candidate).width>width){result.push(item);item=word}else item=candidate;
    }
    if(item)result.push(item);
  }
  const visible=result.slice(0,maxLines);
  if(result.length>maxLines&&visible.length){let i=visible.length-1;while(visible[i].length>1&&ctx.measureText(visible[i]+"…").width>width)visible[i]=visible[i].slice(0,-1);visible[i]+="…";}
  visible.forEach((s,i)=>ctx.fillText(s,x,y+i*size*line));
  ctx.restore();
  return visible.length*size*line;
}
function photo(ctx,img,x,y,w,h,fit="cover",radius=0){
  if(!img?.naturalWidth||!img?.naturalHeight)return false;
  const factor=(fit==="contain"?Math.min:Math.max)(w/img.naturalWidth,h/img.naturalHeight);
  const iw=img.naturalWidth*factor,ih=img.naturalHeight*factor;
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,radius);ctx.clip();
  ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);ctx.restore();return true;
}
function logo(ctx,img,x,y,maxW=110,maxH=94,p){
  if(img?.naturalWidth&&img?.naturalHeight){
    const sc=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight);
    ctx.drawImage(img,x,y,img.naturalWidth*sc,img.naturalHeight*sc);
  }else{
    drawText(ctx,"MCTS",x,y,maxW,27,p.primary,{weight:900,maxLines:1});
  }
}
function ctaBar(ctx,W,H,p,text,transparent,large=false){
  const h=Math.round(Math.max(73,Math.min(112,H*.09)));
  const y=H-h;
  ctx.fillStyle=p.primary;ctx.fillRect(0,y,W,h);
  const textSize=clamp(W*.027,22,37);
  drawText(ctx,text||BRAND.cta,45,y+(h-textSize)/2-4,W-100,textSize,p.white,{weight:800,maxLines:1});
  if(!transparent){ctx.fillStyle="rgba(255,255,255,.06)";ctx.beginPath();ctx.moveTo(W*.70,y);ctx.lineTo(W*.83,H);ctx.lineTo(W*.90,H);ctx.lineTo(W*.78,y);ctx.fill();}
}
function imageFallback(ctx,x,y,w,h,p){
  ctx.save();ctx.strokeStyle=p.periwinkle;ctx.lineWidth=5;ctx.setLineDash([16,16]);
  ctx.strokeRect(x+15,y+15,w-30,h-30);ctx.setLineDash([]);
  drawText(ctx,"UPLOAD A PRODUCT PHOTO",x+35,y+h*.48,w-70,25,p.navy,{weight:700,maxLines:2});ctx.restore();
}
function drawShowcase(ctx,W,H,b,img,logoImg,p,transparent){
  const wide=W/H>1.45;
  if(!transparent){ctx.fillStyle=p.light;ctx.fillRect(0,0,W,H);}
  const header=Math.min(H*.18,175);
  ctx.fillStyle=p.primary;ctx.fillRect(0,0,W,header);
  if(logoImg)logo(ctx,logoImg,50,34,112,87,p);
  else drawText(ctx,"MCTS",50,35,200,43,p.white,{weight:900,maxLines:1});
  drawText(ctx,safeText(b.product,100).toUpperCase(),wide?290:230,43,W-(wide?330:255),27,p.white,{maxLines:2,weight:700});
  const imageY=header+24,imageH=H-header-Math.max(95,H*.09)-45;
  const imageX=wide?W*.48:W*.43,imageW=W-imageX-28;
  if(!transparent){ctx.fillStyle="#E7EDFE";rr(ctx,imageX,imageY,imageW,imageH,36,true);}
  if(!photo(ctx,img,imageX,imageY,imageW,imageH,"contain",32))imageFallback(ctx,imageX,imageY,imageW,imageH,p);
  const titleY=wide?header+45:header+90;
  drawText(ctx,b.headline,52,titleY,imageX-94,wide?50:68,p.navy,{weight:900,maxLines:4});
  drawText(ctx,b.benefit,53,titleY+(wide?150:310),imageX-95,wide?25:29,p.navy,{weight:500,maxLines:5,line:1.3});
  if(b.offer) {ctx.fillStyle=p.primary;rr(ctx,45,H*.73,Math.min(imageX-74,430),69,14,true);drawText(ctx,b.offer,65,H*.73+18,imageX-110,30,p.white,{weight:800,maxLines:1});}
  ctaBar(ctx,W,H,p,b.cta,transparent);
}
function drawStudio(ctx,W,H,b,img,logoImg,p,transparent){
  const wide=W/H>1.45;
  if(!transparent){ctx.fillStyle=p.white;ctx.fillRect(0,0,W,H);}
  ctx.fillStyle=p.primary;ctx.fillRect(0,0,W,Math.min(16,H*.02));
  logo(ctx,logoImg,55,54,126,90,p);
  const pad=wide?48:65;
  drawText(ctx,b.headline,pad,wide?110:195,W-pad*2,wide?63:85,p.primary,{weight:900,maxLines:3});
  const picY=wide?170:H*.36;
  const picX=wide?W*.54:W*.1,picW=wide?W*.4:W*.80,picH=wide?H*.57:H*.42;
  if(!transparent){ctx.fillStyle=p.light;rr(ctx,picX,picY,picW,picH,25,true);}
  if(!photo(ctx,img,picX,picY,picW,picH,"contain",24))imageFallback(ctx,picX,picY,picW,picH,p);
  const by=wide?H*.55:H*.81;
  const descWidth=wide?W*.42:W*.86;
  drawText(ctx,b.benefit,pad,by,descWidth,wide?26:32,p.navy,{weight:500,maxLines:3,line:1.2});
  if(b.offer)drawText(ctx,b.offer,pad,wide?H*.70:H*.91,descWidth,32,p.primary,{weight:800,maxLines:1});
  ctaBar(ctx,W,H,p,b.cta,transparent);
}
function drawBadge(ctx,W,H,b,img,logoImg,p,transparent){
  const wide=W/H>1.45;
  if(!transparent){ctx.fillStyle=p.light;ctx.fillRect(0,0,W,H);}
  const strip=Math.max(95,H*.12);
  ctx.fillStyle=p.primary;ctx.fillRect(0,0,W,strip);
  if(logoImg)logo(ctx,logoImg,50,23,98,65,p);
  else drawText(ctx,"MCTS",52,30,160,36,p.white,{weight:900,maxLines:1});
  drawText(ctx,b.product,wide?230:220,33,W-250,wide?30:31,p.white,{weight:700,maxLines:2});
  const area={x:wide?W*.12:W*.07,y:strip+35,w:wide?W*.57:W*.86,h:wide?H*.57:H*.60};
  if(!transparent){ctx.fillStyle=p.white;rr(ctx,area.x,area.y,area.w,area.h,26,true);}
  if(!photo(ctx,img,area.x,area.y,area.w,area.h,"contain",25))imageFallback(ctx,area.x,area.y,area.w,area.h,p);
  const diameter=wide?Math.min(220,H*.42):Math.min(360,W*.37);
  const cx=wide?W*.77:W*.79,cy=wide?H*.43:H*.39;
  ctx.save();ctx.shadowColor="rgba(23,40,81,.18)";ctx.shadowBlur=25;ctx.fillStyle=p.white;ctx.beginPath();ctx.arc(cx,cy,diameter/2+9,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.fillStyle=p.primary;ctx.beginPath();ctx.arc(cx,cy,diameter/2,0,Math.PI*2);ctx.fill();
  drawText(ctx,b.offer || "CUSTOM MADE",cx-diameter*.38,cy-35,diameter*.76,wide?23:29,p.white,{weight:800,maxLines:2});
  const textY=wide?H*.7:H*.82;
  drawText(ctx,b.headline,55,textY,W-100,wide?40:56,p.navy,{weight:900,maxLines:2});
  ctaBar(ctx,W,H,p,b.cta,transparent);
}
function drawServices(ctx,W,H,b,img,logoImg,p,transparent){
  const wide=W/H>1.45;
  if(!transparent){ctx.fillStyle=p.light;ctx.fillRect(0,0,W,H);}
  const header=wide?125:205;
  ctx.fillStyle=p.primary;ctx.fillRect(0,0,W,header);
  if(logoImg)logo(ctx,logoImg,38,25,85,68,p);
  else drawText(ctx,"MCTS",38,30,170,33,p.white,{weight:900,maxLines:1});
  drawText(ctx,b.headline,wide?185:165,wide?20:55,W-(wide?205:180),wide?45:65,p.white,{weight:900,maxLines:2});
  const items=safeText(b.benefit,260).split(/[,;\n]/).map(x=>x.trim()).filter(Boolean).slice(0,3);
  while(items.length<3)items.push([b.product||"Creative Services","Custom Solutions","Contact us"][items.length]);
  const gap=18,left=30,col=(W-60-gap*2)/3;
  const y=header+(wide?23:37),h=H-y-Math.max(94,H*.09)-(wide?22:65);
  items.forEach((s,i)=>{
    const x=left+i*(col+gap);
    ctx.fillStyle=i===1?p.blueDark:p.primary;rr(ctx,x,y,col,h,20,true);
    ctx.fillStyle="rgba(255,255,255,.09)";ctx.beginPath();ctx.arc(x+col*.70,y+h*.27,col*.25,0,Math.PI*2);ctx.fill();
    drawText(ctx,String(i+1).padStart(2,"0"),x+23,y+28,col-46,wide?32:45,p.white,{weight:900,maxLines:1});
    drawText(ctx,s,x+23,y+h*.49,col-44,wide?23:34,p.white,{weight:800,maxLines:4,line:1.14});
  });
  if(img)photo(ctx,img,W*.36,wide?H*.13:H*.255,W*.28,wide?H*.24:H*.16,"contain",16);
  ctaBar(ctx,W,H,p,b.cta,transparent);
}
export function renderAd(canvas,{format="square",layout="showcase",brief=STARTER,photo:mainPhoto=null,logo:logoImage=null,colors={},locked=true,transparent=false}={}){
  if(!canvas?.getContext)throw new Error("A Canvas element is required");
  const f=FORMATS[format]||FORMATS.square;
  canvas.width=f.width;canvas.height=f.height;
  const ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)throw new Error("Canvas 2D context not available");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const p=palette(colors,locked),args=[ctx,f.width,f.height,brief,mainPhoto,logoImage,p,transparent];
  switch(layout){
    case "studio":drawStudio(...args);break;
    case "badge":drawBadge(...args);break;
    case "services":drawServices(...args);break;
    default:drawShowcase(...args);
  }
  return canvas;
}
