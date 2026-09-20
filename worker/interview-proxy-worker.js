// Cloudflare Worker: the free AI interviewer for the mock interview page,
// plus the anonymous score log used by results.html.
//   POST /            chat (interviewer)         body: {system, messages, max_tokens}
//   POST /score       log a score                body: {paper, score}
//   GET  /stats       read a distribution        ?paper=setB-p1
//
// It holds the API key server-side, so visitors need no key and no sign-up.
// It caps spending three ways: a per-visitor daily limit, a site-wide daily
// limit, and a hard cap on tokens per request. It can run on Anthropic or on
// Google's Gemini free tier, and returns the Anthropic response shape either
// way, so the page needs no changes when you switch.
//
// SETUP
//   1. npm i -g wrangler && wrangler login
//   2. wrangler kv namespace create IV        (put the id in wrangler.toml)
//   3. wrangler secret put ANTHROPIC_API_KEY  (and/or GEMINI_API_KEY)
//   4. wrangler deploy
//   5. Paste the deployed URL into FREE_PROXY at the top of the script in
//      interviews.html, then push the site.
//   6. Set a monthly spend limit in the Anthropic console as a backstop.

const ALLOWED_ORIGINS = [
  "https://kevinvariant08.github.io",
  // add a custom domain here if you buy one
];

const CONFIG = {
  backend: "anthropic",        // "anthropic" or "gemini"
  anthropicModel: "claude-haiku-4-5-20251001",
  geminiModel: "gemini-2.0-flash",
  maxTokensCap: 900,           // per reply
  perVisitorPerDay: 45,        // ~2 full interviews
  sitePerDay: 1200,            // site-wide circuit breaker
  maxMessages: 60,             // reject runaway conversations
  maxChars: 24000,             // reject oversized payloads
};

const PAPERS = { "setA-p1": 20, "setA-p2": 20, "setB-p1": 20, "setB-p2": 20 }; // id -> max score
const SCORES_PER_IP_PER_DAY = 8;

const DAY = () => new Date().toISOString().slice(0, 10);

function corsFor(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}

function refuse(status, message, cors) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

// Count a request against a KV counter that expires at the end of the day.
async function bump(kv, key, limit) {
  const current = parseInt((await kv.get(key)) || "0", 10);
  if (current >= limit) return false;
  await kv.put(key, String(current + 1), { expirationTtl: 60 * 60 * 26 });
  return true;
}

async function callAnthropic(env, body) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CONFIG.anthropicModel,
      max_tokens: body.max_tokens,
      system: body.system,
      messages: body.messages,
    }),
  });
  return { status: res.status, text: await res.text() };
}

// Gemini speaks a different dialect; translate in and out so the page sees
// the Anthropic shape it already understands.
async function callGemini(env, body) {
  const contents = body.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content) }],
  }));
  const payload = {
    contents,
    systemInstruction: { parts: [{ text: body.system }] },
    generationConfig: { maxOutputTokens: body.max_tokens, temperature: 0.7 },
  };
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    CONFIG.geminiModel +
    ":generateContent?key=" +
    env.GEMINI_API_KEY;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { status: res.status, text: await res.text() };
  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join("\n");
  return {
    status: 200,
    text: JSON.stringify({ content: [{ type: "text", text }] }),
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsFor(origin);

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const path = new URL(request.url).pathname;

    // ---- score distribution (read) ----
    if (request.method === "GET" && path === "/stats") {
      const paper = new URL(request.url).searchParams.get("paper");
      if (!PAPERS[paper]) return refuse(400, "Unknown paper.", cors);
      const raw = await env.IV.get(`stats:${paper}`);
      const counts = raw ? JSON.parse(raw) : new Array(PAPERS[paper] + 1).fill(0);
      return new Response(JSON.stringify({ paper, counts }), { headers: { ...cors, "content-type": "application/json", "cache-control": "no-store" } });
    }

    if (request.method !== "POST") return refuse(405, "POST only", cors);
    if (!ALLOWED_ORIGINS.includes(origin)) return refuse(403, "This service only serves the site it was built for.", cors);

    // ---- score log (write) ----
    if (path === "/score") {
      let sb;
      try { sb = await request.json(); } catch { return refuse(400, "Malformed request.", cors); }
      const max = PAPERS[sb.paper];
      const s = Number(sb.score);
      if (!max) return refuse(400, "Unknown paper.", cors);
      if (!Number.isInteger(s) || s < 0 || s > max) return refuse(400, "Score out of range.", cors);
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      if (!(await bump(env.IV, `sc:${ip}:${DAY()}`, SCORES_PER_IP_PER_DAY)))
        return refuse(429, "That is enough scores for one day from this connection.", cors);
      const key = `stats:${sb.paper}`;
      const raw = await env.IV.get(key);
      const counts = raw ? JSON.parse(raw) : new Array(max + 1).fill(0);
      counts[s] = (counts[s] || 0) + 1;
      await env.IV.put(key, JSON.stringify(counts));
      return new Response(JSON.stringify({ ok: true, counts }), { headers: { ...cors, "content-type": "application/json" } });
    }

    // ---- interviewer chat ----

    let body;
    try {
      body = await request.json();
    } catch {
      return refuse(400, "Malformed request.", cors);
    }
    if (!Array.isArray(body.messages) || !body.system) return refuse(400, "Missing system or messages.", cors);
    if (body.messages.length > CONFIG.maxMessages) return refuse(400, "That conversation is longer than the interviewer accepts.", cors);
    if (JSON.stringify(body).length > CONFIG.maxChars) return refuse(400, "That request is too large.", cors);
    body.max_tokens = Math.min(Number(body.max_tokens) || 600, CONFIG.maxTokensCap);

    const day = DAY();
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    if (!(await bump(env.IV, `site:${day}`, CONFIG.sitePerDay)))
      return refuse(429, "The free interviewer has used up today's budget. Switch to self-guided in settings, or add your own key to carry on now.", cors);

    if (!(await bump(env.IV, `ip:${ip}:${day}`, CONFIG.perVisitorPerDay)))
      return refuse(429, "You have used today's free interviews. Come back tomorrow, run self-guided, or add your own key.", cors);

    const useGemini = CONFIG.backend === "gemini" && env.GEMINI_API_KEY;
    let out;
    try {
      out = useGemini ? await callGemini(env, body) : await callAnthropic(env, body);
    } catch (e) {
      return refuse(502, "The interviewer could not be reached. Try again in a moment.", cors);
    }
    if (out.status !== 200) return refuse(502, "The interviewer returned an error. Try again, or run self-guided.", cors);

    return new Response(out.text, {
      status: 200,
      headers: { ...cors, "content-type": "application/json" },
    });
  },
};
