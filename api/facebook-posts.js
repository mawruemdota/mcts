// Optional Vercel serverless endpoint for Page-owned Facebook content.
// Do not use this endpoint for Pages you do not administer. Tokens never reach the browser.
import { timingSafeEqual } from "node:crypto";

const constantTimeEquals = (a, b) => {
  const left = Buffer.from(String(a || ""), "utf8"), right = Buffer.from(String(b || ""), "utf8");
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
};
const total = edge => Number(edge?.summary?.total_count || 0);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "GET") return res.status(405).json({ error: "Use GET." });
  const { FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN, FB_STUDIO_KEY } = process.env;
  if (!FB_PAGE_ID || !FB_PAGE_ACCESS_TOKEN || !FB_STUDIO_KEY) {
    return res.status(503).json({ error: "Facebook Page sync has not been configured on the server." });
  }
  if (!/^\d+$/.test(FB_PAGE_ID)) {
    return res.status(503).json({ error: "Invalid server Page ID configuration." });
  }
  if (!constantTimeEquals(req.headers["x-studio-key"], FB_STUDIO_KEY)) {
    return res.status(401).json({ error: "Invalid dashboard access key." });
  }
  try {
    const fields = "id,message,created_time,permalink_url,shares,attachments{media_type},reactions.limit(0).summary(true),comments.limit(0).summary(true)";
    const url = new URL(`https://graph.facebook.com/v26.0/${FB_PAGE_ID}/posts`);
    url.searchParams.set("fields", fields);
    url.searchParams.set("limit", "50");
    // Page access token is sent in a header instead of the URL (prevents URL log leakage).
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${FB_PAGE_ACCESS_TOKEN}` },
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(json.data)) {
      return res.status(502).json({ error: "Meta declined the request. Check Page access permissions, token validity, and API version." });
    }
    const posts = json.data.map(post => ({
      id: post.id,
      message: post.message || "",
      posttype: post.attachments?.data?.[0]?.media_type || "Post",
      createdtime: post.created_time || "",
      permalink: post.permalink_url || "",
      reactions: total(post.reactions),
      comments: total(post.comments),
      shares: Number(post.shares?.count || 0),
      // No reach metric is asserted here. This is interaction volume, not performance per viewer.
    }));
    return res.status(200).json({ page: FB_PAGE_ID, posts, count: posts.length, metric: "interactions" });
  } catch {
    return res.status(502).json({ error: "Could not contact the Meta Graph API. Retry or import a CSV export." });
  }
}
