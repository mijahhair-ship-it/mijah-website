const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://mijah.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

function validEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await request.json();
    // Honeypot: bots should never fill this hidden field.
    if (body.website) return json({ ok: true });
    if (!validEmail(body.email)) return json({ error: 'Adresse email invalide.' }, 400);

    const apiKey = Deno.env.get('BREVO_API_KEY');
    if (!apiKey) return json({ error: 'Newsletter temporairement indisponible.' }, 503);

    const listId = Number(Deno.env.get('BREVO_LIST_ID') || '3');
    if (!Number.isInteger(listId) || listId < 1) return json({ error: 'Configuration newsletter invalide.' }, 500);

    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { accept: 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        email: body.email.trim().toLowerCase(),
        listIds: [listId],
        updateEnabled: true,
        attributes: { SOURCE: 'website' },
      }),
    });

    if (!brevoResponse.ok) {
      // 400 is returned when the contact already exists; updateEnabled handles that case,
      // but do not leak Brevo's internal response to the browser.
      console.error('Brevo subscription failed', brevoResponse.status);
      return json({ error: 'Inscription impossible pour le moment.' }, 502);
    }

    return json({ ok: true });
  } catch (error) {
    console.error('Newsletter function error', error);
    return json({ error: 'Requête invalide.' }, 400);
  }
});
