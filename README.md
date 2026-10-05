# Beta Drips

**Exceptional fashion. Nigerian brands.**

Beta Drips is a planned curated marketplace showcasing Nigerian clothing brands across ages, styles and ethnic backgrounds, starting with an HNG Lesson 2 shopping experience.

## Current status

The React app has **40 illustrative products across eight brands**, category browsing, a brand filter, brand views and product details with required size/quantity selection, a persistent cart and a checkout interface. It uses JavaScript, Vite and plain CSS.

The name and tagline remain visible. Individual Sample product badges have been removed; counts update with the active filters. The app shows one concise notice per view:

> Preview catalogue. Products, prices and imagery are illustrative.

The migration now explicitly grants schema USAGE and SELECT on orders, order_items and order_emails to authenticated customers, even when automatic table exposure is disabled. Owner-only RLS policies filter those reads. PUBLIC/anonymous table access and browser writes are revoked. Migration permission assertions and the server tests passed locally; The user has applied the migration; cross-account RLS isolation still needs explicit verification.

The complete schema/table/function permission review also confirmed explicit service_role table grants and EXECUTE on save_order, with function access revoked from PUBLIC, anon and authenticated. The RPC uses SECURITY INVOKER with an explicit search path. No further migration correction was needed. Run the initial migration file supabase/migrations/202610020001_orders.sql once on a fresh setup; if already applied, use the repeatable permission blocks instead of recreating tables. See .env.example for the eight configuration variable names; credentials belong in ignored local environment files or Netlify settings.

Integration code now includes Supabase Google sign-in/sign-out, saved order history, an authenticated Netlify order function, atomic/idempotent SQL persistence and separate Mailgun email status. **The user reports successful real local Google sign-in, checkout, Supabase order saving, Mailgun email receipt and order persistence after logout/login. The migration is applied. Production deployment remains pending.** Mailgun currently uses a sandbox restricted to authorized recipients; the tested confirmation arrived in Gmail spam. See [HNG setup instructions](docs/HNG-SETUP.md) for SQL, Google Cloud, redirect URLs, Mailgun, Netlify and live checks.

Completed work:

- Added the official Supabase JavaScript client, PKCE session handling, Account loading/error states and owner-scoped history queries.
- Added orders/items/email-status migration and a service-only transactional RPC with unique per-customer retry keys.
- Added server user verification, validated delivery/cart inputs, trusted catalogue pricing and HTML/plain-text confirmations.
- Added persistence-only confirmation/cart clearing, safe retry keys and independent email acceptance/failure/uncertainty reporting.
- Added placeholder-only .env.example, Netlify configuration and automated server tests.

- Added accessible Catalogue, Cart and Account navigation with the total item quantity.
- Added required product size/quantity selection, separate cart lines per size, quantity editing, removal and empty-cart handling.
- Added validated localStorage cart persistence; totals use current catalogue prices.
- Added checkout fields, field errors, first-error focus and an order summary. Entered details survive view navigation in memory.
- Checkout submits only for a signed-in session; it confirms only a successful saved-order response. Missing configuration disables submission.

- Expanded the existing catalogue to eight brands with five products each, preserving the existing app structure and product IDs.
- Reused 16 existing photographs, replaced two logo-heavy photographs and added 22 distinct licensed images. Sources and download URLs are recorded for all 40.
- Removed badges from cards/details and unused badge CSS, retaining the exact single preview notice.

- Preserved existing documentation and Git history, and retained the initial React/Vite setup.
- Expanded the reusable ProductCard to render catalogue data and local clothing photographs.
- Added category and brand filters, combined matching, a clear-filters control and an empty state.
- Added brand views with a description and all five products, regardless of catalogue filters.
- Added linked product details, relevant size options and Nigerian naira formatting with numeric prices.
- Downloaded and visually inspected 40 different licensed photographs, with source and licence records.
- Added keyboard focus handling, labelled selects and layouts that fit narrow mobile screens.
- Updated PRD.md and AGENTS.md for each brick. Catalogue/cart work added no packages; this integration brick adds the official Supabase client.

## Setup and run

Use a Node.js version compatible with Vite: `^20.19.0 || >=22.12.0`.

```bash
npm install
npm run dev
```

Open the local URL Vite prints (normally `http://localhost:5173`; it chooses another port if that is occupied).

This environment's default shell selects Node.js 18.20.8 and npm 10.8.2. An existing installation at `/usr/bin/node` provides compatible Node.js 22.15.1 with npm 10.9.2. No system software was changed. Here, use:

```bash
PATH=/usr/bin:$PATH npm run dev
```

For frontend-only development use the command above. To run functions locally, follow the Netlify Dev instructions in [HNG setup](docs/HNG-SETUP.md).

To test, build and preview locally:

```bash
PATH=/usr/bin:$PATH npm run test
PATH=/usr/bin:$PATH npm run build
PATH=/usr/bin:$PATH npm run preview
```

The production build writes to ignored `dist/`; preview does not deploy the app. The existing package-lock.json records dependency versions for repeatable installs.

## Files and concepts

| File | Purpose |
| --- | --- |
| `index.html` | Provides the HTML root and loads the JavaScript entry point. |
| `package.json`, `package-lock.json` | Define npm commands, dependencies and resolved versions; Include the Supabase client and the test command; lockfile records installed versions. |
| `vite.config.js` | Enables the React plugin; unchanged. |
| `src/main.jsx` | Mounts React and imports CSS; unchanged. |
| `src/App.jsx` | Owns cart and checkout-detail state, persistence, navigation and existing catalogue views. |
| `src/data/catalogue.js` | Defines eight brand fixtures, 40 product fixtures, sizes, filter logic and price formatting. |
| `src/data/imageSources.json` | Records each local image, original download URL, photographer, source page, licence and resizing details. |
| `src/components/ProductCard.jsx` | Receives a product prop and renders its sample listing with links to the brand and details. |
| `src/components/ProductDetails.jsx` | Requires size and quantity before invoking the parent add-to-cart callback; selections reset between products. |
| `src/data/cart.js` | Validates stored cart data, merges matching IDs/sizes, reads persistence and calculates catalogue-derived totals. |
| `src/components/Cart.jsx` | Renders editable quantities, line totals, removal and the empty state. |
| `src/components/Checkout.jsx` | Validates fields, requires sign-in, submits with loading/error states and shows the order summary. |
| `src/components/Account.jsx` | Offers Google sign-in/sign-out and reloads owner-scoped saved history, with independent email status. |
| `src/lib/` | Public Supabase client/session handling, shared checkout validation and digest-based retry/submission logic. |
| `netlify/functions/submit-order.mjs`, `netlify/lib/orders.mjs` | Verify the user, calculate trusted prices, save atomically and handle formatted server-side email. |
| `supabase/migrations/202610020001_orders.sql` | Defines order snapshots, separate email status, RLS and server-only transactional persistence. |
| `.env.example`, `netlify.toml`, `docs/HNG-SETUP.md` | Placeholder configuration, build/function settings and service setup instructions. |
| `tests/orders.test.mjs` | Exercises server validation/persistence/email branches with mocks; inspects SQL declarations without claiming live RLS verification. |
| `src/components/ImageCredit.jsx` | Displays linked photograph attribution and licence information. |
| `src/index.css` | Styles the grid, cards, filters and stacked mobile detail view with plain CSS. |
| `public/images/catalogue/` | Contains the 40 local JPEG assets; runtime browsing does not fetch stock-photo services. |
| `.gitignore` | Excludes dependencies, builds and local environment files while allowing .env.example; unchanged. |

