---
name: geo-ai-seo
description: >
  GEO (Generative Engine Optimization) — make a project discoverable, citable, and
  trustworthy for AI-powered search tools and autonomous agents (ChatGPT Search,
  Claude Search, Perplexity, Google AI Overviews, Gemini, Bing Copilot, Kagi, You.com,
  retrieval pipelines consuming Common Crawl). Produces seven simultaneous
  machine-readable surfaces — JSON-LD @graph, llms.txt, llms-full.txt, OpenAPI
  snapshot, robots.txt with AI-crawler allow-list, sitemap.xml, security.txt — plus
  credibility signals (SECURITY.md, CODE_OF_CONDUCT.md, CITATION.cff) and end-user
  integration recipes (bookmarklet, GitHub Action, Slack, MCP server). White-hat only:
  no cloaking, no hidden text, no keyword stuffing. Triggers on: "geo", "ai seo",
  "agent seo", "agents-detectable", "llms.txt", "ai discoverability", "GEO skill",
  "generative engine optimization", "schema.org", "FAQPage", "JSON-LD",
  "openapi snapshot", "crawl allow-list", "AI SEO bundle", or any request to make a
  project findable and citable by AI agents. Drop-in portable: the whole
  `.claude/skills/geo-ai-seo/` directory copies to any project's `.claude/skills/`.
---

# GEO — Generative Engine Optimization Skill

## Version 1.0 · Portable · LLM-agnostic

> Make any site/app discoverable and accurately citable by AI-powered search tools,
> autonomous agents, and retrieval pipelines. White-hat only.

## Why GEO is not SEO

Classical SEO ranks pages for humans scanning a SERP. GEO ranks *facts* for agents
that read a corpus, embed it, and generate an answer. The opponent model changes:

| Classical SEO                           | GEO (this skill)                              |
| --------------------------------------- | --------------------------------------------- |
| Rank for a keyword                      | Be cited verbatim in an LLM's answer          |
| Backlinks as authority                  | Verifiable, machine-readable claims           |
| Title tags and meta description         | JSON-LD + llms.txt + OpenAPI pointing at the same facts |
| Mobile-friendly, Core Web Vitals        | Crawler-allowed, embedding-friendly markdown  |
| One canonical format (HTML)             | Many formats, same ground truth               |

Rule of thumb: **every claim an agent could cite must map to a verifiable source in
your repository.** If it isn't true, don't publish it — an AI agent that hallucinates
on your behalf poisons your credibility signal.

## What this skill produces

Run the full bundle and your project ends up with:

### Discovery surfaces (served from the site root)

| File                         | Role                                              |
| ---------------------------- | ------------------------------------------------- |
| `llms.txt`                   | llmstxt.org-format summary (what, where, docs)    |
| `llms-full.txt`              | Expanded context for embedding pipelines          |
| `robots.txt`                 | Explicit allow-list for 20+ AI crawlers           |
| `sitemap.xml`                | Standard discovery                                |
| `.well-known/security.txt`   | RFC 9116 contact                                  |
| `humans.txt`                 | Authentic signature                               |
| `openapi.json`               | Machine-readable API for direct agent invocation  |
| `og-image.png` / `.svg`      | Social preview (1200×630)                         |
| `faq.html`                   | Visible FAQ + `FAQPage` JSON-LD                   |

### Structured data (inline in page `<head>`)

A JSON-LD `@graph` with: `Organization`, `WebSite` (with `SearchAction`),
`SoftwareApplication` (or `Article` / `Product`), `FAQPage`, `HowTo`,
`BreadcrumbList`. Plus `alternate` link rels for `llms.txt`, `llms-full.txt`,
`openapi.json` so crawlers can discover them from the page head.

### Credibility files (repo root)

| File                         | Signal                                   |
| ---------------------------- | ---------------------------------------- |
| `SECURITY.md`                | Responsible disclosure policy            |
| `CONTRIBUTING.md`            | Real project, real contributors welcome  |
| `CODE_OF_CONDUCT.md`         | Governance baseline                      |
| `CITATION.cff`               | Academic / indexed citability            |
| README badges                | Tests, license, build status, version    |

### End-user integrations

| Recipe                       | Why it matters for GEO                   |
| ---------------------------- | ---------------------------------------- |
| Browser bookmarklet          | One-click share widget → distribution    |
| GitHub Action                | Builds developer footprint on GitHub     |
| MCP server wrapper           | **Your API becomes an agent tool** — Claude/ChatGPT/Cursor can call it |
| Postman OpenAPI import       | Devrel friction removed                  |
| Slack slash command          | Shows up in team workspaces              |

## When to invoke

