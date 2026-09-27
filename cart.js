/* ═══════════════════════════════════════════════
   MÎJAH — Cart + Checkout (address & delivery)
   ═══════════════════════════════════════════════ */

const PRODUCTS = {
  elixir:   { fr:'Élixir Anti-Chute',     en:'Anti Hair-Loss Elixir', price:18.10, img:'photosAndvideos/mijah anti-chute.png' },
  rosemary: { fr:'Huile de Croissance',   en:'Rosemary Growth Oil',   price:12.80, img:'photosAndvideos/Mijah hair growth oil.png' },
  mango:    { fr:'Mango Hair Butter',     en:'Mango Hair Butter',     price:14.90, img:'photosAndvideos/Mango Hair Butter.png' },
  trio:     { fr:'Le Coffret MÎJAH Trio', en:'The MÎJAH Trio Set',    price:45.80, img:'photosAndvideos/Mijah Trio with Ingredient.jpeg' }
};

// Supabase is the source of truth when available; keep the local catalogue as
// a resilient fallback so the shop remains usable during a temporary outage.
window.addEventListener('mijah:catalog-loaded', (event) => {
  for (const product of event.detail || []) {
    if (!PRODUCTS[product.slug]) continue;
    PRODUCTS[product.slug] = {
      ...PRODUCTS[product.slug],
      fr: product.name || PRODUCTS[product.slug].fr,
      price: Number(product.price),
      img: product.image_url || PRODUCTS[product.slug].img,
      stock: Number(product.stock ?? PRODUCTS[product.slug].stock ?? 0),
    };
  }
  renderCart();
});

const SHIPPING_ZONES = [
  { id:'fr',     fr:'France métropolitaine',               en:'Metropolitan France',                fee:null  },
  { id:'domtom', fr:'DOM-TOM & Outre-mer',                en:'DOM-TOM & Overseas',                 fee:12.02 },
  { id:'eu',     fr:'Europe',                              en:'Europe',                             fee:14.99 },
  { id:'intl',   fr:'International (Caraïbes, Amériques…)',en:'International (Caribbean, Americas…)',fee:19.99 },
];

const PAYPAL_CLIENT_ID = 'Aaz6On1Loged87kr3EhV4uGYYhr74CGlJdS1YpXdUInAC_B9HFNn5HKtNdk0RQL0uPBjnQGxbIvZNGs9';
const ORDER_NOTIFICATION_ENDPOINT = 'https://formspree.io/f/maqdrqbd';
let paypalSdkPromise;

function trackCommerceEvent(eventName, params = {}) {
  if (typeof window.gtag === 'function') window.gtag('event', eventName, params);
}

function commerceItems(keys) {
  return keys.map(id => ({
    item_id: id,
    item_name: PRODUCTS[id].fr,
    price: PRODUCTS[id].price,
    quantity: cart[id],
  }));
}

function loadPayPalSdk() {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (paypalSdkPromise) return paypalSdkPromise;

  paypalSdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR&intent=capture`;
    script.async = true;
    script.onload = () => window.paypal ? resolve(window.paypal) : reject(new Error('PayPal SDK unavailable'));
    script.onerror = () => reject(new Error('PayPal SDK failed to load'));
    document.head.appendChild(script);
  });

  return paypalSdkPromise;
}

async function notifyMerchant(order) {
  const data = new FormData();
  data.append('_subject', `Nouvelle commande MÎJAH — ${order.reference}`);
  data.append('type', 'Commande payée');
  data.append('reference', order.reference);
  data.append('paypal_order_id', order.paypalOrderId);
  data.append('paypal_status', order.paypalStatus);
  data.append('customer', `${order.firstName} ${order.lastName}`);
  data.append('email', order.email);
  data.append('address', order.address);
  data.append('postal_code', order.postal);
  data.append('city', order.city);
  data.append('country', order.country);
  data.append('shipping_zone', order.zone);
  data.append('items', order.items);
  data.append('subtotal', `€${order.subtotal}`);
  data.append('shipping', `€${order.shipping}`);
  data.append('total', `€${order.total}`);

  const response = await fetch(ORDER_NOTIFICATION_ENDPOINT, {
    method: 'POST',
    body: data,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Order notification failed (${response.status})`);
}

