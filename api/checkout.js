// api/checkout.js — Variations of a Dream
// Stripe checkout session

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
    const Stripe = require('stripe');
    const stripe = new Stripe(stripeKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: `${baseUrl}/?paid=true&vid=${visitorId}`,
      cancel_url: `${baseUrl}/`,
      metadata: { visitorId, type }
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = handler;
