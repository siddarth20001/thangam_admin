# Thangam Admin

Separate React + TypeScript + Vite administration app for the Thangam website. Includes the transcribed 2026 PDF catalog, product/category CRUD, search, category/status filters, CSV export, and Supabase email/password authentication.

## Run locally

```sh
npm install
npm run dev
```

Without Supabase environment variables, the app opens in **local preview** mode. Edits persist only in this browser. The original PDF catalog remains in `src/data/catalog.ts`. Serial numbers match the PDF, including its gaps. Stock quantities were blank in the PDF and are not invented. Product names preserve the source spelling, with spacing normalized. Gift Box and Colour Matches are marked non-discountable; the final Roll Cap and Paper Bomb section should have its discount policy confirmed before discounts are implemented.

## Connect Supabase

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (the legacy anon key also works). Never put a service-role or secret key in a Vite variable.
3. Run `supabase/schema.sql` once in the Supabase SQL editor.
4. Create your admin user in Supabase Authentication. Add the user's UUID to `public.admin_users` with the SQL statement at the bottom of the schema.
5. Restart Vite and sign in. On an empty database, click **Import PDF catalog**. Import is explicit; local edits are not uploaded automatically. Importing upserts the original PDF IDs and can overwrite those rows. Category and product requests are separate; if the product request fails, categories may have imported already, and importing again can retry.

Database row-level security restricts writes and reads to listed admins. New authentication users do not gain catalog access. The visibility migration below enables public storefront reads for ON products. Do not run the new-table SQL against an existing schema without reconciling it first.

```sh
npm run build
npm run preview
```

Deploy `dist` using any static host when ready. Both repositories can share the same Supabase project. Production database access and authentication require configuration and validation against your project.

References: [Vite guide](https://vite.dev/guide/), [Supabase password login](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [Supabase client](https://supabase.com/docs/reference/javascript/auth).

## Product ON/OFF visibility

Each product has a switch in the **Website** column. ON sets `products.active = true`; OFF sets it to false. Changes are saved immediately, and failed saves leave the switch unchanged. Admins can still see and edit OFF products.

Run `supabase/migrations/20261012_public_catalog_visibility.sql` after the schema on new installations. Public users can read categories and only ON products. Admin-only write access remains in place.

The separate website must use the same Supabase project with its publishable key and load products with `.from('products').select('*').eq('active', true)`. It must fetch updated data instead of relying on a hardcoded catalog or a stale cache. A service-role client bypasses row-level security, so server-side website queries must also include the active filter.

## Per-product discounts

The Discount button in Actions opens a percentage editor with a sale-price preview. Valid values are 0–100%; 0 removes the discount. Discounts save to `products.discount_percent` without changing the original price. The admin table and CSV show the resulting sale price. Flat-rate categories have the button disabled; if a category is made non-discountable, its products display at their original price. Changing it back restores any stored percentage.

For existing databases, run `supabase/migrations/20261012_product_discounts.sql`. It has already been applied to the connected project. The website should load category `discountable` alongside `discount_percent`, and compute the effective price as `Math.round(price * (1 - (category.discountable ? discount_percent : 0) / 100) * 100) / 100`. Website display and checkout integration must be implemented in the separate website repository.

## Orders

Navigation now includes Overview, Orders, Products, and Categories. Orders loads the Supabase `orders` table, showing order number, customer contact details, date (India time), total, and status. Search by order number/customer/phone/email, filter by status, or refresh the list. No demo orders are persisted.

For new databases, run `supabase/migrations/20261012_orders.sql` after the base schema. It has been applied to the connected project. Order data is accessible only to listed admins. The separate website checkout still needs a trusted backend to create orders with validated totals; public order creation and order line items have not been implemented. Each order has a status dropdown that saves immediately to Supabase. Available statuses are pending, confirmed, processing, shipped, delivered, and cancelled. Failed saves preserve the original status; conflicting updates require refreshing the order list.

## Discount for all products

Use the percentage box above the product list and click **Apply to all**. This replaces each eligible product's discount, including OFF products, regardless of search/status filters. Flat-rate categories are excluded. Enter 0 to remove all eligible discounts. New products added later start at 0%; individual discount controls remain available.

Apply `supabase/migrations/20261012_bulk_discount.sql` in new environments. This migration is already applied to the connected database. The function validates admin membership and percentage bounds and updates eligible products in one transaction. Existing prices and visibility are unchanged.

## Import CSV

Click **Import CSV** above the product list, choose a file, review its preview, and click **Import products**. Download the template or edit an existing Export CSV file. Files must be under 2 MB with at most 2,000 rows.

Required headings: `Serial`, `Product`, `Category`, `Price INR`, `Unit`. Optional: `Active`, `Discount %`. The exported `Sale price INR` is ignored; selling prices are recalculated. Categories must already exist (matched by name, ignoring case). Units are `1 Box`, `1 pkt`, `1 Bag`, or `1 pcs`. Numeric prices must not contain currency symbols or thousands separators. Duplicate serials, malformed rows, invalid numbers, and discounts on flat-rate categories block the whole import.

Existing serial numbers are updated; new serials are inserted. Existing IDs are preserved in Supabase, and omitted products are not deleted. Blank/omitted optional values preserve existing visibility and discounts; new products default to ON and 0% discount. Moving to a flat-rate category defaults a blank discount to zero. All rows save in one Supabase upsert request; category creation is separate. Preview mode imports stay in the browser.

CSV validation checks: `node --test tests/csv-import.test.mjs`.
