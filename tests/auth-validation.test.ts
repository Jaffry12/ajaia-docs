import { beforeAll, describe, expect, it } from "vitest";
import { createSessionToken, hashPassword, readSessionToken, verifyPassword } from "../lib/auth";
import { shareSchema, updateDocSchema } from "../lib/validation";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-at-least-16-chars";
});

describe("sessions and passwords", () => {
  it("accepts a valid session token and rejects a tampered one", () => {
    const token = createSessionToken("user-1");
    expect(readSessionToken(token)).toBe("user-1");
    const [, expires, signature] = token.split(".");
    expect(readSessionToken(`user-2.${expires}.${signature}`)).toBeNull();
  });

  it("rejects an expired session", () => {
    const token = createSessionToken("user-1", Date.now() - 8 * 24 * 60 * 60 * 1000);
    expect(readSessionToken(token)).toBeNull();
  });

  it("verifies passwords against their scrypt hash", () => {
    const stored = hashPassword("demo1234");
    expect(verifyPassword("demo1234", stored)).toBe(true);
    expect(verifyPassword("wrong", stored)).toBe(false);
  });
});

describe("input validation", () => {
  it("rejects blank or overlong titles", () => {
    expect(updateDocSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(updateDocSchema.safeParse({ title: "x".repeat(121) }).success).toBe(false);
    expect(updateDocSchema.safeParse({}).success).toBe(false);
    expect(updateDocSchema.safeParse({ title: "Q3 plan" }).success).toBe(true);
  });

  it("normalises share emails and only allows known roles", () => {
    expect(shareSchema.parse({ email: " Bob@Ajaia.test ", role: "viewer" })).toEqual({ email: "bob@ajaia.test", role: "viewer" });
    expect(shareSchema.safeParse({ email: "bob@ajaia.test", role: "admin" }).success).toBe(false);
  });
});
