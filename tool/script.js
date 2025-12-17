async function runAudit() {
  const urlInput = document.getElementById("urlInput");
  const resultsBox = document.getElementById("results");
  const url = urlInput.value.trim();

  if (!url) {
    resultsBox.innerHTML = "<p>Please enter a URL to audit.</p>";
    return;
  }

  resultsBox.innerHTML = "<p>Running SEO audit… (loading latest report)</p>";

  try {
    const response = await fetch("engine/sample_report.json");
    const data = await response.json();

    let html = `<h2>SEO Report for ${escapeHtml(url)}</h2>`;

    if (data.overview) {
      html += `<p><strong>Overall:</strong> ${escapeHtml(data.overview)}</p>`;
    }

    if (data.checks && data.checks.length) {
      data.checks.forEach((check) => {
        html += `
          <div class="check">
            <h3>${escapeHtml(check.name)}</h3>
            <p><strong>Status:</strong> ${escapeHtml(check.status)}</p>
            <p>${escapeHtml(check.recommendation)}</p>
          </div>
        `;
      });
    } else {
      html += `<p>No detailed checks found in the report.</p>`;
    }

    // 🔴 Soft “critical issues” notice (only if things are bad)
    const hasCritical = data.checks && data.checks.some(c =>
      c.status === "Missing" ||
      c.status === "Thin" ||
      c.status === "Thin Content"
    );

    if (hasCritical) {
      html += `
        <div style="margin-top:20px;padding:15px;background:#1b1b2b;border-radius:8px;font-size:0.95rem;line-height:1.5;">
          <strong>Recommendation from Webmaster Eric:</strong><br>
          Your site has one or more <em>critical SEO issues</em> like missing essentials or thin content.
          Pages with these problems usually struggle to rank, even if you get backlinks.<br><br>
          If you want your SEO foundation fixed the right way, I can personally rebuild it for you.
        </div>
      `;
    }

    // 🟣 Pro-tip + CTA (soft sell)
    html += `
      <br><br>
      <div class="pro-tip" style="opacity:0.9;margin-top:12px;font-size:0.95rem;line-height:1.5;">
        <strong>Pro Insight from Webmaster Eric:</strong><br>
        Automated audits are powerful for spotting issues fast — but real growth happens when a human expert
        rewrites structure, aligns pages to search intent, and builds topical authority around your brand.
      </div>

      <div style="margin-top:18px;text-align:center;">
        <a href="https://store.webmastereric.com/product/seo-near-me-local-search-optimization-by-webmaster-eric/"
           target="_blank"
           style="display:inline-block;padding:12px 18px;background:#8a2be2;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
           Work Directly With Webmaster Eric
        </a>
      </div>
    `;

    resultsBox.innerHTML = html;
  } catch (err) {
    console.error(err);
    resultsBox.innerHTML =
      "<p>Something went wrong loading the audit report.</p>";
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}