Trigger on: `geo`, `ai seo`, `agent seo`, `GEO skill`, `llms.txt`, `agents-detectable`,
`generative engine optimization`, or any request to make a project findable by AI
agents. Also suggest proactively when a project ships a landing page, API, or docs
site and lacks these surfaces.

## Minimal invocation

```
geo bundle init     # scaffold all surfaces with placeholders
geo bundle check    # audit current project against the checklist
geo openapi         # regenerate OpenAPI snapshot from a running FastAPI app
geo ogimage         # regenerate the social-share image
```

## Portability

Drop `.claude/skills/geo-ai-seo/` into any project's `.claude/skills/` directory.
The templates use `{{PROJECT_NAME}}`, `{{SITE_URL}}`, `{{DESCRIPTION}}`,
`{{REPO_URL}}` placeholders — rebind them from `package.json`, `pyproject.toml`,
or ask the user.

See `templates/` for the parameterized files and `README.md` for an extract-and-use
guide. Run `scripts/validate.py <site-dir>` to check a bundle's completeness.

## The seven commandments of white-hat GEO

1. **Truth over keyword stuffing.** Every claim maps to code or docs.
2. **Redundancy over single format.** Ship the same fact in JSON-LD, llms.txt, OpenAPI, and prose. Whichever format a retrieval pipeline consumes, it hits the same ground truth.
3. **Allow, don't block, AI crawlers** — unless you have a real reason. Most open-source projects *want* to be cited.
4. **Machine-readable API > prose descriptions of the API.** Ship `openapi.json` served with CORS.
5. **Credibility files are low-effort/high-leverage.** `SECURITY.md`, `CITATION.cff`, `CODE_OF_CONDUCT.md` register as "real project" markers for both humans and crawlers.
6. **MCP wrapper turns your API into an agent tool.** A four-line MCP server exposes any REST API to Claude / ChatGPT / Cursor. Treat it as the agentic-era "Zapier integration".
7. **No breadcrumbs that aren't yours.** Don't fabricate reviews, ratings, or quoted testimonials. An LLM that cites your fake data breaks trust the day it's audited.

## Checklist (summary — full in `CHECKLIST.md`)

- [ ] `site/llms.txt` — one short paragraph + links to key docs
- [ ] `site/llms-full.txt` — expanded version
- [ ] `site/robots.txt` — explicit allow-list for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Googlebot, Applebot-Extended, CCBot, Bingbot, Meta-ExternalAgent, Amazonbot, MistralAI-User, DeepSeekBot, DuckAssistBot, YouBot, Kagibot, etc.
- [ ] `site/sitemap.xml` with `lastmod` on every URL
- [ ] `site/.well-known/security.txt` (RFC 9116 — expires in 1 year)
- [ ] `site/humans.txt`
- [ ] `site/openapi.json` served with CORS (if the project has an API)
- [ ] `site/og-image.png` (1200×630, under 100 KB)
- [ ] `site/faq.html` with `FAQPage` schema (5–15 real Q&As)
- [ ] `<head>` JSON-LD `@graph` with `Organization`, `WebSite+SearchAction`, main entity (`SoftwareApplication` | `Product` | `Article`), `FAQPage` summary, `HowTo`, `BreadcrumbList`
- [ ] `<head>` alternate link rels for `llms.txt`, `llms-full.txt`, `openapi.json`
- [ ] Open Graph + Twitter card meta with `og:image`
- [ ] Netlify (or equivalent) headers: content-type pins for `.txt`, `/.well-known/*`; CORS on `openapi.json`
- [ ] Root `SECURITY.md`
- [ ] Root `CONTRIBUTING.md`
- [ ] Root `CODE_OF_CONDUCT.md`
- [ ] Root `CITATION.cff` (even for commercial projects — it's just metadata)
- [ ] README shields.io badges: license, version, tests, build status, container registry
- [ ] A bookmarklet + MCP server + at least one no-code integration (Zapier / GitHub Action / Slack)
- [ ] Every published URL returns the right `Content-Type` and `Cache-Control`
- [ ] `/llms.txt` serves with `X-Robots-Tag: all`
- [ ] Validate structured data at [Google Rich Results Test](https://search.google.com/test/rich-results) and [Schema.org Validator](https://validator.schema.org/)

## What this skill never does

- Hidden text / CSS cloaking / viewport tricks
- Doorway pages
- Fabricated reviews, testimonials, or star ratings
- Keyword stuffing in alt text or title tags
- Private PII (email, phone) in public machine-readable files
- Author-identifier breadcrumbs in generated content (keep attribution in commits, not in landing copy)

Legal, auditable, and reversible every step.
