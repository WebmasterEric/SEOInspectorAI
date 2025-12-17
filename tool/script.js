const $ = (id) => document.getElementById(id);

const urlEl = $("url");
const runEl = $("run");
const msgEl = $("msg");
const resultsEl = $("results");
const reportEl = $("report");

const RULES = {
  title_length_max: 60,
  meta_description_min: 140,
  meta_description_max: 160,
  min_word_count: 800,
};

function normalizeUrl(raw){
  const t = (raw || "").trim();
  if(!t) return null;
  try{
    const u = new URL(t.startsWith("http") ? t : `https://${t}`);
    return u.toString();
  }catch{
    return null;
  }
}

function stripTags(s){
  return (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractText(html){
  // remove script/style/noscript blocks quickly
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  return stripTags(cleaned);
}

function getTitle(html){
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]) : "";
}

function getMetaDescription(html){
  const m = html.match(/<meta[^>]+name=["']description["'][^>]*>/i);
  if(!m) return "";
  const tag = m[0];
  const c = tag.match(/content=["']([^"']+)["']/i);
  return c ? c[1].trim() : "";
}

function getH1Count(html){
  const m = html.match(/<h1\b[^>]*>/gi);
  return m ? m.length : 0;
}

function hasCanonical(html){
  return /<link[^>]+rel=["']canonical["'][^>]*href=["'][^"']+["']/i.test(html);
}

function buildReport(url, html){
  const checks = [];

  // Title
  const title = getTitle(html);
  if(!title){
    checks.push({ name:"Title Tag", status:"Missing",
      recommendation:"Add a clear, descriptive title including your primary keyword." });
  } else if(title.length > RULES.title_length_max){
    checks.push({ name:"Title Tag", status:"Needs Improvement",
      recommendation:`Shorten your title to under ${RULES.title_length_max} characters and keep your primary keyword near the beginning.` });
  } else {
    checks.push({ name:"Title Tag", status:"Good",
      recommendation:"Your title length looks good. Make sure it includes your primary keyword and a strong benefit." });
  }

  // Meta description
  const meta = getMetaDescription(html);
  if(!meta){
    checks.push({ name:"Meta Description", status:"Missing",
      recommendation:`Add a ${RULES.meta_description_min}–${RULES.meta_description_max} character meta description with your primary keyword and a clear call to action.` });
  } else if(meta.length < RULES.meta_description_min || meta.length > RULES.meta_description_max){
    checks.push({ name:"Meta Description", status:"Needs Improvement",
      recommendation:`Adjust your meta description to be between ${RULES.meta_description_min} and ${RULES.meta_description_max} characters, keeping it compelling and keyword-rich.` });
  } else {
    checks.push({ name:"Meta Description", status:"Good",
      recommendation:"Your meta description length looks good. Make sure it clearly explains the page and invites clicks." });
  }

  // H1
  const h1Count = getH1Count(html);
  if(h1Count === 0){
    checks.push({ name:"H1 Structure", status:"Missing",
      recommendation:"Add a single H1 headline that clearly describes the main topic of the page." });
  } else if(h1Count > 1){
    checks.push({ name:"H1 Structure", status:"Needs Improvement",
      recommendation:"Use only one H1 per page for clarity, and move additional headings to H2 or H3 tags." });
  } else {
    checks.push({ name:"H1 Structure", status:"Good",
      recommendation:"Your H1 usage looks good. Ensure it includes your main keyword and speaks to user intent." });
  }

  // Word count
  const text = extractText(html);
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if(wordCount < RULES.min_word_count){
    checks.push({ name:"Word Count", status:"Thin",
      recommendation:`Your page has about ${wordCount} words. Aim for at least ${RULES.min_word_count} high-quality, relevant words to compete in organic search.` });
  } else {
    checks.push({ name:"Word Count", status:"Good",
      recommendation:`Your content length (${wordCount} words) is strong. Focus on clarity, structure, and keyword alignment.` });
  }

  // Canonical
  const canonical = hasCanonical(html);
  if(!canonical){
    checks.push({ name:"Canonical URL", status:"Missing",
      recommendation:"Add a canonical link tag to avoid duplicate content issues and clearly indicate the preferred URL." });
  } else {
    checks.push({ name:"Canonical URL", status:"Good",
      recommendation:"Canonical tag found. Ensure it points to the preferred version of this page." });
  }

  return {
    overview:
      "Quick SEO overview for this URL. This automated report highlights key on-page elements. " +
      "For a deep, human-run SEO strategy and implementation, work directly with Webmaster Eric.",
    url,
    word_count: wordCount,
    checks
  };
}

async function run(){
  resultsEl.classList.add("hidden");
  reportEl.textContent = "";

  const url = normalizeUrl(urlEl.value);
  if(!url){
    msgEl.textContent = "Enter a valid URL (example: https://example.com).";
    return;
  }

  msgEl.textContent = "Running audit…";

  try{
    // NOTE: Many sites block this via CORS. If blocked, we fall back.
    const res = await fetch(url, { method:"GET", mode:"cors" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const report = buildReport(url, html);
    resultsEl.classList.remove("hidden");
    reportEl.textContent = JSON.stringify(report, null, 2);
    msgEl.textContent = "Audit complete.";
  }catch(e){
    msgEl.textContent =
      "This site blocked browser fetching (CORS). That’s normal. " +
      "If you want, I’ll add Ticket Mode so users can submit the URL and you run the audit offsite.";
  }
}

runEl.addEventListener("click", run);
urlEl.addEventListener("keydown", (e) => { if(e.key === "Enter") run(); });
