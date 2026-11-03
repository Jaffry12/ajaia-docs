# Architecture note

## What I prioritised and why

The brief rewards a coherent, working product slice over breadth, so I put depth into the four things a reviewer touches first:

1. **An editing experience that feels solid.** TipTap (ProseMirror) gives reliable rich text. Autosave is debounced at 800 ms, shows a clear saved/unsaved state, retries on failure and warns before leaving with unsaved work.
2. **Sharing that is enforced, not just displayed.** Roles are resolved on the server for every request, and the rules live in one small, tested module.
3. **Import that produces a real document.** Files become editable documents with structure kept, not opaque attachments.
4. **A deployment reviewers can use immediately,** with seeded accounts and a pre-shared document, so the sharing flow can be tested in under a minute.

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 15 (App Router), React 19, TypeScript | One deployable app for UI and API; server components read data directly |
| Editor | TipTap 2 (StarterKit + Underline) | Mature ProseMirror wrapper; the schema filters unknown markup on load |
| Database | Postgres on Neon, via `@neondatabase/serverless` | Persistent and free; the HTTP driver suits serverless functions |
| Import | `marked` (Markdown) and `mammoth` (.docx) | Small, well-known converters to HTML |
| Validation | Zod | One schema per input, with readable error messages |
| Hosting | Vercel | Zero-config Next.js hosting; Neon attached through the Vercel marketplace |
| Tests | Vitest | Fast unit tests for the logic that matters most |

## Data model

```
users            (id, email unique, name, password_hash)
documents        (id, owner_id -> users, title, content HTML, created_at, updated_at)
document_shares  (document_id -> documents, user_id -> users, role 'viewer'|'editor', PK(document_id, user_id))
```

Ownership is a column, not a share row, so a document always has exactly one owner and the owner can't be "unshared". Deleting a document cascades to its shares.

## Access model

`lib/access.ts` turns (owner, caller, share role) into `owner | editor | viewer | null`, plus `canView`, `canEdit`, `canManageSharing` and `canDelete`. Every route loads the document together with the caller's role in one query (`getDocumentForUser`) and checks it before acting:

- No access returns **404** (it doesn't reveal that the document exists).
- A viewer saving returns **403**; only the owner can share, change roles or delete.
- The UI mirrors the same rules (read-only editor and banner for viewers, share panel only for owners), but the server is the source of truth.

## Request flow

Login checks an scrypt password hash and sets an httpOnly, SameSite=Lax cookie holding a signed, expiring token (HMAC-SHA256). Pages are server-rendered with the user's data. The editor is a client component that PATCHes `{ content }` or `{ title }`. Import posts multipart form data, converts the file on the server and returns the new document id.

## Trade-offs and deliberate scope cuts

- **No real-time co-editing.** Two people editing at once is last-write-wins. Real-time (Yjs + a WebSocket server) was the biggest possible feature, but it would have eaten the timebox and needs infrastructure beyond serverless. Sharing, roles and autosave cover the collaboration story for this slice.
- **Demo auth, not production auth.** Seeded users and a signed cookie keep review friction at zero. There's no sign-up, password reset or invite-by-email for people without an account.
- **HTML storage.** Simple, and round-trips perfectly through TipTap. Content is only ever rendered through the editor's schema, so unknown tags and attributes are dropped. Markdown imports escape raw HTML. A server-side sanitiser would be the next hardening step.
- **Import, not attachments.** Turning a file into an editable document is more useful in a doc editor and needs no blob storage. Word conversion keeps headings, emphasis and lists; complex layout, images and tables are best-effort.
- **One stretch feature:** viewer/editor roles, because it deepens the sharing area being evaluated at low cost.

## What I'd build next (2–4 hours)

1. Version history: snapshot on save (throttled) and restore.
2. Conflict protection: send `updated_at` with each save and warn on a stale write, as a step towards real-time.
3. Playwright end-to-end tests in CI (login, share, view-only enforcement, import).
4. Server-side HTML sanitisation and per-user rate limiting on save and import.
5. Export to Markdown/PDF, and invite-by-email for users without an account.
