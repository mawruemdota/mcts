import test from "node:test";
import assert from "node:assert/strict";
import {BRAND,FORMATS,LAYOUTS,STARTER,COLOR_RULES,makeCaptions,palette,validHex,renderAd} from "../engine.mjs";

test("brand palette and format dimensions match the approved working reference",()=>{
  assert.equal(BRAND.primary,"#2355E5");
  assert.equal(BRAND.white,"#FFFFFF");
  assert.equal(BRAND.cta,"Message mo na kami!");
  assert.equal(FORMATS.square.width,1080);
  assert.equal(FORMATS.story.height,1920);
  assert.equal(FORMATS.portrait.height,1350);
  assert.equal(LAYOUTS.length,4);
  assert.equal(new Set(LAYOUTS.map(x=>x.id)).size,4);
  assert.ok(COLOR_RULES.length>=5);
});
test("captions use confirmed facts without making up offers",()=>{
  const brief={...STARTER,headline:"CUSTOM MUGS",offer:"",benefit:"Blue interior options",cta:"Message us today"};
  const texts=makeCaptions(brief);
  assert.equal(texts.length,3);
  assert.ok(texts.every(t=>t.includes("Blue interior options")));
  assert.ok(texts.every(t=>t.includes("Message us today")));
  assert.ok(texts.every(t=>!t.includes("50%")&&!t.includes("FREE SHIPPING")));
});
test("confirmed offer appears; duplicate or missing data is not inserted",()=>{
  const texts=makeCaptions({...STARTER,offer:"₱40 starting price"});
  assert.ok(texts.every(t=>t.includes("₱40 starting price")));
});
test("color lock prevents accidental non-brand hues",()=>{
  const modified=palette({primary:"#FF00FF",navy:"#123456"},true);
  assert.equal(modified.primary,BRAND.primary);
  assert.equal(modified.navy,BRAND.navy);
  assert.equal(palette({primary:"#FF00FF"},false).primary,"#FF00FF");
  assert.ok(validHex("#abc123"));
  assert.equal(validHex("red"),false);
});
test("rendering validates required canvas interface",()=>{
  assert.throws(()=>renderAd(null),/Canvas/);
  assert.throws(()=>renderAd({}),/Canvas/);
});
