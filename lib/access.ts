// Access rules for documents. Kept free of I/O so they can be unit tested and reused by every route.

export type ShareRole = "viewer" | "editor";
export type Role = "owner" | ShareRole;

/** The caller's role on a document, or null when they have no access at all. */
export function resolveRole(ownerId: string, userId: string, sharedRole: ShareRole | null | undefined): Role | null {
  if (ownerId === userId) return "owner";
  return sharedRole ?? null;
}

export const canView = (role: Role | null): boolean => role !== null;
export const canEdit = (role: Role | null): boolean => role === "owner" || role === "editor";
export const canManageSharing = (role: Role | null): boolean => role === "owner";
export const canDelete = (role: Role | null): boolean => role === "owner";

export function roleLabel(role: Role): string {
  return role === "owner" ? "Owner" : role === "editor" ? "Can edit" : "View only";
}
