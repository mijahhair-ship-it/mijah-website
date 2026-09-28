import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://mijah.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

function paypalBaseUrl() {
  return Deno.env.get('PAYPAL_ENVIRONMENT') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function paypalAccessToken() {
  const client = Deno.env.get('PAYPAL_CLIENT_ID');
  const secret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  if (!client || !secret) throw new Error('PayPal credentials are not configured');
  const basic = btoa(`${client}:${secret}`);
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) throw new Error('PayPal authentication failed');
  return (await response.json()).access_token as string;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { action, order_id: internalOrderId, paypal_order_id: paypalOrderId } = await request.json();
    if (!internalOrderId) return json({ error: 'order_id is required' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id,status,total,currency,order_items(product_name,unit_price,quantity)')
      .eq('id', internalOrderId)
      .single();
    if (orderError || !order) return json({ error: 'Order not found' }, 404);

    const token = await paypalAccessToken();
    if (action === 'create') {
      if (order.status !== 'pending') return json({ error: 'Order is not payable' }, 409);
      const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            custom_id: order.id,
            description: 'MÎJAH — commande en ligne',
            amount: { currency_code: order.currency, value: Number(order.total).toFixed(2) },
          }],
        }),
      });
      const payload = await response.json();
      if (!response.ok) return json({ error: 'PayPal order creation failed' }, 502);
      await supabase.from('orders').update({ payment_provider: 'paypal', payment_id: payload.id }).eq('id', order.id);
      return json({ paypal_order_id: payload.id });
    }

    if (action === 'capture') {
      if (!paypalOrderId) return json({ error: 'paypal_order_id is required' }, 400);
      const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const payload = await response.json();
      if (!response.ok || payload.status !== 'COMPLETED') return json({ error: 'PayPal capture failed' }, 502);
      const { error: updateError } = await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString(), payment_provider: 'paypal', payment_id: paypalOrderId }).eq('id', order.id).eq('status', 'pending');
      if (updateError) throw updateError;
      return json({ status: 'paid', order_id: order.id, paypal_order_id: paypalOrderId });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error('paypal-payment error', error);
    return json({ error: 'Payment service unavailable' }, 500);
  }
});
