---
name: wu-commerce-builder
description: Build and deploy print-on-demand e-commerce stores using Vite, Stripe, Printful, and Vercel. Use when creating merch stores, product pages, shopping carts, checkout flows, Stripe webhook integrations, or Printful fulfillment pipelines. Covers the full stack from storefront HTML/CSS/JS to serverless API endpoints, payment processing, and automated order fulfillment.
---

# Wu-Commerce Builder

Build production e-commerce stores with print-on-demand fulfillment. This skill is reverse-engineered from [jewsa.com](https://jewsa.com) — a live, working store.

## Architecture

```
your-store/
├── index.html                    # Storefront (Vite entry point)
├── package.json                  # Vite + build config
├── vite.config.js                # Vite build settings
├── vercel.json                   # Vercel rewrites for API routes
├── public/
│   ├── src/style.css             # Global styles
│   ├── cart/index.html           # Cart page
│   └── success/index.html        # Post-purchase confirmation
├── api/
│   ├── package.json              # API dependencies (stripe, micro, node-fetch)
│   ├── create-checkout-session.js # Stripe checkout session creator
│   └── webhook.js                # Stripe → Printful fulfillment bridge
└── src/                          # Optional: Vite source modules
    └── style.css
```

**Stack:** Vite (build) → Vercel (hosting + serverless) → Stripe (payments) → Printful (fulfillment)

## Setup Workflow

### 1. Initialize Project

```bash
mkdir your-store && cd your-store
npm init -y
npm install --save-dev vite
npm install stripe
mkdir -p public/src public/cart public/success api
```

Set `package.json`:
```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": { "vite": "^5.0.0" },
  "dependencies": { "stripe": "^14.16.0" }
}
```

`vite.config.js`:
```js
import { defineConfig } from 'vite'
export default defineConfig({ build: { outDir: 'dist' } })
```

`vercel.json`:
```json
{ "rewrites": [{ "source": "/api/(.*)", "destination": "/api/$1" }] }
```

### 2. API Dependencies

`api/package.json` — separate from root because Vercel serverless functions resolve deps independently:
```json
{
  "dependencies": {
    "micro": "^10.0.1",
    "node-fetch": "^2.7.0",
    "stripe": "^14.16.0"
  }
}
```

### 3. Vercel Environment Variables

Set in Vercel Project → Settings → Environment Variables:
- `STRIPE_SECRET_KEY` — Stripe secret key (sk_live_... or sk_test_...)
- `STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (pk_live_... or pk_test_...)
- `STRIPE_WEBHOOK_SECRET` — from Stripe webhook endpoint config (whsec_...)
- `PRINTFUL_API_TOKEN` — Printful API access token

### 4. Stripe Webhook Setup

In Stripe Dashboard → Developers → Webhooks:
- Endpoint URL: `https://your-domain.com/api/webhook`
- Listen for: `checkout.session.completed`
- Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET` in Vercel

## Key Implementation Details

### Product Data Pattern

Products defined as a JS object in `index.html`. Each product needs: `id` (Printful product ID), `name`, `price`, `image` (Printful CDN URL). Products with color variants use an `images` map.

```js
const PRODUCTS = {
  tee: {
    id: '419473357',
    name: 'Store Basic Tee',
    price: 25.00,
    image: 'https://files.cdn.printful.com/files/.../preview.png'
  },
  hat: {
    id: '419417492',
    name: 'Store Bucket Hat',
    price: 25.00,
    images: {
      'Black': 'https://files.cdn.printful.com/files/.../preview.png',
      'Navy': 'https://files.cdn.printful.com/files/.../preview.png'
    }
  }
};
```

### Cart (localStorage)

Cart stored in `localStorage` as JSON array. Each item: `{ id, name, price, image, size, color?, variantKey, quantity }`. The `variantKey` uniquely identifies a variant (e.g., `"XL"` or `"S/M-Black"`).

### Checkout Flow

1. Cart page POSTs items to `/api/create-checkout-session`
2. API creates Stripe Checkout Session with line items + metadata (serialized cart items)
3. Client redirects to Stripe hosted checkout via `stripe.redirectToCheckout({ sessionId })`
4. On success → `/success` page (clears localStorage cart)

### Stripe Webhook → Printful (CRITICAL)

See `references/webhook-guide.md` for the complete webhook implementation. Key gotchas:

1. **Vercel body parsing** — Must disable with `module.exports.config = { api: { bodyParser: false } }` and use `micro`'s `buffer()` to read raw body for Stripe signature verification
2. **Stripe API 2026+** — Shipping address is at `session.collected_information.shipping_details`, NOT `session.shipping` or `session.shipping_details`
3. **Variant mapping** — Webhook maps cart items to Printful sync variant IDs via a lookup table

### Stripe Publishable Key

The cart page needs the Stripe publishable key hardcoded in the client JS for `Stripe('pk_...')`. Use test keys during development, swap to live for production.

## Templates

Copy templates from `assets/` as starting points. They contain the complete working implementation from jewsa.com with store-specific values replaced by placeholders.

- `assets/index.html` — Storefront with product cards and cart preview
- `assets/cart.html` — Full cart page with checkout
- `assets/success.html` — Order confirmation page
- `assets/style.css` — Complete responsive stylesheet
- `assets/create-checkout-session.js` — Stripe checkout API endpoint
- `assets/webhook.js` — Stripe → Printful webhook (production-tested)
- `assets/api-package.json` — API dependencies

## References

- `references/webhook-guide.md` — Complete Stripe webhook + Printful integration guide with Vercel-specific gotchas
- `references/printful-variant-mapping.md` — How to map products to Printful sync variant IDs
