// All database reads and writes. Access decisions live in access.ts; routes combine the two.
import { sql } from "./db";
import { resolveRole, type Role, type ShareRole } from "./access";
import { isUuid } from "./validation";

export type User = { id: string; email: string; name: string };

export type OwnedDoc = { id: string; title: string; updated_at: string; share_count: number };
export type SharedDoc = { id: string; title: string; updated_at: string; owner_name: string; role: ShareRole };

export type DocumentRecord = {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  owner_name: string;
  updated_at: string;
};

export type Share = { user_id: string; email: string; name: string; role: ShareRole };

export async function getUserById(id: string): Promise<User | null> {
  if (!isUuid(id)) return null;
  const rows = await sql()`select id, email, name from users where id = ${id}`;
  return (rows[0] as User) ?? null;
}

export async function getUserWithPassword(email: string): Promise<(User & { password_hash: string }) | null> {
  const rows = await sql()`select id, email, name, password_hash from users where email = ${email}`;
  return (rows[0] as User & { password_hash: string }) ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await sql()`select id, email, name from users where email = ${email}`;
  return (rows[0] as User) ?? null;
}

export async function listOtherUsers(userId: string): Promise<User[]> {
  return (await sql()`select id, email, name from users where id <> ${userId} order by name`) as User[];
}

export async function listDocuments(userId: string): Promise<{ owned: OwnedDoc[]; shared: SharedDoc[] }> {
  const owned = await sql()`
    select d.id, d.title, d.updated_at,
           (select count(*) from document_shares s where s.document_id = d.id)::int as share_count
    from documents d
    where d.owner_id = ${userId}
    order by d.updated_at desc`;
  const shared = await sql()`
    select d.id, d.title, d.updated_at, u.name as owner_name, s.role
    from document_shares s
    join documents d on d.id = s.document_id
    join users u on u.id = d.owner_id
    where s.user_id = ${userId}
    order by d.updated_at desc`;
  return { owned: owned as OwnedDoc[], shared: shared as SharedDoc[] };
}

/** The document plus the caller's role, or null if it doesn't exist or the caller has no access. */
export async function getDocumentForUser(
  docId: string,
  userId: string,
): Promise<{ doc: DocumentRecord; role: Role } | null> {
  if (!isUuid(docId)) return null;
  const rows = await sql()`
    select d.id, d.title, d.content, d.owner_id, d.updated_at, u.name as owner_name, s.role as shared_role
    from documents d
    join users u on u.id = d.owner_id
    left join document_shares s on s.document_id = d.id and s.user_id = ${userId}
    where d.id = ${docId}`;
  const row = rows[0] as (DocumentRecord & { shared_role: ShareRole | null }) | undefined;
  if (!row) return null;
  const role = resolveRole(row.owner_id, userId, row.shared_role);
  if (!role) return null;
  const { shared_role: _ignored, ...doc } = row;
  return { doc, role };
}

export async function createDocument(ownerId: string, title: string, content = "<p></p>"): Promise<string> {
  const rows = await sql()`
    insert into documents (owner_id, title, content) values (${ownerId}, ${title}, ${content}) returning id`;
  return rows[0].id as string;
}

export async function updateDocument(docId: string, changes: { title?: string; content?: string }): Promise<string> {
  const rows = await sql()`
    update documents
    set title = coalesce(${changes.title ?? null}, title),
        content = coalesce(${changes.content ?? null}, content),
        updated_at = now()
    where id = ${docId}
    returning updated_at`;
  return rows[0].updated_at as string;
}

export async function deleteDocument(docId: string): Promise<void> {
  await sql()`delete from documents where id = ${docId}`;
}

export async function listShares(docId: string): Promise<Share[]> {
  return (await sql()`
    select s.user_id, u.email, u.name, s.role
    from document_shares s join users u on u.id = s.user_id
    where s.document_id = ${docId}
    order by u.name`) as Share[];
}

export async function upsertShare(docId: string, userId: string, role: ShareRole): Promise<void> {
  await sql()`
    insert into document_shares (document_id, user_id, role) values (${docId}, ${userId}, ${role})
    on conflict (document_id, user_id) do update set role = excluded.role`;
}

export async function removeShare(docId: string, userId: string): Promise<void> {
  await sql()`delete from document_shares where document_id = ${docId} and user_id = ${userId}`;
}
