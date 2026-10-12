# Shanmuga Crackers 🪔

**சண்முகா பட்டாசுகள் & மத்தாப்புக்கள்** – Diwali crackers order website.

A mobile-first Diwali crackers order-booking website with an admin panel. Customers pick gift boxes or individual crackers within their budget and submit an order — no online payment. The admin team manages orders, products, gift boxes, offers and festive messages from `/admin`.

A product by [Cube CorpSol](https://cubecorpsol.com).

## Features

**Customer website** (no login)
- Festive homepage with banner, "Start Your Order", contact & WhatsApp
- Step 1 – customer details (name, mobile, WhatsApp with "same as mobile", place, pincode)
- Step 2 – budget: fixed or not, preset/custom amount, *stay within* or *can exceed*
- Gift Boxes (up to 3 images, contents & quantities, stock status)
- Individual crackers with quantity selector and subtotal
- **Build Your Own Diwali Box** with a live Budget Basket meter (₹720 / ₹1,000 · 72% filled)
- "Budget filled" prompt → Continue Shopping / Increase Budget / Complete Order
- Filters: category, price range, available, popular, search
- Basket, order review, unique Order ID (`CRK-2026-00001`)
- Offers applied automatically (combo prices, buy-X-get-Y, complimentary gifts, vouchers)
- Tamil / English Diwali quotes on home, offers and confirmation pages
- One single "Allow required permissions" prompt (notifications, location auto-fill, WhatsApp contact) asked only once

**Admin panel** (`/admin`)
- Dashboard summary cards & recent orders
- Orders: search, filters (date, status, value, location), status updates, CSV export
- Order detail with internal notes and editable pre-filled **WhatsApp click-to-chat** message
- Products, Categories (dynamic), Gift Boxes (items + 3 images), automatic image compression
- Customers database with order history
- Offers & Promotions: combo, quantity, product, gift voucher, minimum purchase – with validity dates
- Diwali Quotes manager
- Website settings: shop info, logo, banner, order open/close, minimum order, serviceable pincodes, WhatsApp template

## Tech stack
React + Vite + Tailwind CSS · Supabase (Postgres, Auth, Storage, RLS) · Vercel

## Development
```bash
npm install
npm run dev
```
Optional env vars (defaults point to the production Supabase project):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Orders are placed through the `place_order` Postgres function, which re-checks prices, stock, offers, budget, minimum order and serviceable pincodes on the server.
