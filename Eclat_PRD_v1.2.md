# Eclat — Product Requirements Document (PRD)
**Product:** Eclat D2C ecommerce platform — customer storefront + admin dashboard
**Version:** 1.2 · 12 September 2026 · Owner: Indrajit Tidke
**Companion files:** `eclat_schema.sql` (migration 001) · `eclat_schema_002.sql` (migration 002 — collections, tags, blog, lookbooks, videos, FAQs, consent, P2 tables) · `Eclat_System_Flowchart.png/.svg`
**Change log 1.2:** gap analysis against chandranipearls.in and flawnt.store (§15); additions marked **[v1.2]** throughout.
**Audience:** Design (Lovable) · Engineering (Jaydip, Amit, Indrajit) · Client (Eclat)

Phase tags: **[P1]** launch scope (7 weeks) · **[P2]** after launch. Anything untagged is P1.

---

## 1. Purpose and goals

Eclat sells real, farm-grown freshwater pearl jewellery direct to customers in India. The platform must let a customer find a piece, trust that it is real, pay (including COD), and track delivery — and let Eclat's team run products, orders, deliveries and customers without a developer.

**Business goals (first 6 months)**
- Launch by end of October 2026 with 4 categories, ~40 products.
- Conversion rate ≥ 1.5% on mobile; checkout completion ≥ 60% of carts.
- Every order confirmed and tracked on WhatsApp.
- Eclat team adds products and processes orders themselves from week 1.

**Design principle:** minimal, premium, mobile-first. Fewer elements, larger photos, calm typography. Compete with Giva/Palmonas on trust signals and checkout ease, not on visual noise.

**Out of scope for the platform (any phase):** marketplaces, mobile app, multi-currency, POS.

---

## 2. Users and roles

| Role | Where | Can do |
|---|---|---|
| Visitor | Storefront | Browse, search, wishlist (local), add to cart, guest checkout |
| Customer | Storefront | Everything above + account, addresses, order history, tracking, reviews, saved wishlist |
| Owner | Admin | Everything in admin including revenue, settings, staff, refunds |
| Staff | Admin | Products, inventory, orders, delivery, customers, reviews — **no** revenue reports, settings, refunds above a limit, staff management |

Auth: customers log in with phone OTP (email optional). Admin logs in with email + password + OTP (2FA).

---

## 3. Design system (for Lovable — apply to both projects)

**Tokens**
- Background `#FFFFFF`; soft surface `#F6F4EF`; ink `#16161A`; secondary text `#3F3F47`; muted `#7B7B84`; line `#E8E6E0`
- Primary `#0F3D3E` (deep sea green), hover `#1C5D5E`; accent gold `#B8955A` (ratings, small highlights only); sale `#C4626C`; success `#2E8B57`
- Nacre gradient (used only on the Pearl Passport and certificate): `linear-gradient(120deg,#EEE6F0,#DFEDEA 50%,#F4EBDF)`
- Type: **Cormorant Garamond** 500 for headings/product names/prices ≥ 20px; **Inter** 400/500/600 for everything else. Base 14px, line-height 1.5.
- Radius 6px; borders 1px `line`; shadows only on drawers/modals. Spacing scale 4/8/12/16/24/32/48/64.
- Buttons: primary (sea, white text, 46px), secondary (white, sea border), ink (black) for "Buy now", ghost. Full-width on mobile.
- Icons: 1.6px stroke, rounded caps (Lucide-style).

**Rules**
- Mobile-first; breakpoints 0 / 700 / 900 / 1200. Max content width 1200.
- No carousels of text. Photos do the work. One accent colour per screen.
- Every price shows ₹ with Indian grouping (₹1,49,000). MRP struck through + "% off" in green only when MRP > price.
- Every product surface shows: "Real pearl" badge, grade, rating + count.
- Empty states, loading skeletons and error states are required for every list and form.
- Accessibility: 4.5:1 contrast, focus rings, 44px tap targets, alt text on product images.

---

## 4. Information architecture

**Storefront**
```
/                      Home
/shop                  All products (filters, sort)
/shop/[category]       Category page
/collections/[slug]    Curated collection page (occasion, price band, named collection)  [v1.2]
/product/[slug]        Product page
/cart                  Cart (drawer on desktop, page on mobile)
/checkout              Checkout (address → delivery → payment → review)
/order/[id]/success    Order confirmation
/account               Login (OTP) · Profile · Addresses · Orders · Wishlist
/account/orders/[id]   Order detail + live tracking
/track                 Track order without login (order id + phone)
/verify/[code]         Certificate page [P2]
/farm                  Our farm (story page)
/blog, /blog/[slug]    Journal — pearl education, care, stories  [v1.2]
/reviews               All reviews page with photos, filter by rating  [v1.2]
/gifting               Gifting landing: by recipient, by budget, gift wrap, gift cards [P2]  [v1.2]
/pages/[slug]          About, Contact, FAQ, Privacy, T&C, Returns, Shipping, Care guide, Size guide
/search?q=             Search results
```

**Admin (`admin.eclat.in`)**
```
/login
/dashboard             Today's numbers, needs-attention list
/orders                List · filters · detail · status actions · refunds
/deliveries            Shipments and live status (Shiprocket)
/products              List · add/edit · variants · images · SEO
/categories            Manage 4+ categories, order, banner
/collections           Curated & auto collections, mega-menu groups  [v1.2]
/tags                  Occasion · pearl type · recipient tags  [v1.2]
/blog                  Posts  [v1.2]
/lookbooks             Shop-the-look images + linked products; shoppable videos  [v1.2]
/faqs                  Global and per-product FAQs  [v1.2]
/inventory             Stock by variant, low-stock, adjustments
/customers             List · detail (orders, addresses, reviews, notes)
/reviews               Moderation queue
/discounts             Promo codes [P2]
/content               Homepage banners, featured collections, pages
/reports               Sales, products, customers (Owner only)
/settings              Store, shipping rules, COD rules, payments, notifications, staff
```

