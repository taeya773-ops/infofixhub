"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import styles from "./search.module.css";

type Suggestion = { slug: string; title: string };
export function HeroSearch({ query = "", suggestions, suggestionsUnavailable = false }: { query?: string; suggestions?: Suggestion[]; suggestionsUnavailable?: boolean }) {
  const [value, setValue] = useState(query);
  const [open, setOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [result, setResult] = useState<{ query: string; items: Suggestion[]; failed?: boolean } | null>(null);
  const cache = useRef(new Map<string, Suggestion[]>());
  const id = useId();
  const term = value.trim().replace(/\s+/g, " ");
  const enabled = suggestions !== undefined;
  useEffect(() => {
    if (!enabled || !open || !term || composing) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        let items = cache.current.get(term);
        if (!items) {
          const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(term)}`, { signal: controller.signal });
          if (!response.ok) throw new Error("Unavailable");
          const data = await response.json();
          if (!Array.isArray(data.items)) throw new Error("Invalid response");
          items = data.items.filter((item: Suggestion) => typeof item.slug === "string" && typeof item.title === "string").slice(0, 5);
          if (active) {
            if (cache.current.size >= 20) cache.current.clear();
            cache.current.set(term, items!);
          }
        }
        if (active) setResult({ query: term, items: items! });
      } catch {
        if (active && !controller.signal.aborted) setResult({ query: term, items: [], failed: true });
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [enabled, open, term, composing]);
  const items = term ? result?.query === term ? result.items : [] : suggestions ?? [];
  const loading = Boolean(term && result?.query !== term);
  const failed = term ? result?.query === term && result.failed : suggestionsUnavailable;
  return (
    <div className={styles.shell} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); event.stopPropagation(); } }}>
    <form className="editorial-search" action="/search" method="get" role="search" onSubmit={() => setOpen(false)}>
      <label htmlFor="knowledge-query" className="editorial-sr-only">공개된 글의 제목과 주제 검색</label>
      <input id="knowledge-query" type="search" name="q" value={value} onChange={(event) => { setValue(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} aria-controls={enabled && open ? id : undefined} aria-describedby={enabled && open ? `${id}-status` : undefined} maxLength={120} placeholder="무엇이 궁금하세요?" autoComplete="off" />
      <button type="submit"><span>SEARCH</span><span aria-hidden="true">↗</span><span className="editorial-sr-only">검색</span></button>
    </form>
    {enabled && open && <section id={id} className={styles.suggestions} aria-label="검색 제안">
      <p id={`${id}-status`} role="status">{loading ? "검색 중…" : failed ? "제안을 불러오지 못했습니다. 검색 버튼으로 계속 검색할 수 있습니다." : term ? items.length ? "관련 공개 글" : "일치하는 제안이 없습니다." : "최근 공개 글"}</p>
      {!loading && <ul>{items.map((item) => <li key={item.slug}><Link href={`/q/${item.slug}`} onClick={() => setOpen(false)}>{item.title}<span aria-hidden="true">↗</span></Link></li>)}</ul>}
      {term && <Link className={styles.all} href={`/search?q=${encodeURIComponent(term)}`}>전체 검색 결과 보기 ↗</Link>}
    </section>}
    </div>
  );
}
