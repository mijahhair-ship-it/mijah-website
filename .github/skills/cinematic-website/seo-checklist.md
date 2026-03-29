# SEO Checklist for Cinematic Website

## Meta Tags & Head Section
- [ ] `<title>` tag (50-60 characters, include target keyword)
- [ ] `<meta name="description">` (150-160 characters)
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- [ ] `<meta charset="UTF-8">`
- [ ] `<link rel="canonical">` pointing to self
- [ ] `<meta name="robots" content="index, follow">`
- [ ] `<meta name="language" content="en">`

## Open Graph & Social Tags
- [ ] `<meta property="og:title">`
- [ ] `<meta property="og:description">`
- [ ] `<meta property="og:image">` (minimum 1200x630px)
- [ ] `<meta property="og:url">`
- [ ] `<meta property="og:type">`
- [ ] `<meta name="twitter:card" content="summary_large_image">`
- [ ] `<meta name="twitter:title">`
- [ ] `<meta name="twitter:description">`
- [ ] `<meta name="twitter:image">`

## Structured Data (Schema.org)
- [ ] Organization schema (JSON-LD)
  - [ ] Name, URL, logo
  - [ ] Contact information
  - [ ] Social profiles
- [ ] LocalBusiness schema (if applicable)
- [ ] Product schema (if selling products)
- [ ] BreadcrumbList schema (for navigation)
- [ ] FAQSchema (if applicable)

## Content Optimization
- [ ] H1 tag present (only one per page)
- [ ] Header hierarchy proper (H1 → H2 → H3)
- [ ] Keyword density 1-2% (avoid stuffing)
- [ ] Clear, descriptive URLs (use hyphens)
- [ ] Internal linking strategy implemented
- [ ] 300+ words minimum per page
- [ ] Images have alt text
- [ ] Content is unique and original

## Technical SEO
- [ ] Mobile responsive (test with mobile devices)
- [ ] Page load speed < 3 seconds (optimize Core Web Vitals)
  - [ ] Largest Contentful Paint (LCP) < 2.5s
  - [ ] Cumulative Layout Shift (CLS) < 0.1
  - [ ] First Input Delay (FID) < 100ms
- [ ] HTTPS enabled
- [ ] XML Sitemap created and submitted
- [ ] robots.txt configured
- [ ] 404 page customized
- [ ] Redirects (301) if applicable
- [ ] No duplicate content

## Images & Media
- [ ] Images optimized (WebP format preferred)
- [ ] Responsive images implemented (srcset)
- [ ] Lazy loading enabled
- [ ] Image compression applied
- [ ] All images have descriptive alt text
- [ ] Video embeds have captions/transcripts

## Links & Navigation
- [ ] All links working (no 404s)
- [ ] Internal links use descriptive anchor text
- [ ] External links open in new tab (target="_blank")
- [ ] No nofollow tags on internal links (unless intentional)
- [ ] Navigation structure is clear
- [ ] Breadcrumb navigation present (if applicable)

## Site Structure
- [ ] Clear site hierarchy
- [ ] Important content within 3 clicks
- [ ] Consistent URL structure
- [ ] No blocked resources (CSS, JS)

## Performance
- [ ] Minified CSS/JavaScript
- [ ] CSS not render-blocking
- [ ] JavaScript not render-blocking
- [ ] Unused CSS removed
- [ ] Code splitting implemented
- [ ] Caching configured (cache headers)
- [ ] CDN implemented for static files

## Accessibility (SEO-relevant)
- [ ] Alt text for all images
- [ ] Form labels properly associated
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation working
- [ ] Screen reader friendly
- [ ] Heading hierarchy correct

## Crawlability
- [ ] No JavaScript that hides content from crawlers
- [ ] Fetch as Google shows complete content
- [ ] All images crawlable
- [ ] CSS and JavaScript accessible

## Analytics & Monitoring
- [ ] Google Analytics installed and configured
- [ ] Google Search Console verified
- [ ] Bing Webmaster Tools verified
- [ ] Structured data tested (schema.org validator)
- [ ] Mobile-friendly test passed
- [ ] Lighthouse audit performed

## Submission & Indexing
- [ ] Sitemap submitted to Google Search Console
- [ ] Sitemap submitted to Bing Webmaster
- [ ] robots.txt allows good crawling
- [ ] Homepage indexed
- [ ] Key pages indexed
- [ ] No "noindex" on important pages
- [ ] Site in Google Business Profile (if applicable)

## Local SEO (if applicable)
- [ ] Google Business Profile created/updated
- [ ] NAP (Name, Address, Phone) consistent
- [ ] Local schema markup
- [ ] Local citations built

## Competitor Analysis
- [ ] Monitor top competitor rankings
- [ ] Analyze competitor content strategy
- [ ] Identify keyword gaps
- [ ] Backlink analysis performed

## Post-Launch Monitoring
- [ ] Monitor Google Search Console for errors
- [ ] Track rankings for target keywords
- [ ] Monitor traffic and conversions
- [ ] Check for manual penalties
- [ ] Review search performance metrics monthly

## Verification Commands

### Robots.txt
```
curl https://yoursite.com/robots.txt
```

### Sitemap
```
curl https://yoursite.com/sitemap.xml
```

### Lighthouse
```
npm install -g lighthouse
lighthouse https://yoursite.com --view
```

### Schema Validation
Visit: https://schema.org/validator

### Google PageSpeed Insights
Visit: https://pagespeed.web.dev

---

## Notes
- Test on actual devices, not just browsers
- Mobile-first approach is critical
- Core Web Vitals directly impact rankings
- Update content regularly for freshness
- Monitor algorithm updates from Google
