<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FAQ — {{PROJECT_NAME}}</title>
  <meta name="description" content="Common questions about {{PROJECT_NAME}}.">
  <link rel="canonical" href="{{SITE_URL}}/faq.html">
  <meta property="og:title" content="FAQ — {{PROJECT_NAME}}">
  <meta property="og:description" content="Common questions about {{PROJECT_NAME}}.">
  <meta property="og:url" content="{{SITE_URL}}/faq.html">
  <meta property="og:image" content="{{SITE_URL}}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">

  <!-- Replace with your own stylesheet -->
  <style>
    body { font-family: system-ui, sans-serif; max-width: 820px; margin: 2rem auto; padding: 0 1.25rem; line-height: 1.6; }
    details { border-top: 1px solid #ccc; padding: 1rem 0; }
    details:last-child { border-bottom: 1px solid #ccc; }
    summary { cursor: pointer; font-weight: 600; font-size: 1.1rem; }
  </style>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is {{PROJECT_NAME}}?",
        "acceptedAnswer": {"@type": "Answer", "text": "{{DESCRIPTION}}"}
      },
      {
        "@type": "Question",
        "name": "Is it free?",
        "acceptedAnswer": {"@type": "Answer", "text": "..."}
      },
      {
        "@type": "Question",
        "name": "How do I get started?",
        "acceptedAnswer": {"@type": "Answer", "text": "..."}
      }
    ]
  }
  </script>
</head>
<body>
  <h1>Frequently asked questions</h1>
  <p>Short answers. Every claim maps to <a href="{{REPO_URL}}">the repository</a>.</p>

  <details open>
    <summary>What is {{PROJECT_NAME}}?</summary>
    <p>{{DESCRIPTION}}</p>
  </details>

  <details>
    <summary>Is it free?</summary>
    <p>...</p>
  </details>

  <details>
    <summary>How do I get started?</summary>
    <p>...</p>
  </details>
</body>
</html>
