import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { question: { findMany } } }));
vi.mock("@/lib/public-search", () => import("../../lib/public-search"));
vi.mock("@/components/home/hero-search", () => import("../../components/home/hero-search"));
import SearchPage from "./page";

describe("search page rendering", () => {
  beforeEach(() => { vi.stubGlobal("React", React); findMany.mockReset(); });
  afterEach(() => vi.unstubAllGlobals());
  const render = async (q?: string) => renderToStaticMarkup(await SearchPage({ searchParams: Promise.resolve({ q }) }));
  it("shows instructions without querying on empty input", async () => {
    expect(await render(" ")).toContain("궁금한 주제를 입력");
    expect(findMany).not.toHaveBeenCalled();
  });
  it("renders results and passes the published-only filter to the database", async () => {
    findMany.mockResolvedValue([{ id: "test", slug: "tdac", title: "태국 카드 작성법", category: { name: "여행" } }]);
    const html = await render("태국");
    expect(html).toContain('href="/q/tdac"');
    expect(html).toContain("1개의 답변");
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "PUBLISHED" }), take: 31 }));
  });
  it("distinguishes no matches from database failures", async () => {
    findMany.mockResolvedValue([]);
    expect(await render("없는검색어")).toContain("일치하는 공개 글이 없습니다");
    findMany.mockRejectedValue(new Error("private connection details"));
    const html = await render("태국");
    expect(html).toContain("불러오지 못했습니다");
    expect(html).not.toContain("private connection details");
  });
  it("caps visible results and escapes query text", async () => {
    findMany.mockResolvedValue(Array.from({ length: 31 }, (_, i) => ({ id: String(i), slug: `test-${i}`, title: `Test ${i}`, category: null })));
    const html = await render("<script>alert(1)</script>");
    expect(html).toContain("최신 30개");
    expect(html).not.toContain('href="/q/test-30"');
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
