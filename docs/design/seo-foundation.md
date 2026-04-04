# Audex — SEO Foundation Plan

**Step 6 [P2][T1] | Version 1.0 | April 4, 2026**

---

## URL Structure

Clean, readable, keyword-friendly. No query params for navigation.

### Public Pages

| URL                     | Page                   | Notes                      |
| ----------------------- | ---------------------- | -------------------------- |
| `/`                     | Landing page           | ISR, cacheable             |
| `/pricing`              | Pricing                | ISR                        |
| `/about`                | About                  | ISR                        |
| `/changelog`            | Changelog              | ISR                        |
| `/docs`                 | Documentation index    | ISR                        |
| `/docs/glossary`        | Technical glossary     | ISR (a11y AAA requirement) |
| `/docs/[slug]`          | Documentation page     | ISR                        |
| `/blog`                 | Blog index             | ISR                        |
| `/blog/[slug]`          | Blog post              | ISR                        |
| `/reports/[slug]`       | Shared report (public) | SSR, OG tags with score    |
| `/auth/signin`          | Sign in                | noindex                    |
| `/auth/signup`          | Sign up                | noindex                    |
| `/auth/verify-email`    | Email verification     | noindex                    |
| `/auth/forgot-password` | Forgot password        | noindex                    |
| `/auth/reset-password`  | Reset password         | noindex                    |
| `/sitemap`              | HTML sitemap (humans)  | ISR                        |

### Authenticated Pages (noindex all)

| URL                   | Page                    |
| --------------------- | ----------------------- |
| `/dashboard`          | Dashboard               |
| `/audits`             | Audit list              |
| `/audits/[id]`        | Audit detail / progress |
| `/audits/[id]/report` | Report (private)        |
| `/projects`           | Project list            |
| `/projects/[id]`      | Project detail          |
| `/settings/*`         | All settings pages      |
| `/admin/*`            | All admin pages         |

**Rule:** All authenticated pages get `<meta name="robots" content="noindex, nofollow">`. Only public marketing, docs, blog, and shared reports are indexed.

---

## Meta Tags

### Per-Page Meta Strategy

Every public page must have unique:

```html
<head>
  <title>{Page Title} | Audex</title>
  <meta name="description" content="{150-160 char description}" />

  <!-- Open Graph -->
  <meta property="og:title" content="{Page Title}" />
  <meta property="og:description" content="{Description}" />
  <meta property="og:image" content="{OG image URL}" />
  <meta property="og:url" content="{Canonical URL}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Audex" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{Page Title}" />
  <meta name="twitter:description" content="{Description}" />
  <meta name="twitter:image" content="{OG image URL}" />

  <!-- Canonical -->
  <link rel="canonical" href="{Canonical URL}" />
</head>
```

### Page-Specific Meta

| Page              | Title                                         | Description (max 160 chars)                                                                                                                      |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`               | Audex — AI-Powered Website Quality Analysis   | Analyze any website across 11 quality dimensions. Get actionable insights on security, performance, accessibility, SEO, and more. Free to start. |
| `/pricing`        | Pricing — Audex                               | Simple, transparent pricing. Start free with 3 audits per month. Upgrade to Pro for unlimited audits, exports, and AI summaries.                 |
| `/about`          | About — Audex                                 | Audex helps developers and teams build better websites by analyzing quality across 11 dimensions with AI-powered insights.                       |
| `/changelog`      | Changelog — Audex                             | See what's new in Audex. Latest features, improvements, and fixes.                                                                               |
| `/docs`           | Documentation — Audex                         | Learn how to use Audex to analyze websites, interpret reports, and integrate with your CI/CD pipeline via the API.                               |
| `/blog/[slug]`    | {Post Title} — Audex Blog                     | {Post excerpt, auto-generated from first paragraph}                                                                                              |
| `/reports/[slug]` | {URL} scored {score} ({grade}) — Audex Report | Quality report for {URL}: {score}/100 ({grade}). {findings} findings across 11 dimensions including security, performance, and accessibility.    |

### Shared Report OG Image (Dynamic)

For `/reports/[slug]`, generate a dynamic OG image showing:

```
┌──────────────────────────────────────┐
│  AUDEX                               │
│                                      │
│  example.com                         │
│                                      │
│  ┌──────┐                            │
│  │  87  │  Grade: B+                 │
│  │      │  26 findings               │
│  └──────┘  11 dimensions analyzed    │
│                                      │
│  audex.dev/reports/abc123            │
└──────────────────────────────────────┘
```

Implementation: Next.js `opengraph-image.tsx` using `@vercel/og` (Satori). Generated per shared report. Cached via ISR.

---

## Heading Hierarchy

One `<h1>` per page. Levels never skip.

| Page              | h1                                       | h2 examples                                      |
| ----------------- | ---------------------------------------- | ------------------------------------------------ |
| `/`               | "Know exactly how your website performs" | "11 Dimensions", "How It Works", "Pricing"       |
| `/pricing`        | "Simple, transparent pricing"            | "Free", "Pro", "Team", "Enterprise", "FAQ"       |
| `/docs`           | "Documentation"                          | Category headings                                |
| `/blog/[slug]`    | "{Post Title}"                           | Post section headings                            |
| `/reports/[slug]` | "Quality Report: {URL}"                  | "Score Overview", "AI Summary", "Security", etc. |

---

## Structured Data (JSON-LD)

### Site-Wide: Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Audex",
  "url": "https://audex.dev",
  "logo": "https://audex.dev/logo.png",
  "sameAs": ["https://twitter.com/audex", "https://github.com/audex"]
}
```

