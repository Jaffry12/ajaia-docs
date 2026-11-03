# AI workflow note

## Tools

- **Claude Code** (Anthropic, running Claude Opus 5.5), an agentic coding assistant in the terminal. I used it to scaffold the app, write code, run tests, deploy, and check the live build.
- No other AI tools were used for the code.

## How I split the work with AI

I made the product decisions up front and gave them to the assistant as constraints:
- **Stack:** Next.js + TipTap on Vercel.
- **Storage:** Neon Postgres, so the live demo keeps data after restarts.
- **Upload:** import .txt/.md/.docx as editable documents instead of attachments.
- **Stretch:** viewer/editor roles.
- **Scope cuts:** no real-time co-editing; demo authentication.

The assistant then produced most of the implementation inside those boundaries, and I reviewed and steered it.

## Where AI materially sped things up

- Scaffolding the Next.js app, the API route handlers and the data-access layer in minutes instead of an hour or more.
- The TipTap editor and toolbar wiring, plus debounced autosave with saved, unsaved and error states.
- Writing the unit tests and the end-to-end check script against the deployed app.
- Provisioning Neon through the Vercel CLI and deploying.
- First drafts of the README and this documentation.

## What I changed or rejected

- **Rejected the first dependency versions:** npm flagged Next.js 15.5.6 for a known security vulnerability (CVE-2025-66478). I upgraded to patched Next.js 15.5.28 and React 19.1.10 before writing features.
- **Rejected SQLite for the deployment:** it would reset on Vercel's serverless filesystem, so the live demo would lose documents. I chose Postgres instead.
- **Changed Markdown import:** by default it passes raw HTML through. I made it escape raw HTML, and a test now covers that case.
- **Changed access errors:** a user without access gets 404, not 403, so the response doesn't reveal that the document exists.
- **Changed toolbar styling:** after checking screenshots, the B/I/U buttons were plain letters, so I styled them as bold, italic and underline.
- *(Add anything else you changed while reviewing the code or recording the walkthrough.)*

## How I verified correctness, UX quality and reliability

- **Unit tests (15, Vitest)** on the riskiest logic: the access matrix for owner, editor, viewer and no access; import conversion and its error cases; session token tampering and expiry; validation.
- **End-to-end check against the live deployment:**
  - Wrong password is rejected.
  - Create, save formatted content, rename, blank-title rejection and reopen all work.
  - An unshared user gets 404.
  - Sharing as view-only: the viewer can read, gets 403 when saving, and sees the doc under "Shared with me".
  - A non-owner can't share, and sharing to an unknown email gives a clear error.
  - .md import keeps headings and lists; .png is rejected; no session gives 401.
- **Headless browser run (Playwright) on the live site:**
  - Typing triggers "All changes saved".
  - The text is still there after a full page refresh.
  - The viewer's editor is read-only and shows the view-only banner.
- **Manual review** of the main flows and screenshots for layout and clarity, and of the code for access checks on every route.

AI made the build faster; the product calls, scope cuts and checks above are mine.
