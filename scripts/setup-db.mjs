// Creates the tables and seeds three demo users plus one shared welcome document.
// Safe to run more than once. Usage: DATABASE_URL=... node scripts/setup-db.mjs
import { randomBytes, scryptSync } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const sql = neon(url);

const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
};

await sql`create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
)`;
await sql`create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)`;
await sql`create table if not exists document_shares (
  document_id uuid not null references documents(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  primary key (document_id, user_id)
)`;
await sql`create index if not exists documents_owner_idx on documents (owner_id, updated_at desc)`;
await sql`create index if not exists document_shares_user_idx on document_shares (user_id)`;

const DEMO_PASSWORD = "demo1234";
const people = [
  ["alice@ajaia.test", "Alice Chen"],
  ["bob@ajaia.test", "Bob Patel"],
  ["carol@ajaia.test", "Carol Diaz"],
];
for (const [email, name] of people) {
  await sql`insert into users (email, name, password_hash) values (${email}, ${name}, ${hashPassword(DEMO_PASSWORD)})
            on conflict (email) do nothing`;
}

const [alice] = await sql`select id from users where email = 'alice@ajaia.test'`;
const [{ count }] = await sql`select count(*)::int as count from documents where owner_id = ${alice.id}`;
if (count === 0) {
  const content =
    "<h1>Welcome to Ajaia Docs</h1>" +
    "<p>This document is owned by <strong>Alice</strong> and shared with Bob (<em>can edit</em>) and Carol (<u>view only</u>).</p>" +
    "<h2>Try it</h2><ul><li>Sign in as Bob and edit this page.</li><li>Sign in as Carol and notice it is read-only.</li>" +
    "<li>Import a .txt, .md or .docx file from the documents page.</li></ul>" +
    "<ol><li>Changes save automatically.</li><li>Formatting is preserved after refresh.</li></ol>";
  const [doc] = await sql`insert into documents (owner_id, title, content) values (${alice.id}, 'Welcome to Ajaia Docs', ${content}) returning id`;
  const [bob] = await sql`select id from users where email = 'bob@ajaia.test'`;
  const [carol] = await sql`select id from users where email = 'carol@ajaia.test'`;
  await sql`insert into document_shares (document_id, user_id, role) values (${doc.id}, ${bob.id}, 'editor'), (${doc.id}, ${carol.id}, 'viewer')`;
}

console.log("Database ready. Demo users: alice / bob / carol @ajaia.test, password", DEMO_PASSWORD);
