import { canManageSharing } from "../../../../../../lib/access";
import { fail, withUser } from "../../../../../../lib/http";
import { getDocumentForUser, listShares, removeShare } from "../../../../../../lib/repo";
import { isUuid } from "../../../../../../lib/validation";

type Ctx = { params: Promise<{ id: string; userId: string }> };

export const DELETE = withUser(async (user, _request: Request, { params }: Ctx) => {
  const { id, userId } = await params;
  const found = await getDocumentForUser(id, user.id);
  if (!found) return fail(404, "Document not found, or you don't have access to it.");
  if (!canManageSharing(found.role)) return fail(403, "Only the owner can change sharing.");
  if (!isUuid(userId)) return fail(400, "Invalid user.");
  await removeShare(id, userId);
  return Response.json({ shares: await listShares(id) });
});
