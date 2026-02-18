# Printful Variant Mapping

## How It Works

Each product in your Printful store has **sync variants** — specific combinations of size, color, etc. Each sync variant has a unique ID. The webhook maps cart items to these IDs when creating Printful orders.

## Getting Sync Variant IDs

### Via Printful Dashboard
1. Go to Stores → Your Store → Products
2. Click a product
3. Each variant row shows its sync variant ID

### Via Printful API
```bash
# List all products in your store
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.printful.com/store/products

# Get variants for a specific product
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.printful.com/store/products/{product_id}
```

Response includes `sync_variants` array, each with an `id` field — that's the sync variant ID.

## Variant Map Structure

```js
const variantMap = {
    'PRINTFUL_PRODUCT_ID': {
        // Simple (size only):
        'S': 'SYNC_VARIANT_ID',
        'M': 'SYNC_VARIANT_ID',
        'L': 'SYNC_VARIANT_ID',

        // Or with colors (use 'Color-Size' keys):
        'Black-S/M': 'SYNC_VARIANT_ID',
        'Black-L/XL': 'SYNC_VARIANT_ID',
        'Navy-S/M': 'SYNC_VARIANT_ID',
    }
};
```

## Lookup Logic

```js
const getSyncVariantId = (productId, size, color) => {
    const product = variantMap[productId];
    if (!product) throw new Error(`Unknown product: ${productId}`);

    const key = color ? `${color}-${size}` : size;
    const id = product[key];
    if (!id) throw new Error(`Unknown variant: ${key}`);

    return id;
};
```

## Common Issues

- **Wrong variant ID** → Printful creates wrong size/color. Double-check mapping.
- **Missing variant** → 400 error from Printful. Ensure every purchasable combination is mapped.
- **Product ID mismatch** → The product ID in your frontend `PRODUCTS` object must match the Printful product ID, not the Printful catalog ID.