App imports ProductCard and renders it for each matching product with `<ProductCard key={item.id} product={item} />`. The product prop passes an object from the parent to the child. The parameter `{ product }` destructures the props object: it extracts the product property, equivalent to reading `props.product`. Curly braces inside JSX insert JavaScript expressions such as `{product.name}` and `{formatPrice(product.price)}`.

React state stores the current filters and selected size. Category and brand filters combine; mismatched combinations show an empty state. Brand views always show all five products. Simple native hash links (`#brand/bigger`, `#product/bigger-tee`) support direct links, refresh and browser history without adding a routing package. Returning to the catalogue retains filters during the current page session; a full reload resets those filters. Adding to cart uses the selected size and quantity. This does not reserve inventory. Quantities are whole numbers from 1–99 per product/size; repeat additions merge and are capped at 99. Cart quantity inputs retain the last valid total while an invalid draft is being corrected.

## Sample catalogue details

Bigger (streetwear), MegaPrisca (wedding wear), 1805 (experimental/statement fashion) and kutecomfies (baby wear) are user-supplied brand names and category associations. Heritage Atelier (Yoruba attire) and Form Atelier (tailoring/workwear) are clearly fictional demo brands in project documentation; their visible names and descriptions remain clean. Loom Atelier (contemporary African prints and coordinated sets) and Everyday Studio (casual and modest everyday wear) are working brand names, not confirmed partnerships.

All listings, descriptions, prices and size ranges are invented demonstration data. **Brand partnerships, actual inventory, prices, garment ownership and quality inspections have not been verified.** These photographs illustrate clothing styles; they do not claim to show the named brands' actual merchandise. Pictured people do not imply endorsement. The previous hoodie and jacket photographs with prominent unrelated logos were replaced. In particular, the green runway photograph is identified by its source as an Oka Diputra outfit, used solely as a statement-fashion illustration.

Sizes are illustrative choices, not verified brand size charts. Baby wear uses age ranges; bridal/workwear dress sizing uses UK labels; fila uses head circumference; shirts include collar measurements. Age alone does not establish a child's garment fit.

| Brand | Sample product | Illustrative price (NGN) | Sample sizes |
| --- | --- | ---: | --- |
| Bigger | City Graphic Tee | 18,500 | S, M, L, XL, XXL |
| Bigger | After Hours Hoodie | 32,000 | S, M, L, XL, XXL |
| Bigger | Denim Street Jacket | 48,500 | S, M, L, XL, XXL |
| Bigger | Utility Cargo Trousers | 29,500 | Waist 28 in, Waist 30 in, Waist 32 in, Waist 34 in, Waist 36 in |
| Bigger | Checked Street Overshirt | 35,500 | S, M, L, XL, XXL |
| MegaPrisca | Lace Ceremony Gown | 195,000 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |
| MegaPrisca | Satin Bridal Gown | 175,000 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |
| MegaPrisca | Draped Reception Dress | 125,000 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |
| MegaPrisca | Ruffle Bridal Dress | 215,000 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |
| MegaPrisca | Tulle Ceremony Gown | 185,000 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |
| 1805 | Sculptural White Dress | 85,000 | XS, S, M, L, XL |
| 1805 | Pleated Statement Ensemble | 98,000 | XS, S, M, L, XL |
| 1805 | Volume Runway Dress | 110,000 | XS, S, M, L, XL |
| 1805 | Blue Sculpture Dress | 105,000 | XS, S, M, L, XL |
| 1805 | Black Petal Mini Dress | 92,000 | XS, S, M, L, XL |
| kutecomfies | Everyday Bodysuit Set | 9,500 | 0–3 months, 3–6 months, 6–9 months, 9–12 months, 12–18 months |
| kutecomfies | Playtime Pattern Set | 12,500 | 0–3 months, 3–6 months, 6–9 months, 9–12 months, 12–18 months |
| kutecomfies | Nursery Stripe Romper | 10,500 | 0–3 months, 3–6 months, 6–9 months, 9–12 months, 12–18 months |
| kutecomfies | Animal Applique Romper | 11,500 | 0–3 months, 3–6 months, 6–9 months, 9–12 months, 12–18 months |
| kutecomfies | Cloud White Bodysuit | 8,500 | 0–3 months, 3–6 months, 6–9 months, 9–12 months, 12–18 months |
| Heritage Atelier | Celebration Agbada | 95,000 | M, L, XL, XXL |
| Heritage Atelier | Striped Aso Oke Ensemble | 115,000 | S, M, L, XL, XXL |
| Heritage Atelier | Occasion Fila | 15,000 | 54 cm, 56 cm, 58 cm, 60 cm, 62 cm |
| Heritage Atelier | Silver Occasion Agbada | 108,000 | S, M, L, XL, XXL |
| Heritage Atelier | Pinstripe Traditional Set | 65,000 | S, M, L, XL, XXL |
| Form Atelier | Structured Work Blazer | 55,000 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |
| Form Atelier | Straight Cut Work Trousers | 28,500 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |
| Form Atelier | Everyday Tailored Shirt | 22,500 | Collar 14.5 in, Collar 15 in, Collar 15.5 in, Collar 16 in, Collar 16.5 in, Collar 17 in |
| Form Atelier | Tailored Waistcoat | 38,500 | Chest 36 in, Chest 38 in, Chest 40 in, Chest 42 in, Chest 44 in |
| Form Atelier | Ivory Work Blouse | 26,000 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |
| Loom Atelier | Ankara Trouser Set | 42,000 | S, M, L, XL, XXL |
| Loom Atelier | Animal Print Co-ord | 38,000 | XS, S, M, L, XL |
| Loom Atelier | Green Print Mini Dress | 36,500 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |
| Loom Atelier | Flowing Print Maxi Dress | 48,000 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |
| Loom Atelier | Blue Print Dress and Headwrap | 45,000 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |
| Everyday Studio | Brown Shirt Dress | 29,000 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |
| Everyday Studio | Modest Longline Tunic | 32,000 | S, M, L, XL, XXL |
| Everyday Studio | Relaxed Everyday Shirt | 24,000 | S, M, L, XL, XXL |
| Everyday Studio | Wide Leg Everyday Trousers | 27,500 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |
| Everyday Studio | Rose Everyday Midi Dress | 31,000 | UK 8, UK 10, UK 12, UK 14, UK 16, UK 18 |

## Image sources and licences

All 40 JPEG downloads were verified, decoded and visually inspected. Files have distinct SHA-256 hashes; no photograph is shared across products. Source pages and licences were checked during this brick. Pexels download links were obtained from the source pages; local copies use the service's width parameter. Wikimedia files use source-provided original or preview links. Download URLs remain in imageSources.json.

