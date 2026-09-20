import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { HeroSearch } from "@/components/home/hero-search";
import { normalizeSearchQuery, publicSearchWhere } from "@/lib/public-search";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "검색", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const query = normalizeSearchQuery((await searchParams).q);
  let results: Array<{ id: string; slug: string; title: string; category: { name: string } | null }> = [];
  let unavailable = false;
  if (query) {
    try {
      results = await db.question.findMany({ where: publicSearchWhere(query), select: { id: true, slug: true, title: true, category: { select: { name: true } } }, orderBy: { publishedAt: "desc" }, take: 31 });
    } catch { unavailable = true; }
  }
  return (
    <main className="editorial-home editorial-search-page">
      <div className="editorial-wrap">
        <Link className="editorial-back" href="/">← 홈으로</Link>
        <p className="editorial-label">THE ANSWER INDEX / SEARCH</p>
        <h1 className="editorial-search-title">질문에서<br />답변으로.</h1>
        <HeroSearch query={query} />
        <p className="editorial-search-hint">공개된 글의 제목과 주제에서 검색합니다. 여러 단어는 띄어쓰기로 구분하세요.</p>
        <section className="editorial-results" aria-labelledby="results-title">
          <h2 id="results-title">{query ? `“${query}” 검색 결과` : "어떤 답변을 찾고 있나요?"}</h2>
          {unavailable ? <p role="status">검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : !query ? <p>위 검색창에 궁금한 주제를 입력해 주세요.</p> : results.length === 0 ? <p>일치하는 공개 글이 없습니다. 더 짧은 단어나 다른 표현으로 검색해 보세요.</p> : <>
            <p className="editorial-search-hint">{results.length > 30 ? "결과가 많아 최신 30개를 표시합니다. 검색어를 구체적으로 입력해 보세요." : `${results.length}개의 답변 · 최신 게시순`}</p>
            <div className="editorial-list">{results.slice(0, 30).map((item, index) => (
              <Link href={`/q/${item.slug}`} className="editorial-row" key={item.id}>
                <span className="editorial-number">{String(index + 1).padStart(2, "0")}</span>
                <div><span className="editorial-label">{item.category?.name ?? "인사이트"}</span><h3>{item.title}</h3></div>
                <span className="editorial-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}</div>
          </>}
        </section>
      </div>
    </main>
  );
}
