# GEO checklist — audit your project

A yes/no checklist. One missing item may or may not matter; many missing items means the AI retrieval pipelines are guessing at what you are.

## 1. Discoverability surfaces

- [ ] `/llms.txt` exists at site root (llmstxt.org format, ≤ 20 lines in the intro)
- [ ] `/llms-full.txt` exists with expanded context (facts only, no marketing)
- [ ] `/robots.txt` exists
- [ ] `/robots.txt` names a sitemap
- [ ] `/robots.txt` explicitly allows the big AI crawlers: `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-SearchBot`, `Claude-Web`, `anthropic-ai`, `PerplexityBot`, `Perplexity-User`, `Google-Extended`, `Googlebot`, `Applebot-Extended`, `CCBot`, `Bingbot`, `Meta-ExternalAgent`, `Amazonbot`, `MistralAI-User`, `DeepSeekBot`, `DuckAssistBot`, `YouBot`, `Kagibot`, `cohere-ai`, `Bytespider`
- [ ] `/sitemap.xml` exists with every public URL
- [ ] Every `<url>` in the sitemap has `<lastmod>`
- [ ] `/.well-known/security.txt` exists (RFC 9116)
- [ ] `security.txt` has `Expires:` less than 1 year away
- [ ] `security.txt` contact is a safe public channel (GitHub Security Advisories, dedicated alias — never personal email)
- [ ] `/humans.txt` exists
- [ ] `/openapi.json` exists if you expose an API, served with `Access-Control-Allow-Origin: *`
- [ ] `/og-image.png` is 1200×630, under 100 KB

## 2. Inline structured data (page `<head>`)

- [ ] JSON-LD `@graph` block (single `<script>` is cleaner than N separate blocks)
- [ ] `Organization` entity with `name`, `url`, `logo`, `sameAs`
- [ ] `WebSite` entity with `potentialAction: SearchAction`
- [ ] Main entity: `SoftwareApplication` | `Product` | `Article` | … as appropriate
- [ ] `FAQPage` entity on the landing page (summary) and full page (`/faq.html`)
- [ ] `HowTo` entity for your primary user flow
- [ ] `BreadcrumbList` entity
- [ ] All JSON-LD passes the [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] All JSON-LD passes the [Schema.org Validator](https://validator.schema.org/)
- [ ] `<link rel="alternate" type="text/plain" href="/llms.txt">`
- [ ] `<link rel="alternate" type="text/plain" href="/llms-full.txt">`
- [ ] `<link rel="alternate" type="application/json" href="/openapi.json">`
- [ ] `<link rel="canonical">` on every page

## 3. Open Graph + Twitter

- [ ] `og:title`, `og:description`, `og:type`, `og:url`, `og:site_name`
- [ ] `og:image` (absolute URL), `og:image:width`, `og:image:height`, `og:image:alt`
- [ ] `twitter:card = summary_large_image`
- [ ] `twitter:title`, `twitter:description`, `twitter:image`, `twitter:image:alt`
- [ ] Share the home URL in Slack / X / LinkedIn / Discord — preview card renders correctly

## 4. Server behaviour (headers)

- [ ] `.txt` files served as `text/plain; charset=utf-8`
- [ ] `.xml` files served as `application/xml; charset=utf-8`
- [ ] `.json` files served as `application/json; charset=utf-8`
- [ ] `/openapi.json` sends `Access-Control-Allow-Origin: *`
- [ ] `/llms.txt`, `/llms-full.txt` send `X-Robots-Tag: all`
- [ ] Sensible `Cache-Control` on discovery files (1h for llms.txt / robots.txt, 24h for humans.txt, 7d for images)
- [ ] Hardening headers present: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` locks down what the page doesn't use (geolocation, camera, microphone, payment)

## 5. Credibility files (repo root)

- [ ] `LICENSE`
- [ ] `SECURITY.md`
- [ ] `CONTRIBUTING.md`
- [ ] `CODE_OF_CONDUCT.md`
- [ ] `CITATION.cff` (CFF 1.2.0; covers academic + Zenodo + GitHub's citation widget)
- [ ] `CHANGELOG.md`
- [ ] README shields.io badges: license, version, test status, container image, deploy status

## 6. End-user integration surface

- [ ] At least one no-install recipe (bookmarklet / curl one-liner)
- [ ] A GitHub Action YAML snippet (if relevant)
- [ ] An MCP server wrapper (if you have an API) — this turns your product into a tool agents can call
- [ ] A Postman / Insomnia link-to-import (the OpenAPI URL works)
- [ ] A Slack slash-command or Zapier webhook recipe
- [ ] All of these live in one `INTEGRATE.md` or `/integrations/` directory

## 7. Honesty audit

- [ ] Every claim on the landing page maps to code, tests, or docs
- [ ] No fabricated reviews, ratings, or testimonials
- [ ] No fabricated pricing (if the hosted tier doesn't exist yet, say "self-host for now")
- [ ] No hidden text, CSS cloaking, or `visibility:hidden` filler
- [ ] No keyword stuffing in alt text or title tags
- [ ] No `@author` breadcrumbs that aren't the actual author

## 8. Performance

- [ ] Landing page serves in under 1s on a cold cache from a mid-tier VPS
- [ ] Core Web Vitals green (LCP < 2.5s, CLS < 0.1, INP < 200ms) — they still affect Google indexing and therefore AI Overviews
- [ ] No render-blocking third-party scripts
- [ ] Total page weight under 200 KB for the critical path

## 9. Verification

- [ ] `curl -I` on each discovery URL returns 200 + correct content-type
- [ ] Rich Results Test passes on landing page and FAQ page
- [ ] Share preview tested in at least two destinations (X + Slack is the minimum)
- [ ] An LLM-powered search (ChatGPT Search / Perplexity / Claude Search) asked about the project returns something close to the ground truth within a week of publishing

## 10. Monitoring (optional but recommended)

- [ ] Log AI-crawler hits by user-agent so you can see which engines are indexing you
- [ ] Set up a weekly check that `openapi.json` matches the deployed API (freshness)
- [ ] Alert if any discovery URL starts returning 4xx / 5xx
