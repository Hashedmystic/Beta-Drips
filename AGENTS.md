# Working instructions for Beta Drips

The user is learning development alongside cybersecurity. Work one small, understandable brick at a time.

## Scope and communication

- Implement only the current requested brick. Use PRD.md to distinguish the HNG submission from future marketplace features.
- Explain the purpose of the brick before editing.
- After editing, explain each changed file, the main concepts introduced, and how the user can verify the result.
- Connect relevant security lessons to the current work in plain language.
- Update README.md with completed work, pending work and actual verification results for each brick.
- Wait for the user's next instruction before beginning another brick.
- Do not choose a framework until the stack has been discussed with the user.
- Do not commit, push, deploy or make changes to external services unless the user explicitly requests it.

## Security and verification

- Keep secrets out of source code, logs and Git. When credentials are needed, use appropriate secret configuration and document variable names without secret values.
- When authentication and protected data operations are introduced, enforce authentication, ownership checks and server-side validation. Client-side controls alone do not protect data.
- Do not claim an integration works until it has been tested. State what was tested, the result, and any remaining gaps.
- Identify illustrative catalogue content with the user's requested single preview notice; do not imply verified merchandise or stock.

## Current brick

Prepare the existing project changes for deployment review. Document the user's successful real local Google sign-in, checkout, Supabase saving, Mailgun receipt in Gmail spam and saved-order persistence after logout/login. Record that Mailgun uses a sandbox restricted to authorized recipients. Preserve the distinction between user-reported live results, local automated checks and remaining production/RLS/concurrency verification.

Verify .env is ignored and no secrets are tracked or staged without printing secret values. Run the compatible-Node production build and relevant existing tests. Stage project changes and show the staged summary. Suggest a plain imperative commit message without a feat: prefix. Do not commit, push, deploy or change external services. Stop after this brick.
