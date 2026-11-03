import { currentUser } from "./session";
import type { User } from "./repo";

export const fail = (status: number, error: string) => Response.json({ error }, { status });

/** Parses a JSON body, returning undefined instead of throwing on malformed input. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** Wraps a handler with auth and a catch-all so clients always get a JSON error. */
export function withUser<A extends unknown[]>(handler: (user: User, ...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      const user = await currentUser();
      if (!user) return fail(401, "Please sign in again.");
      return await handler(user, ...args);
    } catch (error) {
      console.error(error);
      return fail(500, "Something went wrong on our side. Please try again.");
    }
  };
}
