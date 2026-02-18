# Stripe Webhook → Printful Integration on Vercel

## The Flow

1. Customer completes Stripe Checkout
2. Stripe fires `checkout.session.completed` event to your webhook endpoint
3. Webhook verifies signature, extracts order data, creates Printful order
4. Printful handles printing and shipping

## Vercel-Specific Gotchas

### 1. Body Parsing (CRITICAL)

Vercel auto-parses JSON request bodies. Stripe signature verification requires the **exact raw bytes**. If you pass a parsed object, signature always fails → 400 error.

**Fix:** Disable Vercel's body parser and use `micro` to read the raw buffer:

```js
const { buffer } = require('micro');

// In handler:
const rawBody = await buffer(req);
event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

// At bottom of file:
module.exports = handler;
module.exports.config = {
    api: { bodyParser: false }
};
```

**Dependencies:** Add `micro` to `api/package.json` (NOT root package.json).

### 2. API Dependencies Are Separate

Vercel serverless functions in `api/` resolve dependencies from `api/package.json`, not the root. Always maintain a separate `api/package.json` with:
- `stripe` — for Stripe SDK
- `micro` — for raw body reading
- `node-fetch` — for Printful API calls (Node.js < 18 in Vercel serverless)

### 3. CJS vs ESM

Vercel serverless functions with `api/package.json` default to CommonJS. Use `require()` and `module.exports`, not `import`/`export`. The root project can be ESM (`"type": "module"`), but `api/` functions are independent.

## Stripe API Version Differences

### Shipping Address Location

| API Version | Shipping Data Path |
|---|---|
| Pre-2022 | `session.shipping` |
| 2022-2025 | `session.shipping_details` |
| 2026+ (clover) | `session.collected_information.shipping_details` |

**Safe fallback pattern:**
```js
const address = session.collected_information?.shipping_details
    || session.shipping_details
    || session.shipping;
```

The address object structure is consistent across versions:
```json
{
    "name": "Customer Name",
    "address": {
        "line1": "123 Main St",
        "line2": null,
        "city": "Portland",
        "state": "OR",
        "country": "US",
        "postal_code": "97201"
    }
}
```

## Storing Cart Data for the Webhook

The webhook receives the Stripe session object, not your cart. To pass cart items to the webhook for Printful mapping:

1. **Checkout endpoint** serializes cart items into session metadata:
```js
metadata: {
    orderId: Date.now().toString(),
    items: JSON.stringify(items)  // Cart items as JSON string
}
```

2. **Webhook** deserializes:
```js
const items = JSON.parse(session.metadata.items);
```

**Limitation:** Stripe metadata values max 500 chars. For large carts, consider storing order data in a database and passing only an order ID.

## Webhook Retry Behavior

Stripe retries failed webhooks with exponential backoff for up to 3 days. If your webhook returns 4xx/5xx, Stripe will retry. After fixing a bug, you can:
- Wait for automatic retry
- Manually resend from Stripe Dashboard → Developers → Webhooks → select event → Resend

## Testing

1. Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhook`
2. Use test mode keys (sk_test_, pk_test_) during development
3. Test card: `4242 4242 4242 4242`, any future expiry, any CVC
4. Check Stripe Dashboard → Developers → Webhooks for delivery logs and response bodies
