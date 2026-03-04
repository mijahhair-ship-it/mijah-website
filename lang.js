/**
 * MÎJAH — Multilingual Engine (FR / EN)
 * Language persists across pages via localStorage.
 * Elements declare translations via data-fr and data-en attributes.
 * Placeholders use data-fr-placeholder / data-en-placeholder.
 */
(function () {
  var STORAGE_KEY = 'mijahLang';

  // Default language is French
  var currentLang = localStorage.getItem(STORAGE_KEY) || 'fr';

  /* ─────────────────────────────────────────
     Core: apply a language to the page
  ───────────────────────────────────────── */
  function applyLang(lang) {
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
    setToggleState(lang);
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
