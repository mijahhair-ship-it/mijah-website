/* ============================================================
   MÎJAH — Consentement cookies (RGPD / lignes directrices CNIL)
   Google Analytics n'est chargé qu'après un accord explicite.
   "Tout refuser" est aussi visible que "Tout accepter".
   Le choix est conservé 6 mois, puis redemandé.
   ============================================================ */
(function () {
  const STORAGE_KEY = 'mijah_consent_v1';
  const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 182; // ~6 mois
  const GA_ID = 'G-8C6EZBF8MC';

  function readConsent() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Date.now() - saved.ts < MAX_AGE_MS) return saved;
    } catch (e) {}
    return null;
  }

  function saveConsent(analytics) {
    const consent = { analytics: !!analytics, ts: Date.now() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); } catch (e) {}
    return consent;
  }

  let gaLoaded = false;
  function loadAnalytics() {
    if (gaLoaded) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function clearAnalyticsCookies() {
    const host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(c => {
      const name = c.split('=')[0].trim();
      if (!/^_ga/.test(name)) return;
      ['', '; domain=.' + host, '; domain=' + host].forEach(d => {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
  }

  function apply(consent) {
    if (consent.analytics) loadAnalytics();
    else clearAnalyticsCookies();
  }

  function injectStyles() {
    if (document.getElementById('mijah-consent-css')) return;
    const css = document.createElement('style');
    css.id = 'mijah-consent-css';
    css.textContent = `
      #mijah-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:10050;max-width:540px;margin:0 auto;background:#fefdf9;color:#1a1a1a;border:1px solid rgba(74,110,61,.18);border-radius:16px;box-shadow:0 18px 50px rgba(22,33,15,.18);padding:20px 20px 16px;font-family:'Jost',system-ui,sans-serif}
      #mijah-consent h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.35rem;font-weight:500;color:#2b3d24;margin:0 0 6px;padding-right:90px}
      #mijah-consent p{font-size:.82rem;line-height:1.6;color:#555;margin:0 0 14px;font-weight:300}
      #mijah-consent a{color:#4a6e3d}
      #mijah-consent .mc-row{display:flex;gap:10px;flex-wrap:wrap}
      #mijah-consent .mc-btn{flex:1 1 140px;padding:12px 16px;border-radius:100px;font:500 .8rem 'Jost',system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;border:1px solid #2b3d24;background:#2b3d24;color:#fff}
      #mijah-consent .mc-close{position:absolute;top:12px;right:14px;background:none;border:none;font-size:.75rem;color:#777;cursor:pointer;text-decoration:underline}
    `;
    document.head.appendChild(css);
  }

  function openBanner() {
    injectStyles();
    document.getElementById('mijah-consent')?.remove();
    const box = document.createElement('div');
    box.id = 'mijah-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Gestion des cookies');
    box.innerHTML = `
      <button type="button" class="mc-close" data-mc="refuse">Continuer sans accepter</button>
      <h2>Vos cookies, votre choix</h2>
      <p>Avec votre accord, nous utilisons Google Analytics (Google LLC, données pouvant être transférées aux États-Unis) pour mesurer l'audience du site. Rien n'est activé tant que vous n'avez pas choisi. Vous pouvez changer d'avis à tout moment via « Gestion des cookies » en bas de page. <a href="privacy">En savoir plus</a></p>
      <div class="mc-row">
        <button type="button" class="mc-btn" data-mc="refuse">Tout refuser</button>
        <button type="button" class="mc-btn" data-mc="accept">Tout accepter</button>
      </div>`;
    box.addEventListener('click', e => {
      const action = e.target.closest('[data-mc]')?.dataset.mc;
      if (!action) return;
      const consent = saveConsent(action === 'accept');
      box.remove();
      // Un script déjà chargé ne peut pas être déchargé : on recharge la page après un retrait.
      if (gaLoaded && !consent.analytics) {
        clearAnalyticsCookies();
        location.reload();
        return;
      }
      apply(consent);
    });
    document.body.appendChild(box);
  }

  function addFooterLink() {
    const anchor = document.querySelector('footer a[href="privacy"], footer a[href="/privacy"]');
    if (!anchor || document.getElementById('mijah-consent-link')) return;
    const link = document.createElement('a');
    link.id = 'mijah-consent-link';
    link.href = '#';
    link.textContent = 'Gestion des cookies';
    link.style.cssText = anchor.style.cssText;
    link.className = anchor.className;
    link.addEventListener('click', e => { e.preventDefault(); openBanner(); });
    anchor.insertAdjacentElement('afterend', link);
  }

  window.mijahConsent = { open: openBanner };

  function init() {
    addFooterLink();
    const consent = readConsent();
    if (consent) apply(consent);
    else openBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
