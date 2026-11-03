import { fail, readJson, withUser } from "../../../lib/http";
import { createDocument, listDocuments } from "../../../lib/repo";
import { createDocSchema, firstError } from "../../../lib/validation";

export const GET = withUser(async (user) => Response.json(await listDocuments(user.id)));

export const POST = withUser(async (user, request: Request) => {
  const parsed = createDocSchema.safeParse((await readJson(request)) ?? {});
  if (!parsed.success) return fail(400, firstError(parsed.error));
  const id = await createDocument(user.id, parsed.data.title ?? "Untitled document");
  return Response.json({ id }, { status: 201 });
});
