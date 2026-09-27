import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { questions, categories } = vi.hoisted(() => ({ questions: vi.fn(), categories: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { question: { findMany: questions }, category: { findMany: categories } } }));
vi.mock("@/components/home/hero-search", () => import("../components/home/hero-search"));
vi.mock("@/components/home/category-explorer", () => import("../components/home/category-explorer"));
import Home, { metadata } from "./page";
describe("homepage public content", () => {
  beforeEach(() => { vi.stubGlobal("React", React); questions.mockReset(); categories.mockReset(); });
  afterEach(() => vi.unstubAllGlobals());
  it("preserves canonical and queries only published posts and category counts", async () => {
    questions.mockResolvedValue([{ id: "q1", slug: "tdac", title: "태국 입국카드", publishedAt: new Date("2026-08-01"), category: { name: "여행" } }]);
    categories.mockResolvedValue([{ name: "여행", slug: "travel", _count: { questions: 7 }, questions: [{ title: "태국 입국카드", slug: "tdac" }] }]);
    const html = renderToStaticMarkup(await Home());
    expect(metadata.alternates).toEqual({ canonical: "/" });
    expect(questions).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PUBLISHED" }, take: 12 }));
    expect(categories).toHaveBeenCalledWith(expect.objectContaining({
      where: { active: true, questions: { some: { status: "PUBLISHED" } } },
      select: expect.objectContaining({ _count: { select: { questions: { where: { status: "PUBLISHED" } } } }, questions: expect.objectContaining({ where: { status: "PUBLISHED" }, take: 1 }) }),
    }));
    expect(html).toContain('href="/category/travel"');
    expect(html).toContain('href="/q/tdac"');
    expect(html).toContain("공개 글 7개");
    expect(html).toContain("질문은 구체적으로. 답변은 쓸모 있게.");
    expect(html).toContain('aria-hidden="true">Q</span>');
    expect(html).toContain("답변 전체 보기");
    expect(html).toContain("knowledge-study-v1.png");
    expect(html).toContain('id="hero-heading">무엇이<br/><em>궁금</em>하세요?</h1>');
    for (const subject of ["laptop", "thailand", "stocks", "game", "pc", "saju"]) {
      expect(html).toContain(`guide-${subject}-v1.png`);
    }
    expect(html.match(/class="editorial-guide"/g)).toHaveLength(6);
    expect(html).toContain("STOCKS &amp; INVESTING");
    expect(html).toContain('href="/search?q=미국 주식"');
    expect(html).toContain("SAJU &amp; FORTUNE");
    expect(html).not.toContain("↗");
    expect(html).not.toContain("TRENDING");
    expect(html).toContain("무엇이 궁금하세요?");
    expect(html).not.toContain("MATTERS");
    expect(html).not.toContain("찾고.");
  });
  it("keeps guides and search usable when data is unavailable", async () => {
    questions.mockRejectedValue(new Error("private db"));
    categories.mockRejectedValue(new Error("private db"));
    const html = renderToStaticMarkup(await Home());
    expect(html).toContain("카테고리를 불러오지 못했습니다");
    expect(html).toContain('action="/search"');
    expect(html).toContain('href="/q/how-to-fill-thailand-arrival-card"');
    expect(html).not.toContain("private db");
    expect(html.match(/class="editorial-guide"/g)).toHaveLength(6);
  });
});