---

## 5. Storefront — screen specifications

Each block below is written so it can be pasted into Lovable as a screen prompt.

### 5.1 Global
- **Announcement bar** (34px, sea bg): rotating 1–3 messages from admin. Dismissible.
- **Header**: logo left; desktop: deliver-to pincode, search input, icons (account, wishlist w/ count, bag w/ count); nav row below. Mobile: logo, search icon, wishlist, bag; horizontally scrolling chips below. Sticky.
- **Mega menu [v1.2]** (desktop hover / mobile drawer): four columns — *Shop by category* (4 categories + sub-types), *Shop by occasion* (Everyday, Work, Wedding guest, Festive, Party, Gifting), *Collections* (named/seasonal, e.g. "New harvest", "Best sellers", "Under ₹1,999"), *Learn* (Our farm, Care guide, Journal, Verify a pearl). Each column from admin Collections/Tags; menu groups editable.
- **Welcome popup [v1.2]**: first visit, after 8 s or 40% scroll — phone/email capture with consent line ("I agree to receive updates on WhatsApp/SMS/email"), shows first-order offer text (offer itself is P2). Dismissed state remembered 30 days.
- **Footer**: brand blurb, payment badges (UPI/Visa/MC/RuPay/EMI/COD), Shop / Help / About links, newsletter (phone or email), social.
- **WhatsApp floating button** bottom-right (opens wa.me with prefilled text incl. current product if on PDP).
- **Toast** for add-to-bag, wishlist, errors.
- **Cart drawer** (desktop) slides from right; mobile navigates to /cart.

### 5.2 Home
Sections in order (each toggleable from admin Content):
1. Hero carousel: 1–3 slides (image, kicker, headline, sub, 1–2 CTAs). Auto 6s, dots, arrows on desktop.
2. Category circles: 4–8 (image, label) → category page.
3. Trust row: 4 items (Certified real pearl · 15-day returns · Free insured shipping · Lifetime restringing). Text editable.
4. "Harvest picks": product row, 6–8 products, horizontally scrollable on mobile, 4-up desktop. Admin selects products or "bestsellers auto".
5. Shop by budget: 4 tiles (label, price cap → /shop?max=).
6. Two banners (image, title, sub → link).
7. Farm story block: headline, paragraph, 4 numbered steps, CTA, 3 photos.
8. Real vs plated comparison table (5 rows, editable).
9. Reviews wall: rating summary (avg, count, % recommend) + 3 latest 5★ reviews.
10. Instagram/farm grid: 6 images with captions.
11. **Shop by occasion [v1.2]**: tabs/chips (Everyday · Work · Wedding guest · Festive · Party) → 4–8 products each (auto from tags).
12. **Watch & shop [v1.2]**: 4–6 short vertical videos (farm, try-on, UGC) with the linked product card under each; tap to play inline, "Shop this" → PDP.
13. **Shop the look [v1.2]**: lifestyle image with 2–4 product cards beside it (hotspots optional).
14. **Journal [v1.2]**: 3 latest blog posts (cover, title, excerpt).
15. **Named collection feature [v1.2]**: one large collection banner + 4 products (admin picks the collection).
- **[P2]** Custom pearl configurator block · Sale countdown banner (campaign) · Loyalty teaser.

### 5.3 Category / Collection / Shop
- Title, product count, breadcrumb; **collection pages [v1.2]** add a banner image and a short description above the grid, and support auto rules (tags, price cap, new, rating) or manual ordering.
- Filter chips (mobile) / sidebar (desktop): category, price range, pearl grade (A/AA/AAA), metal, size, rating, "in stock", "new harvest", **occasion, pearl type, colour, recipient [v1.2]**.
- Sort: Popular (default), Price low→high, high→low, Newest, Rating.
- Grid: 2-up mobile, 3-up tablet, 4-up desktop. 24 per page, "Load more".
- Product card: image (hover swaps to 2nd image on desktop), badges (Real pearl; % off or New), wishlist heart, rating + count, name, one-line spec (grade · size · metal), price/MRP/% off, "Add to bag" (opens size selector inline if variants).
- Empty state: "No pearls match — clear filters".

