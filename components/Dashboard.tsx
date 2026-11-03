"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { OwnedDoc, SharedDoc } from "../lib/repo";
import { roleLabel } from "../lib/access";

const ACCEPT = ".txt,.md,.docx";
const MAX_BYTES = 2 * 1024 * 1024;

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function Dashboard({ owned, shared }: { owned: OwnedDoc[]; shared: SharedDoc[] }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"" | "create" | "import">("");
  const [error, setError] = useState("");

  async function createDoc() {
    setBusy("create");
    setError("");
    try {
      const res = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/doc/${data.id}`);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't create a document.");
      setBusy("");
    }
  }

  async function importFile(file: File) {
    setError("");
    if (file.size > MAX_BYTES) return setError("That file is larger than 2 MB.");
    if (!/\.(txt|md|docx)$/i.test(file.name)) return setError("Unsupported file type. Upload a .txt, .md or .docx file.");
    setBusy("import");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/doc/${data.id}`);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Import failed.");
      setBusy("");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <>
      <div className="actions">
        <button className="primary" type="button" onClick={createDoc} disabled={busy !== ""}>
          {busy === "create" ? "Creating…" : "+ New document"}
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} disabled={busy !== ""}>
          {busy === "import" ? "Importing…" : "Import a file"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
        />
        <span className="hint">Import turns a .txt, .md or .docx file (up to 2 MB) into a new editable document.</span>
      </div>
      {error && <p className="error" role="alert">{error}</p>}

      <section className="section">
        <h2>My documents</h2>
        <ul className="doc-list">
          {owned.length === 0 && <li className="empty">No documents yet. Create one or import a file.</li>}
          {owned.map((d) => (
            <li key={d.id}>
              <div>
                <Link className="title" href={`/doc/${d.id}`}>{d.title}</Link>
                <div className="meta">Edited {formatDate(d.updated_at)}</div>
              </div>
              {d.share_count > 0 ? <span className="badge">Shared with {d.share_count}</span> : <span className="badge view">Private</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2>Shared with me</h2>
        <ul className="doc-list">
          {shared.length === 0 && <li className="empty">Nothing has been shared with you yet.</li>}
          {shared.map((d) => (
            <li key={d.id}>
              <div>
                <Link className="title" href={`/doc/${d.id}`}>{d.title}</Link>
                <div className="meta">Owned by {d.owner_name} · edited {formatDate(d.updated_at)}</div>
              </div>
              <span className={d.role === "viewer" ? "badge view" : "badge"}>{roleLabel(d.role)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
