# Ajaia Docs

A lightweight collaborative document editor: create, format, import, share and reopen documents in the browser.

- **Live app:** https://ajaia-docs-virid.vercel.app
- **Demo accounts** (password `demo1234` for all):

| User | Email | What to try |
|---|---|---|
| Alice Chen | `alice@ajaia.test` | Owns "Welcome to Ajaia Docs"; can share, change roles and remove access |
| Bob Patel | `bob@ajaia.test` | Has **edit** access to Alice's welcome document |
| Carol Diaz | `carol@ajaia.test` | Has **view-only** access to the same document |

The login page has one-click buttons that fill in each demo account.

## Features

- **Documents:** create, rename (click the title), edit in the browser, autosave with a visible "Saving… / All changes saved" state, reopen later.
- **Rich text:** bold, italic, underline, headings (H1–H3), bulleted and numbered lists, quotes, undo/redo, plus the usual keyboard shortcuts.
- **File import:** upload a **.txt, .md or .docx** file (up to 2 MB) and it becomes a new editable document. Markdown headings, emphasis and lists are kept; Word files are converted with their basic formatting. Other file types are rejected with a clear message.
- **Sharing:** the owner shares by email as **Can edit** or **View only**, can change a role or remove access, and sees who has access. The documents page separates **My documents** from **Shared with me** and shows each role.
- **Access control on the server:** every API route checks the caller's role. Viewers can't save, only owners can share or delete, and users without access get a 404.
- **Persistence:** Postgres (Neon). Documents are stored as HTML from the editor, so formatting survives a refresh.

## Run locally

Requirements: Node.js 20+ and a Postgres database (a free [Neon](https://neon.tech) database works, or local Postgres).

```bash
npm install
cp .env.example .env.local        # then set DATABASE_URL and SESSION_SECRET
npm run db:setup                  # creates tables, seeds the 3 demo users and a shared welcome doc
npm run dev                       # http://localhost:3000
```

`npm run db:setup` is safe to run more than once. It reads `DATABASE_URL` from the environment, so on Windows PowerShell set it first (`$env:DATABASE_URL="..."`) or run it through a tool that loads `.env.local`.

## Tests

```bash
npm test
```

15 unit tests (Vitest) cover the access rules (owner / editor / viewer / no access), file import (text escaping, Markdown structure, raw HTML blocked, unsupported, empty, oversized and corrupt files), session tokens (tampered and expired tokens rejected), password hashing and input validation.

The deployed build was also checked end to end: create, save, rename, reopen, share, view-only enforcement, import and error cases, plus a headless browser run confirming autosave survives a refresh and the viewer can't edit.

## Deploy (Vercel + Neon)

```bash
vercel link
vercel integration add neon          # free Neon Postgres; sets DATABASE_URL on the project
vercel env add SESSION_SECRET        # any random 16+ character string, for each environment
npm run db:setup                     # with DATABASE_URL pointing at the Neon database
vercel deploy --prod
```

## Project structure

```
app/                 Next.js App Router pages and API route handlers
  api/auth/          login / logout (signed httpOnly session cookie)
  api/documents/     list, create, read, update, delete; shares sub-routes
  api/import/        file upload -> new document
  doc/[id]/          editor page
components/          Dashboard, DocumentEditor (TipTap + toolbar), SharePanel, LoginForm
lib/                 access rules, validation, import conversion, auth, data access
scripts/setup-db.mjs schema + seed data
tests/               Vitest unit tests
docs/screenshots/    screenshots of the main flows
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for decisions and trade-offs, and [AI_WORKFLOW.md](AI_WORKFLOW.md) for how AI tools were used.
