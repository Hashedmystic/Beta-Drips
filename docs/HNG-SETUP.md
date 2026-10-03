# HNG integration setup

The user has applied the orders migration and reports successful real local Google sign-in, checkout, Supabase saving, Mailgun receipt in Gmail spam and order persistence after logout/login. Mailgun currently uses a sandbox restricted to authorized recipients. Production deployment, general-recipient sending, inbox placement, two-account RLS isolation and real concurrent retries remain unverified.

## 1. Local environment

Use compatible Node (here: Node 22.15.1).

```bash
cp .env.example .env
PATH=/usr/bin:$PATH npm install
PATH=/usr/bin:$PATH npm run test
PATH=/usr/bin:$PATH npm run build
```

Replace placeholders in ignored .env locally. Never paste secrets into source files or screenshots. Vite exposes every VITE_ value in the browser bundle. Set only VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY there. Use the same Supabase project for the frontend and function.

- Browser: Supabase URL and publishable key (sb_publishable_…).
- Function: SUPABASE_URL and SUPABASE_SECRET_KEY (sb_secret_…). The function also supports a legacy service_role JWT in that server-only variable.
- Function: MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM and MAILGUN_REGION (US or EU).

Supabase's [API key documentation](https://supabase.com/docs/guides/getting-started/api-keys) distinguishes public keys from server secrets. Server secrets bypass RLS; this function therefore verifies the caller separately before writing.

Plain `npm run dev` runs only the frontend. For local function requests, use [Netlify Dev](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/) with Node 22:

```bash
PATH=/usr/bin:$PATH npx netlify-cli dev
```

