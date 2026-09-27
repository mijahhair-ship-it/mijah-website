/* Public Supabase client for the MÎJAH storefront.
   This publishable key is safe in browser code. Never place a service/secret key here. */
(function () {
  const SUPABASE_URL = 'https://fozuetpukdurdforfbyh.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_dolvjp_DdLEZwpd492DkRQ_G9pc95vf';

  window.MIJAH_SUPABASE_CONFIG = { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY };

  function loadCatalog() {
    if (!window.supabase?.createClient) return Promise.resolve([]);
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    window.MIJAH_SUPABASE = client;
    return client.from('products')
      .select('slug,name,description,price,currency,image_url,stock')
      .eq('active', true)
      .order('created_at')
      .then(({ data, error }) => {
        if (error) throw error;
        window.MIJAH_CATALOG = data || [];
        window.dispatchEvent(new CustomEvent('mijah:catalog-loaded', { detail: window.MIJAH_CATALOG }));
        return window.MIJAH_CATALOG;
      })
      .catch(error => {
        console.warn('[MÎJAH] Catalogue Supabase indisponible, utilisation du catalogue local.', error);
        return [];
      });
  }

  function syncProductCards(catalog) {
    for (const product of catalog || []) {
      const card = document.querySelector(`[data-product-slug="${CSS.escape(product.slug)}"]`);
      if (!card) continue;
      const image = card.querySelector('[data-product-image], .p-card-img-wrap img');
      const price = card.querySelector('[data-product-price], .price');
      const name = card.querySelector('[data-product-name], h3');
      if (image && product.image_url) image.src = product.image_url;
      if (name && product.name) name.textContent = product.name;
      if (price && Number.isFinite(Number(product.price))) price.textContent = `€${Number(product.price).toFixed(2)}`;
      card.dataset.stock = String(product.stock ?? '');
    }
  }

  window.MIJAH_LOAD_CATALOG = loadCatalog;
  window.MIJAH_SYNC_PRODUCT_CARDS = syncProductCards;
  window.addEventListener('mijah:catalog-loaded', event => syncProductCards(event.detail), { once: true });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCatalog, { once: true });
  } else {
    loadCatalog();
  }
}());