### Landing Page: SoftwareApplication

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Audex",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web",
  "description": "AI-powered website quality analysis across 11 dimensions",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "0"
  }
}
```

Add `aggregateRating` only after collecting real reviews.

### Pricing Page: Product offers

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Audex Pro",
  "description": "Unlimited website quality audits with AI summaries and exports",
  "offers": {
    "@type": "Offer",
    "price": "29",
    "priceCurrency": "USD",
    "billingIncrement": "P1M",
    "priceValidUntil": "2027-12-31"
  }
}
```

### Blog Posts: Article

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{Post Title}",
  "datePublished": "{ISO date}",
  "dateModified": "{ISO date}",
  "author": { "@type": "Person", "name": "Rufsan" },
  "publisher": { "@type": "Organization", "name": "Audex" },
  "image": "{OG image URL}"
}
```

### FAQ Page (Pricing):

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Can I cancel anytime?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, cancel anytime from your billing settings."
      }
    }
  ]
}
```

---

## sitemap.xml

Auto-generated via Next.js `app/sitemap.ts`:

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { url: "https://audex.dev", changeFrequency: "weekly", priority: 1.0 },
    {
      url: "https://audex.dev/pricing",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://audex.dev/about",
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://audex.dev/changelog",
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: "https://audex.dev/docs",
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "https://audex.dev/blog",
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Dynamic: published blog posts
  const blogPosts = await getBlogPosts();
  const blogUrls = blogPosts.map((post) => ({
    url: `https://audex.dev/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Dynamic: public shared reports
  const sharedReports = await getPublicReports();
  const reportUrls = sharedReports.map((report) => ({
    url: `https://audex.dev/reports/${report.shareSlug}`,
    lastModified: report.createdAt,
    changeFrequency: "never" as const,
    priority: 0.3,
  }));

  return [...staticPages, ...blogUrls, ...reportUrls];
}
```

---

## robots.txt

Via Next.js `app/robots.ts`:

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/audits", "/projects", "/settings", "/admin", "/api/", "/auth/"],
      },
    ],
    sitemap: "https://audex.dev/sitemap.xml",
  };
}
```

---

## Performance Targets (Core Web Vitals)

Search ranking factor since 2021. Target "Good" on all metrics:

| Metric                          | Target  | Measured On            |
| ------------------------------- | ------- | ---------------------- |
| LCP (Largest Contentful Paint)  | < 2.5s  | Landing, pricing, blog |
| INP (Interaction to Next Paint) | < 200ms | All interactive pages  |
| CLS (Cumulative Layout Shift)   | < 0.1   | All pages              |
| TTFB (Time to First Byte)       | < 800ms | All pages              |
| FCP (First Contentful Paint)    | < 1.8s  | Landing, pricing       |

### Implementation

- ISR for marketing pages (revalidate: 3600)
- SSR for shared reports (dynamic OG tags)
- next/image for all images (WebP, lazy loading, srcset)
- Font optimization: `next/font` with `display: swap`
- Minimal JS on marketing pages (Server Components by default)
- Preconnect to external origins (Stripe, PostHog, R2 CDN)

---

## Content Strategy (SEO-Driven)

### Blog Topics (Target Keywords)

| Topic Category       | Example Posts                                      | Target Keywords                                     |
| -------------------- | -------------------------------------------------- | --------------------------------------------------- |
| Dimension deep-dives | "What CSP Headers Mean for Your Site"              | website security headers, CSP guide                 |
| How-to guides        | "How to Improve Your Lighthouse Score"             | improve lighthouse score, web performance           |
| Benchmarks           | "We Analyzed 1,000 Websites: Here's What We Found" | website quality benchmark, average lighthouse score |
| Comparisons          | "Audex vs Lighthouse: What's the Difference?"      | lighthouse alternative, website audit tool          |
| Best practices       | "10 SEO Mistakes Developers Make"                  | developer seo, technical seo checklist              |
| Product updates      | "New: AI-Powered Report Summaries"                 | — (branded, not SEO-targeted)                       |

### Internal Linking Strategy

- Blog posts link to relevant dimension docs
- Docs link to glossary terms
- Shared reports link to signup
- Landing page links to pricing, docs, blog
- Every public page has footer with links to all main sections

---

## Technical SEO Checklist

### Pre-Launch

- [ ] All public pages have unique title + description
- [ ] OG tags on all public pages (test with og-image debugger)
- [ ] JSON-LD structured data on landing, pricing, blog
- [ ] sitemap.xml generated and submitted to Google Search Console
- [ ] robots.txt blocks authenticated routes
- [ ] Canonical URLs on all pages (prevent duplicate content)
- [ ] No orphan pages (every page linked from at least one other)
- [ ] 404 page returns actual 404 status code (not 200)
- [ ] Redirects use 301 (permanent) not 302
- [ ] No broken internal links
- [ ] Images have alt text (WCAG AAA requirement already covers this)
- [ ] Core Web Vitals pass "Good" threshold
- [ ] Mobile-friendly (responsive, no horizontal scroll)
- [ ] HTTPS enforced (Vercel handles this)
- [ ] HTML sitemap at `/sitemap` for humans

### Post-Launch

- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Monitor indexing status weekly
- [ ] Monitor Core Web Vitals in Search Console
- [ ] Set up Google Alerts for brand mentions
- [ ] Track keyword rankings for target terms
- [ ] Monitor 404s and fix/redirect
