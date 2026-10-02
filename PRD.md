# Beta Drips — Product Requirements

**Tagline:** Exceptional fashion. Nigerian brands.

**Vision:** A curated marketplace showcasing Nigerian clothing brands across ages, styles and ethnic backgrounds.

## HNG Lesson 2 submission scope

The initial implementation will support a buyer browsing products and placing an order. It will use clearly labelled sample products until real catalogue assets are available. Sample listings must not imply that real stock or participating brands have been verified.

### Required features

- Product catalogue and individual product details.
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

Backend implementation and hosting remain undecided. The required integrations below are unchanged; none is configured in this brick.

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

- This brick adds a minimal React app displaying the Beta Drips name and tagline. Shopping features and integrations remain unimplemented.
- Real catalogue assets have not been supplied for this brick, so initial product content is planned as clearly labelled samples.
- Checkout must support saving orders and sending confirmations even if optional payments are omitted.
- Production deployment is a submission requirement, but is not authorized in this brick.
