# Beta Drips

**Exceptional fashion. Nigerian brands.**

Beta Drips is a planned curated marketplace showcasing Nigerian clothing brands across ages, styles and ethnic backgrounds, starting with an HNG Lesson 2 shopping experience.

## Current status

A minimal React app displays **Beta Drips** and **Exceptional fashion. Nigerian brands.** It uses JavaScript, Vite and plain CSS, with no starter logos or demo content.

Completed work:

- Preserved the project documentation and Git history.
- Added the minimal frontend and development/build commands.
- Added ignore rules for dependencies, build output and local environment files, allowing a future `.env.example`.
- Updated [PRD.md](PRD.md) with the frontend choice and [AGENTS.md](AGENTS.md) with the current brick.

## Setup and run

Use a Node.js version compatible with Vite: `^20.19.0 || >=22.12.0`.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). You should see the name and tagline centered on a light background.

This environment's default shell has Node.js 18.20.8 and npm 10.8.2. An existing compatible installation at `/usr/bin/node` provides Node.js 22.15.1; selecting it through PATH also selects npm 10.9.2. No system software was changed. In this environment, use:

```bash
PATH=/usr/bin:$PATH npm install
PATH=/usr/bin:$PATH npm run dev
```

To build for production and preview the build locally:

```bash
npm run build
npm run preview
```

Use the same `PATH=/usr/bin:$PATH` prefix here if your shell still selects Node 18. The build writes to `dist/`; preview does not deploy the app.

## Files to understand

| File | Purpose |
| --- | --- |
| `index.html` | Browser entry page; provides the root element and loads the JavaScript entry point. |
| `package.json` | Declares dependencies, Node compatibility and npm commands. |
| `package-lock.json` | Records resolved dependency versions for repeatable installs. |
| `vite.config.js` | Enables Vite's React plugin for JSX and development updates. |
| `src/main.jsx` | Mounts React into the root element and imports the CSS. |
| `src/App.jsx` | Defines the component containing the name and tagline. |
| `src/index.css` | Sets the colors, typography, spacing and centered layout with plain CSS. |
| `.gitignore` | Keeps dependencies, generated output and local environment files out of Git. |

JSX lets components describe HTML-like content inside JavaScript. React renders that content into the HTML root. Vite serves the app during development and bundles it for production.

## Pending work

The frontend choice is React, JavaScript, Vite and plain CSS. Backend implementation and hosting remain undecided. Google authentication configured through Google Cloud, a Supabase database and Mailgun confirmation emails remain required integrations; none is configured or tested.

Further implementation awaits the user's next instruction. Catalogue, product details, size and quantity selection, cart, checkout, persistent buyer orders, confirmation emails, full responsive feature verification and production deployment are pending. Products will be clearly labelled samples until real catalogue assets are available. Payments are optional and must use test mode if added.

Designer onboarding, product approval, quality reviews, delayed payouts, delivery acceptance and dispute protection belong to future scope.

## Verification

- Dependency installation passed; npm reported zero known vulnerabilities at installation time.
- `PATH=/usr/bin:$PATH npm run build` passed using Node.js 22.15.1 and Vite 8.3.2.
- The development server started successfully. HTTP checks returned the HTML entry page and transformed React component containing both requested lines. The server was stopped after verification.
- `git diff --check` passed. Ignore checks confirmed that `node_modules`, `dist` and local environment files are ignored, while `.env.example` is allowed.
- Browser visual verification was not performed. No authentication, database or email integration has been configured or tested.

To verify locally, run `npm run build`, start the development server and check the displayed text. Run `git status --short` and `git diff --check` to review changes. Newly created files appear as untracked until added to Git; this brick does not stage or commit them.

Local environment files are ignored, but that alone does not make frontend values secret. Vite's `VITE_*` environment values are exposed to the browser bundle. Never put private API keys or other secrets there. Future protected features must enforce authentication, ownership checks and server-side validation.
