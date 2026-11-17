{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "{{SITE_URL}}/#org",
      "name": "{{PROJECT_NAME}}",
      "url": "{{SITE_URL}}/",
      "logo": "{{SITE_URL}}/og-image.png",
      "sameAs": ["{{REPO_URL}}"]
    },
    {
      "@type": "WebSite",
      "@id": "{{SITE_URL}}/#website",
      "name": "{{PROJECT_NAME}}",
      "url": "{{SITE_URL}}/",
      "description": "{{DESCRIPTION}}",
      "inLanguage": "en",
      "publisher": {"@id": "{{SITE_URL}}/#org"},
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "{{SITE_URL}}/?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "{{SITE_URL}}/#app",
      "name": "{{PROJECT_NAME}}",
      "description": "{{DESCRIPTION}}",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Cross-platform",
      "url": "{{SITE_URL}}/",
      "codeRepository": "{{REPO_URL}}",
      "license": "https://spdx.org/licenses/{{LICENSE}}.html",
      "softwareVersion": "{{VERSION}}",
      "author": {"@id": "{{SITE_URL}}/#org"},
      "publisher": {"@id": "{{SITE_URL}}/#org"},
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "isAccessibleForFree": true,
      "citation": "{{REPO_URL}}/blob/main/CITATION.cff"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": "{{SITE_URL}}/"},
        {"@type": "ListItem", "position": 2, "name": "FAQ",  "item": "{{SITE_URL}}/faq.html"}
      ]
    }
  ]
}
