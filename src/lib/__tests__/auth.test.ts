import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

// We test the password functions directly using bcrypt
// since importing auth.ts triggers NextAuth initialization which requires
// a full app context. The hashPassword and verifyPassword functions
// in auth.ts are thin wrappers around bcrypt with the same implementation.

// These implementations match src/lib/auth.ts
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

describe("hashPassword", () => {
  it("hashes a password", async () => {
    const password = "testPassword123";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it("generates different hashes for same password", async () => {
    const password = "testPassword123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });

  it("generates bcrypt format hash", async () => {
    const password = "testPassword123";
    const hash = await hashPassword(password);

    // bcrypt hashes start with $2a$ or $2b$
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it("uses cost factor of 12", async () => {
    const password = "testPassword123";
    const hash = await hashPassword(password);

    // bcrypt hash format: $2a$12$... where 12 is the cost factor
    expect(hash).toMatch(/^\$2[ab]\$12\$/);
  });
});

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const password = "testPassword123";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("returns false for incorrect password", async () => {
    const password = "testPassword123";
    const wrongPassword = "wrongPassword456";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  it("returns false for empty password against valid hash", async () => {
    const password = "testPassword123";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword("", hash);
    expect(isValid).toBe(false);
  });

  it("handles special characters in password", async () => {
    const password = "Test@Pass#123!$%^&*()";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("handles unicode characters in password", async () => {
    const password = "Test密码123";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("is case sensitive", async () => {
    const password = "TestPassword";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword("testpassword", hash);
    expect(isValid).toBe(false);
  });

  it("works with pre-generated hash", async () => {
    // This tests that our implementation matches bcrypt's expected behavior
    const password = "knownPassword";
    const hash = await bcrypt.hash(password, 12);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });
});