/* France: dynamic fee based on total quantity & subtotal */
function getFranceFee(totalQty, subtotal) {
  if (subtotal >= 50) return 0;
  if (totalQty === 1)  return 5.49;
  if (totalQty === 2)  return 7.59;
  return 9.29; // 3+
}

function getZoneFee(zone, totalQty, subtotal) {
  return zone.id === 'fr' ? getFranceFee(totalQty, subtotal) : zone.fee;
}

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
  trackCommerceEvent('add_to_cart', {
    currency: 'EUR',
    value: PRODUCTS[id].price,
    items: [{
      item_id: id,
      item_name: PRODUCTS[id].fr,
      price: PRODUCTS[id].price,
      quantity: 1,
    }],
  });
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

  let subtotal = 0, html = '';
  keys.forEach(id => {
    const p = PRODUCTS[id], qty = cart[id];
    subtotal += p.price * qty;
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
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <span style="font-size:0.8rem;color:#999;">${lang==='fr'?'Sous-total':'Subtotal'}</span>
      <span style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:600;color:#2b3d24;">€${subtotal.toFixed(2)}</span>
    </div>
    <p style="font-size:0.73rem;color:#bbb;margin-bottom:14px;">${lang==='fr'?'Livraison calculée à l\'étape suivante':'Shipping calculated at next step'}</p>
    <button onclick="openCheckout()" style="width:100%;padding:15px;background:linear-gradient(135deg,#2b3d24,#4a6e3d);color:#fff;border:none;border-radius:100px;font-family:'Jost',sans-serif;font-size:0.85rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
      <i class="ph ph-package"></i> ${lang==='fr'?'Passer la Commande':'Place Order'}
    </button>`;
}

/* ══════════════════════════════════════════════
   CHECKOUT — address + delivery fee
   ══════════════════════════════════════════════ */

function openCheckout() {
  const keys = Object.keys(cart).filter(k => PRODUCTS[k] && cart[k] > 0);
  if (!keys.length) return;
  const lang = typeof currentLang !== 'undefined' ? currentLang : (localStorage.getItem('mijahLang') || 'fr');
  const subtotal = keys.reduce((sum, id) => sum + PRODUCTS[id].price * cart[id], 0);

  closeCart();
  trackCommerceEvent('begin_checkout', {
    currency: 'EUR',
    value: subtotal,
    items: commerceItems(keys),
  });

  /* build zone options */
  const totalQty = keys.reduce((sum, id) => sum + cart[id], 0);
  const zoneOptions = SHIPPING_ZONES.map(z => {
    let label;
    if (z.id === 'fr') {
      const fee = getFranceFee(totalQty, subtotal);
      label = fee === 0
        ? (lang==='fr' ? `${z.fr} — Gratuit 🎉` : `${z.en} — Free 🎉`)
        : (lang==='fr' ? `${z.fr} — +€${fee.toFixed(2)}` : `${z.en} — +€${fee.toFixed(2)}`);
    } else {
      label = `${lang==='fr'?z.fr:z.en} — +€${z.fee.toFixed(2)}`;
    }
    return `<option value="${z.id}">${label}</option>`;
  }).join('');

  /* build item list */
  const itemRows = keys.map(id => {
    const p = PRODUCTS[id], qty = cart[id];
    return `<div style="display:flex;justify-content:space-between;font-size:0.82rem;color:#555;margin-bottom:4px;">
      <span>${lang==='fr'?p.fr:p.en} × ${qty}</span>
      <span>€${(p.price*qty).toFixed(2)}</span>
    </div>`;
  }).join('');

  document.getElementById('checkout-body').innerHTML = `
    <!-- Order summary -->
    <div style="background:#f4f7f0;border-radius:14px;padding:14px 16px;margin-bottom:20px;">
      <p style="font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:#7a9a6e;font-weight:600;margin-bottom:10px;">${lang==='fr'?'Récapitulatif':'Order Summary'}</p>
      ${itemRows}
      <div style="border-top:1px solid rgba(74,110,61,0.15);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-size:0.82rem;color:#777;">
        <span>${lang==='fr'?'Sous-total':'Subtotal'}</span>
        <span id="co-subtotal">€${subtotal.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:#777;margin-top:4px;">
        <span>${lang==='fr'?'Livraison':'Shipping'}</span>
        <span id="co-shipping">—</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:700;color:#2b3d24;margin-top:8px;padding-top:8px;border-top:1px solid rgba(74,110,61,0.15);">
        <span>Total</span>
        <span id="co-total">€${subtotal.toFixed(2)}</span>
      </div>
    </div>

    <!-- Delivery zone -->
    <label style="display:block;font-size:0.75rem;font-weight:600;color:#2b3d24;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px;">${lang==='fr'?'Zone de livraison *':'Delivery Zone *'}</label>
    <select id="co-zone" onchange="updateDeliveryFee()" style="width:100%;padding:11px 14px;border:1.5px solid rgba(74,110,61,0.25);border-radius:10px;font-size:0.85rem;color:#2b3d24;margin-bottom:18px;background:#fff;appearance:none;-webkit-appearance:none;">
      <option value="">${lang==='fr'?'— Choisir votre zone —':'— Select your zone —'}</option>
      ${zoneOptions}
    </select>

    <!-- Address form -->
    <p style="font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:#7a9a6e;font-weight:600;margin-bottom:12px;">${lang==='fr'?'Adresse de livraison':'Delivery Address'}</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <div>
        <label class="co-label">${lang==='fr'?'Prénom *':'First Name *'}</label>
        <input id="co-firstname" class="co-input" type="text" placeholder="${lang==='fr'?'Marie':'Marie'}" required>
      </div>
      <div>
        <label class="co-label">${lang==='fr'?'Nom *':'Last Name *'}</label>
        <input id="co-lastname" class="co-input" type="text" placeholder="${lang==='fr'?'Dupont':'Dupont'}" required>
      </div>
    </div>

    <label class="co-label">Email *</label>
    <input id="co-email" class="co-input" type="email" placeholder="email@example.com" style="margin-bottom:10px;" required>

    <label class="co-label">${lang==='fr'?'Adresse *':'Address *'}</label>
    <input id="co-address" class="co-input" type="text" placeholder="${lang==='fr'?'12 rue de la Paix':'12 Peace Street'}" style="margin-bottom:10px;" required>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;">
      <div>
        <label class="co-label">${lang==='fr'?'Code postal *':'Postal Code *'}</label>
        <input id="co-postal" class="co-input" type="text" placeholder="75001" required>
      </div>
      <div>
        <label class="co-label">${lang==='fr'?'Ville *':'City *'}</label>
        <input id="co-city" class="co-input" type="text" placeholder="${lang==='fr'?'Paris':'Paris'}" required>
      </div>
    </div>

    <label class="co-label">${lang==='fr'?'Pays *':'Country *'}</label>
    <input id="co-country" class="co-input" type="text" placeholder="${lang==='fr'?'France':'France'}" style="margin-bottom:18px;" required>

    <button onclick="submitOrder()" style="width:100%;padding:15px;background:linear-gradient(135deg,#2b3d24,#4a6e3d);color:#fff;border:none;border-radius:100px;font-family:'Jost',sans-serif;font-size:0.85rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
      <i class="ph ph-check-circle"></i> ${lang==='fr'?'Confirmer la commande':'Confirm Order'}
    </button>
    <p style="font-size:0.7rem;color:#bbb;text-align:center;margin-top:10px;">${lang==='fr'?'Paiement sécurisé à l\'étape suivante':'Secure payment at next step'}</p>
  `;

  document.getElementById('checkout-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function updateDeliveryFee() {
  const keys = Object.keys(cart).filter(k => PRODUCTS[k] && cart[k] > 0);
  const subtotal = keys.reduce((sum, id) => sum + PRODUCTS[id].price * cart[id], 0);
  const totalQty = keys.reduce((sum, id) => sum + cart[id], 0);
  const zoneId = document.getElementById('co-zone').value;
  const zone = SHIPPING_ZONES.find(z => z.id === zoneId);
  if (!zone) return;
  const lang = typeof currentLang !== 'undefined' ? currentLang : (localStorage.getItem('mijahLang') || 'fr');
  const fee = getZoneFee(zone, totalQty, subtotal);
  document.getElementById('co-shipping').textContent = fee === 0
    ? (lang === 'fr' ? 'Gratuit 🎉' : 'Free 🎉')
    : `+€${fee.toFixed(2)}`;
  document.getElementById('co-total').textContent = `€${(subtotal + fee).toFixed(2)}`;
}

function closeCheckout() {
  document.getElementById('checkout-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

async function submitOrder() {
  const lang = typeof currentLang !== 'undefined' ? currentLang : (localStorage.getItem('mijahLang') || 'fr');

  /* validate */
  const fields = ['co-zone','co-firstname','co-lastname','co-email','co-address','co-postal','co-city','co-country'];
  for (const id of fields) {
    const el = document.getElementById(id);
    if (!el || !el.value.trim() || (typeof el.checkValidity === 'function' && !el.checkValidity())) {
      el.style.borderColor = '#e55';
      el.focus();
      return;
    }
    el.style.borderColor = 'rgba(74,110,61,0.25)';
  }

  /* calculate total */
  const keys = Object.keys(cart).filter(k => PRODUCTS[k] && cart[k] > 0);
  const subtotal = keys.reduce((sum, id) => sum + PRODUCTS[id].price * cart[id], 0);
  const totalQty = keys.reduce((sum, id) => sum + cart[id], 0);
  const zone = SHIPPING_ZONES.find(z => z.id === document.getElementById('co-zone').value);
  const fee = getZoneFee(zone, totalQty, subtotal);
  const total = (subtotal + fee).toFixed(2);
  const firstName = document.getElementById('co-firstname').value;
  const lastName  = document.getElementById('co-lastname').value;
  const address   = document.getElementById('co-address').value;
  const postal    = document.getElementById('co-postal').value;
  const city      = document.getElementById('co-city').value;
  const email     = document.getElementById('co-email').value;
  const country   = document.getElementById('co-country').value;
  const reference = `MIJAH-${Date.now().toString(36).toUpperCase()}`;
  const items = commerceItems(keys);

  trackCommerceEvent('add_shipping_info', {
    currency: 'EUR',
    value: Number(total),
    shipping_tier: zone.id,
    items,
  });

  /* show PayPal payment step */
  document.getElementById('checkout-body').innerHTML = `
    <div style="background:#f4f7f0;border-radius:14px;padding:14px 16px;margin-bottom:20px;">
      <p style="font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:#7a9a6e;font-weight:600;margin-bottom:8px;">${lang==='fr'?'Récapitulatif':'Summary'}</p>
      <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:#555;margin-bottom:4px;">
        <span>${lang==='fr'?'Sous-total':'Subtotal'}</span><span>€${subtotal.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:#555;margin-bottom:4px;">
        <span>${lang==='fr'?'Livraison':'Shipping'} (${lang==='fr'?zone.fr:zone.en})</span><span>${fee===0?(lang==='fr'?'Gratuit':'Free'):`+€${fee.toFixed(2)}`}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:700;color:#2b3d24;margin-top:8px;padding-top:8px;border-top:1px solid rgba(74,110,61,0.15);">
        <span>Total</span><span>€${total}</span>
      </div>
    </div>
    <p style="font-size:0.8rem;color:#777;text-align:center;margin-bottom:14px;">${lang==='fr'?'Paiement sécurisé via PayPal':'Secure payment via PayPal'}</p>
    <div id="paypal-loading" style="padding:18px;text-align:center;color:#777;font-size:0.82rem;">${lang==='fr'?'Chargement du paiement sécurisé…':'Loading secure payment…'}</div>
    <div id="paypal-button-container"></div>
  `;

  let paypalApi;
  try {
    paypalApi = await loadPayPalSdk();
    document.getElementById('paypal-loading')?.remove();
  } catch (error) {
    console.error(error);
    document.getElementById('checkout-body').insertAdjacentHTML('beforeend', `<p style="color:#b42318;text-align:center;font-size:0.82rem;">${lang==='fr'?'Le paiement ne peut pas être chargé. Vérifiez votre connexion et réessayez.':'Payment could not be loaded. Check your connection and try again.'}</p>`);
    return;
  }

  paypalApi.Buttons({
    style: { layout:'vertical', color:'gold', shape:'pill', label:'pay' },
    createOrder: (data, actions) => actions.order.create({
      application_context: { shipping_preference: 'GET_FROM_FILE', user_action: 'PAY_NOW' },
      purchase_units: [{
        custom_id: reference,
        description: `MÎJAH — ${keys.map(id => `${PRODUCTS[id].fr} x${cart[id]}`).join(', ')}`.slice(0, 127),
        amount: {
          value: total,
          currency_code: 'EUR',
          breakdown: {
            item_total: { value: subtotal.toFixed(2), currency_code: 'EUR' },
            shipping: { value: fee.toFixed(2), currency_code: 'EUR' },
          },
        },
        items: keys.map(id => ({
          name: PRODUCTS[id].fr,
          sku: id,
          quantity: String(cart[id]),
          category: 'PHYSICAL_GOODS',
          unit_amount: { value: PRODUCTS[id].price.toFixed(2), currency_code: 'EUR' },
        })),
      }]
    }),
    onApprove: (data, actions) => actions.order.capture().then(async details => {
      const paypalStatus = details.status || 'COMPLETED';
      const paypalOrderId = details.id || data.orderID;
      const itemSummary = keys.map(id => `${PRODUCTS[id].fr} x${cart[id]}`).join(' | ');
      const orderRecord = {
        reference,
        paypalOrderId,
        paypalStatus,
        firstName,
        lastName,
        email,
        address,
        postal,
        city,
        country,
        zone: lang === 'fr' ? zone.fr : zone.en,
        items: itemSummary,
        subtotal: subtotal.toFixed(2),
        shipping: fee.toFixed(2),
        total,
      };

      try {
        await notifyMerchant(orderRecord);
      } catch (error) {
        console.error('Order notification error:', error);
      }

      trackCommerceEvent('purchase', {
        transaction_id: paypalOrderId,
        affiliation: 'MÎJAH',
        currency: 'EUR',
        value: Number(total),
        shipping: fee,
        items,
      });

      cart = {};
      saveCart();
      updateBadge();
      document.getElementById('checkout-body').innerHTML = `
        <div style="text-align:center;padding:30px 10px;">
          <div style="width:64px;height:64px;background:linear-gradient(135deg,#2b3d24,#4a6e3d);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;">
            <i class="ph ph-check" style="font-size:2rem;color:#fff;"></i>
          </div>
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:#2b3d24;margin-bottom:8px;">${lang==='fr'?'Paiement confirmé !':'Payment Confirmed!'}</h3>
          <p style="font-size:0.85rem;color:#777;line-height:1.6;">${lang==='fr'?`Merci, votre commande de <strong>€${total}</strong> a bien été reçue. Conservez la référence <strong>${reference}</strong> et votre reçu PayPal.`:`Thank you, your order of <strong>€${total}</strong> has been received. Keep reference <strong>${reference}</strong> and your PayPal receipt.`}</p>
        </div>`;
    }),
    onError: (err) => {
      console.error('PayPal error:', err);
      const msg = lang==='fr'
        ? 'Une erreur est survenue lors du paiement. Veuillez réessayer.'
        : 'A payment error occurred. Please try again.';
      alert(msg);
    }
  }).render('#paypal-button-container');
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  updateBadge();
  renderCart();
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', openCart);
});