### 5.4 Product page (PDP)
Left/top: gallery — main image 1:1 with zoom on tap/hover, 3–6 thumbnails, badge "Real pearl · certified". Video slot optional.
Right/bottom:
- Breadcrumb, name (serif), rating + review count (anchors to reviews).
- Price, MRP, % off, "Inclusive of all taxes".
- Offer strips **[P2]** (coupon code chips).
- **Pearl Passport** card (nacre gradient header): Grade, Size, Setting, Grown in (pond), Time in water, Harvest. "Verify this pearl" link **[P2]**.
- Variant selector (size / length / ring size) as chips; "Size guide" link opens modal. Out-of-stock chips disabled with "Notify me".
- Pincode check: input + button → "Delivery by {date} · COD available/not available · Free shipping".
- **Gift option on PDP [v1.2]**: checkbox "Is this a gift? Wrap it (₹149 / free per settings)" + message field; carries to cart.
- **Material badges [v1.2]**: 4 icon tiles under the CTA from `products.badges` (e.g. Freshwater pearl · 925 silver · Hypoallergenic · Grown on our farm).
- CTAs: Add to bag (primary) · Buy now (ink) · Ask on WhatsApp (ghost, full width). Quantity stepper (1–5).
- EMI line: "EMI from ₹X/month" → modal with plans (from Razorpay).
- Accordions: Why a real pearl costs this much · Product details · Care · Delivery & returns · **Contact support [v1.2]** (WhatsApp, email, hours).
- **FAQ block [v1.2]**: 4–6 questions (global PDP FAQs + product-specific) — "Will it tarnish?", "Are these real pearls?", "How do I care for it?", "Do you gift wrap?".
- **Gallery [v1.2]**: include one scale-reference photo (piece next to a coin/ruler) and one on-model photo per product — photography guideline for the client.
- Reviews section: summary bars (5→1), photo strip, list (name, verified badge, date, stars, text, photos), "Write a review" (only if logged in and purchased). Hide rating on cards/PDP until ≥ 1 approved review (never show "0.0"). **"See all reviews" → /reviews [v1.2]**.
- "Complete the look": 4–6 products from other categories.
- Mobile sticky bar: price + Add to bag.
- SEO: server-rendered, JSON-LD Product schema (price, availability, rating).

### 5.5 Cart
- Line items: image, name, variant, qty stepper, unit price, line total, remove. Save-for-later (moves to wishlist).
- Free-shipping progress bar ("Add ₹X more for free insured shipping").
- Gift wrap toggle (+₹/free per settings) + gift message (150 chars).
- Coupon field **[P2]**.
- Summary: subtotal, shipping (calculated at checkout / free), total. "Checkout" primary; "Continue shopping".
- Empty: illustration + "Shop the harvest".

### 5.6 Checkout (single page, 4 steps on mobile as accordion)
1. **Contact**: phone (OTP for guest to verify), email optional. Logged-in users skip.
2. **Address**: saved addresses or new (name, phone, pincode → auto city/state, line 1, line 2, landmark, type home/office). Pincode serviceability check inline.
3. **Delivery**: standard (free above threshold, else ₹X) with ETA from Shiprocket; insured shipping note.
4. **Payment**: Razorpay (UPI / cards / net banking / wallets / EMI) or **Cash on delivery** (if pincode COD-serviceable, order total ≤ COD limit, and product not COD-excluded). COD shows fee if configured and requires OTP confirm.
- Order review panel (sticky on desktop): items, totals, gift wrap.
- Errors inline; never lose entered data on failure.
- Success page: order id, items, ETA, "Track on WhatsApp" note, create-account prompt for guests.

### 5.7 Account
- OTP login (phone). Profile (name, email, birthday optional). Addresses CRUD. Orders list (status pill, items, total) → Order detail: timeline (Placed → Confirmed → Packed → Shipped → Out for delivery → Delivered / Cancelled / Returned), live tracking from Shiprocket with AWB link, invoice/receipt download, "Return / exchange" button within return window, "Reorder".
- Wishlist (synced when logged in).
- Reviews I've written.

### 5.8 Track order (no login)
Order id + phone → same timeline view.

### 5.9 Search
Instant results dropdown (products, categories) after 2 chars; full results page with same grid/filters. Typo-tolerant.

### 5.10 Content pages
CMS-editable rich text: About, Farm, FAQ, Contact (form → email + WhatsApp), Privacy, T&C, Returns, Shipping. Size guide modal content.

---

## 6. Admin dashboard — screen specifications

Layout: left sidebar nav, top bar (search orders/products/customers, notifications, user menu). Tables: sticky header, column sort, filter bar, bulk actions, pagination 25/50/100, CSV export. All destructive actions confirm.

### 6.1 Dashboard (home)
- Today / 7 days / 30 days selector.
- KPI cards: Orders, Revenue (Owner only), Avg order value (Owner), Pending to ship, COD pending confirmation, Returns open.
- Needs attention list: unpaid > 30 min, COD unconfirmed, ready-to-ship > 24h, low stock, delivery exceptions (RTO, undelivered), reviews awaiting moderation.
- Sales chart (14 days) (Owner). Top 5 products.

### 6.2 Orders
- List columns: Order #, date, customer, items, total, payment (Paid / COD / Failed / Refunded), status, delivery status, actions.
- Filters: status, payment method, date range, pincode/state, search by order #/phone/name/AWB.
- Order detail: customer + addresses (editable before ship), items with variant/SKU/price, totals, payment details (Razorpay id, method), COD confirmation status, timeline with who/when, internal notes, activity log.
- Actions: Confirm · Mark packed · Create shipment (Shiprocket: pick courier, print label, manifest) · Cancel (with reason; auto-refund if paid) · Partial/full refund (Owner; staff up to ₹X) · Resend WhatsApp/SMS · Edit address (pre-ship) · Mark delivered (manual override) · Start return/exchange.
- Bulk: confirm, create shipments, print labels, export.

### 6.3 Deliveries
- All shipments: order, AWB, courier, status (from webhook), last scan, EDD, exceptions. Filters by status/courier. Click → tracking timeline. RTO handling: mark received back, restock, refund.

