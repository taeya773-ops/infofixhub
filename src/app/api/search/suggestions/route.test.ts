import { beforeEach, describe, expect, it, vi } from "vitest";
const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { question: { findMany } } }));
vi.mock("@/lib/public-search", () => import("../../../../lib/public-search"));
import { GET } from "./route";
describe("public suggestions", () => {
  beforeEach(() => { findMany.mockReset(); });
  it("does not query for blank input", async () => {
    const response = await GET(new Request("http://localhost/api/search/suggestions?q=%20"));
    expect(await response.json()).toEqual({ items: [] });
    expect(findMany).not.toHaveBeenCalled();
  });
  it("only selects public titles and slugs, capped at five", async () => {
    findMany.mockResolvedValue([{ title: "태국 입국카드", slug: "tdac" }]);
    const response = await GET(new Request("http://localhost/api/search/suggestions?q=태국"));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "PUBLISHED" }), select: { title: true, slug: true }, take: 5 }));
    expect(await response.json()).toEqual({ items: [{ title: "태국 입국카드", slug: "tdac" }] });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("does not leak database errors", async () => {
    findMany.mockRejectedValue(new Error("secret connection"));
    const response = await GET(new Request("http://localhost/api/search/suggestions?q=Windows"));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret");
  });
});
