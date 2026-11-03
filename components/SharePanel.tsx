"use client";

import { useState } from "react";
import type { ShareRole } from "../lib/access";
import type { Share, User } from "../lib/repo";

export default function SharePanel({ docId, initialShares, people }: { docId: string; initialShares: Share[]; people: User[] }) {
  const [shares, setShares] = useState(initialShares);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(url: string, init: RequestInit) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Sharing failed");
      setShares(data.shares);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sharing failed");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const share = (targetEmail: string, targetRole: ShareRole) =>
    call(`/api/documents/${docId}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, role: targetRole }),
    });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (await share(email, role)) setEmail("");
  }

  return (
    <aside className="card share-panel" aria-label="Sharing">
      <h3>Share</h3>
      <p className="hint" style={{ margin: 0 }}>Give another user access by email.</p>
      <form onSubmit={submit}>
        <input
          type="email"
          list="people"
          placeholder="name@ajaia.test"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email to share with"
        />
        <datalist id="people">
          {people.map((p) => (
            <option key={p.id} value={p.email}>{p.name}</option>
          ))}
        </datalist>
        <div className="row">
          <select value={role} onChange={(e) => setRole(e.target.value as ShareRole)} aria-label="Access level">
            <option value="editor">Can edit</option>
            <option value="viewer">View only</option>
          </select>
          <button className="primary" type="submit" disabled={busy}>Share</button>
        </div>
      </form>
      {error && <p className="error" role="alert">{error}</p>}

      <h3 style={{ marginTop: 16 }}>People with access</h3>
      <ul className="share-list">
        <li><span className="person">You</span><span className="badge">Owner</span></li>
        {shares.map((s) => (
          <li key={s.user_id}>
            <span className="person" title={s.email}>{s.name}</span>
            <span style={{ display: "flex", gap: 6 }}>
              <select
                value={s.role}
                disabled={busy}
                aria-label={`Access for ${s.name}`}
                onChange={(e) => share(s.email, e.target.value as ShareRole)}
              >
                <option value="editor">Can edit</option>
                <option value="viewer">View only</option>
              </select>
              <button
                type="button"
                className="danger"
                disabled={busy}
                aria-label={`Remove ${s.name}`}
                onClick={() => call(`/api/documents/${docId}/shares/${s.user_id}`, { method: "DELETE" })}
              >
                ✕
              </button>
            </span>
          </li>
        ))}
      </ul>
      {shares.length === 0 && <p className="hint">Only you can see this document.</p>}
    </aside>
  );
}
