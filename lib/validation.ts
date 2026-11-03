import { z } from "zod";

export const TITLE_MAX = 120;
export const CONTENT_MAX_CHARS = 500_000;

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title can't be empty")
  .max(TITLE_MAX, `Title must be ${TITLE_MAX} characters or fewer`);

export const createDocSchema = z.object({ title: titleSchema.optional() });

export const updateDocSchema = z
  .object({
    title: titleSchema.optional(),
    content: z.string().max(CONTENT_MAX_CHARS, "Document is too large to save").optional(),
  })
  .refine((d) => d.title !== undefined || d.content !== undefined, "Nothing to update");

export const shareSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  role: z.enum(["viewer", "editor"]).default("editor"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string): boolean => UUID.test(value);

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
