# Beta Drips — Product Requirements

**Tagline:** Exceptional fashion. Nigerian brands.

**Vision:** A curated marketplace showcasing Nigerian clothing brands across ages, styles and ethnic backgrounds.

## HNG Lesson 2 submission scope

The initial implementation will support a buyer browsing products and placing an order. Until real catalogue assets are available, illustrative listings are identified by the single preview catalogue notice. Listings must not imply that real stock or participating brands have been verified.

### Required features

- Product catalogue and individual product details.
- Preview catalogue: eight brands with five illustrative products each, category browsing, brand filtering and brand views with descriptions. Product details include relevant sizes, including age sizes for baby wear.
- Size and quantity selection.
- Cart and checkout.
- Google authentication configured through Google Cloud.
- Supabase database for persistent application data, including saved orders.
- Saved orders associated with the authenticated buyer, available after logout, closing the browser and signing in again.
- Real, formatted order confirmation emails sent through Mailgun.
- Responsive layout for mobile and desktop.
- Production deployment as a later implementation milestone.

Payments are optional. If added, they must use test mode for this submission.

### Acceptance checks for the initial implementation

- A buyer can browse the catalogue, open product details, select a valid size and quantity, and proceed through cart and checkout.
- Google sign-in works using the configured Google Cloud integration.
- A successfully placed order is saved in Supabase and visible to its owner after logout, browser closure and signing in again.
- A buyer cannot read or change another buyer's orders. Authentication, ownership checks and server-side validation protect relevant operations.
- An order confirmation is delivered to a real test inbox through Mailgun, with readable formatting and the correct order details.
- Sample products are visibly labelled in the catalogue and product details.
- The layout works on mobile and desktop, and the deployed production site passes the relevant feature checks.
- If payments are included, a test-mode payment flow is verified without charging real money.

These are planned acceptance checks, not claims of completed or tested functionality.

## Technical stack

The frontend uses React with JavaScript, Vite for development and production builds, and plain CSS. No TypeScript, Tailwind, routing or component library is included in the initial setup.

Backend implementation uses Supabase and Netlify Functions; Netlify is the hosting target, with deployment pending. The required integrations below are unchanged; the user has configured them and reports successful real local tests.

Required integrations remain:

| Integration | Purpose |
| --- | --- |
| Google authentication through Google Cloud | Buyer sign-in |
| Supabase | Persistent database, including buyer-owned orders |
| Mailgun | Real, formatted order confirmation emails |

Integration details and credential configuration will be discussed during the relevant implementation bricks. Secrets must stay out of source code, logs and Git.

## Future marketplace scope — excluded from the initial implementation

- Designer registration and brand profiles.
- Product uploads and admin approval.
- Physical product quality reviews.
- Platform-collected payments and delayed designer payouts.
- Delivery confirmation and buyer acceptance.
- Balanced dispute protection for buyers and designers.

These features require later requirements and implementation discussions. They must not expand the HNG submission scope.

## Current status and assumptions

- The frontend includes the Beta Drips name and tagline, 40 illustrative listings across eight brands, licensed photographs, category/brand filters, brand views and product details with size selection. Counts reflect active filters.
- Bigger, MegaPrisca, 1805 and kutecomfies are user-supplied names. Heritage Atelier and Form Atelier are fictional demo brands in documentation. Loom Atelier and Everyday Studio are working names. Visible brand names and descriptions remain clean.
- The single catalogue notice is: “Preview catalogue. Products, prices and imagery are illustrative.” Individual sample badges are removed at the user's request. Partnerships, stock, prices, garment ownership and quality inspections have not been verified. Licensed photographs do not establish that pictured garments belong to the named brands.
- Cart, required size/quantity selection and the checkout interface are implemented. Cart persistence uses validated localStorage; checkout details persist in memory across navigation. Supabase Google sign-in, authenticated Netlify submission, atomic/idempotent persistence, saved history and server Mailgun confirmation code are implemented. The user applied SQL and reports successful real local Google sign-in, checkout, Supabase persistence, Mailgun receipt in Gmail spam and logout/login order persistence. Mailgun uses an authorized-recipient-only sandbox. Cross-account RLS, real concurrent retries and production deployment remain unverified. Order confirmation requires a successful saved-order response; email status is independent.
- Checkout must support saving orders and sending confirmations even if optional payments are omitted.
- Production deployment is a submission requirement, but is not authorized in this brick.

## HNG Task 3 — mobile counterpart, first brick

Android with React Native and Expo is the intended later client. This brick only adds shared authenticated customer carts and website integration using the existing Supabase project. New cart storage uses owner-only reads, server-verified writes, revisions, retry receipts and atomic checkout clearing. Guest carts remain local and merge once on authentication. The coding agent has not applied the new migration. The user reports manual shared-cart checks passed; no individual RLS/concurrency or production results were provided. No mobile scaffold or future marketplace features are included.

## HNG Task 3 — Android foundation, second brick

`mobile/` now contains a JavaScript Expo SDK 57 application with a branded home screen, Android-only configuration, a development-client build profile and the `betadrips` scheme reserved for later authentication. The website remains a separate Vite app with its own dependency installation. There is no mobile authentication, catalogue browsing, cart sync or checkout yet. Expo checks/config introspection and Android JavaScript export passed. Native compilation, APK installation and rendered home-screen launch on a physical Android phone were verified separately. The future authentication callback remains untested. Dependency-audit findings are documented in the mobile README.
