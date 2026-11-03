# Submission: Ajaia AI-Native Full Stack Developer Assignment

**Candidate:** Syed Muhammad Dawood (dawoodjaffry12@gmail.com)

## Links

- **Live product:** https://ajaia-docs-dawood.vercel.app
- **Code (GitHub):** https://github.com/Jaffry12/ajaia-docs
- **Walkthrough video:** https://www.loom.com/share/8323b73ec5854b1ab90d396c04791fbf (also in `VIDEO_URL.txt`)

## Test accounts (password `demo1234`)

- `alice@ajaia.test`: owner of "Welcome to Ajaia Docs"
- `bob@ajaia.test`: can edit that document
- `carol@ajaia.test`: view-only on that document

## What's in this folder

| Item | Path |
|---|---|
| Source code | `ajaia-docs/` (`app/`, `components/`, `lib/`, `scripts/`, `tests/`, config files) |
| Setup and run instructions | `ajaia-docs/README.md` |
| Architecture note | `ajaia-docs/ARCHITECTURE.md` |
| AI workflow note | `ajaia-docs/AI_WORKFLOW.md` |
| This file | `SUBMISSION.md` |
| Walkthrough video link | `VIDEO_URL.txt` |
| Screenshots | `ajaia-docs/docs/screenshots/` |

## Status

**Working end to end:**
- Sign in (seeded users), create, rename, edit with rich text, autosave, reopen after refresh.
- Import .txt / .md / .docx as a new document.
- Share by email as editor or viewer, change roles, remove access.
- "My documents" vs "Shared with me".
- Server-side access enforcement, validation and error messages.
- Postgres persistence, 15 unit tests, live deployment.

**Intentionally not built:**
- Real-time co-editing: concurrent edits are last-write-wins.
- Sign-up, password reset, and invites for users without an account.
- Attachments: files are imported as documents instead.
- Version history, comments, export.

**Next with 2–4 more hours:**
1. Version history with restore.
2. Stale-write detection on save.
3. Playwright end-to-end tests in CI.
4. Server-side HTML sanitisation and rate limiting.
5. Export to Markdown/PDF.