### 6.4 Products
- List: image, name, category, variants count, price range, stock, status (Draft/Active/Archived), rating. Search + filters.
- Add/Edit form (tabs): **Basics** (name, category, subtitle, description rich text, tags, status) · **Pearl details** (type, grade A/AA/AAA/Designer, size mm, colour, lustre, pond, harvest batch, time in water, setting/metal, purity, weight) · **Variants** (option types e.g. Size/Length; generate combinations; per variant: SKU, price, MRP, stock, weight, barcode, image) · **Media** (drag-drop images, reorder, alt text; video URL) · **Shipping** (weight, dimensions, COD allowed, insured) · **SEO** (slug, title, meta, OG image) · **Visibility** (featured, new harvest, related products).
- Duplicate product. Bulk edit price/stock. CSV import/export (template = client product sheet).

### 6.5 Categories, collections and tags
- Categories: name, slug, image, banner, description, position, status. Assign products (drag order). Filters available per category.
- **Collections [v1.2]**: manual (pick & order products) or auto (rules: tags, price cap, new, rating, category). Menu group (category / occasion / collection / most-loved / price) and position drive the mega menu. Banner + description for the collection page.
- **Tags [v1.2]**: kinds occasion / pearl_type / colour / recipient; bulk-assign to products from the product list.

### 6.6 Inventory
- Stock by SKU with reserved (in open carts/orders) vs available; low-stock threshold per SKU; adjustments with reason (harvest in, damaged, correction); history log. Notify-me subscriptions list per SKU.

### 6.7 Customers
- List: name, phone, email, orders count, total spent (Owner), last order, tags. Detail: profile, addresses, orders, reviews, wishlist, notes, WhatsApp opt-in status, "Message on WhatsApp".
- Export CSV. GDPR-style delete/anonymise on request.

### 6.8 Reviews
- Queue: pending / approved / rejected. Shows product, rating, text, photos, customer (verified purchase badge). Approve / reject / reply (public reply shown on PDP).

### 6.9 Discounts **[P2]**
- Code, type (% / flat / free shipping), min order, max discount, per-customer limit, total limit, validity, applicable categories/products, first-order only, stackable no. Usage report.

### 6.10 Content
- Announcement messages. Home sections: enable/disable, order; hero slides (image, text, CTA, link); category circles; harvest picks (manual/auto); budget tiles; banners; farm story; comparison table; Instagram grid images. Pages editor (rich text). Size guide. Trust row text.
- **Blog [v1.2]**: posts with cover, excerpt, body, tags, related products, SEO, publish date.
- **Lookbooks & videos [v1.2]**: upload image/video, link products, choose placement (home / PDP / collection), order.
- **FAQs [v1.2]**: global, shipping, returns, PDP-default, and per-product.
- **Welcome popup [v1.2]**: enable, delay, text, consent copy; subscriber list export.

### 6.11 Reports (Owner)
- Sales by day/week/month; by category/product; payment mix; COD vs prepaid; returns rate; top customers; abandoned carts count. Export.

### 6.12 Settings
- Store: name, contact, address, GSTIN, social links.
- Shipping: free threshold, flat fee, insured note, pickup address, default courier preference (Shiprocket), packaging weights.
- COD: enabled, max order value, fee, excluded products/categories, OTP confirmation on/off.
- Payments: Razorpay keys (test/live), EMI enabled.
- Notifications: WhatsApp/SMS/email toggles per event, template text preview, sender ids.
- Returns: window days, non-returnable categories (e.g. earrings), exchange enabled.
- Staff: invite by email, role, deactivate. Audit log.
- Tax: prices inclusive; GST rate per category (for receipt line).

---

## 7. Functional rules

- **Stock**: decremented on payment success (prepaid) or on COD confirmation; reserved for 15 min during checkout; released on failure/expiry. No overselling.
- **Order statuses**: Pending payment → Paid/COD confirmed → Confirmed → Packed → Shipped → Out for delivery → Delivered; side states Cancelled, Return requested → Return approved → Received → Refunded; RTO. Each transition logged (user, time).
- **COD**: allowed only if pincode COD-serviceable (Shiprocket) AND total ≤ COD max AND no COD-excluded item. OTP confirm via WhatsApp/SMS within 2h else auto-cancel (configurable).
- **Refunds**: prepaid → Razorpay refund API to source; COD returns → bank transfer recorded manually with UTR.
- **Returns**: within window from delivered date; excluded categories blocked; custom/made-to-order, sale-tagged (configurable) and free-gift items non-returnable. Request requires reason + photos; **unboxing video optional at launch, required for damage claims [v1.2]**. Reverse pickup via Shiprocket; one pickup attempt cycle, second attempt may carry a fee (setting).
- **Cancellation [v1.2]**: customer can cancel from the order page until `cancel_allowed_until` (placed + 24 h, or until shipped — whichever first); prepaid auto-refunds to source; after that, only via support.
- **Refund method rules [v1.2]**: prepaid → source; COD → UPI transfer (UTR recorded) or store credit [P2]; damaged/wrong item → replacement first, refund if not possible.
- **Pricing**: all prices inclusive of GST; receipt shows GST component by category rate.
- **Free shipping**: order subtotal ≥ threshold (after discounts [P2]).
- **Reviews**: only customers with a delivered order of that product; one review per product per customer; moderation before publish.
- **Search**: name, category, tags, SKU; synonyms editable [P2].
- **Wishlist**: localStorage for guests, merged into account on login.
- **Guest → account**: on success page, one tap creates account (phone already verified).

---

## 8. Data model (core entities)

