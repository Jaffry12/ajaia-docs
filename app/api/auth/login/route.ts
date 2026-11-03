import { verifyPassword } from "../../../../lib/auth";
import { fail, readJson } from "../../../../lib/http";
import { getUserWithPassword } from "../../../../lib/repo";
import { startSession } from "../../../../lib/session";
import { firstError, loginSchema } from "../../../../lib/validation";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(400, firstError(parsed.error));
  try {
    const user = await getUserWithPassword(parsed.data.email);
    if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
      return fail(401, "Wrong email or password.");
    }
    await startSession(user.id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return fail(500, "Couldn't sign you in right now. Please try again.");
  }
}
