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
- Keep sample products clearly labelled until real catalogue assets are available.

## Current brick

Inspect the repository and create or update only PRD.md, AGENTS.md and README.md. Do not implement the website, install dependencies, commit, push or deploy. The next brick is discussing the technical stack.
