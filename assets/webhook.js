const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fetch = require('node-fetch');
const { buffer } = require('micro');

const createPrintfulOrder = async (session) => {
    const items = JSON.parse(session.metadata.items);

    // Stripe API 2026+: shipping is under collected_information.shipping_details
    const address = session.collected_information?.shipping_details
        || session.shipping_details
        || session.shipping;

    // Map cart items to Printful sync variant IDs
    const orderItems = items.map(item => ({
        sync_variant_id: getSyncVariantId(item.id, item.size, item.color),
        quantity: item.quantity,
        retail_price: item.price.toString()
    }));

    const response = await fetch('https://api.printful.com/orders', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.PRINTFUL_API_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            recipient: {
                name: address.name,
                address1: address.address.line1,
                address2: address.address.line2,
                city: address.address.city,
                state_code: address.address.state,
                country_code: address.address.country,
                zip: address.address.postal_code
            },
            items: orderItems,
            retail_costs: {
                subtotal: (session.amount_subtotal / 100).toString(),
                shipping: ((session.total_details?.amount_shipping || 0) / 100).toString(),
                tax: ((session.total_details?.amount_tax || 0) / 100).toString()
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Printful API error: ${JSON.stringify(data)}`);
    }
    return data;
};

// CUSTOMIZE: Map your product IDs + variants to Printful sync variant IDs
// Get these from Printful Dashboard → Stores → Your Store → Products → Sync Variants
const getSyncVariantId = (productId, size, color) => {
    const variantMap = {
        // 'PRINTFUL_PRODUCT_ID': {
        //     'SIZE': 'SYNC_VARIANT_ID',
        // },
        // For products with colors, use 'Color-Size' as key:
        // 'PRINTFUL_PRODUCT_ID': {
        //     'Black-S/M': 'SYNC_VARIANT_ID',
        // },
    };

    // If product has color variants, look up by 'Color-Size'
    const product = variantMap[productId];
    if (!product) throw new Error(`Unknown product ID: ${productId}`);

    const key = color ? `${color}-${size}` : size;
    const variantId = product[key];
    if (!variantId) throw new Error(`Unknown variant: ${key} for product ${productId}`);

    return variantId;
};

const handler = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Raw body required for Stripe signature verification
        const rawBody = await buffer(req);
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        try {
            const printfulOrder = await createPrintfulOrder(session);
            console.log('Printful order created:', printfulOrder);
            return res.json({ received: true, printfulOrder });
        } catch (error) {
            console.error('Error creating Printful order:', error);
            return res.status(500).json({
                error: 'Failed to create Printful order',
                message: error.message
            });
        }
    }

    res.json({ received: true });
};

// CRITICAL: Disable Vercel body parsing — Stripe needs raw body for signature verification
module.exports = handler;
module.exports.config = {
    api: {
        bodyParser: false,
    },
};
