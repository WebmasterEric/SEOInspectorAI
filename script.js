const urlInput = document.getElementById("urlInput");
const resultsBox = document.getElementById("results");
const runBtn = document.getElementById("runBtn");

const RULES = {
  title_length_max: 60,
  meta_description_min: 140,
  meta_description_max: 160,
  min_word_count: 800
};

function normalizeUrl(u){
  let url = (u || "").trim();
  if(!url) return "";
  if(!url.startsWith("http://") && !url.startsWith("https://")){
    url = "https://" + url;
  }
  return url;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripTags(s){
  return (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractText(html){
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

function hasImages(html){
  return /<img\b[^>]*>/i.test(html);
}

function hasAltIssues(html){
  // crude: count img tags missing alt=
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  let missing = 0;
  for(const img of imgs){
    if(!/alt\s*=\s*["'][^"']*["']/i.test(img)) missing++;
  }
  return { total: imgs.length, missing };
}

function badge(status){
  if(status === "Good") return `<span class="badge good">GOOD</span>`;
  if(status === "Needs Improvement") return `<span class="badge warn">FIX</span>`;
  return `<span class="badge bad">MISSING</span>`;
}

function buildChecks(url, html){
  const checks = [];

  // Title
  const title = getTitle(html);
  if(!title){
    checks.push({ name:"Title Tag", status:"Missing", recommendation:"Add your primary keyword and keep the title under 60 characters." });
  }else if(title.length > RULES.title_length_max){
    checks.push({ name:"Title Tag", status:"Needs Improvement", recommendation:`Shorten your title to under ${RULES.title_length_max} characters and keep the keyword near the beginning.` });
  }else{
    checks.push({ name:"Title Tag", status:"Good", recommendation:"Title length is solid. Ensure it includes your primary keyword + a benefit." });
  }

  // Meta description
  const meta = getMetaDescription(html);
  if(!meta){
    checks.push({ name:"Meta Description", status:"Missing", recommendation:`Write a compelling ${RULES.meta_description_min}–${RULES.meta_description_max} character description with keyword + benefit.` });
  }else if(meta.length < RULES.meta_description_min || meta.length > RULES.meta_description_max){
    checks.push({ name:"Meta Description", status:"Needs Improvement", recommendation:`Adjust meta description to ${RULES.meta_description_min}–${RULES.meta_description_max} characters.` });
  }else{
    checks.push({ name:"Meta Description", status:"Good", recommendation:"Meta description length is in the ideal range." });
  }

  // H1
  const h1Count = getH1Count(html);
  if(h1Count === 0){
    checks.push({ name:"H1 Structure", status:"Missing", recommendation:"Add one clear H1 that matches search intent and includes the main topic." });
  }else if(h1Count > 1){
    checks.push({ name:"H1 Structure", status:"Needs Improvement", recommendation:"Use only one H1. Move extra headings to H2/H3." });
  }else{
    checks.push({ name:"H1 Structure", status:"Good", recommendation:"You have a single descriptive H1. Add supporting H2s to strengthen structure." });
  }

  // Word count / depth
  const wordCount = extractText(html).split(/\s+/).filter(Boolean).length;
  if(wordCount < RULES.min_word_count){
    checks.push({ name:"Content Depth", status:"Thin", recommendation:`Increase the page to at least ${RULES.min_word_count}–1200 words of helpful, intent-matching content.` });
  }else{
    checks.push({ name:"Content Depth", status:"Good", recommendation:`Strong content length (${wordCount} words). Improve structure and internal linking.` });
  }

  // Canonical
  if(!hasCanonical(html)){
    checks.push({ name:"Canonical Tag", status:"Missing", recommendation:"Add a canonical URL tag to prevent duplicate content issues." });
  }else{
    checks.push({ name:"Canonical Tag", status:"Good", recommendation:"Canonical tag found. Confirm it points to the preferred URL." });
  }

  // Images / ALT
  const imgInfo = hasAltIssues(html);
  if(imgInfo.total === 0){
    checks.push({ name:"Image Optimization", status:"Needs Improvement", recommendation:"Add relevant images and include descriptive ALT text for accessibility + SEO." });
  }else if(imgInfo.missing > 0){
    checks.push({ name:"Image Optimization", status:"Needs Improvement", recommendation:`${imgInfo.missing} image(s) missing ALT text. Add descriptive ALT and compress large images.` });
  }else{
    checks.push({ name:"Image Optimization", status:"Good", recommendation:"Images found with ALT text. Consider compression + modern formats (WebP/AVIF)." });
  }

  const hasCritical = checks.some(c => c.status === "Missing" || c.status === "Thin" || c.status === "Thin Content");
  const overview =
    hasCritical
      ? "This page has strong content potential but several technical and on-page SEO issues that should be fixed."
      : "Automated SEO analysis completed successfully. You have a solid foundation — now refine structure and intent."

  return { url, overview, checks, word_count: wordCount };
}

function renderReport(report){
  let html = `<h2>SEO Report for ${escapeHtml(report.url)}</h2>`;
  html += `<p><strong>Overall:</strong> ${escapeHtml(report.overview)}</p>`;

  report.checks.forEach((check) => {
    html += `
      <div class="check">
        <h3>${escapeHtml(check.name)} ${badge(check.status)}</h3>
        <p><strong>Status:</strong> ${escapeHtml(check.status)}</p>
        <p>${escapeHtml(check.recommendation)}</p>
      </div>
    `;
  });

  const hasCritical = report.checks.some(c =>
    c.status === "Missing" || c.status === "Thin" || c.status === "Thin Content"
  );

  if (hasCritical) {
    html += `
      <div class="check">
        <h3>Recommendation from Webmaster Eric <span class="badge bad">CRITICAL</span></h3>
        <p>Your site has one or more <em>critical SEO issues</em> like missing essentials or thin content.</p>
        <p>If you want your SEO foundation fixed the right way, I can personally rebuild it for you.</p>
      </div>
    `;
  }

  html += `
    <div class="check">
      <h3>Pro Insight from Webmaster Eric <span class="badge warn">PRO</span></h3>
      <p>Automated audits spot issues fast — but real growth happens when a human expert rewrites structure, aligns pages to search intent, and builds topical authority.</p>
      <p style="text-align:center;margin-top:12px;">
        <a href="https://store.webmastereric.com/product/seo-near-me-local-search-optimization-by-webmaster-eric/"
          target="_blank" rel="noopener"
          style="display:inline-block;padding:12px 18px;background:#8a2be2;color:white;border-radius:10px;text-decoration:none;font-weight:700;">
          Work Directly With Webmaster Eric
        </a>
      </p>
    </div>
  `;

  resultsBox.innerHTML = html;
}

function renderTicketMode(url){
  const ticket = `SEOInspectorAI Ticket Mode
URL: ${url}

Goal:
- I want my page to rank and convert.

Notes (optional):
- Business type:
- Location:
- Top competitor:
- Target keyword:
`;
  resultsBox.innerHTML = `
    <h2>Ticket Mode (This Site Blocked Browser Fetch)</h2>
    <p>This is normal. Many sites block in-browser audits. Copy the ticket below and submit it with your order/request.</p>
    <pre style="white-space:pre-wrap;background:rgba(0,0,0,.35);padding:12px;border-radius:12px;border:1px solid var(--line);">${escapeHtml(ticket)}</pre>
    <p style="text-align:center;margin-top:12px;">
      <a href="https://store.webmastereric.com/product/seo-near-me-local-search-optimization-by-webmaster-eric/"
        target="_blank" rel="noopener"
        style="display:inline-block;padding:12px 18px;background:#8a2be2;color:white;border-radius:10px;text-decoration:none;font-weight:700;">
        Submit Ticket + Get Help
      </a>
    </p>
  `;
}

async function runAudit(){
  const raw = urlInput.value;
  const url = normalizeUrl(raw);

  if(!url){
    resultsBox.innerHTML = "<p>Please enter a URL to audit.</p>";
    return;
  }

  resultsBox.innerHTML = "<p>Running SEO audit… (attempting to fetch page HTML)</p>";

  try{
    const res = await fetch(url, { method:"GET", mode:"cors" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const report = buildChecks(url, html);
    renderReport(report);
  }catch(err){
    console.log("Fetch blocked / failed:", err);
    renderTicketMode(url);
  }
}

runBtn.addEventListener("click", runAudit);
urlInput.addEventListener("keydown", (e) => { if(e.key === "Enter") runAudit(); });