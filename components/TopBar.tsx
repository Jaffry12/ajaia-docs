"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TopBar({ name }: { name: string }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }
  return (
    <header className="topbar">
      <Link href="/" className="brand">
        Ajaia <span>Docs</span>
      </Link>
      <div className="who">
        Signed in as <strong>{name}</strong>
        <button type="button" onClick={logout}>Sign out</button>
      </div>
    </header>
  );
}
