const el = (id) => document.getElementById(id);

const urlInput = el("url");
const runBtn = el("run");
const ticketBtn = el("ticket");

const statusEl = el("status");
const snapEl = el("snapshot");
const findingsEl = el("findings");
const recsEl = el("recs");
const ticketOut = el("ticketOut");

function setStatus(msg){ statusEl.textContent = msg; }

function normalizeUrl(raw){
  const trimmed = (raw || "").trim();
  if(!trimmed) return null;
  try{
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return u.toString();
  }catch{ return null; }
}

function scoreLabel(n){
  if(n >= 85) return "Strong";
  if(n >= 65) return "Decent";
  if(n >= 45) return "Needs Work";
  return "Critical";
}

function addFinding(list, ok, text){
  list.push(`${ok ? "✅" : "⚠️"} ${text}`);
}

function addRec(list, text){
  list.push(`• ${text}`);
}

// Browser-only fetch is often blocked by CORS. We try anyway and then guide.
async function fetchHtml(targetUrl){
  const res = await fetch(targetUrl, { method:"GET", mode:"cors" });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function extractBetween(html, start, end){
  const s = html.indexOf(start);
  if(s === -1) return null;
  const e = html.indexOf(end, s + start.length);
  if(e === -1) return null;
  return html.slice(s + start.length, e);
}

function stripTags(s){
  return (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getTitle(html){
  const t = extractBetween(html, "<title>", "</title>");
  return t ? stripTags(t) : null;
}

function getMeta(html, name){
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, "i");
  const m = html.match(re);
  if(!m) return null;
  const tag = m[0];
  const c = tag.match(/content=["']([^"']+)["']/i);
  return c ? c[1].trim() : null;
}

function hasCanonical(html){
  return /<link[^>]+rel=["']canonical["']/i.test(html);
}

function countH1(html){
  const m = html.match(/<h1\b[^>]*>/gi);
  return m ? m.length : 0;
}

function hasViewport(html){
  return /<meta[^>]+name=["']viewport["']/i.test(html);
}

function hasOg(html){
  return /property=["']og:/i.test(html) || /name=["']twitter:/i.test(html);
}

function computeScore({title, desc, canonical, h1Count, viewport, og}){
  let score = 0;
  if(title && title.length >= 20 && title.length <= 65) score += 25;
  else if(title) score += 12;

  if(desc && desc.length >= 70 && desc.length <= 160) score += 25;
  else if(desc) score += 12;

  if(canonical) score += 12;
  if(h1Count === 1) score += 12;
  else if(h1Count > 1) score += 6;

  if(viewport) score += 8;
  if(og) score += 8;

  // light bonus if keywords-ish present
  if(title && /seo|audit|inspector|webmaster/i.test(title)) score += 5;
  if(desc && /seo|audit|inspector|webmaster/i.test(desc)) score += 5;

  return Math.min(100, score);
}

function renderResult(targetUrl, result){
  const lines = [];
  lines.push(`URL: ${targetUrl}`);
  lines.push(`Score: ${result.score}/100 (${scoreLabel(result.score)})`);
  lines.push(`Title: ${result.title || "—"}`);
  lines.push(`Meta description: ${result.desc || "—"}`);
  lines.push(`Canonical: ${result.canonical ? "Yes" : "No"}`);
  lines.push(`H1 count: ${result.h1Count}`);
  lines.push(`Viewport meta: ${result.viewport ? "Yes" : "No"}`);
  lines.push(`OpenGraph/Twitter tags: ${result.og ? "Yes" : "No"}`);
  snapEl.textContent = lines.join("\n");
}

function renderLists(findings, recs){
  findingsEl.textContent = findings.join("\n") || "—";
  recsEl.textContent = recs.join("\n") || "—";
}

function generateTicket(targetUrl){
  const now = new Date();
  const stamp = now.toISOString();
  return [
    "SEOInspectorAI — Ticket Mode",
    `Author: Webmaster Eric`,
    `Timestamp: ${stamp}`,
    `Target URL: ${targetUrl || "(not provided)"}`,
    "",
    "What I want:",
    "- A clear SEO inspection summary",
    "- Priority fixes (top 5)",
    "- Quick wins vs deeper fixes",
    "- Conversion notes (CTA + trust signals)",
    "",
    "Notes (optional):",
    "- Industry / location:",
    "- Goal (calls, leads, sales):",
    "- Competitors:",
  ].join("\n");
}

async function run(){
  ticketOut.textContent = "";
  const targetUrl = normalizeUrl(urlInput.value);
  if(!targetUrl){
    setStatus("Enter a valid URL (example: https://example.com).");
    return;
  }

  setStatus("Running inspection… (attempting to fetch page HTML)");
  snapEl.textContent = "Working…";
  findingsEl.textContent = "Working…";
  recsEl.textContent = "Working…";

  const findings = [];
  const recs = [];

  try{
    const html = await fetchHtml(targetUrl);

    const title = getTitle(html);
    const desc = getMeta(html, "description");
    const canonical = hasCanonical(html);
    const h1Count = countH1(html);
    const viewport = hasViewport(html);
    const og = hasOg(html);

    const score = computeScore({title, desc, canonical, h1Count, viewport, og});

    addFinding(findings, !!title, title ? "Title tag found" : "Missing <title>");
    addFinding(findings, !!desc, desc ? "Meta description found" : "Missing meta description");
    addFinding(findings, canonical, canonical ? "Canonical link found" : "Missing canonical link");
    addFinding(findings, h1Count === 1, h1Count ? `H1 tags detected: ${h1Count}` : "No H1 tag detected");
    addFinding(findings, viewport, viewport ? "Viewport meta present" : "Viewport meta missing");
    addFinding(findings, og, og ? "Social sharing tags present" : "No OG/Twitter tags found");

    if(!title) addRec(recs, "Add a unique title (20–65 chars) that includes the primary intent keyword.");
    if(!desc) addRec(recs, "Write a meta description (70–160 chars) that sells the click (benefit + proof + CTA).");
    if(!canonical) addRec(recs, "Add a canonical link tag to prevent duplicate URL issues.");
    if(h1Count !== 1) addRec(recs, "Use exactly one H1 that matches the page intent. Convert other H1s to H2/H3.");
    if(!og) addRec(recs, "Add OpenGraph + Twitter card tags for cleaner sharing + higher trust.");
    addRec(recs, "Add internal links to your money page and one supporting doc page (tight topical cluster).");

    renderResult(targetUrl, {title, desc, canonical, h1Count, viewport, og, score});
    renderLists(findings, recs);
    setStatus(`Done. Score: ${score}/100. If fetch worked, you’re seeing real HTML checks.`);
  }catch(err){
    // Most common: CORS
    setStatus("This site blocked browser fetching (CORS). Use Ticket Mode below — it always works.");
    snapEl.textContent = `URL: ${targetUrl}\n\nCORS blocked browser fetch.\nThis is normal.\nUse Ticket Mode to request the audit.`;
    addFinding(findings, false, "Browser fetch blocked (CORS)");
    addRec(recs, "Use Ticket Mode: it creates an audit request you can paste into your WooCommerce flow.");
    renderLists(findings, recs);
  }
}

runBtn.addEventListener("click", run);
urlInput.addEventListener("keydown", (e) => {
  if(e.key === "Enter") run();
});

ticketBtn.addEventListener("click", () => {
  const targetUrl = normalizeUrl(urlInput.value) || "";
  ticketOut.textContent = generateTicket(targetUrl);
});