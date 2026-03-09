/* ═══════════════════════════════════════════════
   MÎJAH — Shared Cart + Embedded Stripe Checkout
   ═══════════════════════════════════════════════ */

const PRODUCTS = {
  elixir:   { fr:'Élixir Anti-Chute',     en:'Anti Hair-Loss Elixir', price:21.90, img:'photosAndvideos/mijah anti-chute.png',           priceId:'price_1T7077D7x2m6lpvVoJv7Mhlr' },
  rosemary: { fr:'Huile de Croissance',   en:'Rosemary Growth Oil',   price:12.80, img:'photosAndvideos/Mijah hair growth oil.png',       priceId:'price_1T702JD7x2m6lpvVGAxXYXys' },
  mango:    { fr:'Mango Hair Butter',     en:'Mango Hair Butter',     price:19.90, img:'photosAndvideos/Mango Hair Butter.png',           priceId:'price_1T70AGD7x2m6lpvVWEexJ0Lh' },
  trio:     { fr:'Le Coffret MÎJAH Trio', en:'The MÎJAH Trio Set',    price:49.90, img:'photosAndvideos/Mijah Trio with Ingredient.jpeg', priceId:'price_1T70G1D7x2m6lpvV7br7zQut' }
};

/* ── Inject cart HTML into every page ── */
(function injectCartHTML() {
  if (document.getElementById('cart-drawer')) return; // already present

  const cartHTML = `
  <style>
    #cart-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:8000;backdrop-filter:blur(3px);}
    #cart-drawer{position:fixed;top:0;right:-420px;width:100%;max-width:420px;height:100%;background:#fff;z-index:8001;display:flex;flex-direction:column;transition:right 0.38s cubic-bezier(0.4,0,0.2,1);box-shadow:-8px 0 40px rgba(0,0,0,0.12);}
    #cart-drawer.open{right:0;}
    .cart-item{display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid rgba(74,110,61,0.07);}
    .cart-item img{width:70px;height:70px;object-fit:contain;border-radius:12px;background:#f4f7f0;}
    .cart-qty-btn{width:26px;height:26px;border-radius:50%;border:1px solid rgba(74,110,61,0.2);background:#fff;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;color:#2b3d24;transition:background 0.2s;}
    .cart-qty-btn:hover{background:#f4f7f0;}
    #stripe-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:20000;align-items:center;justify-content:center;padding:20px;}
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

  <div id="stripe-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:20000;align-items:center;justify-content:center;padding:20px;">
    <div style="background:#fff;border-radius:24px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 24px 80px rgba(0,0,0,0.25);">
      <button onclick="closeStripeOverlay()" style="position:absolute;top:14px;right:16px;background:rgba(0,0,0,0.08);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:1rem;z-index:1;display:flex;align-items:center;justify-content:center;">✕</button>
      <div id="stripe-container" style="padding:24px;"></div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', cartHTML);
})();

/* ── State ── */
let cart = JSON.parse(localStorage.getItem('mijahCart') || '{}');

function saveCart()  { localStorage.setItem('mijahCart', JSON.stringify(cart)); }

function updateBadge() {
  const total  = Object.values(cart).reduce((a, b) => a + b, 0);
  document.querySelectorAll('#cart-count').forEach(el => {
    el.textContent    = total;
    el.style.display  = total > 0 ? 'flex' : 'none';
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
    <button onclick="openEmbeddedCheckout()" style="width:100%;padding:15px;background:linear-gradient(135deg,#c09040,#d4a853);color:#fff;border:none;border-radius:100px;font-family:'Jost',sans-serif;font-size:0.85rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
      <i class="ph ph-lock-simple"></i> ${lang==='fr'?'Passer la Commande':'Checkout Securely'}
    </button>`;
}

/* ── Stripe Payment Link checkout ── */
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/4gM5kC9Aoca46oj5QQ1wY05';

function openEmbeddedCheckout() {
  const keys = Object.keys(cart).filter(k => PRODUCTS[k] && cart[k] > 0);
  if (!keys.length) return;
  window.location.href = STRIPE_PAYMENT_LINK;
}

function closeStripeOverlay() {
  document.getElementById('stripe-overlay').style.display = 'none';
  document.getElementById('stripe-container').innerHTML = '';
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  updateBadge();
  renderCart();
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', openCart);
});
