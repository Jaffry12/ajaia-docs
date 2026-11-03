"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_USERS = ["alice@ajaia.test", "bob@ajaia.test", "carol@ajaia.test"];
const DEMO_PASSWORD = "demo1234";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_USERS[0]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError((await res.json().catch(() => ({}))).error ?? "Sign-in failed.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={submit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
      <div className="demo-users">
        Demo accounts (password <code>{DEMO_PASSWORD}</code>):
        <div>
          {DEMO_USERS.map((u) => (
            <button key={u} type="button" onClick={() => { setEmail(u); setPassword(DEMO_PASSWORD); }}>
              {u.split("@")[0]}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
