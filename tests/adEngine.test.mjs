import test from "node:test";
import assert from "node:assert/strict";
import { AD_FORMATS, captionDrafts, parseCSV, normalizePosts, analyzePosts, MCTS_BRAND, STARTER_BRIEF } from "../src/components/creativehub/adEngine.js";

test("format dimensions and brand defaults", () => {
  assert.equal(AD_FORMATS.portrait.width, 1080);
  assert.equal(AD_FORMATS.story.height, 1920);
  assert.equal(MCTS_BRAND.primary, "#02343D");
});

test("CSV recognizes quoted commas and CRLF rows", () => {
  const rows = parseCSV('Post type,Post message,Reach,Reactions,Comments,Shares\r\nPhoto,"Hello, world",100,10,2,1\r\nVideo,"Second post",200,6,2,2');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].postmessage, "Hello, world");
  const normalized = normalizePosts(rows);
  assert.equal(normalized[0].engagement, 13);
  assert.equal(normalized[0].reach, 100);
  assert.equal(normalized[1].type, "Video");
});

test("all-positive-reach data compares engagement rates", () => {
  const posts = normalizePosts(parseCSV('Type,Message,Reach,Engagement\nPhoto,First,100,20\nPhoto,Second,200,10\nVideo,Third,100,4\nVideo,Fourth,300,6\nPhoto,Fifth,100,11'));
  const analysis = analyzePosts(posts);
  assert.equal(analysis.count, 5);
  assert.equal(analysis.useRate, true);
  assert.equal(analysis.ranked[0].message, "First");
  assert.equal(analysis.metric, "Engagement / reach (%)");
  assert.equal(analysis.reliable, true);
});

test("mixed reach availability never mixes rates with interaction counts", () => {
  const posts = normalizePosts(parseCSV('Type,Message,Reach,Engagement\nPhoto,First,100,10\nVideo,Second,,20'));
  const analysis = analyzePosts(posts);
  assert.equal(analysis.useRate, false);
  assert.equal(analysis.ranked[0].message, "Second");
  assert.match(analysis.metric, /not reach-normalized/);
  assert.equal(analysis.reliable, false);
});

test("offline captions respect provided facts", () => {
  const captions = captionDrafts(MCTS_BRAND, { ...STARTER_BRIEF, offer: "", cta: "Message us", hashtags: "#MCTS #MCTS #Prints" }, "Taglish");
  assert.equal(captions.length, 3);
  assert.ok(captions.every(v => v.includes("Message us")));
  assert.ok(captions.every(v => !v.includes("50%")));
  assert.ok(captions.every(v => (v.match(/#MCTS/g) || []).length === 1));
});
