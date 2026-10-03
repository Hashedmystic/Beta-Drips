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
