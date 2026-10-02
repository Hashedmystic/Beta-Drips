# Beta Drips

**Exceptional fashion. Nigerian brands.**

Beta Drips is a planned curated marketplace showcasing Nigerian clothing brands across ages, styles and ethnic backgrounds, starting with an HNG Lesson 2 shopping experience.

## Current status

Documentation only. No website has been implemented, no dependencies installed, and no integrations configured or tested.

Completed work:

- Inspected the repository.
- Added [PRD.md](PRD.md) to separate HNG submission requirements from future marketplace features.
- Added [AGENTS.md](AGENTS.md) to define small learning steps, security practices and verification expectations.
- Updated this README with project status and next steps.

## Pending work

**Next step: discuss the technical stack.** No framework has been selected. Google authentication configured through Google Cloud, a Supabase database and Mailgun confirmation emails remain required integrations.

After the stack discussion, implementation will proceed one requested brick at a time. Catalogue, product details, size and quantity selection, cart, checkout, persistent buyer orders, confirmation emails, responsive layout and production deployment are pending. Products will be clearly labelled samples until real catalogue assets are available. Payments are optional and must use test mode if added.

Designer onboarding, product approval, quality reviews, delayed payouts, delivery acceptance and dispute protection belong to future scope.

## Verification

Documentation review and Git diff checks confirm that this brick changes only PRD.md, AGENTS.md and README.md, with no whitespace errors. There is no application to test yet; Google authentication, Supabase persistence and Mailgun delivery remain untested.

To verify locally, read the three documents and run `git status --short` and `git diff --check`. Newly created files appear as untracked until added to Git; this brick does not stage or commit them.
