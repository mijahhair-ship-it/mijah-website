# Cinematic Website - Quick Start Guide

## What's Included in This Skill

Your skill includes the following supporting files:

1. **cinematic-html.template** - Semantic HTML boilerplate with SEO & accessibility
2. **animations.css** - Pre-built CSS animations, keyframes, and responsive utilities
3. **seo-checklist.md** - Comprehensive SEO verification checklist
4. **performance-optimization.md** - Complete guide for optimizing Core Web Vitals

## 5-Step Quick Start

### Step 1: Set Up Project Structure
```
your-project/
├── index.html          (use cinematic-html.template)
├── styles.css          (import animations.css)
├── script.js           (add interactivity)
├── sitemap.xml         (auto-generated)
├── robots.txt          (define crawling rules)
└── images/             (optimize before deploying)
```

### Step 2: Use the HTML Template
1. Copy content from `cinematic-html.template`
2. Replace placeholder text with your content
3. Update meta tags with your brand info
4. Ensure structured data (JSON-LD) is accurate

### Step 3: Implement Animations
1. Link `animations.css` to your HTML
2. Add animation classes to elements:
   - `.fade-in` - Fade in on load
   - `.fade-in-delayed` - Fade in with delay
   - `.scale-in` - Scale/zoom effect
   - `.slide-in-left` / `.slide-in-right` - Directional slides
3. Use `[data-parallax]` attribute for parallax effects
4. Test that animations don't block interactions

### Step 4: Optimize for Performance
Key priorities:
- [ ] Image optimization (WebP, lazy loading)
- [ ] Minify CSS/JavaScript
- [ ] Enable GZIP compression
- [ ] Implement caching (cache headers)
- [ ] Use a CDN for static assets
- [ ] Test Core Web Vitals with Lighthouse

**Target**: LCP < 2.5s, CLS < 0.1, FID < 100ms

### Step 5: SEO Implementation
Use the `seo-checklist.md` to verify:
- [ ] All meta tags present & accurate
- [ ] Open Graph tags for social sharing
- [ ] Structured data (JSON-LD) valid
- [ ] XML sitemap created
- [ ] robots.txt configured
- [ ] Mobile responsive
- [ ] All links working

## File Usage Guide

### HTML Template
**When to use**: Starting a new page or project

```bash
# Copy and customize
cp cinematic-html.template index.html
# Edit to add your content
```

### Animations CSS
**When to use**: Need cinematic effects

```html
<head>
    <link rel="stylesheet" href="animations.css">
    <!-- Your custom styles override here -->
</head>

<body>
    <h1 class="fade-in">Hello World</h1>
    <p class="fade-in-delayed">This fades in with a delay</p>
    <div class="hero-background" data-parallax></div>
</body>
```

### SEO Checklist
**When to use**: Before publishing

```bash
# Go through the checklist systematically
# Verify each item is complete
# Run Lighthouse & PageSpeed tests
# Submit sitemap to Google Search Console
```

### Performance Guide
**When to use**: After initial launch

```bash
# Run Lighthouse
lighthouse https://yoursite.com --view

# Identify bottlenecks
# Follow optimization recommendations
# Re-test after each change
```

## Common Tasks

### Add a New Section
1. Use semantic HTML (`<section>`, `<article>`, `<header>`)
2. Add animation classes (`.fade-in`, `.slide-in-left`)
3. Follow the grid pattern from `.service-grid`
4. Test responsiveness on mobile

### Optimize Images
```bash
# Using ImageMagick
convert image.jpg -quality 80 -resize 1200x image-opt.jpg

# Using sharp (Node.js)
npx sharp input.jpg -o output.webp
```

### Generate Sitemap
```bash
# If using XML sitemap generator
npm install npm-sitemap-builder

# Or manually create sitemap.xml with all URLs
```

### Run Performance Audit
```bash
# Using Lighthouse
npm install -g lighthouse
lighthouse https://yoursite.com --output-path=report.html --view

# Check Core Web Vitals
# Fix issues in order of impact
# Re-run audit
```

## Animation Best Practices

✅ **DO**:
- Use transform & opacity (GPU-accelerated)
- Respect `prefers-reduced-motion`
- Keep animations under 1 second for UI
- Use animations to enhance UX
- Test on real devices

❌ **DON'T**:
- Animate layout properties (width, height, left, right)
- Animate backgrounds excessively
- Use too many simultaneous animations
- Block content with animations
- Ignore accessibility preferences

## Troubleshooting

**Animations not playing?**
- Check animation duration is > 0ms
- Verify animation is applied to correct element
- Clear browser cache
- Check for `prefers-reduced-motion` setting

**Performance slow?**
- Run Lighthouse audit
- Check image sizes (aim for < 100KB)
- Minify CSS/JS
- Check for unused CSS
- Enable GZIP compression on server

**SEO issues?**
- Validate all HTML (W3C validator)
- Check sitemap is valid XML
- Verify robots.txt syntax
- Test with Google Search Console
- Check for noindex tags

## Resources

- **Google Lighthouse**: https://developers.google.com/web/tools/lighthouse
- **Schema.org Validator**: https://schema.org/validator
- **PageSpeed Insights**: https://pagespeed.web.dev
- **Web.dev Learn**: https://web.dev/learn/
- **MDN Web Docs**: https://developer.mozilla.org

## Next Steps

1. ✅ Copy HTML template and customize
2. ✅ Link animations.css and add animation classes
3. ✅ Go through SEO checklist
4. ✅ Run Lighthouse and optimize performance
5. ✅ Deploy to CDN
6. ✅ Monitor with Google Search Console
7. ✅ Track Core Web Vitals monthly

---

**Pro Tip**: Start with a clean, semantic HTML structure. Animations and optimization are easier to add later, but poor HTML structure is harder to fix.

Good luck building your cinematic website! 🎬
