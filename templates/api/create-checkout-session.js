const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify Stripe key exists
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('Missing STRIPE_SECRET_KEY');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Parse items from request body
        const { items } = req.body;
        
        if (!items?.length) {
            return res.status(400).json({ error: 'No items in cart' });
        }

        console.log('Creating checkout session for items:', items);

        // Create line items for Stripe
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    images: [item.image],
                    metadata: {
                        size: item.size,
                        productId: item.id
                    }
                },
                unit_amount: Math.round(item.price * 100), // Convert to cents
            },
            quantity: item.quantity,
        }));

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/cart`,
            shipping_address_collection: {
                allowed_countries: ['US', 'CA'],
            },
            metadata: {
                orderId: Date.now().toString()
            }
        });

        // Return successful response
        return res.status(200).json({ sessionId: session.id });
    } catch (error) {
        // Log the full error for debugging
        console.error('Stripe checkout error:', error);

        // Return error response
        return res.status(500).json({
            error: 'Checkout session creation failed',
            message: error.message
        });
    }
};