Pexels images use the [Pexels License](https://www.pexels.com/license/), which permits website use and prohibits implying endorsement. Wikimedia images retain their individual public-domain, CC0 or [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) terms. Those image licences apply to the photographs, not the entire app. Images are displayed with `object-fit: contain`, without cropping or retouching. CC BY-SA credits and licence links appear on catalogue cards and detail views; other credits appear on detail views. Resizing is recorded below.

| Local asset | Photographer and original source | Licence | Changes |
| --- | --- | --- | --- |
| [bigger-tee.jpg](public/images/catalogue/bigger-tee.jpg) | [DISPLACED BY DESIGN CLOTHING](https://www.pexels.com/photo/urban-fashion-streetwear-photo-with-model-28994265/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [bigger-hoodie.jpg](public/images/catalogue/bigger-hoodie.jpg) | [Atef Khaled](https://www.pexels.com/photo/photo-of-man-wearing-hoodie-1706912/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [bigger-jacket.jpg](public/images/catalogue/bigger-jacket.jpg) | [Airam Dato-on](https://www.pexels.com/photo/young-woman-in-a-casual-outfit-with-a-jean-jacket-posing-on-a-street-24287024/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [bigger-cargo.jpg](public/images/catalogue/bigger-cargo.jpg) | [Dima Valkov](https://www.pexels.com/photo/woman-in-white-shirt-and-beige-cargo-pants-6503007/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [bigger-overshirt.jpg](public/images/catalogue/bigger-overshirt.jpg) | [mohamed abdelghaffar](https://www.pexels.com/photo/man-wearing-checked-jacket-on-a-street-21701014/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [megaprisca-lace.jpg](public/images/catalogue/megaprisca-lace.jpg) | [Rodion Ivanov](https://www.pexels.com/photo/a-woman-wearing-wedding-gown-10050389/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [megaprisca-satin.jpg](public/images/catalogue/megaprisca-satin.jpg) | [Alexander Mass](https://www.pexels.com/photo/bride-fitting-satin-wedding-dress-reflection-35538626/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [megaprisca-gown.jpg](public/images/catalogue/megaprisca-gown.jpg) | [Alexander Mass](https://www.pexels.com/photo/elegant-bride-holding-wedding-dress-in-soft-light-35538630/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [megaprisca-ruffle.jpg](public/images/catalogue/megaprisca-ruffle.jpg) | [许新乐](https://www.pexels.com/photo/portrait-of-woman-in-white-wedding-dress-9902467/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [megaprisca-crown.jpg](public/images/catalogue/megaprisca-crown.jpg) | [Ferdie Balean](https://www.pexels.com/photo/studio-portrait-of-a-bride-in-a-wedding-dress-6001109/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [1805-white.jpg](public/images/catalogue/1805-white.jpg) | [Felix Young](https://www.pexels.com/photo/elegant-avant-garde-fashion-portrait-34440688/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [1805-monochrome.jpg](public/images/catalogue/1805-monochrome.jpg) | [Vika Glitter](https://www.pexels.com/photo/high-fashion-editorial-with-avant-garde-design-33798228/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [1805-runway.jpg](public/images/catalogue/1805-runway.jpg) | [Stephoccitan](https://commons.wikimedia.org/wiki/File:Model_wearing_Oka_Diputra_clothes.jpg) | [Public domain](https://commons.wikimedia.org/wiki/File:Model_wearing_Oka_Diputra_clothes.jpg) | Unmodified local copy; displayed without cropping. |
| [1805-blue.jpg](public/images/catalogue/1805-blue.jpg) | [Felix Young](https://www.pexels.com/photo/fashion-model-in-avant-garde-blue-dress-34376111/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [1805-black.jpg](public/images/catalogue/1805-black.jpg) | [Vika Glitter](https://www.pexels.com/photo/elegant-woman-in-avant-garde-black-dress-34387665/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [kutecomfies-set.jpg](public/images/catalogue/kutecomfies-set.jpg) | [Polina Tankilevitch](https://www.pexels.com/photo/baby-clothes-arranged-on-bed-3875080/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [kutecomfies-pattern.jpg](public/images/catalogue/kutecomfies-pattern.jpg) | [ALOK DAS](https://www.pexels.com/photo/minimalist-baby-clothing-on-clothesline-35727373/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [kutecomfies-nursery.jpg](public/images/catalogue/kutecomfies-nursery.jpg) | [Alexander Mass](https://www.pexels.com/photo/cozy-baby-clothes-hanging-in-nursery-36276517/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [kutecomfies-animal.jpg](public/images/catalogue/kutecomfies-animal.jpg) | [Fernanda Neitzel](https://www.pexels.com/photo/cute-baby-onesies-with-animal-designs-on-white-background-34121886/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [kutecomfies-knit.jpg](public/images/catalogue/kutecomfies-knit.jpg) | [Anna Shvets](https://www.pexels.com/photo/baby-in-white-onesie-3845295/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [heritage-agbada.jpg](public/images/catalogue/heritage-agbada.jpg) | [Jamie Tubers](https://commons.wikimedia.org/wiki/File:A_Nigerian_Yoruba_woman_in_a_lace_Buba_blouse,_with_Ipele_and_the_gele_headtie_made_from_contemporary_Aso_Oke_and_A_man_in_Agbada2.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Unmodified local copy; displayed without cropping. |
| [heritage-aso-oke.jpg](public/images/catalogue/heritage-aso-oke.jpg) | [Jeremyida002](https://commons.wikimedia.org/wiki/File:Aso_Oke.jpg) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Unmodified local copy; displayed without cropping. |
| [heritage-fila.jpg](public/images/catalogue/heritage-fila.jpg) | [Aduagba3687](https://commons.wikimedia.org/wiki/File:Fila_Yoruba_lorisirisi.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Downloaded 960px preview; displayed without cropping. |
| [heritage-grey.jpg](public/images/catalogue/heritage-grey.jpg) | [Taiye Salawu](https://www.pexels.com/photo/nigerian-man-in-traditional-agbada-outfit-outdoors-37340989/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [heritage-white.jpg](public/images/catalogue/heritage-white.jpg) | [Abdulkadir muhammad sani](https://www.pexels.com/photo/portrait-of-a-man-wearing-traditional-attire-33356793/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [form-blazer.jpg](public/images/catalogue/form-blazer.jpg) | [cottonbro studio](https://www.pexels.com/photo/a-woman-wearing-a-black-blazer-7609956/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [form-trousers.jpg](public/images/catalogue/form-trousers.jpg) | [Evoking Ephemerality](https://www.pexels.com/photo/stylish-woman-posing-outdoors-in-business-attire-35294486/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [form-shirt.jpg](public/images/catalogue/form-shirt.jpg) | [ravi k](https://www.pexels.com/photo/photo-of-man-wearing-gray-button-up-shirt-with-analog-watch-938642/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [form-waistcoat.jpg](public/images/catalogue/form-waistcoat.jpg) | [Tima Miroshnichenko](https://www.pexels.com/photo/a-man-with-a-waistcoat-looking-at-a-mirror-6766246/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [form-blouse.jpg](public/images/catalogue/form-blouse.jpg) | [Elina Volkova](https://www.pexels.com/photo/young-woman-wearing-a-white-shirt-and-beige-pants-16373348/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [loom-set.jpg](public/images/catalogue/loom-set.jpg) | [Gift Omoh](https://www.pexels.com/photo/fashionable-woman-in-colorful-ankara-outfit-outdoors-36456207/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [loom-matching.jpg](public/images/catalogue/loom-matching.jpg) | [The Jeremiah XO Concepts](https://www.pexels.com/photo/young-woman-posing-in-a-matching-set-of-clothing-with-an-animal-print-16452315/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [loom-green.jpg](public/images/catalogue/loom-green.jpg) | [Alvintakunda Gasura](https://www.pexels.com/photo/elegant-african-print-dress-on-model-35549954/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [loom-midi.jpg](public/images/catalogue/loom-midi.jpg) | [Ayodeji Fatunla](https://www.pexels.com/photo/elegant-woman-in-vibrant-african-print-dress-33561263/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [loom-blouse.jpg](public/images/catalogue/loom-blouse.jpg) | [Abdulkadir muhammad sani](https://www.pexels.com/photo/elegant-woman-in-african-print-dress-portrait-35435656/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [everyday-brown.jpg](public/images/catalogue/everyday-brown.jpg) | [Polina ⠀](https://www.pexels.com/photo/woman-wearing-a-dress-5885840/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [everyday-modest.jpg](public/images/catalogue/everyday-modest.jpg) | [kelvin agustinus](https://www.pexels.com/photo/a-hijab-woman-in-her-modesty-clothing-12208801/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [everyday-shirt.jpg](public/images/catalogue/everyday-shirt.jpg) | [Oz Art](https://www.pexels.com/photo/photo-of-a-young-woman-in-a-casual-outfit-and-sunglasses-sitting-near-a-fence-20635541/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [everyday-trousers.jpg](public/images/catalogue/everyday-trousers.jpg) | [BULE](https://www.pexels.com/photo/elegant-portrait-of-woman-in-relaxed-pose-33411621/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |
| [everyday-midi.jpg](public/images/catalogue/everyday-midi.jpg) | [Chu Chup Hinh](https://www.pexels.com/photo/woman-in-pink-long-sleeved-midi-dress-and-pair-of-white-shoes-1057086/) | [Pexels License](https://www.pexels.com/license/) | Downloaded at 720px width; displayed without cropping. |

## Pending HNG work

The cart, checkout and HNG integration code are implemented. Real local Google sign-in, checkout, Supabase persistence and Mailgun receipt passed according to the user. The migration is applied. Explicit two-account RLS isolation and real concurrent retry checks remain pending. Delivery fees and payments are not configured; totals include products only.

Backend implementation uses Supabase and Netlify Functions; Netlify is the chosen deployment target, with deployment still pending. Production URL/OAuth configuration, production deployment, cross-account RLS checks, real concurrent retries and browser-closure persistence verification remain pending. Logout/login persistence passed locally. Payments are optional and must use test mode if added. Further implementation awaits the user's next instruction.

Designer registration, brand profile management, product uploads and approval, physical quality inspections, delayed designer payouts, delivery acceptance and disputes remain future scope. The current brand view is a read-only catalogue view, not designer onboarding.

## Verification

- Initial setup: dependency installation and production build passed; npm reported zero known vulnerabilities at that installation time. That earlier catalogue brick did not install dependencies. The HNG integration brick added @supabase/supabase-js 2.117.2; npm reported zero known vulnerabilities during installation.
- Catalogue production build passed using Node.js 22.15.1 and Vite 8.3.2.
- Data checks passed: eight brands, 40 unique product IDs, five products per brand, 40 unique image paths and file hashes, numeric prices, nonempty sizes, combined filters and baby age ranges.
- Installed Chrome browser checks passed: all 40 images decoded, all brand filters, category browsing, combined-filter empty state, clearing filters, eight complete brand views, 40 detail views and size selections, size reset, invalid-link handling, filter retention, browser Back/Forward and refreshing a detail link. Navigation keeps the header visible at the top.
- Browser checks found no horizontal overflow at 320px for catalogue and detail views, and no JavaScript runtime errors. Desktop catalogue and mobile detail screenshots were inspected.
- `git diff --check` passed. No commits, pushes, deployments or external-service changes were made. The earlier integration implementation used mocked services; the user subsequently configured and tested the real local services. Current integration checks: production build passed with Node 22.15.1; six server tests passed using mocked services and static SQL inspection. Tests cover user/price tampering, invalid requests, same-key retries/conflict, persistence failures, independent email outcomes and HTML escaping. Browser checks passed for missing configuration and a mocked signed-in flow: retry key reuse, failed-save cart retention, successful-response confirmation/cart clearing, email-failure reporting, sign-out/history reload and 320px layout. The user subsequently applied SQL and verified real local OAuth, checkout, order saving, Mailgun receipt in Gmail spam and logout/login persistence. Real concurrent retries and two-account RLS isolation remain unverified. Earlier cart-interface browser checks passed: required size; additions and separate sizes; quantity edits and invalid-quantity handling; accurate totals; removal and empty states; reload persistence; corrupt JSON and invalid stored entries; catalogue prices overriding stored prices; checkout field errors and first-error focus; valid-details notice; retained details after visiting cart; account placeholder; and no overflow at 320px.

Cart persistence uses the key `beta-drips-cart-v1` and stores only product IDs, sizes and quantities. Invalid JSON, unknown products/sizes and non-integer/out-of-range quantities are discarded. Duplicate lines merge with a 99-item cap. Storage-write failures display a session-only warning. Checkout contact details are held only in memory: they survive Catalogue/Cart/Account navigation, but reset on page reload. Checkout personal details are not written to localStorage. The Supabase SDK separately persists the sign-in session (including tokens and account metadata). The order-retry helper stores only a request digest and random key, scoped to the signed-in customer.

Browser verification checklist:

- Open a product, try adding without a size, then choose a size and quantity. Confirm the navigation count.
- Add another size of that product: check two cart lines. Change quantities, check totals, remove lines and confirm the empty state.
- Reload with items present: confirm they remain. Check that different sizes stay separate.
- Continue to checkout, submit blank/invalid fields and confirm clear errors. Enter valid details, visit Cart and return: confirm details remain.
- Check the order summary, missing-configuration/sign-in guidance and narrow mobile layout. With credentials configured, verify confirmation only after persistence, then check saved history.

- Start the development server and open its printed URL. Confirm the name, tagline and exact preview notice.
- Check 40 cards without sample badges with different photographs and naira prices.
- Select each brand: expect five products. Combine incompatible category/brand filters: expect an empty state. Clear filters: expect 40.
- Open each brand link: confirm its clean name, description and all five products.
- Open product details and choose a size. Baby sizes should use months; fila sizes should use centimetres. Switch products and confirm the selection resets.
- Use browser Back/Forward and refresh a detail link. Check that the correct view renders.
- Check desktop and 320px mobile layouts, image credits and keyboard navigation.
- Confirm no designer dashboard, marketing sections, animations or claims of verified inventory/partnerships.

## Security lessons

React escapes text inserted through JSX, so catalogue descriptions render as text rather than executable HTML. Product and brand IDs are matched against local fixtures; unknown links show a safe unavailable-page message. No raw HTML injection is used.

Local environment files stay out of Git, but frontend `VITE_*` values are exposed in the browser bundle. Never put private keys there. localStorage can be edited by anyone using the browser; validation improves interface consistency but does not authorize a purchase. Checkout validation is repeated server-side. Supabase verifies the bearer token; its returned user ID owns the order. Browser roles only read owner-scoped rows; server-only writes calculate prices from repository fixtures. Client-side price formatting and size choices are presentation only: the order function validates IDs, sizes and quantities and calculates authoritative prices before using the verified user ID. The privileged key bypasses RLS, so this explicit server check is essential. RLS enforcement still needs the two-account live tests in the setup guide.

## Deployment preparation — 3 October 2026

User-reported real local tests passed: Google sign-in; checkout; Supabase order saving; Mailgun confirmation received in Gmail spam; saved orders remaining available after logout/login. Mailgun uses a sandbox and sends only to authorized recipients. General-recipient sending and inbox placement are not verified. Production deployment and its OAuth URLs remain pending.

Preparation checks: compatible Node production build and existing tests passed; .env is ignored; project files and Git index were checked for credential patterns and matches to local secret values without printing them. Changes were staged for review only. No commit, push or deployment was performed.

## Task 3 brick 1 — shared customer carts (4 October 2026)

Implemented on `task-3`; no mobile app has been scaffolded. The existing Supabase project, Google authentication, trusted catalogue, order history and Mailgun workflow are reused.

- `supabase/migrations/202610040001_customer_carts.sql` is a **new migration, not applied by the coding agent**. It adds one cart per customer, revisions and durable operation receipts. Explicit grants and RLS allow customers to read only their own cart; anonymous access and direct customer writes are denied. Receipts and mutation RPCs are server-only. The previously applied orders migration is unchanged.
- `netlify/lib/carts.mjs` validates products, sizes, bounded integer quantities, duplicate lines and operation identity using the existing catalogue. `netlify/functions/cart.mjs` implements authenticated GET/POST. It verifies bearer tokens with Supabase and derives the owner from the verified user, never the request body. Because server credentials bypass RLS, this ownership check is mandatory.
- `src/lib/cartClient.js` provides guest retry snapshots and account-generation guards. `src/lib/useCart.js` owns guest/local and customer/server cart state, persists retry intentions, hides previous-account carts and ignores late responses. Customer carts refresh on sign-in, focus, visibility and every 15 seconds while visible. Same-origin Web Locks serialize guest synchronization across tabs; authenticated synchronization requires Web Locks (modern browsers over HTTPS or localhost). Failed/uncertain merges retain the guest snapshot and ID, bound to the original account until confirmed. Matching product/size quantities are added once; different sizes remain separate. Over-limit merges fail atomically instead of truncating quantities. Sign out to reduce the preserved guest cart after a definite limit rejection, then sign in again. Local guest storage remains untrusted.
- `src/App.jsx` integrates the hook and account-aware order confirmations. `src/components/Cart.jsx` disables edits during synchronization and reflects remote quantity changes. `src/components/ProductDetails.jsx` disables adding during sync/errors and describes an update as requested rather than confirmed.
- `src/lib/submitOrder.js` submits the cart revision and confirms session ownership. `src/components/Checkout.jsx` blocks checkout during unresolved cart synchronization, pauses cart refresh during an unresolved order attempt and offers unchanged-detail retries or an explicit cart reload. Contact details remain in memory only. After page reload, check saved orders in Account if a previous response was lost.
- `netlify/functions/submit-order.mjs` calls the new `save_cart_order` wrapper. The transaction checks the cart revision and exact contents, saves the order and clears its cart under the same customer lock. An existing order retry is recovered before cart checks/clearing, preserving items added after checkout. Mailgun remains independent of successful persistence.
- `tests/carts.test.mjs` covers server ownership/authentication, validation, merge retry identity, conflicts, guest snapshot preservation, stale-account guards and SQL declarations. `tests/orders.test.mjs` retains prior coverage and adds revision propagation, cart clearing, persistence failure and preserving later additions on order retry.

Actual verification: production Vite build passed with cached Node **22.23.2**. All **16 assertions-based test cases passed** when running the two test files directly; the existing Node test-runner invocation also passed. `git diff --check` passed. Services and cart/order transactions in tests are **mocked**; SQL security/transaction ordering is inspected as text. No real database SQL, RLS, concurrent transactions, browser OAuth or browser synchronization was exercised in this brick. Existing user-reported Google/order/Mailgun success applies to the earlier implementation, not this new cart integration.

Pending: explicitly authorize and apply the new migration before trying the updated authenticated cart/checkout against Supabase. Both RPCs and cart tables must exist before this code can work live. Then verify two-account RLS, concurrent updates/checkouts, interrupted merge retries, browser state and Mailgun regression through Netlify Dev. No migration, deployment, commit or push was performed. Android Expo work remains a later brick.

Manual verification after migration is separately authorized:

1. As a guest, add two sizes and reload. Sign in with a customer who already has a cart: matching sizes add quantities once; other sizes remain separate. Reload/sign in again: no repeated merge.
2. Interrupt the merge response, switch accounts, then return to the original customer and retry. The guest snapshot must survive uncertainty, and another account must not receive it.
3. Open two browsers with the same customer. Change one cart; focus the other or wait 15 seconds. Submit a stale update: expect 409, refreshed contents and an instruction to repeat the intended edit.
4. Use two customers and anonymous requests. Direct reads of another customer's cart must return no rows; direct cart/receipt writes and RPC calls with public credentials must fail. A spoofed `userId` sent to the endpoint must not change ownership.
5. Checkout: expect one saved order and one cart clear. Add new items, then resend the old order request/key: the new items must remain. Stale checkout and database failure must preserve the cart and not send email.
6. Sign out/switch accounts while a response is delayed: previous-customer items must disappear and the late response must not restore them. Confirm saved orders and Mailgun sandbox receipts still work.

### Task 3 session-loss correction

Manual results supplied by the user: guest merging succeeded in Chrome. Firefox, signed into the same customer, later reported an expired session and displayed an empty cart. These observations do not establish that the database cart was deleted.

Diagnosis: `useAuth.js` previously called Supabase `signOut()` with no scope. The installed SDK defaults to **global**, revoking refresh tokens in other browsers. Chrome sign-out can therefore cause Firefox's next refresh to fail; an existing access token may remain valid until expiry. This is a likely explanation, not a verified reconstruction of the user's server events. Automatic token refresh was already enabled, and cart requests already used SDK `getSession()` rather than a token captured when React rendered. However, rejected requests had no bounded refresh retry, and the UI treated missing/unloaded cart data as empty. Loading changes also reset cart state unnecessarily.

Fixes:

- `src/lib/authClient.js` defines browser-local sign-out and authenticated requests. Every send reads the latest SDK session. A 401 allows one refresh/retry with the exact original payload; an already-rotated token is reused. Permanent session loss is distinct from network/429/5xx failures. Account switches stop late retries. No credentials are logged or trusted in place of server verification.
- `src/lib/useAuth.js` explicitly signs out only the current browser session, tracks unexpected session loss, requests sign-in and prevents focus events from restoring a rejected token to the visible account state. It does not delete server cart data.
- `src/lib/useCart.js` uses the request helper, preserves last-known items on temporary errors, preserves guest merge snapshots/receipts on authentication failure and hides the account cart on actual session loss. It does not copy an authenticated cart into guest storage or send an empty replacement to handle failed authentication. Routine loading changes no longer reset an authenticated cart. Conflict recovery remains separate from authentication recovery.
- `src/lib/cartClient.js`, `src/App.jsx`, `src/components/Cart.jsx` and `src/components/Checkout.jsx` distinguish loading, failed loading, session loss and a successfully loaded empty cart. A lost session displays a sign-in prompt; an unavailable cart does not display a misleading zero-item count.
- `tests/auth-cart.test.mjs` adds 13 regression cases for local sign-out, latest tokens, bounded refresh, exact merge retries, revoked sessions, refresh races, transient errors, account switches and actual server-rendered Cart/Checkout output. `tests/carts.test.mjs` also confirms rejected authentication performs no database request.

Verification: all **29 test cases passed** with cached Node **22.23.2**, including the existing order/cart cases; production build and `git diff --check` passed. Authentication/services are mocked, SQL remains statically inspected, and component rendering tests do not run browser effects. The fixed live Chrome/Firefox flow and real database RLS/concurrency remain unverified. No migration, commit, push, deployment or mobile work was performed.

Manual regression checklist:

1. Sign into the same customer in Chrome and Firefox. Add items and confirm both browsers load the shared cart. Sign out in Chrome, focus Firefox and confirm Firefox remains signed in and its cart still loads, including after token renewal.
2. Test actual session revocation separately: Firefox must hide account items and request sign-in, without claiming its cart is empty. Sign back into the same account and confirm the server cart returns unchanged.
3. Go offline or simulate a cart/auth-service 503. Last-known items must remain visible with a retry error; no empty-cart success or guest conversion should appear.
4. Interrupt a guest merge, then refresh/sign in again. The same merge ID must be retried and quantities added once. Switch accounts during a delayed response: the previous customer's response must be ignored.

### Order history wording

`src/components/Account.jsx` now uses the heading “Order history” and displays “Demo order — no payment taken” in every order entry. This clarifies that a saved record does not establish payment, fulfilment or delivery. Order storage and email-status behaviour are unchanged. The wording change remains with the uncommitted shared-cart work on `task-3`.

Verification: production build passed with Node 22.23.2; the two-line component diff and whitespace checks passed. No new tests were added for this wording-only change. Pending manual check: sign in, open Account and confirm the heading and notice on each entry. Live shared-cart/session/RLS verification remains pending as documented above.

### Shared-cart review before commit

The user reports that the manual shared-cart checks passed and the Order history wording change is complete. No individual checklist results, two-account RLS results, database concurrency measurements or production results were supplied, so those are not independently marked verified. Earlier Chrome success and Firefox session-loss observations remain historical; this latest statement is the user's reported outcome after the fixes. Automated checks are separate: 29 mocked/component-rendering/static-SQL test cases and the Node 22.23.2 production build passed. No migration was applied by the coding agent.

The reviewed changes are limited to shared carts, related authentication/checkout handling, the requested Order history wording, tests and documentation. Secret checks compare local private configuration values against project/index content without printing their values; `.env` is ignored. This brick is authorized for the commit “Add shared customer carts and website synchronization”; no push or deployment is authorized.

## Task 3 brick 2 — Android Expo foundation

Shared-cart changes were reviewed for scope and secrets and committed as **34301e8**, “Add shared customer carts and website synchronization”. The user reported manual shared-cart checks passed and the Order history wording change was complete; no additional individual live checks are claimed.

Created a separate JavaScript Expo app in `mobile/` using the official blank template and stable SDK 57. It displays Beta Drips and “Exceptional fashion. Nigerian brands.” in the website's colours. `mobile/App.js` defines the native screen with safe-area/scroll support; `index.js` registers it. `app.json` specifies Android only, the name, `com.betadrips.app` and the `betadrips` custom URL scheme. `eas.json` declares an internal Android development-client APK profile; it has not started or linked any cloud service. `package.json` and its lockfile keep SDK-compatible mobile dependencies separate from the website. Template launcher assets/license remain, and `.gitignore` excludes dependencies, local env files, native/generated outputs and signing files. `mobile/README.md` documents each file and physical-device installation steps.

Actual checks: Node 22.23.2 website build and 29 existing test cases passed; mobile Android JavaScript/Hermes export passed; online Expo dependency validation passed; Expo Doctor passed 21/21 checks; config introspection confirmed the Android scheme registration. Ignore and secret checks passed without printing private values. No new behaviour tests were added for the simple static screen. Npm audit found 23 dependency-tree issues (7 moderate, 16 high); these remain unresolved. Forced major downgrades were not applied because they do not preserve the verified Expo SDK pairing. See the mobile README for details.

Local tooling, native compilation, installation and rendered home-screen launch were subsequently verified below. Pending: icon reopening, accessibility/large-text review and the future authentication callback. Authentication, cart sync, checkout and backend credentials are excluded from this brick. No migration, push, deployment or cloud build was run. Start with the [phone setup instructions](mobile/README.md#install-on-a-physical-android-phone-locally); root website commands are unchanged.

### Local Android prerequisites

Checked current official Expo/Android documentation against installed SDK 57 and React Native 0.86.3. The project configuration specifies Android API 36, Build Tools 36.0.0 and NDK 27.1.12297006; Expo's SDK 57 environment uses Java 17. React Native's source-build configuration also specifies CMake 3.30.5.

Installed Node 22.23.2 through existing nvm, retaining Node 18.20.8 and the global default of 18. Installed checksum-verified Temurin JDK 17.0.20.1 in the user's home directory without sudo. `.nvmrc` pins the project Node version; `mobile/android-env.sh` activates Node and the user-local Java/Android SDK paths in the current Bash terminal without changing shell startup files. `mobile/README.md` explains CLI installation, personal SDK licence acceptance and phone authorization.

Actual checks: sourcing the helper produced Node 22.23.2, Java 17.0.20.1 and javac 17.0.20.1. Bash syntax and tracked-diff whitespace checks passed. Existing user changes were preserved. After the user accepted the download terms, checksum-verified Android command-line tools were installed in `~/Android/Sdk/cmdline-tools/latest`; `sdkmanager --version` passed with version 22.0 using Java 17. The tool prints an official deprecation notice recommending Android CLI. The user reports personally accepting all package licences. SDK package installation succeeded; `sdkmanager --list_installed` confirmed Android platform 36 (revision 2), Build Tools 36.0.0, NDK 27.1.12297006, CMake 3.30.5 and platform-tools 37.0.1. ADB 1.0.41 / platform-tools 37.0.1 ran successfully, and its local daemon started. `adb devices -l` returned an empty device list; phone connection and authorization remain pending. No Android Studio or emulator was installed. No application build, feature change, commit, push or forced dependency audit fix was performed.

### First local Android development build

After the user connected the phone, ADB verified its `device` status. Initial resources: 2.9 GiB available RAM, full swap and 58 GiB free disk. Expo prebuild generated only the ignored Android project; package.json was unchanged. Local generated Gradle properties limited the build to one worker, disabled parallel builds, capped heap at 1536 MiB and used in-process Kotlin compilation. Expo's supported `run:android` workflow then built the phone's armeabi-v7a debug APK successfully in 59m 34s. Gradle also installed dependency-required Build Tools 35.0.0 and CMake 3.22.1. No emulator was started.

Build succeeded, but the first installation attempt failed because the phone disconnected before Expo's install phase. Metro started successfully on localhost:8081 with one worker; Gradle was stopped to release memory. The approximately 47 MiB APK was preserved in the ignored Android build output for installation after reconnection. [Mobile instructions](mobile/README.md#first-physical-phone-build) explain the server terminal and USB forwarding.

Reconnection verification: ADB confirmed the physical phone's `device` status. Installation of the existing APK returned `Success`, and `pm path com.betadrips.app` confirmed the installed package without rebuilding. USB reverse mapping for port 8081 was established and listed. Launch returned Android `Status: ok` for MainActivity, and its foreground state was verified. Metro bundled 717 modules successfully in 12.855 seconds; visual inspection of the phone screenshot confirmed the branded home screen and requested tagline. Build, installation and rendered launch are now verified separately. Metro remains running with one worker; keep that development-server session and the USB connection active. Icon reopening, accessibility review and future authentication callbacks remain separate checks. Only documentation was updated; no features, commit or push were added.

Foundation commit review: the setup helper uses user-relative defaults and respects configured `NVM_DIR`, `JAVA_HOME` and Android SDK locations without changing shell startup files. The commit includes only `.nvmrc`, the mobile foundation and its related README/PRD documentation. Generated native projects, APKs, dependencies, environment files and signing material stay ignored. Review checks and actual validation results are recorded in the mobile README. The user authorized the commit “Set up Beta Drips Android app foundation”; no push is authorized.

Pre-commit checks passed: secret-pattern/exact-private-value review of 95 nonignored files without printing private values; generated/dependency/environment/signing ignore checks; Bash syntax and helper activation/idempotence/configured-path checks; Node 22.23.2 website production build and three existing automated test files. Configured-path shell checks used an nvm stub; website tests do not test a live database. Offline Expo validation reported dependencies up to date with its offline-reliability warning. No native rebuild was needed for this review.

## Task 3 brick 3 — mobile Google authentication

Added Google sign-in in a system-browser custom tab using the website's existing Supabase project/accounts, PKCE with S256, and exact callback **`betadrips://auth/callback`**. Add that URL to the existing Supabase Authentication → URL Configuration → Redirect URLs without removing website redirects or changing the Site URL. No dashboard changes were performed.

`mobile/lib/supabase.js` configures persisted/refreshing native auth with a SecureStore adapter and the installed SDK's built-in session coordination. `crypto.js` supplies secure random/SHA-256 primitives; `secureStorage.mjs` bounds encrypted chunks and preserves the prior session across failed writes. `authController.mjs` handles code-only callbacks, duplicate delivery, persisted pending attempts, cold starts, cancellation/errors, restoration/foreground refresh and explicit local-scope sign-out. `useMobileAuth.js` manages React/platform subscriptions, and `App.js` displays the signed-in name/email and operation states. Public configuration validation, placeholder `.env.example`, tests and SDK-compatible dependencies/plugins are included. The ignored mobile `.env` contains only the website's public Supabase URL and publishable key; no server/Mailgun/Google secrets were copied.

Automated verification: 18 mobile controller/storage/PKCE test cases passed (platform/network mocks; the installed real Supabase SDK produces S256 offline using Node crypto). Online Expo dependency validation and Doctor 21/21 passed after dependency deduplication. Config introspection confirmed the scheme and SecureStore backup references; Android JavaScript/Hermes export passed. Website production build and three existing automated test files passed. No live database/Google authentication or native Keystore test is claimed. The last dependency audit reported 23 findings (7 moderate, 16 high); no forced fixes were made.

Pending: rebuild/reinstall the development APK for the new native modules, add the redirect, then verify Google browser return, account identity, cancellation/errors, close/reopen persistence, refresh/session loss and mobile-only sign-out keeping the website signed in. These are not the foundation's already-verified phone launch. [Mobile authentication instructions](mobile/README.md#google-sign-in-brick) explain changed files and the physical-phone checklist. Catalogue/cart/checkout remain excluded. No migration, external service change, commit, push or deployment occurred in this brick.

### Mobile authentication rebuild — physical device

The user reports adding the mobile callback to Supabase's redirect allowlist. Verified an authorized connected phone, 4.7 GiB available RAM and 53 GiB free disk. Expo regenerated the ignored native project; one-worker/no-parallel/1536 MiB Gradle limits were reapplied. The authentication APK build succeeded in 2m 35s and Expo completed installation; Android's package-path check independently confirmed the installed app. No emulator was started.

Restarted Metro with public mobile environment configuration and one worker, restored/listed USB reverse port 8081 and launched the app with Android `Status: ok`. Metro bundled 781 modules in 5.094 seconds. Visual inspection confirmed the branded screen with Continue with Google. The phone blocks ADB-injected taps, so the user must tap the button and complete Google's account/consent prompts. No security setting was weakened. Google browser return/account display, persistence, refresh and website-session preservation on mobile sign-out are still pending; rebuild/install/UI launch success does not establish those results. Metro remains running. No commit or push occurred.

Mobile saved-account check: after reopening showed the development launcher, Metro was verified healthy on 8081. Once the authorized phone reconnected, USB reverse forwarding was restored and the installed app reopened through the localhost development-client URL with Android `Status: ok`. Visual inspection confirmed the signed-in account/profile and sign-out button without another sign-in. No rebuild or app-data clearing occurred, and personal profile values were not recorded. Saved-account restoration is verified for this reconnection; token-expiry refresh and website isolation on mobile sign-out remain separate pending checks. No commit or push occurred.


### User-verified mobile authentication results

Before committing, the user explicitly reports: Google sign-in returned to Beta Drips and displayed the account; the saved account restored after reopening/reconnecting to Metro; mobile sign-out left the local website signed in after refresh; canceling Google sign-in and retrying worked. These are user-verified physical-phone/live results. They are separate from the agent's build/install/visual-restoration observations and mocked/offline automated tests. No additional manual result is inferred. Token-expiry refresh, revocation/network interruption, process termination during browser sign-in, another-account switching and accessibility review remain pending on the phone; no production result is claimed.

The reviewed commit contains only mobile authentication, related native dependencies/configuration, placeholder public environment example, tests and documentation. Local environment files and generated/dependency/build artifacts remain ignored. The user authorized “Add Google sign-in to the Android app” on task-3; no push or catalogue work is authorized.

Authentication pre-commit checks passed: secret-pattern/exact-private-value review of 103 nonignored files without printing private values; local environment/dependency/generated-native/APK/export/signing ignore checks; 18 mobile tests; three existing website test files; Node 22.23.2 website production build and diff whitespace checks. No application code changed during this review.

### Mobile clothing catalogue

Completed the next Task 3 brick: Shop/Account navigation with Shop opening by default, a cream/green product grid, combined brand/category filters, search/reset/empty states and complete product details with original sizes, descriptions, naira prices and image attribution. Browsing does not require authentication; the existing authentication controller remains mounted across navigation. No mobile cart, checkout or purchase buttons were added.

Mobile imports the canonical `src/data/catalogue.js` directly; all 40 products/eight brands and their IDs/prices/sizes/image associations remain shared with the website/server without duplicate listings. A portable Metro watch folder supports the shared directory. HTTPS images use the existing Netlify site, with loading/error/retry placeholders. All 40 hosted JPEGs were fetched and verified byte-for-byte against repository images (real network check). The single illustrative-preview notice remains visible.

Checks passed: three catalogue cases plus 18 existing mobile authentication cases; Android JavaScript/Hermes export; the Node 22.23.2 website production build and three existing website test files. Catalogue checks use real shared data; authentication/platform operations and website backend checks remain mocked/offline as previously documented, not live database verification. The connected authorized phone launched the existing app through restarted one-worker Metro and restored USB forwarding. Visual inspection confirmed Shop, search/filters, 40-piece count, loaded photos and Shop/Account tabs. No native dependencies changed, so no APK rebuild/install or app-data clearing was performed.

The user verified filters/reset, search/empty results, product details, Shop/Account navigation and signed-out browsing on the physical phone. These live manual results are distinct from automated tests and agent screenshot observations. Image-failure retry and accessibility checks remain pending. Prior user-verified Google authentication results are preserved separately. See [mobile documentation](mobile/README.md#mobile-clothing-catalogue-brick) for changed-file explanations and the manual checklist. Keep Metro running. No commit, push, deployment or external configuration change was performed.

Catalogue final review: the 10 changed/new files passed private-value/secret-pattern/machine-path and whitespace checks; ignored local environment/dependency/native/export/APK files remain ignored. Final mobile tests/export passed after account UI cleanup. Website/catalogue/backend source and dependency/native configuration are unchanged.

### Mobile shared customer carts

Implemented the next Task 3 brick: size selection/Add to cart, a Cart tab with original images/sizes/quantities/removal/naira totals, persistent guest carts and authenticated synchronization through the existing website cart endpoint. No mobile checkout was added. The already-applied customer-cart migration, backend authentication/validation, grants/RLS and receipt/revision protocol were reused without SQL changes or migration execution.

Extracted browser-free validation/total helpers into `src/data/cartModel.js`, retaining the website's existing cart exports/read behaviour. Mobile also reuses the website's pure authenticated-request helper to read the latest access token and refresh/retry a 401 once. An encrypted atomic journal stores guest snapshots and per-account pending operations before sends; lost responses retry the same ID/body and server receipts prevent duplicate merges. Account claims/generation checks isolate customers; stale updates refresh rather than overwrite newer changes. Genuine session loss hides account items and requests sign-in; network/storage failures preserve data and do not appear as a successfully empty cart. Foreground, active 15-second polling and manual/pull refresh are implemented.

For local testing, ignored mobile configuration uses `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8888`; HTTPS production configuration remains available. HTTP is restricted to loopback port 8888 in development. Existing Netlify dev was verified running from this repository on 8888; Metro restarted with one worker, and both 8081/8888 USB forwards were restored. The phone launched the existing app successfully and visual inspection confirmed Shop and the new Cart tab. No native dependencies changed or APK rebuild/data clearing was needed. Both servers must remain running.

Automated results: 41 mobile cases (17 cart, 21 auth, three catalogue), Android JavaScript export, Node 22.23.2 website production build and three website test files passed. Storage/network/server receipt models/native lifecycle are mocked; no live PostgreSQL/RLS result is inferred. Real local endpoint checks rejected missing and invalid bearer tokens with 401 without customer-cart writes. The user verified synchronization in both directions between the physical phone and local website, guest-cart persistence after reopening, guest-cart merging after sign-in and no duplication after refreshing. These are user-verified live functional results. Live database security/RLS and concurrency tests were not performed in this brick. Offline/lost-response retries, account switching and actual session-loss checks remain pending manual verification. Earlier user-verified catalogue/authentication checks remain separate.

See [mobile shared-cart documentation](mobile/README.md#mobile-shared-cart-brick) for every changed file, security concepts, environment/server setup and a laptop↔phone test checklist. No migration, deployment, main merge, commit or push was performed.

Mobile-cart final review: all 17 changed/new files passed private-value/secret-pattern/portable-path and whitespace checks; ignored environment/dependency/native/export/APK files remain ignored. No backend, migration, native configuration or dependency files changed. Final regressions cover failed sign-out recovery and native-link lookup failure without misclassifying a valid session as lost; no extra manual success is inferred.

Mobile-cart pre-commit verification: the user's two-way synchronization, guest persistence after reopening, sign-in merge and no-duplication-after-refresh results are recorded as user-verified. Review of the 17 changed/new files found no private credential values, secret-key patterns, machine-specific paths or unrelated/backend/migration changes. Local environment, dependencies, generated native/export/build/APK files remain ignored and untracked. With Node 22.23.2, the existing website tests/build, 41 mobile cases and one-worker Android JavaScript/Hermes export passed again. Database security/RLS and concurrency verification remain unperformed as live tests; automated contract models are documented separately. The user authorized the separate mobile-cart commit and a normal task-3 push; no main merge or deployment is authorized.

### Mobile demo checkout and order history

Implemented signed-in Demo checkout from the shared cart, the website's required full name/email/phone/delivery address validation, product/size/quantity/naira summary, confirmation/retry states and Account → Order history with expandable saved details. Checkout, confirmation and each history entry say “Demo order — no payment taken”; saved orders are not labeled paid, fulfilled or delivered. Shop, authentication and synchronized carts remain in place.

Reused the existing verified order API and coordinated `save_cart_order` transaction without backend/migration changes. Existing retry keys recover orders before cart revision checks/clearing; new orders validate the cart snapshot and revision. A client retry-identity gap was flagged: website detail changes generate a new key, while its revision protections remain in force. Mobile freezes the original per-account key/payload in encrypted SecureStore before POST so uncertain retries/reopening cannot silently create a different submission. Cart changes pause until resolution; confirmed checkout uses only a guarded GET of the current cart, never an empty replacement that could delete newer items. Confirmed records persist until acknowledgement; contact fields/results/history are hidden on account changes/sign-out. Email problems remain separate from durable order success.

History uses the existing RLS-protected Supabase tables/projection, only the public URL/key/current user JWT, with active/foreground/manual refresh. Extracted the website's unchanged email-status text into `src/lib/orderStatus.js` for native sharing; contact validation and authenticated-request logic are also shared. No server or Mailgun secrets were added to mobile. See [mobile checkout/history documentation](mobile/README.md#mobile-demo-checkout-and-order-history-brick) for each changed file, retry/privacy concepts and the manual checklist.

Automated results: 59 mobile cases (18 new order, 21 auth, 17 cart, three catalogue), one-worker Android JavaScript/Hermes export, Node 22.23.2 website production build and three existing website test files passed. Tests run real controller/API/validator code with mocked storage/network and an in-memory transaction/receipt model; no live PostgreSQL/RLS/concurrency or Mailgun test is claimed.

Actual setup/launch checks: authorized phone, healthy Metro 8081/Netlify dev 8888, both USB forwards, successful Android launch and a real unauthenticated local order POST rejected with 401 without creating an order. A blank development-client screen after reload recovered by restarting only the app process and reconnecting; visual inspection confirmed Shop and all three tabs. No APK rebuild/reinstall or data clearing was needed. The user verified that a phone order appeared in website Order history and both carts cleared; a website order appeared in phone Order history with correct details; phone sign-out hid its history while the website remained signed in; and a confirmation email arrived in spam. These are user-verified functional results. Failed-submission/retry behaviour was not manually verified. Stale-revision and cross-account switching scenarios remain pending manual verification. No live database security/RLS or concurrency testing is claimed. Existing user-verified cart/auth/catalogue results are separate.

Keep Metro and Netlify dev running; test the laptop at localhost:8888 and mobile through USB forwarding, using the same account and a Mailgun-authorized email. No native/dependency/backend/SQL changes, migration, commit, push, main merge or deployment were performed.

Checkout/history final review: the user authorized review, checks, a separate task-3 commit and a normal push to the existing origin. The unfinished Mailgun diagnostic/status-write edit is preserved outside this checkout commit; no email was resent or configuration changed. No main merge or deployment is authorized.

Final checkout/history checks passed again with Node 22.23.2: all four mobile test files (59 cases), all three website test files, website production build and one-worker Android JavaScript/Hermes export. The changed-file secret/path review and ignore/whitespace checks passed without exposing credentials. Automated services remain mocked/in-memory; no new live database/RLS/concurrency checks were performed.

### Task 3 production deployment review

Fetched origin and reviewed `task-3` against `origin/main`: seven individual Task 3 commits are ready for a merge without squashing. The website production build and all three existing website test files passed with Node 22.23.2. Netlify CLI packaged both `cart` and `submit-order` successfully into a temporary directory, without publishing. Review of all 65 release files, the seven commit diffs and built website found no private credential values; local environment, dependencies, native builds and APKs remain ignored. Mobile configuration was not changed.

Deployment requires only the existing `202610020001_orders.sql` and `202610040001_customer_carts.sql` migrations. The orders migration is unchanged. Read-only checks of the existing Supabase project returned HTTP 200 for the five required tables and confirmed the `save_order`, `change_cart` and `save_cart_order` API interfaces. No migration or database mutation was performed. These existence checks do not verify live RLS/ownership or concurrency.

Required production names remain `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the website build; `SUPABASE_URL` and `SUPABASE_SECRET_KEY` for Functions; and `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`, `MAILGUN_REGION` for sandbox email. Secret values must stay out of build/browser variables. After the user completed Netlify login, the existing `betadrips` site was verified as connected to `Hashedmystic/Beta-Drips`, production branch `main`, build command `npm run build`, publish directory `dist` and Functions directory `netlify/functions`, with builds enabled. All eight required production variables are configured with the needed build/Functions scopes. Public Supabase configuration and non-secret Mailgun domain/sender/region match the tested local setup. The server Supabase and Mailgun keys are protected by Netlify Secrets Controller; their configured presence/scopes were verified, but their original values cannot be read or compared through the API. An attempted read-only probe with the masked Supabase value returned 401 and was not treated as a production-key failure. The database interface checks used the tested project credentials and confirmed the same project configured in production. No production environment setting was modified.

Pre-deployment public checks: the website returned HTTP 200, unauthenticated order POST returned 401, and the cart route returned 404, confirming that the shared-cart route is not yet published. No order or email was created. Netlify login and production settings verification are complete. Website tests/build and Netlify packaging passed again. The release is ready for a merge preserving the individual Task 3 commits and a normal main push; publication and post-deployment HTTP results will be recorded separately after monitoring. Production Google sign-in, authenticated website/mobile synchronization, demo checkout/history, email receipt and retry/account isolation remain manual checks after deployment; no live security/concurrency success is claimed.
