import { canDelete, canEdit } from "../../../../lib/access";
import { fail, readJson, withUser } from "../../../../lib/http";
import { deleteDocument, getDocumentForUser, updateDocument } from "../../../../lib/repo";
import { firstError, updateDocSchema } from "../../../../lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withUser(async (user, _request: Request, { params }: Ctx) => {
  const found = await getDocumentForUser((await params).id, user.id);
  if (!found) return fail(404, "Document not found, or you don't have access to it.");
  return Response.json(found);
});

export const PATCH = withUser(async (user, request: Request, { params }: Ctx) => {
  const { id } = await params;
  const found = await getDocumentForUser(id, user.id);
  if (!found) return fail(404, "Document not found, or you don't have access to it.");
  if (!canEdit(found.role)) return fail(403, "You have view-only access to this document.");
  const parsed = updateDocSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(400, firstError(parsed.error));
  const updatedAt = await updateDocument(id, parsed.data);
  return Response.json({ ok: true, updated_at: updatedAt });
});

export const DELETE = withUser(async (user, _request: Request, { params }: Ctx) => {
  const { id } = await params;
  const found = await getDocumentForUser(id, user.id);
  if (!found) return fail(404, "Document not found, or you don't have access to it.");
  if (!canDelete(found.role)) return fail(403, "Only the owner can delete this document.");
  await deleteDocument(id);
  return Response.json({ ok: true });
});
