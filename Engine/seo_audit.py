#!/usr/bin/env python3
"""
SEOInspectorAI™ engine by Webmaster Eric

Usage:
    python engine/seo_audit.py https://example.com
This will overwrite engine/sample_report.json with a fresh audit.
"""

import sys
import json
import re
import requests
from bs4 import BeautifulSoup

RULES_PATH = "data/rules.json"
OUTPUT_PATH = "engine/sample_report.json"

def load_rules():
    with open(RULES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def fetch_html(url):
    headers = {"User-Agent": "SEOInspectorAI/1.0 (+github.com)"}
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    return resp.text

def extract_text(soup):
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator=" ")
    return re.sub(r"\s+", " ", text).strip()

def analyze(url, html, rules):
    soup = BeautifulSoup(html, "html.parser")
    checks = []

    # TITLE TAG
    title = soup.title.string.strip() if soup.title and soup.title.string else ""
    if not title:
        checks.append({
            "name": "Title Tag",
            "status": "Missing",
            "recommendation": "Add a keyword-optimized title under 60 characters."
        })
    else:
        if len(title) > rules["title_length_max"]:
            checks.append({
                "name": "Title Tag",
                "status": "Needs Improvement",
                "recommendation": f"Shorten to under {rules['title_length_max']} characters."
            })
        else:
            checks.append({
                "name": "Title Tag",
                "status": "Good",
                "recommendation": "Good title length — ensure it contains your primary keyword."
            })

    # META DESCRIPTION
    meta_desc_tag = soup.find("meta", attrs={"name": "description"})
    meta_desc = meta_desc_tag["content"].strip() if meta_desc_tag and meta_desc_tag.get("content") else ""
    if not meta_desc:
        checks.append({
            "name": "Meta Description",
            "status": "Missing",
            "recommendation": "Add a 140–160 character meta description with keyword + benefit."
        })
    else:
        if len(meta_desc) < rules["meta_description_min"] or len(meta_desc) > rules["meta_description_max"]:
            checks.append({
                "name": "Meta Description",
                "status": "Needs Improvement",
                "recommendation": f"Adjust to {rules['meta_description_min']}–{rules['meta_description_max']} characters."
            })
        else:
            checks.append({
                "name": "Meta Description",
                "status": "Good",
                "recommendation": "Meta description length is optimal."
            })

    # H1 CHECK
    h1_tags = soup.find_all("h1")
    if not h1_tags:
        checks.append({
            "name": "H1 Header",
            "status": "Missing",
            "recommendation": "Add one clear, keyword-focused H1."
        })
    elif len(h1_tags) > 1:
        checks.append({
            "name": "H1 Header",
            "status": "Needs Improvement",
            "recommendation": "Use only one H1 tag per page."
        })
    else:
        checks.append({
            "name": "H1 Header",
            "status": "Good",
            "recommendation": "Good H1 usage — ensure it matches search intent."
        })

    # WORD COUNT CHECK
    text = extract_text(soup)
    word_count = len(text.split())
    if word_count < rules["min_word_count"]:
        checks.append({
            "name": "Content Depth",
            "status": "Thin Content",
            "recommendation": f"Increase to at least {rules['min_word_count']} words."
        })
    else:
        checks.append({
            "name": "Content Depth",
            "status": "Good",
            "recommendation": f"Strong content length ({word_count} words)."
        })

    # CANONICAL CHECK
    canonical = soup.find("link", rel="canonical")
    if not canonical:
        checks.append({
            "name": "Canonical Tag",
            "status": "Missing",
            "recommendation": "Add <link rel='canonical'> to prevent duplicate content."
        })
    else:
        checks.append({
            "name": "Canonical Tag",
            "status": "Good",
            "recommendation": "Canonical tag is present."
        })

    return {
        "url": url,
        "overview": "Automated SEO analysis completed successfully.",
        "checks": checks
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: python engine/seo_audit.py https://example.com")
        sys.exit(1)

    url = sys.argv[1]
    html = fetch_html(url)
    rules = load_rules()
    report = analyze(url, html, rules)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"Report generated at {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
