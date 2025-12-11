async function runAudit() {
  const urlInput = document.getElementById("urlInput");
  const resultsBox = document.getElementById("results");
  const url = urlInput.value.trim();

  if (!url) {
    resultsBox.innerHTML = "<p>Please enter a URL to audit.</p>";
    return;
  }

  resultsBox.innerHTML = "<p>Running SEO audit… (demo data)</p>";

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

    html += `<p style="margin-top:14px;opacity:0.8;">
      This is a demo report based on the latest engine run.
      For a real human-run SEO audit and implementation,
      work directly with Webmaster Eric using the button below.
    </p>`;

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
