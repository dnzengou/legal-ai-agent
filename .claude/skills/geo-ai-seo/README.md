# geo-ai-seo — extract and reuse

This skill is self-contained. Lift `.claude/skills/geo-ai-seo/` into any other project's `.claude/skills/` directory and it works the same way.

## What's inside

```
.claude/skills/geo-ai-seo/
├── SKILL.md            # Claude Skill definition (triggers, scope, when to use)
├── README.md           # this file — extraction guide
├── CHECKLIST.md        # full audit checklist for any project
├── templates/
│   ├── llms.txt.tpl
│   ├── llms-full.txt.tpl
│   ├── robots.txt
│   ├── sitemap.xml.tpl
│   ├── security.txt.tpl
│   ├── humans.txt.tpl
│   ├── jsonld-graph.json.tpl
│   ├── faq.html.tpl
│   └── netlify-headers.toml
└── scripts/
    ├── generate_openapi.py    # snapshot a FastAPI app's OpenAPI spec
    ├── generate_og_image.py   # produce a 1200×630 PNG + SVG
    └── validate.py            # audit a site/ dir against the checklist
```

## Placeholders

Templates use mustache-style placeholders. Rebind them from your project's metadata:

| Placeholder          | Source                                                  |
| -------------------- | ------------------------------------------------------- |
| `{{PROJECT_NAME}}`   | `package.json#name`, `pyproject.toml[project.name]`, repo name |
| `{{SITE_URL}}`       | Netlify / Vercel / Pages URL; custom domain if set      |
| `{{DESCRIPTION}}`    | One-sentence project description                        |
| `{{REPO_URL}}`       | GitHub / GitLab repository URL                          |
| `{{LICENSE}}`        | SPDX identifier (MIT, Apache-2.0, …)                    |
| `{{VERSION}}`        | `package.json#version` or latest Git tag                |
| `{{AUTHOR_NAME}}`    | Repo owner (handle is fine)                             |
| `{{YEAR}}`           | Current year                                            |

Either hand-fill them with your editor's find-and-replace, or script it with `envsubst` / a small Python loop.

## Drop-in procedure for a new project

```bash
# 1. Copy the skill
cp -r /path/to/legal-ai-agent/.claude/skills/geo-ai-seo ./.claude/skills/

# 2. Scaffold site/ artifacts from templates
mkdir -p site/.well-known
cp .claude/skills/geo-ai-seo/templates/robots.txt            site/robots.txt
cp .claude/skills/geo-ai-seo/templates/llms.txt.tpl          site/llms.txt
cp .claude/skills/geo-ai-seo/templates/llms-full.txt.tpl     site/llms-full.txt
cp .claude/skills/geo-ai-seo/templates/sitemap.xml.tpl       site/sitemap.xml
cp .claude/skills/geo-ai-seo/templates/humans.txt.tpl        site/humans.txt
cp .claude/skills/geo-ai-seo/templates/security.txt.tpl      site/.well-known/security.txt
cp .claude/skills/geo-ai-seo/templates/faq.html.tpl          site/faq.html

# 3. Rebind placeholders — pick your favourite method
#    (manual editor find-and-replace is fine for a one-off)

# 4. Generate the OpenAPI snapshot (if you have a FastAPI app)
python .claude/skills/geo-ai-seo/scripts/generate_openapi.py \
  --app api.app:app --out site/openapi.json

# 5. Generate the OG image
python .claude/skills/geo-ai-seo/scripts/generate_og_image.py \
  --title "legal-ai-agent" --tagline "First-pass legal analysis in seconds." \
  --url "legal-ai-agent.netlify.app" --out site/og-image.png

# 6. Validate
python .claude/skills/geo-ai-seo/scripts/validate.py site/

# 7. Deploy
# netlify.toml handles cache + content-type pins — copy templates/netlify-headers.toml too
```

## Validate what you shipped

```bash
python .claude/skills/geo-ai-seo/scripts/validate.py site/
```

The validator checks:

- Every expected file is present and non-empty.
- Each `.txt` file parses as UTF-8.
- `sitemap.xml` and `openapi.json` parse.
- Every URL in sitemap uses the same origin.
- `robots.txt` references the sitemap.
- `security.txt`'s `Expires` is in the future.
- JSON-LD in `faq.html` validates as `FAQPage`.

## As a standalone package

If you want to ship this as its own repo (e.g. `github.com/you/geo-skill`), the `.claude/skills/geo-ai-seo/` directory is the whole package. Nothing in it depends on legal-ai-agent — the templates are parameterized and the scripts take CLI args.

For publishing to PyPI as a CLI (e.g. `pipx install geo-skill` → `geo init`), wrap `scripts/validate.py` + the scaffolder logic behind a `typer` or `click` entrypoint. Under 150 lines.

## License

MIT — same as the parent project. Lift, fork, extend, charge for it. No attribution required but welcome.