This may download the CLI if not installed. It runs locally; do not run a deploy command yet. Use the URL it prints (typically http://localhost:8888) for OAuth redirects. Netlify CLI/local function packaging was not run during this brick; direct function tests and mocked browser checks were run.

## 2. Supabase SQL

Create/open your Supabase project. Run the complete contents of `supabase/migrations/202610020001_orders.sql` once in the SQL editor, or apply it using your existing Supabase migration workflow. Do not re-run this initial migration on tables already created by it.

It creates:

With Data API enabled, automatic table exposure disabled and automatic RLS enabled, this migration still explicitly enables RLS and supplies schema USAGE plus table SELECT grants for authenticated customers. The grants allow querying; ownership policies limit which rows are returned. Anonymous access and browser writes are revoked, including inherited PUBLIC table permissions. Ensure public remains in the Data API's exposed schemas. See [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api).

If the initial migration has already been applied, run only its updated schema/table permission block (from grant usage through grant all) in the SQL editor. Those grant/revoke statements are repeatable; do not recreate the existing tables. Then run the two-account ownership checks below.

- orders: owner ID, delivery details, price total, timestamps and unique retry key.
- order_items: immutable product/size/quantity/price snapshots.
- order_emails: status and provider message ID, separate from order persistence.
- RLS read policies: authenticated customers can read only their own order, items and email status. Anonymous readers have no access. Browser roles have no insert/update/delete permission.
- save_order: server-only transactional RPC, restricted to service_role; creates the order/items/email record together, or returns the prior order for the same customer and retry key. Changed request details under that key are rejected.

The user successfully applied the migration in Supabase and verified order saving locally. Real concurrent retries, transactional rollback and cross-account RLS isolation still need explicit checks.

## 3. Google Cloud and redirects

Follow the [Supabase Google provider guide](https://supabase.com/docs/guides/auth/social-login/auth-google):

1. Configure Google Auth Platform branding/consent and its audience. Add test users while the OAuth app is in testing.
2. Create a **Web application** OAuth client. Add your exact local app origin and final HTTPS Netlify origin to Authorized JavaScript origins.
3. Add the Supabase callback shown in Authentication → Providers → Google as Google's Authorized redirect URI, normally `https://PROJECT_REF.supabase.co/auth/v1/callback`.
4. Enable Google in Supabase and enter the Google client ID and secret **there**, not in the React app.
5. Set Supabase Authentication → URL Configuration → Site URL to the final HTTPS app origin. Add the exact application return URLs:
   - `http://localhost:8888/?view=account`
   - `http://localhost:8888/?view=checkout`
   - `https://YOUR_SITE.netlify.app/?view=account`
   - `https://YOUR_SITE.netlify.app/?view=checkout`
   Add the actual Vite URL equivalents only if testing frontend-only OAuth there. Avoid broad production wildcards.

Google redirects to Supabase; Supabase redirects back to the app. The browser uses PKCE and the SDK exchanges the callback code. See [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls). Google navigation reloads the page: the cart remains, but personal checkout details must be re-entered. Sign in first to avoid that extra step.

## 4. Mailgun

Verify a sending domain in Mailgun using its required DNS records. For a sandbox domain, authorize each test recipient first. Set MAILGUN_FROM to a sender on that domain, for example `Beta Drips <orders@your-domain.example>`. Set the matching US/EU region and server-only API key.

The function sends both a styled HTML confirmation and plain-text alternative using the [Mailgun Messages API](https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/messages/post-v3--domain-name--messages). Customer text is HTML-escaped. The email is sent to the validated checkout email; no payment is collected.

Email states:

| State | Meaning |
| --- | --- |
| pending | Saved order, email attempt not claimed yet. |
| processing | One function claimed the attempt; completion not yet recorded. |
| accepted | Mailgun accepted the message; inbox delivery is **not verified**. |
| failed | Mailgun rejected the attempt; order remains saved. |
| unknown | Send outcome or status write could not be confirmed; order remains saved. |
| not_configured | Mailgun settings were missing; order remains saved. |

Retries do not blindly resend emails. After interruption, processing/unknown may require manual reconciliation with Mailgun logs. Check the provider before deciding whether to resend, and use a privileged maintenance workflow to reset an appropriate status to pending only after confirming no message was accepted. This app has no automated email-retry worker or delivery webhook. A failed status write can leave processing even if the provider accepted; it never erases the order.

## 5. Netlify configuration and later deployment

netlify.toml sets `npm run build`, `dist`, `netlify/functions` and Node 22. Hash-based app views need no SPA rewrite. The endpoint is `/.netlify/functions/submit-order`.

When you explicitly choose to deploy later, configure Netlify environment variables before building:

- VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY: available during **Builds**.
- SUPABASE_URL, SUPABASE_SECRET_KEY and all MAILGUN_ settings: server-only, available to **Functions** (use scopes where your plan supports them).

Set runtime Node 22 in the Netlify environment/runtime settings as needed. Never put credentials in netlify.toml: [function environment variables](https://docs.netlify.com/build/functions/environment-variables/) must be supplied through Netlify's UI/CLI/API. Rebuild after public configuration changes. Ensure OAuth URLs exactly match the final site.

Do not publish only dist via drag-and-drop and assume functions exist; use Netlify's build/function deployment workflow once deployment is authorized. No deployment was performed.

## 6. Live acceptance checks still required

1. Sign in with Google, sign out, and sign in again. Check loading/error handling and Account identity.
2. Place an order and check both database tables. Verify the total uses deployed catalogue prices even when browser prices/user IDs are modified.
3. Retry the identical request/key, including concurrent requests and a simulated lost response: expect one order with one set of items. Changed details under the same key must return 409. The browser retains a digest/retry key per customer; retry unchanged details after uncertainty. Editing details/cart starts a new order intent.
4. Force a database error: expect no confirmation and no cart clearing. Successful persistence must clear the cart.
5. Sign out, close the browser, then sign back in: saved orders must reload from Supabase.
6. Using **two real accounts**, request the other user's orders/items/email rows with the public client: expect no rows. Anonymous reads and browser insert/update/delete/RPC attempts must fail. These negative checks are essential to verify RLS.
7. Confirm a real formatted email arrives. Compare accepted status and provider logs; do not describe API acceptance as delivered. Force Mailgun rejection/missing settings: the saved order must remain visible with accurate email status.
8. Check desktop/mobile layouts, expired sessions, missing configuration, reloads and browser history.

Local tests use mocked services and static SQL inspection; they are not evidence that Google OAuth, the migration, RLS or real Mailgun delivery works.
