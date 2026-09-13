import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isAdminIdentity, loginIdentity } from "./admin-policy";

describe("Google-only administrator policy", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_GOOGLE_EMAIL", "owner@example.com");
    vi.stubEnv("AUTH_SECRET", "test-only-secret-with-at-least-32-characters");
  });
  afterEach(() => vi.unstubAllEnvs());
  const profile = { email: "owner@example.com", email_verified: true };
  it("accepts the configured Google-verified identity", () => {
    expect(isAdminIdentity(loginIdentity("google", profile))).toBe(true);
  });
  it.each(["kakao", "naver"])("denies %s even with the same email", (provider) => {
    expect(isAdminIdentity(loginIdentity(provider, profile))).toBe(false);
  });
  it.each([false, undefined, "true"])("denies unverified Google profiles: %s", (email_verified) => {
    expect(isAdminIdentity(loginIdentity("google", { ...profile, email_verified }))).toBe(false);
  });
  it("denies another Google account and missing identity", () => {
    expect(isAdminIdentity(loginIdentity("google", { ...profile, email: "other@example.com" }))).toBe(false);
    expect(isAdminIdentity(null)).toBe(false);
    expect(isAdminIdentity({})).toBe(false);
  });
  it("fails closed when configuration is missing", () => {
    vi.stubEnv("ADMIN_GOOGLE_EMAIL", "");
    expect(isAdminIdentity(loginIdentity("google", profile))).toBe(false);
  });
  it.each(["", "development-secret-change-me", "short"])("denies unsafe secrets", (secret) => {
    vi.stubEnv("AUTH_SECRET", secret);
    expect(isAdminIdentity(loginIdentity("google", profile))).toBe(false);
  });
});
