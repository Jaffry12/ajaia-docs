import { fail, withUser } from "../../../lib/http";
import { ImportError, fileToDocument } from "../../../lib/import";
import { createDocument } from "../../../lib/repo";

export const POST = withUser(async (user, request: Request) => {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail(400, "Choose a file to import.");
  try {
    const { title, html } = await fileToDocument(file.name, Buffer.from(await file.arrayBuffer()));
    const id = await createDocument(user.id, title, html);
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof ImportError) return fail(400, error.message);
    throw error;
  }
});
