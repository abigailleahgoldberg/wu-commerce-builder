const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('Missing STRIPE_SECRET_KEY');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const { items } = req.body;
        if (!items?.length) return res.status(400).json({ error: 'No items in cart' });

        const lineItems = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    images: [item.image],
                    metadata: {
                        size: item.size,
                        color: item.color,
                        productId: item.id
                    }
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            // REPLACE with your domain
            success_url: `https://{{YOUR_DOMAIN}}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://{{YOUR_DOMAIN}}/cart`,
            shipping_address_collection: {
                allowed_countries: ['US', 'CA'],
            },
            metadata: {
                orderId: Date.now().toString(),
                items: JSON.stringify(items)  // Stored for webhook → Printful
            }
        });

        return res.status(200).json({ sessionId: session.id });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return res.status(500).json({
            error: 'Checkout session creation failed',
            message: error.message
        });
    }
};
