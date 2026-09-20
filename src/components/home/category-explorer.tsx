"use client";

import { useState } from "react";
import Link from "next/link";

export type ExploreCategory = { name: string; slug: string; count: number; article?: { title: string; slug: string } };
export function CategoryExplorer({ categories, unavailable }: { categories: ExploreCategory[]; unavailable: boolean }) {
  const [selected, setSelected] = useState(categories[0]?.slug);
  const current = categories.find((category) => category.slug === selected) ?? categories[0];
  return <section className="editorial-section editorial-explore" aria-labelledby="explore-heading">
    <span className="editorial-label">EXPLORE / 04</span>
    <h2 id="explore-heading" className="editorial-heading">무엇을<br />찾고 있나요?</h2>
    {!current ? <p>{unavailable ? "카테고리를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요." : "공개된 글이 있는 카테고리를 준비하고 있습니다."}</p> : <div className="editorial-explore-grid">
      <div className="editorial-category-list">{categories.map((category) => <button key={category.slug} type="button" aria-pressed={current.slug === category.slug} aria-controls="category-preview" onMouseEnter={() => setSelected(category.slug)} onFocus={() => setSelected(category.slug)} onClick={() => setSelected(category.slug)}>
        <span>{category.name}</span><small aria-label={`공개 글 ${category.count}개`}>{category.count}</small><span aria-hidden="true">↗</span>
      </button>)}</div>
      <div id="category-preview" className="editorial-category-preview">
        <span className="editorial-label">{current.name} / 최신 공개 글</span>
        {current.article && <Link className="editorial-category-article" href={`/q/${current.article.slug}`}>{current.article.title}<span aria-hidden="true">↗</span></Link>}
        <Link className="editorial-text-link" href={`/category/${current.slug}`}>{current.name} 전체 보기 ↗</Link>
      </div>
    </div>}
  </section>;
}