```
Customer(id, phone*, email, name, dob, whatsapp_opt_in, tags, created_at)
Address(id, customer_id, name, phone, line1, line2, landmark, city, state, pincode, type, is_default)
Category(id, name, slug, image, banner, description, position, status)
Product(id, category_id, name, slug, subtitle, description, status, featured, is_new, tags[], seo{}, pearl{type,grade,size_mm,colour,lustre,pond,harvest_batch,months,setting,purity}, cod_allowed, insured, related_ids[], created_at)
ProductImage(id, product_id, url, alt, position, variant_id?)
OptionType(id, product_id, name)           e.g. Size
Variant(id, product_id, sku*, options{Size:"7 mm"}, price, mrp, weight_g, dims, barcode, status)
Inventory(variant_id, on_hand, reserved, low_stock_threshold)
InventoryMovement(id, variant_id, delta, reason, ref, user_id, created_at)
Cart(id, customer_id?, session_id, items[{variant_id, qty}], gift_wrap, gift_msg, updated_at)
Order(id, number*, customer_id?, contact{phone,email}, ship_address{}, items[{variant_id, sku, name, options, qty, unit_price, mrp, gst_rate}], subtotal, shipping_fee, cod_fee, discount[P2], total, payment_method, payment_status, status, gift{}, notes, source, created_at)
Payment(id, order_id, provider, provider_order_id, provider_payment_id, method, amount, status, raw)
Refund(id, order_id, payment_id?, amount, reason, method, utr?, status, by_user)
Shipment(id, order_id, provider=shiprocket, sr_order_id, awb, courier, label_url, manifest_url, status, edd, last_event, events[], rto)
Review(id, product_id, customer_id, order_id, rating, title, text, photos[], status, reply, created_at)
Discount[P2](id, code, type, value, min_order, max_discount, per_customer, total_limit, starts, ends, scope{}, first_order_only, uses)
Content(key, json)                          hero, sections, pages, trust, comparison
Notification(id, order_id, channel, template, to, status, provider_id, sent_at)
User(id, email, password_hash, role, totp_secret, active)   admin users
AuditLog(id, user_id, entity, entity_id, action, diff, created_at)
```

---

## 9. Integrations

| Integration | Purpose | Key points |
|---|---|---|
| **Razorpay** | Payments, EMI, refunds | Orders API → Checkout.js on client → verify signature server-side → webhook `payment.captured` / `payment.failed` / `refund.processed`. Store live+test keys in Settings. Idempotent webhook handling. |
| **Shiprocket** | Serviceability, rates, shipments, tracking, COD | Auth token refresh; `serviceability` at PDP/checkout (pincode, weight, COD flag); create order → assign AWB → generate label/manifest → pickup; tracking via webhook + polling fallback; map SR statuses to order timeline; RTO events. |
| **WhatsApp Business API** (Meta Cloud API or BSP e.g. Interakt/Gupshup) | Order notifications, COD confirm, chat | Templates: order_confirmed, cod_confirm (with Yes/No buttons), shipped (AWB + link), out_for_delivery, delivered, return_update, abandoned_cart [P2]. Opt-in captured at checkout. Fallback to SMS if not delivered in 10 min. |
| **SMS** (MSG91 / Twilio) | OTP, fallback notifications | DLT-registered templates (India). |
| **Email** (Resend / SES) | Receipts, account, fallback | Transactional templates with Eclat branding. |
| **Search** | Product search | Meilisearch (or Postgres full-text at launch); index on product save. |
| **Media** | Images | S3 + CloudFront; on-upload resize to 200/600/1200/2000; WebP/AVIF. |
| **Analytics** | GA4, Meta Pixel (+ Conversions API), Google Shopping feed | Events: view_item, add_to_cart, begin_checkout, add_payment_info, purchase (server-side purchase too). Feed at `/feeds/google.xml`. |
| **Maps/Pincode** | Pincode → city/state | India Post pincode dataset (local table). |

---

## 10. Non-functional requirements

- **Performance**: LCP < 2.0s on 4G mobile for home/PDP; TTFB < 400ms; images lazy + responsive; Lighthouse ≥ 90 mobile.
- **Availability**: 99.9%; auto-scaling on AWS (ECS Fargate), RDS Multi-AZ, daily backups, 30-day retention.
- **Security**: HTTPS/HSTS; WAF; rate limiting on OTP/login/checkout; OWASP top-10 checks; PCI scope avoided (Razorpay hosted fields); secrets in AWS Secrets Manager; admin 2FA; audit log; least-privilege IAM.
- **SEO**: SSR, canonical URLs, sitemap, robots, structured data (Product, Breadcrumb, Organization), OG tags.
- **Privacy**: consent for WhatsApp; data export/delete on request; no card data stored.
- **Observability**: error tracking (Sentry), uptime checks, CloudWatch alarms → WhatsApp/email to team; structured logs with order ids.
- **Compatibility**: last 2 versions Chrome/Safari/Firefox/Edge; iOS 15+; Android 10+.
- **Localisation**: English only at launch; INR; India addresses; DD Mon YYYY dates. Hindi/Marathi strings [P2].

---

## 11. Tech stack and environments

- Storefront: **Next.js 14 (App Router), React, Tailwind** — exported/adapted from Lovable, SSR for PDP/category/home.
- Admin: React (Vite or Next) + Tailwind, shared design tokens.
- API: **Node.js (NestJS or Express) + TypeScript**, REST (OpenAPI), Zod validation, JWT (customer) + session+2FA (admin).
- DB: **PostgreSQL** (RDS) with Prisma; Redis (ElastiCache) for sessions, carts, rate limits, caches.
- Jobs: BullMQ workers for notifications, webhooks retry, feed generation, abandoned cart [P2].
- Infra: AWS Mumbai — ECS Fargate, ALB, RDS Multi-AZ, S3+CloudFront, WAF, Secrets Manager, CloudWatch; Terraform; GitHub Actions CI/CD; environments **dev → staging → production**; blue/green deploy; feature flags.
- Repos: `eclat-web`, `eclat-admin`, `eclat-api`, `eclat-infra`.

