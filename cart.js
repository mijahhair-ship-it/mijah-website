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

const ORDER_FUNCTION_URL = 'https://fozuetpukdurdforfbyh.supabase.co/functions/v1/create-order';
const PAYMENT_FUNCTION_URL = 'https://fozuetpukdurdforfbyh.supabase.co/functions/v1/paypal-payment';
// Legacy anon JWT is public and accepted by Supabase Edge Function gateway.
// Never replace this with a service_role/secret key.
const SUPABASE_PUBLIC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvenVldHB1a2R1cmRmb3JtYnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjU0NDMsImV4cCI6MjA5MjAwMTQ0M30.7dsgruYKmYgGo94ORBOiUGehnwJDyY6OiOKa9GA3uJQ';

async function callSupabaseFunction(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { apikey: SUPABASE_PUBLIC_KEY, Authorization: `Bearer ${SUPABASE_PUBLIC_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Backend request failed');
  return payload;
}

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
    <div class="co-steps" aria-label="${lang==='fr'?'Étapes de commande':'Checkout steps'}">
      <span aria-current="step"><b>1</b> ${lang==='fr'?'Livraison':'Delivery'}</span>
      <span><b>2</b> ${lang==='fr'?'Paiement':'Payment'}</span>
    </div>
    <!-- Order summary -->
    <div class="co-section co-summary">
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
    <form id="co-form" onsubmit="event.preventDefault(); submitOrder()">
    <section class="co-section co-address-section" aria-labelledby="co-address-title">
    <h4 id="co-address-title" class="co-section-title"><span>01</span> ${lang==='fr'?'Adresse de livraison':'Delivery address'}</h4>
    <p class="co-hint">${lang==='fr'?'Les champs marqués * sont obligatoires.':'Fields marked * are required.'}</p>
    <div class="co-field">
    <label for="co-zone" class="co-label">${lang==='fr'?'Zone de livraison *':'Delivery zone *'}</label>
    <select id="co-zone" class="co-input" onchange="updateDeliveryFee()" required>
      <option value="">${lang==='fr'?'— Choisir votre zone —':'— Select your zone —'}</option>
      ${zoneOptions}
    </select>
    </div>

    <!-- Address form -->

    <div class="co-row">
      <div class="co-field">
        <label for="co-firstname" class="co-label">${lang==='fr'?'Prénom *':'First name *'}</label>
        <input id="co-firstname" name="given-name" autocomplete="given-name" class="co-input" type="text" placeholder="Marie" required>
      </div>
      <div class="co-field">
        <label for="co-lastname" class="co-label">${lang==='fr'?'Nom *':'Last name *'}</label>
        <input id="co-lastname" name="family-name" autocomplete="family-name" class="co-input" type="text" placeholder="Dupont" required>
      </div>
    </div>

    <div class="co-field">
    <label for="co-email" class="co-label">Email *</label>
    <input id="co-email" name="email" autocomplete="email" class="co-input" type="email" placeholder="vous@exemple.fr" required>
    </div>

    <div class="co-field">
    <label for="co-address" class="co-label">${lang==='fr'?'Adresse *':'Address *'}</label>
    <input id="co-address" name="street-address" autocomplete="street-address" class="co-input" type="text" placeholder="${lang==='fr'?'Numéro et nom de rue, appartement':'Street address, apartment'}" required>
    </div>

    <div class="co-row">
      <div class="co-field">
        <label for="co-postal" class="co-label">${lang==='fr'?'Code postal *':'Postal code *'}</label>
        <input id="co-postal" name="postal-code" autocomplete="postal-code" class="co-input" type="text" placeholder="75001" required>
      </div>
      <div class="co-field">
        <label for="co-city" class="co-label">${lang==='fr'?'Ville *':'City *'}</label>
        <input id="co-city" name="address-level2" autocomplete="address-level2" class="co-input" type="text" placeholder="Paris" required>
      </div>
    </div>

    <div class="co-field">
    <label for="co-country" class="co-label">${lang==='fr'?'Pays *':'Country *'}</label>
    <input id="co-country" name="country-name" autocomplete="country-name" class="co-input" type="text" placeholder="France" required>
    </div>

    <label class="co-newsletter-consent" style="display:flex;align-items:flex-start;gap:10px;margin-top:12px;color:#52604c;font-size:0.78rem;line-height:1.5;cursor:pointer;">
      <input id="co-newsletter-opt-in" type="checkbox" style="margin-top:3px;accent-color:#4a6e3d;">
      <span>${lang==='fr'?'Je souhaite recevoir les conseils et offres MÎJAH par email. Désinscription possible à tout moment.':'I would like to receive MÎJAH tips and offers by email. Unsubscribe at any time.'}</span>
    </label>

    </section>
    <section class="co-section co-payment-section" aria-labelledby="co-payment-title">
    <h4 id="co-payment-title" class="co-section-title"><span>02</span> ${lang==='fr'?'Paiement sécurisé':'Secure payment'}</h4>
    <p class="co-hint">${lang==='fr'?'Validez votre adresse pour afficher les moyens de paiement proposés par PayPal.':'Confirm your address to display the payment methods offered by PayPal.'}</p>
    <p id="co-error" class="co-error" role="alert" hidden></p>
    <button id="co-submit" type="submit" class="co-primary">
      ${lang==='fr'?'Continuer vers le paiement':'Continue to payment'} <i class="ph ph-arrow-right" aria-hidden="true"></i>
    </button>
    <p class="co-trust"><i class="ph ph-lock-simple" aria-hidden="true"></i> ${lang==='fr'?'Paiement sécurisé via PayPal à l’étape suivante.':'Secure payment via PayPal in the next step.'}</p>
    </section>
    </form>
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
  const submitButton = document.getElementById('co-submit');
  if (submitButton?.disabled) return;

  /* validate */
  const fields = ['co-zone','co-firstname','co-lastname','co-email','co-address','co-postal','co-city','co-country'];
  for (const id of fields) {
    const el = document.getElementById(id);
    if (!el || !el.value.trim() || (typeof el.checkValidity === 'function' && !el.checkValidity())) {
      if (el) {
        el.style.borderColor = '#e55';
        el.focus();
      }
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
  const newsletterOptIn = Boolean(document.getElementById('co-newsletter-opt-in')?.checked);
  const reference = `MIJAH-${Date.now().toString(36).toUpperCase()}`;
  const items = commerceItems(keys);

  trackCommerceEvent('add_shipping_info', {
    currency: 'EUR',
    value: Number(total),
    shipping_tier: zone.id,
    items,
  });

  let serverOrder;
  let paypalOrderId;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = lang === 'fr' ? 'Préparation du paiement…' : 'Preparing payment…';
  }
  const formError = document.getElementById('co-error');
  if (formError) formError.hidden = true;
  try {
    serverOrder = await callSupabaseFunction(ORDER_FUNCTION_URL, {
      shipping_zone: zone.id,
      items: keys.map(id => ({ slug: id, quantity: cart[id] })),
      customer: {
        email,
        first_name: firstName,
        last_name: lastName,
        address,
        postal_code: postal,
        city,
        country,
      },
      newsletter_opt_in: newsletterOptIn,
    });
    const payment = await callSupabaseFunction(PAYMENT_FUNCTION_URL, {
      action: 'create',
      order_id: serverOrder.order.id,
    });
    paypalOrderId = payment.paypal_order_id;
  } catch (error) {
    console.error('Secure order creation failed:', error);
    if (formError) {
      formError.textContent = lang === 'fr' ? 'Le paiement ne peut pas être préparé pour le moment. Vos informations sont conservées. Veuillez réessayer.' : 'Payment could not be prepared. Your details have been kept. Please try again.';
      formError.hidden = false;
    }
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = lang === 'fr' ? 'Continuer vers le paiement' : 'Continue to payment';
    }
    return;
  }

  /* show PayPal payment step */
  document.getElementById('checkout-body').innerHTML = `
    <div class="co-steps" aria-label="${lang==='fr'?'Étapes de commande':'Checkout steps'}">
      <span><b>✓</b> ${lang==='fr'?'Livraison':'Delivery'}</span>
      <span aria-current="step"><b>2</b> ${lang==='fr'?'Paiement':'Payment'}</span>
    </div>
    <section class="co-section co-payment-section" aria-labelledby="co-payment-title">
    <h4 id="co-payment-title" class="co-section-title"><span>02</span> ${lang==='fr'?'Paiement sécurisé':'Secure payment'}</h4>
    <p class="co-hint">${lang==='fr'?'Choisissez votre moyen de paiement parmi les options proposées ci-dessous.':'Choose your payment method from the options below.'}</p>
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
    <p style="font-size:0.8rem;color:#777;text-align:center;margin-bottom:8px;">${lang==='fr'?'Paiement sécurisé via PayPal':'Secure payment via PayPal'}</p>
    <p style="font-size:0.74rem;color:#555;text-align:center;line-height:1.55;margin-bottom:14px;">${lang==='fr'
      ?'En cliquant sur le bouton de paiement, vous passez une <strong>commande avec obligation de paiement</strong> et acceptez nos <a href="/terms" target="_blank" rel="noopener" style="color:#4a6e3d;">conditions générales de vente</a>. Droit de rétractation de 14 jours : voir notre <a href="/retours" target="_blank" rel="noopener" style="color:#4a6e3d;">politique de retour</a>.'
      :'By clicking the payment button, you place an <strong>order with an obligation to pay</strong> and accept our <a href="/terms" target="_blank" rel="noopener" style="color:#4a6e3d;">terms of sale</a>. 14-day right of withdrawal: see our <a href="/retours" target="_blank" rel="noopener" style="color:#4a6e3d;">returns policy</a>.'}</p>
    <div id="paypal-loading" style="padding:18px;text-align:center;color:#777;font-size:0.82rem;">${lang==='fr'?'Chargement du paiement sécurisé…':'Loading secure payment…'}</div>
    <div id="paypal-button-container"></div>
    </section>
  `;

  let paypalApi;
  document.getElementById('checkout-modal').scrollTop = 0;
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
    createOrder: () => paypalOrderId,
    onApprove: (data) => callSupabaseFunction(PAYMENT_FUNCTION_URL, {
      action: 'capture',
      order_id: serverOrder.order.id,
      paypal_order_id: data.orderID || paypalOrderId,
    }).then(async details => {
      const paypalStatus = 'COMPLETED';
      const capturedPaypalOrderId = details.paypal_order_id || data.orderID;
      const itemSummary = keys.map(id => `${PRODUCTS[id].fr} x${cart[id]}`).join(' | ');
      const orderRecord = {
        reference,
        paypalOrderId: capturedPaypalOrderId,
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
        transaction_id: capturedPaypalOrderId,
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

/* ─── STICKY MOBILE ADD-TO-CART (product pages) ───────────────────────
   Shows a bottom bar on small screens while the page's main add-to-cart
   button is scrolled out of view. Leaves room on the right for the Tidio
   chat bubble. */
document.addEventListener('DOMContentLoaded', () => {
  const mainBtn = document.querySelector('#prod-img') &&
    document.querySelector('button[onclick^="addToCart("]');
  if (!mainBtn || !('IntersectionObserver' in window)) return;
  const id = (mainBtn.getAttribute('onclick').match(/addToCart\('([a-z]+)'\)/) || [])[1];
  const product = id && PRODUCTS[id];
  if (!product) return;

  const title = (document.querySelector('h1')?.textContent || product.fr).trim();
  const bar = document.createElement('div');
  bar.id = 'sticky-atc';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = `
    <div style="min-width:0;flex:1;">
      <p style="font-size:0.78rem;color:#2b3d24;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0;"></p>
      <p style="font-size:0.95rem;color:#4a6e3d;font-weight:600;margin:0;">€${product.price.toFixed(2)}</p>
    </div>
    <button type="button" tabindex="-1" style="flex-shrink:0;background:linear-gradient(135deg,#d4a853,#e8c98a);color:#172211;border:none;border-radius:100px;padding:11px 16px;font-size:0.72rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;">Ajouter</button>`;
  bar.querySelector('p').textContent = title;
  bar.querySelector('button').addEventListener('click', () => addToCart(id));

  const style = document.createElement('style');
  style.textContent = `
    #sticky-atc{position:fixed;left:12px;right:88px;bottom:12px;z-index:40;display:none;align-items:center;gap:12px;
      padding:10px 10px 10px 16px;background:rgba(254,253,249,0.97);border:1px solid rgba(74,110,61,0.15);border-radius:16px;
      box-shadow:0 8px 28px rgba(0,0,0,0.12);transform:translateY(140%);transition:transform .3s ease}
    #sticky-atc.show{transform:translateY(0)}
    @media(max-width:767px){#sticky-atc{display:flex}}`;
  document.head.appendChild(style);
  document.body.appendChild(bar);

  new IntersectionObserver(([entry]) => {
    // Visible whenever the main button is off-screen — it starts below the fold on mobile.
    const show = !entry.isIntersecting;
    bar.classList.toggle('show', show);
    bar.setAttribute('aria-hidden', String(!show));
  }).observe(mainBtn);
});

/* Header icon buttons: at least 44×44px touch area on every page. */
(() => {
  const style = document.createElement('style');
  style.textContent = '#cart-btn,#mob-menu-btn{min-width:44px;min-height:44px}';
  document.head.appendChild(style);
})();
