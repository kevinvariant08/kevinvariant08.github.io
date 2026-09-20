// Cloudflare Worker: forwards interview requests to the Anthropic API with your key.
// Deploy: wrangler deploy, then `wrangler secret put ANTHROPIC_API_KEY`.
// Then paste the worker URL into the Proxy field on interviews.html and leave the key blank.
// Set a monthly spend limit in the Anthropic console as well; this worker only rate-limits per IP.

const ALLOWED_ORIGINS = ["https://kevinvariant08.github.io"];   // add a custom domain here if you buy one
const MODELS = ["claude-sonnet-5", "claude-haiku-4-5-20251001"]; // models callers may request
const MAX_TOKENS_CAP = 1500;
const PER_IP_PER_HOUR = 60;                                       // ~2 full interviews per hour per visitor

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("POST only", { status: 405, headers: cors });
    if (!ALLOWED_ORIGINS.includes(origin)) return new Response("Forbidden origin", { status: 403, headers: cors });

    // Simple per-IP hourly limit using the cache API (good enough for a personal site).
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const hour = Math.floor(Date.now() / 3600000);
    const key = new Request(`https://ratelimit.local/${ip}/${hour}`);
    const cache = caches.default;
    let count = 0;
    const hit = await cache.match(key);
    if (hit) count = parseInt(await hit.text(), 10) || 0;
    if (count >= PER_IP_PER_HOUR) return new Response("Rate limit: try again in an hour", { status: 429, headers: cors });
    await cache.put(key, new Response(String(count + 1), { headers: { "Cache-Control": "max-age=3600" } }));

    let body;
    try { body = await request.json(); } catch { return new Response("Bad JSON", { status: 400, headers: cors }); }
    if (!MODELS.includes(body.model)) body.model = MODELS[0];
    body.max_tokens = Math.min(body.max_tokens || 600, MAX_TOKENS_CAP);
    body.stream = false;

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    const text = await upstream.text();
    return new Response(text, { status: upstream.status, headers: { ...cors, "content-type": "application/json" } });
  },
};