---


## 11A. System architecture — how store and admin connect

![Eclat system flowchart](Eclat_System_Flowchart.png)

**One API, one database.** The storefront (`eclat.in`) and the admin (`admin.eclat.in`) are two front-ends over the same Node.js API and the same PostgreSQL database. Nothing in either front-end talks to Postgres, Razorpay or Shiprocket directly. All business rules — stock, roles, COD, returns — live in the API once.

| Layer | What it is | Talks to |
|---|---|---|
| Storefront | Next.js (SSR) | Public API `/v1/*` with JWT after phone OTP; guest sessions via cookie |
| Admin | React SPA | Admin API `/admin/v1/*` with session + TOTP 2FA; every route role-checked (Owner / Staff) |
| API | Node.js + TypeScript (NestJS), REST, OpenAPI spec | PostgreSQL (Prisma), Redis, S3, Razorpay, Shiprocket, WhatsApp, SMS, email |
| Workers | BullMQ on Redis | Notifications, webhook processing, COD timeout, feeds, low-stock alerts |
| Webhooks | `/hooks/razorpay`, `/hooks/shiprocket`, `/hooks/whatsapp` | Verified by signature, stored in `webhook_events` (unique provider+event_id) before processing → idempotent |

**API modules** (one folder each in `eclat-api`): `auth`, `catalogue`, `orders`, `payments`, `shipping`, `reviews`, `customers`, `content`, `admin`, `notifications`, `webhooks`, `reports`.

### Key flows (sequence)

**Prepaid checkout**
1. `POST /v1/checkout/start` → API validates cart, pincode serviceability (Shiprocket cache), calls `reserve_stock(items)` in a transaction, creates `orders` row (`pending_payment`) + Razorpay order → returns `razorpay_order_id`.
2. Client opens Razorpay Checkout → on success `POST /v1/checkout/verify` with signature → API marks `payments.status=captured` **only after** signature verification.
3. Razorpay webhook `payment.captured` arrives (may be before or after step 2) → worker: if order still `pending_payment` → `commit_stock(order)` → status `confirmed` → `order_events` → enqueue `order_confirmed` WhatsApp.
4. If no capture within 15 min → worker calls `release_stock(order)` and marks `cancelled` (reason `payment_timeout`).

**COD checkout**
1. Same as above but `payment_method=cod`, status `cod_unconfirmed`, `cod_confirm_deadline = now + settings.cod.confirm_hours`.
2. Worker sends WhatsApp template `cod_confirm` with Yes/No buttons (SMS fallback with a link).
3. Yes → `/hooks/whatsapp` → `commit_stock` → `confirmed`. No or timeout → `release_stock` → `cancelled`.

**Shipment**
1. Admin clicks *Create shipment* on a `confirmed`/`packed` order → `POST /admin/v1/orders/:id/ship` → API creates Shiprocket order, assigns AWB, fetches label → `shipments` row → order `shipped` → WhatsApp `shipped` with tracking URL.
2. Shiprocket tracking webhooks → `shipment_events` → map to `out_for_delivery` / `delivered` / `undelivered` / `rto_*` → order status + customer notification. Polling job every 2 h as fallback for missed webhooks.
3. `delivered` sets `orders.delivered_at` and `return_window_ends = delivered + settings.returns.window_days`.

**Return / refund**
Customer requests from order page (within window, returnable items only) → `returns` row → admin approves → reverse pickup via Shiprocket → `return_received` → `commit` back to stock (`inventory_movements.reason=return`) → refund: prepaid via Razorpay refund API, COD via manual bank transfer with UTR → `refunded`.

**Review**
Only if `orders.status=delivered` for that product and no existing review → `pending` → admin approves → trigger recalculates `products.rating_avg/count`.

**Product publish**
Admin saves product → variants generated from option types → inventory rows created → images uploaded to S3 (resized) → `search_tsv` updated by trigger → storefront cache for that product/category invalidated (Redis key) → live immediately.

## 11B. Database

Source of truth: **`eclat_schema.sql`** (PostgreSQL 15+, run as migration 001; Prisma introspects it). Tested: DDL applies clean; `reserve_stock` rejects overselling under contention.

**Decisions**
- Money in **integer paise**; prices GST-inclusive; `gst_breakup` stored per order for receipts.
- **Snapshots** on `order_items` (name, options, price) and `orders.ship_address` — history never changes when catalogue changes.
- **Inventory** = `on_hand` − `reserved`; DB constraint `reserved ≤ on_hand`; every change logged in `inventory_movements`. Only the three functions `reserve_stock / commit_stock / release_stock` mutate stock.
- `jsonb` only for genuinely variable shapes: `products.pearl`, `variants.options`, `settings.data`, `content_blocks.data`, `orders.ship_address`. Everything filtered or reported on is a real, indexed column (`grade`, `metal`, `status`, `placed_at`…).
- Search: Postgres full-text (`search_tsv`, GIN) + trigram on name for typo tolerance. Meilisearch only if needed later.
- Idempotency: `webhook_events(provider, event_id)` unique; `payments.provider_payment_id` unique.
- Roles enforced in API, audited in `audit_log`; Staff never receives revenue fields from `/admin/v1/reports/*` or `dashboard` (fields stripped server-side, not hidden in UI).
- Order numbers: `ECL1001, ECL1002…` from a sequence; UUIDs for all internal ids.
- Time zone: stored UTC, reported in `Asia/Kolkata` (see `v_daily_sales`).
- Backups: RDS automated daily + PITR 30 days; restore drill in week 6.

