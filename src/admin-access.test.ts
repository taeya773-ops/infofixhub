import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { encode } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
vi.mock("@/lib/admin-policy", () => import("./lib/admin-policy"));
import { middleware } from "./middleware";

const secret = "test-only-secret-with-at-least-32-characters";
const identity = { sub: "user-1", loginProvider: "google", verifiedGoogleEmail: "owner@example.com" };
async function request(path: string, token?: Record<string, unknown>, maxAge = 3600) {
  const cookie = token ? `next-auth.session-token=${await encode({ token, secret, maxAge })}` : "";
  return middleware(new NextRequest(`https://example.com${path}`, { headers: { cookie } }));
}
describe("admin boundary", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", secret);
    vi.stubEnv("ADMIN_GOOGLE_EMAIL", "owner@example.com");
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
  });
  afterEach(() => vi.unstubAllEnvs());
  it("redirects anonymous visitors without a Basic Auth challenge", async () => {
    const response = await request("/admin");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/login");
    expect(response.headers.has("www-authenticate")).toBe(false);
  });
  it("rejects old Basic credentials and malformed tokens", async () => {
    const requests: Record<string, string>[] = [{ authorization: "Basic YWRtaW46cGFzc3dvcmQ=" }, { cookie: "next-auth.session-token=invalid" }];
    for (const headers of requests) {
      const response = await middleware(new NextRequest("https://example.com/api/content/publish", { headers }));
      expect(response.status).toBe(401);
    }
  });
  it.each(["/api/discovery", "/api/content/generate", "/api/content/publish"])("protects %s", async (path) => {
    expect((await request(path)).status).toBe(401);
    expect((await request(path, { ...identity, loginProvider: "kakao" })).status).toBe(403);
    expect((await request(path, identity)).headers.get("x-middleware-next")).toBe("1");
  });
  it("hides admin pages from other Google users and legacy role claims", async () => {
    expect((await request("/admin", { ...identity, verifiedGoogleEmail: "other@example.com" })).status).toBe(404);
    expect((await request("/admin", { role: "ADMIN", email: "owner@example.com" })).status).toBe(404);
  });
  it("rejects expired and tampered sessions", async () => {
    expect((await request("/admin", identity, -3600)).status).toBe(307);
    const forged = await encode({ token: identity, secret: "wrong-secret", maxAge: 3600 });
    const response = await middleware(new NextRequest("https://example.com/admin", { headers: { cookie: `next-auth.session-token=${forged}` } }));
    expect(response.status).toBe(307);
  });
  it("guards every current admin action before business logic", () => {
    for (const file of ["src/app/admin/page.tsx", "src/app/admin/questions/[id]/page.tsx"]) {
      const source = readFileSync(file, "utf8");
      const actions = source.match(/"use server";/g) ?? [];
      expect(actions.length).toBeGreaterThan(0);
      expect(source.match(/"use server";\s+await requireAdmin\(\);/g)).toHaveLength(actions.length);
    }
  });
});
