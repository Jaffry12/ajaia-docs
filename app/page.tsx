import { redirect } from "next/navigation";
import { currentUser } from "../lib/session";
import { listDocuments } from "../lib/repo";
import TopBar from "../components/TopBar";
import Dashboard from "../components/Dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { owned, shared } = await listDocuments(user.id);
  return (
    <>
      <TopBar name={user.name} />
      <main className="page">
        <Dashboard owned={owned} shared={shared} />
      </main>
    </>
  );
}