**Entity map (summary)** — customers → addresses; categories → products → option_types / variants → inventory → inventory_movements; carts/cart_items, wishlist_items; orders → order_items, order_events, payments → refunds, shipments → shipment_events, returns; reviews; discounts [P2] → discount_uses; content_blocks, pages; notification_templates → notifications; admin_users, settings, audit_log; pincodes; webhook_events; stock_alerts.

## 11C. API conventions

- Base: `https://api.eclat.in`. Versioned paths `/v1`, `/admin/v1`. JSON only. Errors `{ code, message, details }` with stable `code` strings (e.g. `OUT_OF_STOCK`, `PINCODE_NOT_SERVICEABLE`, `COD_NOT_ALLOWED`).
- Auth: customer `Authorization: Bearer <JWT>` (15 min access + refresh cookie); guest `x-session-id`. Admin: httpOnly session cookie + CSRF token; TOTP on login.
- Pagination: `?page=&limit=` (max 100) with `{ data, page, total }`. Sorting `?sort=price:asc`. Filtering explicit query params, no generic filter language.
- Rate limits (Redis): OTP 5/10 min per phone; login 10/15 min per IP; checkout 20/min per session.
- Idempotency-Key header honoured on `POST /v1/checkout/*` and admin refund/ship actions.
- Every mutating admin call writes `audit_log`.
- OpenAPI spec generated from code (`/docs` on staging only).

**Public endpoints (P1)**: `GET /v1/catalogue/{home,categories,products,products/:slug,search}` · `POST /v1/auth/otp/{send,verify}` · `GET/PUT /v1/me`, `/v1/me/addresses` · `GET/PUT /v1/cart` · `GET /v1/shipping/pincode/:pin?cod=1` · `POST /v1/checkout/{start,verify}` · `GET /v1/orders`, `/v1/orders/:number`, `/v1/orders/track` · `POST /v1/orders/:number/return` · `POST /v1/reviews` · `GET/PUT /v1/wishlist` · `POST /v1/stock-alerts`.

**Admin endpoints (P1)**: `/admin/v1/{dashboard,orders,orders/:id/(confirm|pack|ship|cancel|refund|address|note),shipments,products,products/:id/(variants|images),categories,inventory,inventory/adjust,customers,reviews,content,pages,settings,staff,reports,audit}`.

## 11D. Repositories, environments, definition of done

| Repo | Contents | Owner |
|---|---|---|
| `eclat-web` | Next.js storefront (Lovable export, hardened) | Jaydip |
| `eclat-admin` | React admin (Lovable export, hardened) | Jaydip |
| `eclat-api` | NestJS API + workers + Prisma + migrations (`001_init.sql` = `eclat_schema.sql`) | Amit |
| `eclat-infra` | Terraform (ECS, RDS, Redis, S3/CloudFront, WAF, Secrets), GitHub Actions | Indrajit |

Environments: `dev` (local Docker: Postgres + Redis + MinIO) → `staging` (AWS, Razorpay test, Shiprocket sandbox, WhatsApp test number) → `production`. Secrets only in AWS Secrets Manager; `.env.example` in each repo.

**Definition of done for any feature**: API endpoint with validation + tests · migration if schema changes · admin and/or storefront UI with loading/empty/error states · audit log or order_event where relevant · notification hooked if customer-facing · OpenAPI updated · demoed on staging Friday.

## 12. Acceptance criteria (launch gate)

1. Customer can complete prepaid (UPI, card, EMI) and COD orders on mobile in ≤ 3 screens after cart.
2. COD order sends WhatsApp confirm; unconfirmed orders auto-cancel per setting.
3. Admin creates a shipment in ≤ 3 clicks; label prints; tracking updates appear on customer order page within 15 min of courier scan.
4. Adding a product with 3 variants and 4 images takes an admin < 5 minutes; appears on site immediately.
5. Stock never goes negative under a 50-concurrent-checkout load test.
6. Reviews from verified buyers only; moderation works; rating updates on PDP.
7. All notification events fire (WhatsApp → SMS fallback) for a test order end-to-end.
8. Lighthouse mobile ≥ 90 on home, category, PDP; LCP < 2s on staging.
9. Staff role cannot see revenue or settings; audit log records order edits.
10. Backups restore tested once; monitoring alerts reach the team.

---

## 13. Open questions (client)
COD limit · free-shipping threshold · return window and earring exclusion · guest checkout · gift wrap fee · review photos · staff roles · launch offer. (Tracked in the requirements checklist.)

---

## 14. How to use this PRD with Lovable

1. Create two Lovable projects: **Eclat Store** and **Eclat Admin**. In each, paste Section 3 first as the system/design instruction.
2. Build screens in this order — Store: Global (5.1) → Home (5.2) → Category (5.3) → PDP (5.4) → Cart (5.5) → Checkout (5.6) → Account (5.7) → Track/Search/Pages. Admin: Layout → Dashboard → Orders (list + detail) → Products (form) → Deliveries → Inventory → Customers → Reviews → Content → Settings.
3. For each screen paste its section verbatim as the prompt, then add: "Use mock data. Include loading, empty and error states. Mobile first."
4. Do not let Lovable add a backend or auth; keep it UI with mock JSON. Engineering replaces mocks with the API from Sections 8–9.
5. Export code after each screen is approved; engineering reviews for component reuse before the next screen.
6. Design sign-off = Eclat approves the Lovable preview links for Home, PDP, Checkout, Orders list, Product form. Everything else follows the system.

