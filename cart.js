/* ═══════════════════════════════════════════════
   MÎJAH — Shared Cart
   ═══════════════════════════════════════════════ */

const PRODUCTS = {
  elixir:   { fr:'Élixir Anti-Chute',     en:'Anti Hair-Loss Elixir', price:21.90, img:'photosAndvideos/mijah anti-chute.png' },
  rosemary: { fr:'Huile de Croissance',   en:'Rosemary Growth Oil',   price:12.80, img:'photosAndvideos/Mijah hair growth oil.png' },
  mango:    { fr:'Mango Hair Butter',     en:'Mango Hair Butter',     price:19.90, img:'photosAndvideos/Mango Hair Butter.png' },
  trio:     { fr:'Le Coffret MÎJAH Trio', en:'The MÎJAH Trio Set',    price:49.90, img:'photosAndvideos/Mijah Trio with Ingredient.jpeg' }
};

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
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <span style="font-size:0.8rem;color:#999;">${lang==='fr'?'Sous-total':'Subtotal'}</span>
      <span style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:600;color:#2b3d24;">€${total.toFixed(2)}</span>
    </div>
    <p style="font-size:0.75rem;color:#bbb;text-align:center;">${lang==='fr'?'Livraison calculée à la commande':'Shipping calculated at checkout'}</p>`;
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  updateBadge();
  renderCart();
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', openCart);
});
