// api/checkout.js — Variations of a Dream
// Stripe checkout session using fetch (no package required)

const handler = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: 'Stripe not configured' });

  const { type, visitorId } = req.body || {};
  const baseUrl = process.env.BASE_URL || 'https://variations-of-a-dream.vercel.app';

  const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY;
  const singlePriceId = process.env.STRIPE_PRICE_SINGLE;

  if (!monthlyPriceId || !singlePriceId) {
    return res.status(500).json({ error: 'Stripe prices not configured' });
  }

  const priceId = type === 'MONTHLY' ? monthlyPriceId : singlePriceId;
  const mode = type === 'MONTHLY' ? 'subscription' : 'payment';

  try {
    const params = new URLSearchParams();
    params.append('payment_method_types[]', 'card');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('mode', mode);
    params.append('success_url', `${baseUrl}/?paid=true&vid=${visitorId}`);
    params.append('cancel_url', `${baseUrl}/`);
    if (visitorId) params.append('metadata[visitorId]', visitorId);
    params.append('metadata[type]', type || 'SINGLE');

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    const session = await response.json();

    if (session.error) {
      console.error('Stripe error:', session.error.message);
      return res.status(500).json({ error: session.error.message });
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = handler;