## 15. Competitor gap analysis — chandranipearls.in and flawnt.store (12 Sep 2026)

Both are Shopify stores. Chandrani (Kolkata, since 1985, 300+ SKUs, Smile.io loyalty, Judge.me reviews, Razorpay Magic checkout, multi-currency) is the broad-catalogue pearl incumbent. Flawnt (Mumbai, since 2021, ~200 SKUs, Shiprocket, Fastrr checkout, Track123) is the design-led boutique. Everything below was checked against this PRD; **"Have"** = already in P1, **"Added"** = added in v1.2, **"P2"** = deliberately deferred.

| Feature seen | Where | Status in Eclat PRD |
|---|---|---|
| Rotating announcement bar (free shipping · COD above ₹1,000 · dispatch in 24 h) | Both | Have |
| Mega menu: category · occasion · named collections · most loved · price bands | Chandrani | **Added** (§5.1, §6.5, migration 002 `collections`, `tags`) |
| Shop by occasion (Casual, Work, Wedding guest, Party…) | Chandrani | **Added** (home §5.2 #11, filters §5.3) |
| Named seasonal collections with banner + products (Lotus, Neer, Wedding, Festive) | Chandrani | **Added** (collection pages, home #15) |
| Price-band collections (Under ₹X, Premium) | Both | Have (budget tiles) + auto-collections **Added** |
| New arrivals / Best sellers / Hot tabs | Both | Have (badges) · auto-collections **Added** |
| Watch & shop shoppable videos / UGC try-on | Both | **Added** (home #12, `videos`) |
| Shop the look | Flawnt | **Added** (home #13, `lookbooks`) |
| Category circles | Flawnt | Have |
| Trust icon row (certified · members · easy return · free shipping) | Both | Have |
| Product card: sale/sold-out/new/best-seller badges, rating, add to cart | Both | Have (hide "0.0" ratings — **Added** rule) |
| PDP: gift wrap checkbox with price | Flawnt | **Added** to PDP (was cart-only) |
| PDP: material icon badges (freshwater pearl · 18K plating · hypoallergenic · silver needle) | Flawnt | **Added** (`products.badges`) |
| PDP: estimated delivery by pincode | Flawnt | Have |
| PDP: accordions incl. contact support; FAQ block | Flawnt | **Added** (contact support, `faqs`) |
| PDP: scale photo with coin/ruler, front/back | Flawnt | **Added** as photography guideline |
| Reviews app with photo, "from 458 reviews", all-reviews page | Chandrani | Have + **Added** /reviews page |
| Track your order page (order no. + AWB) | Flawnt | Have (/track) |
| Blog / journal (care, education, festive stories) | Both | **Added** (`blog_posts`) — important for SEO on "real vs fake pearl" queries |
| Care guide page, FAQs page | Both | Have (pages) — content from client |
| Newsletter with WhatsApp/SMS consent line; welcome popup with first-order code | Both | **Added** popup + consent fields (`subscribers`, opt-ins); the code itself is P2 (discounts) |
| Cancellation within 24 h | Flawnt | **Added** rule + `cancel_allowed_until` |
| Return needs unboxing video; pickup fee on re-attempt; sale items non-returnable | Both | **Added** (video optional, required for damage; settings) |
| COD refunds as store credit / UPI only | Both | **Added** rule; store credit wallet **P2** (`store_credits`) |
| Loyalty points (Smile.io: signup, per ₹, review, birthday, follow) | Chandrani | **P2** (`loyalty_ledger`) |
| Gift cards | Chandrani | **P2** (`gift_cards`) |
| Bundles / "pack of 3" gift packs | Flawnt | **P2** (`bundles`) — the custom-pearl + stud set is a natural first bundle |
| Sale countdown timer ("Grab now") | Flawnt | **P2** (`campaigns`) |
| Multi-currency (USD/GBP/EUR…) | Chandrani | Out of scope (international is P3) |
| Store locator | Chandrani | Out of scope until a store exists |
| Language switcher (Google Translate) | Flawnt | Skip — Hindi/Marathi strings are P2 |
| One-page checkout with phone-number address autofill (Razorpay Magic / Fastrr) | Both | Have OTP checkout; **Added**: after OTP, prefill last address for returning customers |
| Pre-orders | Flawnt | Covered by "grown to order" custom pearls (P2) |

**What neither of them has — and Eclat will:** farm-to-customer origin and Pearl Passport on every product, scannable certificate (P2), real-vs-plated comparison, designer/image pearls grown to order, harvest-based "new drop" collections that are actually true. Keep these above the fold; the features in the table are table stakes, not the story.

**Lovable impact:** four new screen blocks (occasion tabs, watch & shop, shop the look, journal) on Home; a Collection page template; a Blog list/post template; a Reviews page; PDP gains gift checkbox, badge tiles, FAQ block. Admin gains Collections, Tags, Blog, Lookbooks/Videos, FAQs screens.

**Engineering impact:** migration 002 (tested); collection auto-rules resolver in Catalogue service; blog SSR pages with sitemap; video hosting on S3/CloudFront (mp4 ≤ 20 MB, or embed Instagram); consent capture at popup/checkout with timestamp.
