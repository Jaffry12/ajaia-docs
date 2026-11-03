import { redirect } from "next/navigation";
import { currentUser } from "../../lib/session";
import LoginForm from "../../components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentUser()) redirect("/");
  return (
    <main className="login card">
      <h1>
        Ajaia <span style={{ color: "var(--accent)" }}>Docs</span>
      </h1>
      <p className="hint">Sign in with one of the demo accounts to try sharing between users.</p>
      <LoginForm />
    </main>
  );
}
