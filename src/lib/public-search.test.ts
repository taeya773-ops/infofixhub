import { describe, expect, it } from "vitest";
import { normalizeSearchQuery, publicSearchWhere } from "./public-search";

describe("public search", () => {
  it("normalizes Korean and English search terms", () => {
    expect(normalizeSearchQuery("  태국   TDAC  ")).toBe("태국 TDAC");
  });
  it("handles missing and repeated query parameters safely", () => {
    expect(normalizeSearchQuery(undefined)).toBe("");
    expect(normalizeSearchQuery(["one", "two"])).toBe("");
    expect(normalizeSearchQuery("  ")).toBe("");
  });
  it("limits query size and condition count", () => {
    expect(normalizeSearchQuery("a".repeat(200))).toHaveLength(120);
    expect(publicSearchWhere("a b c d e f g h i j").AND).toHaveLength(8);
  });
  it("always restricts results to published questions", () => {
    for (const query of ["", "태국", "DRAFT", "' OR 1=1 --"]) {
      expect(publicSearchWhere(query).status).toBe("PUBLISHED");
    }
  });
  it("requires each term in title or category, without searching private drafts", () => {
    expect(publicSearchWhere("태국 카드")).toEqual({ status: "PUBLISHED", AND: ["태국", "카드"].map((term) => ({ OR: [
      { title: { contains: term, mode: "insensitive" } },
      { category: { is: { name: { contains: term, mode: "insensitive" } } } },
    ] })) });
  });
});
