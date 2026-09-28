import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://mijah.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SHIPPING_FEES: Record<string, number> = {
  domtom: 12.02,
  eu: 14.99,
  intl: 19.99,
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function franceFee(quantity: number, subtotal: number) {
  if (subtotal >= 50) return 0;
  if (quantity === 1) return 5.49;
  if (quantity === 2) return 7.59;
  return 9.29;
}

async function addToNewsletter(email: string) {
  const apiKey = Deno.env.get('BREVO_API_KEY');
  if (!apiKey) return;
  const listId = Number(Deno.env.get('BREVO_LIST_ID') || '3');
  if (!Number.isInteger(listId) || listId < 1) return;
  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { accept: 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ email, listIds: [listId], updateEnabled: true, attributes: { SOURCE: 'order-checkout' } }),
  });
  if (!response.ok) console.error('Brevo order opt-in failed', response.status);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await request.json();
    const customer = body?.customer;
    const requestedItems = body?.items;
    const zone = String(body?.shipping_zone || '');

    if (!['fr', 'domtom', 'eu', 'intl'].includes(zone)) return json({ error: 'Invalid shipping zone' }, 400);
    if (!customer || !Array.isArray(requestedItems) || requestedItems.length === 0) {
      return json({ error: 'Customer and items are required' }, 400);
    }

    const email = String(customer.email || '').trim().toLowerCase();
    const fields = ['first_name', 'last_name', 'address', 'postal_code', 'city', 'country'];
    if (!email || !/^\S+@\S+\.\S+$/.test(email) || fields.some(field => !String(customer[field] || '').trim())) {
      return json({ error: 'Complete customer details are required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const slugs = [...new Set(requestedItems.map((item: any) => String(item?.slug || '')))].filter(Boolean);
    if (slugs.length === 0 || slugs.length > 20) return json({ error: 'Invalid items' }, 400);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id,slug,name,price,stock,active')
      .in('slug', slugs)
      .eq('active', true);
    if (productsError) throw productsError;

    const bySlug = new Map((products || []).map(product => [product.slug, product]));
    let subtotal = 0;
    let totalQuantity = 0;
    const items = [];
    for (const requested of requestedItems) {
      const product = bySlug.get(String(requested?.slug || ''));
      const quantity = Number(requested?.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return json({ error: 'Invalid product or quantity' }, 400);
      }
      if (quantity > product.stock) return json({ error: `${product.name} is out of stock` }, 409);
      subtotal += Number(product.price) * quantity;
      totalQuantity += quantity;
      items.push({ product, quantity });
    }

    const shipping = zone === 'fr' ? franceFee(totalQuantity, subtotal) : SHIPPING_FEES[zone];
    const total = Number((subtotal + shipping).toFixed(2));

    const { data: savedCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        email,
        first_name: String(customer.first_name).trim(),
        last_name: String(customer.last_name).trim(),
        address: String(customer.address).trim(),
        postal_code: String(customer.postal_code).trim(),
        city: String(customer.city).trim(),
        country: String(customer.country).trim(),
      })
      .select('id')
      .single();
    if (customerError) throw customerError;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ customer_id: savedCustomer.id, subtotal, shipping, total, currency: 'EUR' })
      .select('id,status,subtotal,shipping,total,currency')
      .single();
    if (orderError) throw orderError;

    const { error: itemsError } = await supabase.from('order_items').insert(items.map(({ product, quantity }) => ({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      unit_price: product.price,
      quantity,
    })));
    if (itemsError) throw itemsError;

    // Newsletter subscription is opt-in only and must never block checkout.
    if (body?.newsletter_opt_in === true) {
      try { await addToNewsletter(email); } catch (error) { console.error('Brevo opt-in error', error); }
    }

    return json({ order });
  } catch (error) {
    console.error('create-order error', error);
    return json({ error: 'Unable to create order' }, 500);
  }
});
