import { describe, expect, it } from "vitest";
import { canDelete, canEdit, canManageSharing, canView, resolveRole } from "../lib/access";

const OWNER = "owner-id";
const OTHER = "other-id";

describe("document access rules", () => {
  it("gives the owner full control", () => {
    const role = resolveRole(OWNER, OWNER, null);
    expect(role).toBe("owner");
    expect([canView(role), canEdit(role), canManageSharing(role), canDelete(role)]).toEqual([true, true, true, true]);
  });

  it("lets an editor view and edit, but not share or delete", () => {
    const role = resolveRole(OWNER, OTHER, "editor");
    expect([canView(role), canEdit(role), canManageSharing(role), canDelete(role)]).toEqual([true, true, false, false]);
  });

  it("keeps a viewer read-only", () => {
    const role = resolveRole(OWNER, OTHER, "viewer");
    expect([canView(role), canEdit(role), canManageSharing(role), canDelete(role)]).toEqual([true, false, false, false]);
  });

  it("denies everything to a user the document was not shared with", () => {
    const role = resolveRole(OWNER, OTHER, null);
    expect(role).toBeNull();
    expect([canView(role), canEdit(role), canManageSharing(role), canDelete(role)]).toEqual([false, false, false, false]);
  });
});
