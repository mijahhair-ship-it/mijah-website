/* ═══════════════════════════════════════════════
   MÎJAH — Shared Cart + PayPal Checkout
   ═══════════════════════════════════════════════ */

const PRODUCTS = {
  elixir:   { fr:'Élixir Anti-Chute',     en:'Anti Hair-Loss Elixir', price:21.90, img:'photosAndvideos/mijah anti-chute.png' },
  rosemary: { fr:'Huile de Croissance',   en:'Rosemary Growth Oil',   price:12.80, img:'photosAndvideos/Mijah hair growth oil.png' },
  mango:    { fr:'Mango Hair Butter',     en:'Mango Hair Butter',     price:19.90, img:'photosAndvideos/Mango Hair Butter.png' },
  trio:     { fr:'Le Coffret MÎJAH Trio', en:'The MÎJAH Trio Set',    price:49.90, img:'photosAndvideos/Mijah Trio with Ingredient.jpeg' }
};

const PAYPAL_CLIENT_ID = 'ATZqS9lY7OVclSuN8DHVlOXcKluLj5XWp8VJ3R-QGn7-64KQwE98DNcQm8tMdH4ImyWaGGzlwjoGVQBm';

/* ── Inject cart + PayPal modal HTML ── */
(function injectCartHTML() {
  if (document.getElementById('cart-drawer')) return;

  document.body.insertAdjacentHTML('beforeend', `
  <style>
    #cart-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:8000;backdrop-filter:blur(3px);}
    #cart-drawer{position:fixed;top:0;right:-420px;width:100%;max-width:420px;height:100%;background:#fff;z-index:8001;display:flex;flex-direction:column;transition:right 0.38s cubic-bezier(0.4,0,0.2,1);box-shadow:-8px 0 40px rgba(0,0,0,0.12);}
    #cart-drawer.open{right:0;}
    .cart-item{display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid rgba(74,110,61,0.07);}
    .cart-item img{width:70px;height:70px;object-fit:contain;border-radius:12px;background:#f4f7f0;}
    .cart-qty-btn{width:26px;height:26px;border-radius:50%;border:1px solid rgba(74,110,61,0.2);background:#fff;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;color:#2b3d24;transition:background 0.2s;}
    .cart-qty-btn:hover{background:#f4f7f0;}
    #paypal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:20000;align-items:center;justify-content:center;padding:20px;}
    #paypal-overlay.open{display:flex;}
    #paypal-modal{background:#fff;border-radius:24px;max-width:480px;width:100%;padding:32px 28px;position:relative;box-shadow:0 24px 80px rgba(0,0,0,0.25);}
    @keyframes spin{to{transform:rotate(360deg);}}
  </style>

  <div id="cart-overlay" onclick="closeCart()"></div>
  <div id="cart-drawer">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 24px 16px;border-bottom:1px solid rgba(74,110,61,0.1);">
      <div>
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:500;color:#2b3d24;" data-fr="Mon Panier" data-en="My Cart">Mon Panier</h3>
        <p id="cart-item-count" style="font-size:0.75rem;color:#999;margin-top:2px;"></p>
      </div>
      <button onclick="closeCart()" style="background:none;border:none;cursor:pointer;color:#2b3d24;padding:8px;">
        <i class="ph-bold ph-x" style="font-size:1.3rem;"></i>
      </button>
    </div>
    <div id="cart-items" style="flex:1;overflow-y:auto;padding:16px 24px;"></div>
    <div id="cart-footer" style="padding:20px 24px;border-top:1px solid rgba(74,110,61,0.1);"></div>
  </div>

  <div id="paypal-overlay">
    <div id="paypal-modal">
      <button onclick="closePayPal()" style="position:absolute;top:14px;right:16px;background:rgba(0,0,0,0.08);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">✕</button>
      <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;color:#2b3d24;margin-bottom:6px;" id="paypal-title">Paiement sécurisé</h3>
      <p style="font-size:0.8rem;color:#999;margin-bottom:20px;" id="paypal-total"></p>
      <div id="paypal-buttons"></div>
    </div>
  </div>`);
})();

/* ── State ── */
let cart = JSON.parse(localStorage.getItem('mijahCart') || '{}');

function saveCart() { localStorage.setItem('mijahCart', JSON.stringify(cart)); }

function updateBadge() {
  const total = Object.values(cart).reduce((a, b) => a + b, 0);
  document.querySelectorAll('#cart-count').forEach(el => {
    el.textContent   = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  });
  const counter = document.getElementById('cart-item-count');
  if (counter) counter.textContent = total > 0 ? `${total} article${total > 1 ? 's' : ''}` : '';
}

