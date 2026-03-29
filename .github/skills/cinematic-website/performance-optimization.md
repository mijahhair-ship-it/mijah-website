# Performance Optimization Guide

For optimizing your cinematic website while maintaining visual quality.

## Core Web Vitals Targets

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

## Image Optimization

### Format Selection
```
- JPG/JPEG: Photographs, complex graphics
- PNG: Transparent backgrounds, logos
- WebP: Modern browsers (smaller file size)
- AVIF: Next-gen format (compressed)
- SVG: Icons, logos, simple graphics
```

### Implementation
```html
<!-- Responsive images with srcset -->
<img 
    src="image.jpg" 
    srcset="
        image-small.jpg 480w, 
        image-medium.jpg 800w, 
        image-large.jpg 1200w
    "
    sizes="(max-width: 600px) 100vw, (max-width: 1200px) 75vw, 50vw"
    alt="Description"
    loading="lazy"
/>

<!-- Picture element for format fallback -->
<picture>
    <source srcset="image.avif" type="image/avif">
    <source srcset="image.webp" type="image/webp">
    <img src="image.jpg" alt="Description" loading="lazy">
</picture>
```

### Compression Tools
- **ImageOptim** (Mac): https://imageoptim.com/
- **TinyPNG**: https://tinypng.com/
- **ImageMagick**: CLI tool for batch processing
- **Sharp npm**: Programmatic image processing

### Guidelines
- Max 100KB for hero images
- Responsive breakpoints: 480px, 768px, 1024px, 1920px
- Always include lazy loading

## CSS Optimization

### Minification
```bash
npm install -g cssnano
cssnano styles.css --output styles.min.css
```

### Critical CSS
Extract above-the-fold CSS:
```html
<!-- Inline critical CSS -->
<style>
  /* Hero section styles only */
</style>

<!-- Load rest asynchronously -->
<link rel="preload" href="styles.css" as="style">
<link rel="stylesheet" href="styles.css">
```

### Unused CSS Removal
```bash
npm install --save-dev purgecss
purgecss --css styles.css --content index.html
```

### Best Practices
- Use CSS variables for theming
- Avoid !important
- Use shorthand properties
- Remove deprecated properties
- Limit animations to GPU-accelerated properties (transform, opacity)

## JavaScript Optimization

### Code Splitting
```javascript
// Lazy load modules
const parallax = () => import('./parallax.js');

// Load on demand
document.addEventListener('scroll', parallax);
```

### Minification & Bundling
```bash
npm install --save-dev webpack terser-webpack-plugin
```

### Defer Non-Critical JS
```html
<!-- Load critical JS immediately -->
<script src="critical.js"></script>

<!-- Defer non-critical JS -->
<script src="animations.js" defer></script>

<!-- Load on interaction -->
<script src="analytics.js" defer></script>
```

### Remove Unused JavaScript
- Tree-shaking in bundlers
- Remove console.log in production
- Remove debug code

## Font Optimization

### System Fonts (Fastest)
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Variable Fonts (Google Fonts)
```html
<!-- Only request needed weights/styles -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
```

### Self-Hosted Fonts
```css
@font-face {
    font-family: 'CustomFont';
    src: url('/fonts/custom.woff2') format('woff2');
    display: swap; /* Prevent FOUT */
}
```

### Best Practices
- Use `font-display: swap` for fallback
- Limit to 2-3 font families
- Use woff2 format (best compression)
- Preload critical fonts
- Subset fonts if possible

## Animation Optimization

### GPU-Accelerated Properties
```css
/* Good: Use transform & opacity */
@keyframes slide {
    from { transform: translateX(0); }
    to { transform: translateX(100px); }
}

/* Bad: Avoid layout-triggering properties */
/* left, right, width, height, etc. */
```

### Reduce Motion Preference
```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

### Best Practices
- Use CSS animations over JavaScript
- Limit simultaneous animations
- Use will-change sparingly
- Avoid animating background images
- Keep frame rate at 60fps

## Caching Strategy

### HTTP Headers
```
Cache-Control: public, max-age=31536000  /* 1 year for versioned assets */
Cache-Control: public, max-age=3600      /* 1 hour for HTML */
Cache-Control: no-cache, no-store        /* For dynamic content */
```

### Service Worker
```javascript
// Basic service worker for offline support
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open('v1').then(cache => {
            return cache.addAll([
                '/',
                '/styles.css',
                '/script.js'
            ]);
        })
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request)
            .then(response => response || fetch(e.request))
    );
});
```

## Network Optimization

### Preloading
```html
<!-- Preload critical resources -->
<link rel="preload" href="fonts/custom.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="critical.css" as="style">
```

### DNS Prefetch
```html
<link rel="dns-prefetch" href="//external-cdn.com">
```

### Connection Preconnect
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

### Resource Hints
```html
<!-- Prefetch for future navigation -->
<link rel="prefetch" href="page2.html">

<!-- Prerender entire page -->
<link rel="prerender" href="page2.html">
```

## Monitoring & Testing

### Tools
- **Lighthouse**: Built into Chrome DevTools
- **PageSpeed Insights**: https://pagespeed.web.dev
- **GTmetrix**: https://gtmetrix.com/
- **WebPageTest**: https://webpagetest.org/
- **Speedcurve**: Continuous monitoring

### Key Metrics to Track
- Page load time
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

### Testing Commands
```bash
# Lighthouse CLI
lighthouse https://yoursite.com --view

# Performance timing
npm install perfume.js
```

## CDN Configuration

### Popular CDNs
- **Cloudflare**: https://www.cloudflare.com
- **Netlify**: https://www.netlify.com
- **Vercel**: https://vercel.com
- **AWS CloudFront**: https://aws.amazon.com/cloudfront

### Benefits
- Global content distribution
- Automatic compression (gzip, brotli)
- Image optimization
- DDoS protection

## Web Vitals Checklist

- [ ] LCP optimized (hero image, render-blocking resources)
- [ ] FID minimal (JavaScript execution time)
- [ ] CLS controlled (image dimensions, font loading)
- [ ] Mobile performance tested
- [ ] Network throttling tested (3G, 4G)
- [ ] Device diversity tested (mobile, tablet, desktop)

## Quick Wins

1. ✅ Enable GZIP/Brotli compression
2. ✅ Optimize images first
3. ✅ Defer non-critical JavaScript
4. ✅ Minimize CSS
5. ✅ Use system fonts
6. ✅ Remove unused code
7. ✅ Implement lazy loading
8. ✅ Use a CDN
9. ✅ Enable browser caching
10. ✅ Minimize third-party scripts

## Continuous Monitoring

- [ ] Set up Google Search Console alerts
- [ ] Monitor Core Web Vitals dashboard
- [ ] Set performance budgets
- [ ] Monthly Lighthouse audits
- [ ] Track ranking changes
- [ ] Monitor 404 errors
