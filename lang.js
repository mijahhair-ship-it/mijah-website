/**
 * MÎJAH — Multilingual Engine (FR / EN)
 * Language persists across pages via localStorage.
 * Elements declare translations via data-fr and data-en attributes.
 * Placeholders use data-fr-placeholder / data-en-placeholder.
 *
 * ───────────────────────────────────────────────────────────────
 * 2026-05-21 — ENGLISH TEMPORARILY DISABLED (SEO decision).
 *   The ?lang=en pages were being de-indexed by Google because they
 *   shared the French <head> (canonical / title / meta / html lang),
 *   so every EN URL canonicalised back to its French twin.
 *   Until proper static /en/ pages exist, the site is French-only:
 *   the FR|EN toggle is hidden and every visitor is served French.
 *
 *   TO RE-ENABLE ENGLISH LATER: set EN_ENABLED = true below
 *   (and re-add the hreflang="en" <link> tags in each page <head>).
 * ───────────────────────────────────────────────────────────────
 */
(function () {
  var STORAGE_KEY = 'mijahLang';

  // ← single switch. false = French-only. true = restore FR/EN toggle.
  var EN_ENABLED = false;

  // While English is disabled, hide every FR|EN toggle as early as
  // possible (avoids a flash of the button before init runs).
  if (!EN_ENABLED) {
    var style = document.createElement('style');
    style.setAttribute('data-mijah', 'lang-disabled');
    style.textContent = '[onclick*="toggleLang"],#lang-toggle{display:none !important}';
    (document.head || document.documentElement).appendChild(style);
  }

  // Default language is French. Stored preference only honoured when EN is on.
  var currentLang = (EN_ENABLED && localStorage.getItem(STORAGE_KEY)) || 'fr';

  /* ─────────────────────────────────────────
     Core: apply a language to the page
  ───────────────────────────────────────── */
  function applyLang(lang) {
    if (!EN_ENABLED) lang = 'fr';      // force French while disabled
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    // Update <html lang="…">
    document.documentElement.lang = lang;

    // Translate every element that has a data-fr attribute
    document.querySelectorAll('[data-fr]').forEach(function (el) {
      var text = el.getAttribute('data-' + lang);
      if (text !== null) el.textContent = text;
    });

    // Translate placeholder attributes
    document.querySelectorAll('[data-fr-placeholder]').forEach(function (el) {
      var ph = el.getAttribute('data-' + lang + '-placeholder');
      if (ph !== null) el.placeholder = ph;
    });

    // Update the toggle button visual state (desktop + mobile)
    if (EN_ENABLED) setToggleState(lang);
  }

  /* ─────────────────────────────────────────
     Update FR | EN button appearance
  ───────────────────────────────────────── */
  function setToggleState(lang) {
    var pairs = [
      ['lang-fr', 'lang-en'],
      ['mob-lang-fr', 'mob-lang-en']
    ];
    pairs.forEach(function (ids) {
      var frEl = document.getElementById(ids[0]);
      var enEl = document.getElementById(ids[1]);
      if (!frEl || !enEl) return;

      if (lang === 'fr') {
        frEl.style.fontWeight = '600';
        frEl.style.opacity   = '1';
        enEl.style.fontWeight = '400';
        enEl.style.opacity   = '0.4';
      } else {
        frEl.style.fontWeight = '400';
        frEl.style.opacity   = '0.4';
        enEl.style.fontWeight = '600';
        enEl.style.opacity   = '1';
      }
    });
  }

  /* ─────────────────────────────────────────
     Public: called by onclick="toggleLang()"
  ───────────────────────────────────────── */
  window.toggleLang = function () {
    if (!EN_ENABLED) return;           // no-op while disabled
    applyLang(currentLang === 'fr' ? 'en' : 'fr');
  };

  /* ─────────────────────────────────────────
     Init: run when DOM is ready
  ───────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      applyLang(currentLang);
    });
  } else {
    applyLang(currentLang);
  }
})();
