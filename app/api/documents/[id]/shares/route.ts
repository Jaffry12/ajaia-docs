import { canManageSharing } from "../../../../../lib/access";
import { fail, readJson, withUser } from "../../../../../lib/http";
import { getDocumentForUser, getUserByEmail, listShares, upsertShare } from "../../../../../lib/repo";
import { firstError, shareSchema } from "../../../../../lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withUser(async (user, _request: Request, { params }: Ctx) => {
  const { id } = await params;
  const found = await getDocumentForUser(id, user.id);
  if (!found) return fail(404, "Document not found, or you don't have access to it.");
  return Response.json({ shares: await listShares(id) });
});

export const POST = withUser(async (user, request: Request, { params }: Ctx) => {
  const { id } = await params;
  const found = await getDocumentForUser(id, user.id);
  if (!found) return fail(404, "Document not found, or you don't have access to it.");
  if (!canManageSharing(found.role)) return fail(403, "Only the owner can share this document.");

  const parsed = shareSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(400, firstError(parsed.error));
  const target = await getUserByEmail(parsed.data.email);
  if (!target) return fail(404, `No user with the email ${parsed.data.email}.`);
  if (target.id === found.doc.owner_id) return fail(400, "You already own this document.");

  await upsertShare(id, target.id, parsed.data.role);
  return Response.json({ shares: await listShares(id) });
});
