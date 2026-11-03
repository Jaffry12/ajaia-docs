import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "../../../lib/session";
import { getDocumentForUser, listOtherUsers, listShares } from "../../../lib/repo";
import { canManageSharing } from "../../../lib/access";
import TopBar from "../../../components/TopBar";
import DocumentEditor from "../../../components/DocumentEditor";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const found = await getDocumentForUser((await params).id, user.id);

  if (!found) {
    return (
      <>
        <TopBar name={user.name} />
        <main className="page">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Document not available</h2>
            <p>It doesn&apos;t exist, or it hasn&apos;t been shared with you. Ask the owner to share it with {user.email}.</p>
            <Link href="/">Back to my documents</Link>
          </div>
        </main>
      </>
    );
  }

  const owner = canManageSharing(found.role);
  const [shares, people] = owner ? await Promise.all([listShares(found.doc.id), listOtherUsers(user.id)]) : [[], []];

  return (
    <>
      <TopBar name={user.name} />
      <main className="page" style={{ maxWidth: owner ? 1180 : 960 }}>
        <p style={{ margin: "0 0 12px" }}>
          <Link href="/">← All documents</Link>
        </p>
        <DocumentEditor
          docId={found.doc.id}
          initialTitle={found.doc.title}
          initialContent={found.doc.content}
          ownerName={found.doc.owner_name}
          role={found.role}
          initialShares={shares}
          people={people}
        />
      </main>
    </>
  );
}
