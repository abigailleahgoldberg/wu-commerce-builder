# The Art of Digital Commerce (Wu-Tang Style)

> "You need to diversify your bonds" - Wu-Tang Financial

This skill helps you build your digital empire with:
- Sharp product displays
- Secure money handling
- Mobile-ready design
- Swift deployment
- Automated fulfillment

## The Essentials (Requirements)

- GitHub account (your digital dojo)
- Vercel account (your distribution network)
- Stripe account (handle that paper)
- Printful account (optional, for physical products)

## Quick Strike (Fast Setup)

1. Establish your base:
```bash
git init your-shop-name
cd your-shop-name
```

2. Build the foundation:
```bash
mkdir -p public/src public/cart api
touch public/src/style.css public/cart/index.html api/create-checkout-session.js
```

3. Set the rules (vercel.json):
```json
{
  "version": 2,
  "builds": [
    { "src": "api/**/*.js", "use": "@vercel/node" },
    { "src": "package.json", "use": "@vercel/static-build" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

4. Declare your presence (package.json):
```json
{
  "name": "your-shop-name",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "build": "echo 'No build required'"
  },
  "dependencies": {
    "stripe": "^14.16.0"
  }
}
```

## The Blueprints (Templates)

Each file in the templates directory is battle-tested and ready for action. Copy them to your project and customize to your style.

## Deployment (Taking it to the Streets)

1. Push your code:
```bash
git add .
git commit -m "Initial setup - Wu-Tang style"
git push origin main
```

2. Set up on Vercel:
- Connect your GitHub repo
- Add your secret weapons:
  - STRIPE_SECRET_KEY
  - STRIPE_PUBLISHABLE_KEY

3. Claim your domain (optional):
- Register in Vercel
- Set up your DNS

## Testing the Product (Quality Control)

1. Test the flow:
- Add products (like stacking vinyl)
- Adjust quantities (count your inventory)
- Remove items (keep it clean)

2. Test payments:
- Use Stripe test card: 4242 4242 4242 4242
- Future expiry date
- Any 3 digits for CVC
- Any address info

## Customization (Make it Yours)

### Product Setup

Update your catalog in index.html:
```javascript
const PRODUCTS = {
    product1: {
        id: 'your-id',
        name: 'Product Name',
        price: 25.00,
        image: 'image-url'
    }
    // Add more heat
};
```

### Visual Style

Set your colors in style.css:
```css
:root {
    --primary: #your-color;
    --accent: #your-color;
    --background: #your-color;
    --text: #your-color;
}
```

## Going Live (The Big Move)

1. Switch to live mode:
   - Update Stripe to live keys
   - Connect real Printful API
   - Set up your domain
   - Test the full flow
   - Set up notifications

## Troubleshooting (Problem Solving)

When things get rough:

1. Image issues:
   - Check your URLs
   - Verify CORS settings
   - Use proper CDN links

2. Payment problems:
   - Verify your keys
   - Check your routes
   - Review those logs

3. Deployment drama:
   - Check vercel.json
   - Verify build settings
   - Review environment setup

## The Sacred Texts (References)

- [Stripe Knowledge](https://stripe.com/docs/api)
- [Vercel Wisdom](https://vercel.com/docs)
- [Printful Scriptures](https://www.printful.com/docs)

## The Wu-Tang Way

Remember:
- Keep it simple but effective
- Test everything twice
- Protect your customers
- Share knowledge
- Cash Rules Everything Around Me, but customer service is forever

---

Built with pride by the Wu-Tang Clan of AI Agents. 
Protect Ya Neck, Secure Ya Code.