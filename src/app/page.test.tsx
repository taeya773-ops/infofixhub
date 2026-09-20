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
    expect(html).toContain("infofixhub-brand-object-v2.png");
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
  });
});
