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
      ui_mode: 'embedded',
      line_items,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['FR', 'BE', 'CH', 'LU', 'MC', 'GP', 'MQ', 'GF', 'RE', 'YT', 'GB', 'DE', 'ES', 'IT', 'NL', 'PT', 'US', 'CA', 'HT', 'MF', 'SX', 'AI', 'DM', 'LC'],
      },
      return_url: `${origin}/merci.html?session_id={CHECKOUT_SESSION_ID}`,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ clientSecret: session.client_secret }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
