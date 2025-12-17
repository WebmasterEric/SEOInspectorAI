async function runAudit() {
  const urlInput = document.getElementById("urlInput");
  const resultsBox = document.getElementById("results");
  let url = (urlInput.value || "").trim();

  if (!url) {
    resultsBox.innerHTML = "<p>Please enter a URL to audit.</p>";
    return;
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  resultsBox.innerHTML = "<p>Running SEO audit… (attempting to fetch page HTML)</p>";

  try {
    const res = await fetch(url, { method: "GET", mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // --- Checks (ported from your Python logic) ---
    const RULES = { title_length_max: 60, meta_description_min: 140, meta_description_max: 160, min_word_count: 800 };

    const stripTags = (s) => String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const extractText = (h) => stripTags(h.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<noscript[\s\S]*?<\/noscript>/gi," "));
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? stripTags(titleMatch[1]) : "";
    const metaTag = html.match(/<meta[^>]+name=["']description["'][^>]*>/i);
    const meta = metaTag ? (metaTag[0].match(/content=["']([^"']+)["']/i)?.[1] || "").trim() : "";
    const h1Count = (html.match(/<h1\b[^>]*>/gi) || []).length;
    const wordCount = extractText(html).split(/\s+/).filter(Boolean).length;
    const hasCanonical = /<link[^>]+rel=["']canonical["'][^>]*href=["'][^"']+["']/i.test(html);

    const checks = [];

    // Title
    if (!title) checks.push({ name:"Title Tag", status:"Missing", recommendation:"Add a keyword-optimized title under 60 characters." });
    else if (title.length > RULES.title_length_max) checks.push({ name:"Title Tag", status:"Needs Improvement", recommendation:`Shorten to under ${RULES.title_length_max} characters.` });
    else checks.push({ name:"Title Tag", status:"Good", recommendation:"Good title length — ensure it contains your primary keyword." });

    // Meta
    if (!meta) checks.push({ name:"Meta Description", status:"Missing", recommendation:`Add a ${RULES.meta_description_min}–${RULES.meta_description_max} character meta description with keyword + benefit.` });
    else if (meta.length < RULES.meta_description_min || meta.length > RULES.meta_description_max)
      checks.push({ name:"Meta Description", status:"Needs Improvement", recommendation:`Adjust to ${RULES.meta_description_min}–${RULES.meta_description_max} characters.` });
    else checks.push({ name:"Meta Description", status:"Good", recommendation:"Meta description length is optimal." });

    // H1
    if (h1Count === 0) checks.push({ name:"H1 Structure", status:"Missing", recommendation:"Add one clear, keyword-focused H1." });
    else if (h1Count > 1) checks.push({ name:"H1 Structure", status:"Needs Improvement", recommendation:"Use only one H1 tag per page." });
    else checks.push({ name:"H1 Structure", status:"Good", recommendation:"Good H1 usage — add supporting H2s for structure." });

    // Word count
    if (wordCount < RULES.min_word_count) checks.push({ name:"Content Depth", status:"Thin", recommendation:`Increase to at least ${RULES.min_word_count}–1200 words.` });
    else checks.push({ name:"Content Depth", status:"Good", recommendation:`Strong content length (${wordCount} words).` });

    // Canonical
    if (!hasCanonical) checks.push({ name:"Canonical Tag", status:"Missing", recommendation:"Add <link rel='canonical'> to prevent duplicate content." });
    else checks.push({ name:"Canonical Tag", status:"Good", recommendation:"Canonical tag is present." });

    const hasCritical = checks.some(c => c.status === "Missing" || c.status === "Thin" || c.status === "Thin Content");
    const overview = hasCritical
      ? "This page has strong content potential but several technical and on-page SEO issues that should be fixed."
      : "Automated SEO analysis completed successfully.";

    // Render
    let out = `<h2>SEO Report for ${url}</h2>`;
    out += `<p><strong>Overall:</strong> ${overview}</p>`;

    checks.forEach((c) => {
      out += `<div class="check"><h3>${c.name}</h3><p><strong>Status:</strong> ${c.status}</p><p>${c.recommendation}</p></div>`;
    });

    if (hasCritical) {
      out += `<div class="check" style="margin-top:16px;">
        <strong>Recommendation from Webmaster Eric:</strong><br>
        You have critical issues (missing essentials or thin content). If you want it fixed the right way, I can rebuild the foundation for you.
      </div>`;
    }

    out += `<div style="margin-top:18px;text-align:center;">
      <a href="https://store.webmastereric.com/product/seo-near-me-local-search-optimization-by-webmaster-eric/"
        target="_blank"
        style="display:inline-block;padding:12px 18px;background:#8a2be2;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
        Work Directly With Webmaster Eric
      </a>
    </div>`;

    resultsBox.innerHTML = out;

  } catch (err) {
    console.error(err);
    resultsBox.innerHTML =
      `<p><strong>Fetch blocked (CORS) or failed.</strong> This is normal for many sites.</p>
       <p>Try a different site like <code>https://example.com</code>, or use your paid audit link in the footer.</p>`;
  }
}