/* ── Cart open/close ── */
function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').style.display = 'block';
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

/* ── Add / Remove / Change qty ── */
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart(); updateBadge(); renderCart(); openCart();
}
function removeFromCart(id) {
  delete cart[id];
  saveCart(); updateBadge(); renderCart();
}
function changeQtyCart(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart(); updateBadge(); renderCart();
}

/* ── Render cart drawer ── */
function renderCart() {
  const container = document.getElementById('cart-items');
  const footer    = document.getElementById('cart-footer');
  if (!container || !footer) return;
  const lang = typeof currentLang !== 'undefined' ? currentLang : (localStorage.getItem('mijahLang') || 'fr');
  const keys = Object.keys(cart).filter(k => PRODUCTS[k] && cart[k] > 0);

  if (keys.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:60px 20px;">
      <i class="ph ph-shopping-cart" style="font-size:3rem;display:block;color:#ddd;margin-bottom:14px;"></i>
      <p style="font-family:'Cormorant Garamond',serif;font-size:1.2rem;color:#aaa;">${lang==='fr'?'Votre panier est vide':'Your cart is empty'}</p>
      <p style="font-size:0.78rem;color:#ccc;margin-top:6px;">${lang==='fr'?'Ajoutez des produits pour commencer':'Add products to get started'}</p>
    </div>`;
    footer.innerHTML = '';
    return;
  }

  let total = 0, html = '';
  keys.forEach(id => {
    const p = PRODUCTS[id], qty = cart[id];
    total += p.price * qty;
    html += `<div class="cart-item">
      <img src="${p.img}" alt="${lang==='fr'?p.fr:p.en}" />
      <div style="flex:1;min-width:0;">
        <p style="font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:500;color:#2b3d24;line-height:1.3;">${lang==='fr'?p.fr:p.en}</p>
        <p style="font-size:0.8rem;color:#d4a853;font-weight:600;margin-top:3px;">€${(p.price*qty).toFixed(2)}</p>
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px;">
          <button class="cart-qty-btn" onclick="changeQtyCart('${id}',-1)">−</button>
          <span style="font-size:0.9rem;font-weight:600;color:#2b3d24;min-width:16px;text-align:center;">${qty}</span>
          <button class="cart-qty-btn" onclick="changeQtyCart('${id}',1)">+</button>
        </div>
      </div>
      <button onclick="removeFromCart('${id}')" style="background:none;border:none;cursor:pointer;color:#ccc;padding:4px;transition:color 0.2s;" onmouseover="this.style.color='#e55'" onmouseout="this.style.color='#ccc'">
        <i class="ph ph-trash" style="font-size:1rem;"></i>
      </button>
    </div>`;
  });
  container.innerHTML = html;

  footer.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <span style="font-size:0.8rem;color:#999;">${lang==='fr'?'Sous-total':'Subtotal'}</span>
      <span style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:600;color:#2b3d24;">€${total.toFixed(2)}</span>
    </div>
    <button onclick="openPayPalCheckout()" style="width:100%;padding:15px;background:linear-gradient(135deg,#c09040,#d4a853);color:#fff;border:none;border-radius:100px;font-family:'Jost',sans-serif;font-size:0.85rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
      <i class="ph ph-lock-simple"></i> ${lang==='fr'?'Passer la Commande':'Checkout Securely'}
    </button>`;
}

/* ── Shipping zones ── */
const SHIPPING_ZONES = [
  { id: 'fr',    fr: 'France métropolitaine',              en: 'Metropolitan France',               fee: 5.49  },
  { id: 'domtom',fr: 'DOM-TOM & Outre-mer',               en: 'DOM-TOM & Overseas',                fee: 12.02 },
  { id: 'eu',    fr: 'Europe',                             en: 'Europe',                            fee: 14.99 },
  { id: 'intl',  fr: 'International (Caraïbes, Amériques…)',en: 'International (Caribbean, Americas…)',fee: 19.99 },
];

/* ── PayPal Checkout ── */
function closePayPal() {
  document.getElementById('paypal-overlay').classList.remove('open');
  document.getElementById('paypal-buttons').innerHTML = '';
}

function openPayPalCheckout() {
  const keys = Object.keys(cart).filter(k => PRODUCTS[k] && cart[k] > 0);
  if (!keys.length) return;
  const lang     = typeof currentLang !== 'undefined' ? currentLang : (localStorage.getItem('mijahLang') || 'fr');
  const subtotal = keys.reduce((sum, id) => sum + PRODUCTS[id].price * cart[id], 0);

  document.getElementById('paypal-title').textContent = lang === 'fr' ? 'Paiement sécurisé' : 'Secure Payment';
  document.getElementById('paypal-total').textContent = '';

  /* Step 1 — show shipping zone selector */
  document.getElementById('paypal-buttons').innerHTML = `
    <p style="font-size:0.82rem;color:#555;margin-bottom:10px;">${lang==='fr'?'Choisissez votre zone de livraison :':'Choose your delivery zone:'}</p>
    ${SHIPPING_ZONES.map(z => `
      <label style="display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border:1.5px solid rgba(74,110,61,0.2);border-radius:12px;margin-bottom:8px;cursor:pointer;transition:border-color 0.2s;" onclick="selectZone('${z.id}')">
        <span style="display:flex;align-items:center;gap:10px;">
          <input type="radio" name="zone" value="${z.id}" style="accent-color:#4a6e3d;">
          <span style="font-size:0.83rem;color:#2b3d24;">${lang==='fr'?z.fr:z.en}</span>
        </span>
        <span style="font-size:0.83rem;font-weight:600;color:#d4a853;">+€${z.fee.toFixed(2)}</span>
      </label>`).join('')}
    <div id="zone-total" style="display:none;margin:14px 0 10px;padding:12px 14px;background:#f4f7f0;border-radius:12px;">
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:#777;margin-bottom:4px;">
        <span>${lang==='fr'?'Produits':'Products'}</span>
        <span>€${subtotal.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:#777;margin-bottom:8px;">
        <span id="zone-label">${lang==='fr'?'Livraison':'Shipping'}</span>
        <span id="zone-fee"></span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:700;color:#2b3d24;border-top:1px solid rgba(74,110,61,0.15);padding-top:8px;">
        <span>Total</span>
        <span id="zone-grand-total"></span>
      </div>
    </div>
    <div id="paypal-render"></div>`;

  document.getElementById('paypal-overlay').classList.add('open');

  if (!window.paypal) {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR`;
    document.head.appendChild(script);
  }
}

function selectZone(zoneId) {
  const lang  = typeof currentLang !== 'undefined' ? currentLang : (localStorage.getItem('mijahLang') || 'fr');
  const keys  = Object.keys(cart).filter(k => PRODUCTS[k] && cart[k] > 0);
  const subtotal = keys.reduce((sum, id) => sum + PRODUCTS[id].price * cart[id], 0);
  const zone  = SHIPPING_ZONES.find(z => z.id === zoneId);
  const total = (subtotal + zone.fee).toFixed(2);

  /* update summary */
  document.getElementById('zone-total').style.display = 'block';
  document.getElementById('zone-label').textContent = lang === 'fr' ? zone.fr : zone.en;
  document.getElementById('zone-fee').textContent = `+€${zone.fee.toFixed(2)}`;
  document.getElementById('zone-grand-total').textContent = `€${total}`;

  /* render PayPal buttons */
  const container = document.getElementById('paypal-render');
  container.innerHTML = '';

  function doRender() {
    paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'pay' },
      createOrder: (data, actions) => actions.order.create({
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: total,
            breakdown: {
              item_total: { currency_code: 'EUR', value: subtotal.toFixed(2) },
              shipping:   { currency_code: 'EUR', value: zone.fee.toFixed(2) }
            }
          },
          items: keys.map(id => ({
            name: lang === 'fr' ? PRODUCTS[id].fr : PRODUCTS[id].en,
            unit_amount: { currency_code: 'EUR', value: PRODUCTS[id].price.toFixed(2) },
            quantity: String(cart[id])
          }))
        }]
      }),
      onApprove: (data, actions) => actions.order.capture().then(() => {
        cart = {};
        saveCart();
        updateBadge();
        window.location.href = '/merci.html';
      }),
      onError: () => {
        alert(lang === 'fr' ? 'Une erreur est survenue. Veuillez réessayer.' : 'An error occurred. Please try again.');
      }
    }).render('#paypal-render');
  }

  if (window.paypal) {
    doRender();
  } else {
    const interval = setInterval(() => {
      if (window.paypal) { clearInterval(interval); doRender(); }
    }, 100);
  }
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  updateBadge();
  renderCart();
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', openCart);
});
