const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items } = JSON.parse(event.body);

    const line_items = items.map(({ priceId, quantity }) => ({
      price: priceId,
      quantity,
    }));

    const origin = event.headers.origin || 'https://mijah.fr';

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['FR', 'BE', 'CH', 'LU', 'MC', 'GP', 'MQ', 'GF', 'RE', 'YT', 'GB', 'DE', 'ES', 'IT', 'NL', 'PT', 'US', 'CA', 'HT', 'MF', 'SX', 'AI', 'DM', 'LC'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 549, currency: 'eur' },
            display_name: 'France metropolitaine (3-5 jours)',
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 1202, currency: 'eur' },
            display_name: 'DOM-TOM & Outre-mer (7-14 jours)',
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 1499, currency: 'eur' },
            display_name: 'Europe (5-10 jours)',
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 1999, currency: 'eur' },
            display_name: 'International - Caraibes, Amerique (10-21 jours)',
          },
        },
      ],
      success_url: `${origin}/merci.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/collection.html`,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
